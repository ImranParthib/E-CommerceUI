import { NextResponse } from 'next/server';
import axios from 'axios';
import { getOAuthSignature } from '../../../../lib/oauth';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const firebaseUid = searchParams.get('firebase_uid');

        if (!firebaseUid) {
            return NextResponse.json({
                error: 'Firebase UID is required'
            }, { status: 400 });
        }

        // Set up the request to WooCommerce API
        const method = 'GET';
        const baseUrl = `${process.env.WOOCOMMERCE_URL}/wp-json/wc/v3/orders`;

        // Query parameters for search
        const queryParams = {
            per_page: 50, // Retrieve up to 50 orders initially
            meta_key: 'firebase_uid',
            meta_value: firebaseUid
        };

        // Set up OAuth parameters
        const oauthParams = {
            oauth_consumer_key: process.env.WOOCOMMERCE_CONSUMER_KEY,
            oauth_nonce: Math.random().toString(36).substring(2),
            oauth_signature_method: 'HMAC-SHA1',
            oauth_timestamp: Math.floor(Date.now() / 1000),
            oauth_version: '1.0',
            ...queryParams
        };

        // Generate signature for OAuth
        const signature = getOAuthSignature(
            method,
            baseUrl,
            oauthParams,
            process.env.WOOCOMMERCE_CONSUMER_SECRET
        );
        oauthParams.oauth_signature = signature;

        // Prepare the full URL with OAuth parameters
        const queryString = new URLSearchParams(oauthParams).toString();
        const finalUrl = `${baseUrl}?${queryString}`;

        // Make the API call to WooCommerce
        const response = await axios.get(finalUrl);

        // Extract orders and format them for our app
        const orders = response.data.map(wcOrder => {
            return normalizeWooCommerceOrder(wcOrder, firebaseUid);
        });

        // Include pagination information
        return NextResponse.json({
            success: true,
            orders,
            totalOrders: response.headers['x-wp-total'] || orders.length,
            totalPages: response.headers['x-wp-totalpages'] || 1
        });

    } catch (error) {
        console.error('Error fetching orders from WooCommerce:', error.response?.data || error.message);

        // Return error response with details
        return NextResponse.json({
            success: false,
            error: 'Failed to fetch orders from WooCommerce',
            message: error.response?.data?.message || error.message
        }, { status: error.response?.status || 500 });
    }
}

// Helper function to normalize WooCommerce order format to our app's format
function normalizeWooCommerceOrder(wcOrder, firebaseUid) {
    // Extract app_order_id from metadata if available
    const appOrderIdMeta = wcOrder.meta_data?.find(meta => meta.key === 'app_order_id');
    const appOrderId = appOrderIdMeta ? appOrderIdMeta.value : `wc_${wcOrder.id}`;

    // Extract delivery time from metadata
    const deliveryTimeMeta = wcOrder.meta_data?.find(meta => meta.key === 'delivery_time');
    const deliveryTime = deliveryTimeMeta ? deliveryTimeMeta.value : 'standard';

    // Map WooCommerce status to our app's status
    const statusMap = {
        'pending': 'pending',
        'processing': 'processing',
        'on-hold': 'pending',
        'completed': 'delivered',
        'cancelled': 'cancelled',
        'refunded': 'cancelled',
        'failed': 'cancelled'
    };

    // Process line items into our format
    const items = wcOrder.line_items.map(item => {
        // Extract any selected attributes from metadata
        const selectedAttributes = {};
        if (item.meta_data && item.meta_data.length > 0) {
            item.meta_data.forEach(meta => {
                if (meta.key.startsWith('attribute_')) {
                    const attrName = meta.key.replace('attribute_', '');
                    selectedAttributes[attrName] = meta.value;
                }
            });
        }

        // Get product images from meta data
        const images = [];
        if (item.meta_data) {
            const imageMeta = item.meta_data.find(meta => meta.key === '_product_image');
            if (imageMeta && imageMeta.value) {
                try {
                    const imageData = JSON.parse(imageMeta.value);
                    if (Array.isArray(imageData)) {
                        images.push(...imageData);
                    } else if (typeof imageData === 'object') {
                        images.push(imageData);
                    }
                } catch (e) {
                    console.error('Error parsing product image data:', e);
                }
            }
        }

        return {
            id: item.product_id.toString(),
            name: item.name,
            quantity: item.quantity,
            price: parseFloat(item.price),
            subtotal: parseFloat(item.subtotal),
            total: parseFloat(item.total),
            variation_id: item.variation_id || null,
            selectedAttributes,
            meta_data: item.meta_data || [],
            images: images.length > 0 ? images : item.images || [],
            image: item.image || null
        };
    });

    // Create a delivery object from shipping address
    const shipping = wcOrder.shipping || {};
    const delivery = {
        name: `${shipping.first_name || ''} ${shipping.last_name || ''}`.trim(),
        phone: shipping.phone || wcOrder.billing?.phone || '',
        address: shipping.address_1 || wcOrder.billing?.address_1 || '',
        city: shipping.city || wcOrder.billing?.city || '',
        zip: shipping.postcode || wcOrder.billing?.postcode || '',
        notes: wcOrder.customer_note || ''
    };

    // Build status history from WooCommerce status changes and notes
    const statusHistory = [{
        status: statusMap[wcOrder.status] || 'pending',
        timestamp: wcOrder.date_created || new Date().toISOString()
    }];

    // Convert WooCommerce order to our app's format
    return {
        id: appOrderId,
        woocommerceId: wcOrder.id.toString(),
        userId: firebaseUid,
        status: statusMap[wcOrder.status] || 'pending',
        paymentStatus: wcOrder.status === 'completed' || wcOrder.payment_method !== 'cod' ? 'paid' : 'pending',
        paymentMethod: wcOrder.payment_method || 'pending',
        transactionId: wcOrder.transaction_id || null,
        items: items,
        total: parseFloat(wcOrder.total),
        deliveryFee: parseFloat(wcOrder.shipping_total) || 0,
        discount: Math.abs(parseFloat(wcOrder.discount_total)) || 0,
        delivery,
        deliveryTime,
        createdAt: wcOrder.date_created || new Date().toISOString(),
        updatedAt: wcOrder.date_modified || new Date().toISOString(),
        statusHistory,
        lastSynced: new Date().toISOString()
    };
}