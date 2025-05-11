import { NextResponse } from 'next/server';
import axios from 'axios';
import { getOAuthSignature } from '../../../../lib/oauth';

export async function POST(request) {
    try {
        // Get order data from request
        const orderData = await request.json();

        // Validate required fields
        if (!orderData) {
            return NextResponse.json({ error: 'Order data is required' }, { status: 400 });
        }

        // Basic validation
        if (!orderData.customerData || !orderData.customerData.woocommerceId) {
            return NextResponse.json({
                error: 'WooCommerce customer ID is required',
                message: 'Cannot create order without a valid WooCommerce customer'
            }, { status: 400 });
        }

        // Set up the request to WooCommerce API
        const method = 'POST';
        const baseUrl = `${process.env.WOOCOMMERCE_URL}/wp-json/wc/v3/orders`;

        // Set up OAuth parameters
        const oauthParams = {
            oauth_consumer_key: process.env.WOOCOMMERCE_CONSUMER_KEY,
            oauth_nonce: Math.random().toString(36).substring(2),
            oauth_signature_method: 'HMAC-SHA1',
            oauth_timestamp: Math.floor(Date.now() / 1000),
            oauth_version: '1.0'
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

        // Prepare order data for WooCommerce with proper format
        const wooOrder = transformOrderForWooCommerce(orderData);

        console.log('Creating WooCommerce order with data:', JSON.stringify(wooOrder, null, 2));

        // Make the API call to WooCommerce
        const response = await axios.post(finalUrl, wooOrder);

        console.log('WooCommerce order created successfully:', response.data.id);

        // Return the WooCommerce order data
        return NextResponse.json({
            success: true,
            wcOrderId: response.data.id,
            order: response.data,
            message: 'Order successfully created in WooCommerce'
        });

    } catch (error) {
        console.error('Error creating WooCommerce order:', error.response?.data || error.message);

        // If we have more specific error data from WooCommerce, include it
        const wcErrorData = error.response?.data?.data || {};
        const wcErrorMessage = error.response?.data?.message || 'Unknown error from WooCommerce';

        return NextResponse.json({
            error: 'Failed to create WooCommerce order',
            message: wcErrorMessage,
            details: wcErrorData,
            originalError: error.message
        }, { status: error.response?.status || 500 });
    }
}

// Helper function to transform our order format to WooCommerce format
function transformOrderForWooCommerce(orderData) {
    const {
        items,
        total,
        delivery,
        customerData,
        status,
        paymentMethod,
        paymentStatus,
        discount,
        deliveryFee
    } = orderData;    // Map our payment methods to WooCommerce payment methods
    const paymentMethodMap = {
        'cod': 'cod',
        'online': 'sslcommerz', // Use sslcommerz if available in WooCommerce, fallback to bacs
        'pending': 'pending_payment' // Use WooCommerce's pending payment status
    };

    // Map our order statuses to WooCommerce order statuses
    const statusMap = {
        'pending': 'pending',
        'processing': 'processing',
        'confirmed': 'processing',
        'shipped': 'shipped',
        'delivered': 'completed',
        'completed': 'completed',
        'cancelled': 'cancelled'
    };

    // Transform line items - ensure proper format for WooCommerce API
    const line_items = items.map(item => {
        // Base item data
        const lineItem = {
            product_id: parseInt(item.id, 10),
            quantity: item.quantity || 1
        };

        // Add price if available (important for some setups)
        if (item.price) {
            lineItem.price = parseFloat(item.price);
        }

        // Add variation ID if available
        if (item.variation_id) {
            lineItem.variation_id = parseInt(item.variation_id, 10);
        }

        // Add metadata for product attributes
        const meta_data = [];

        // Add selected attributes if available
        if (item.selectedAttributes && Object.keys(item.selectedAttributes).length > 0) {
            Object.entries(item.selectedAttributes).forEach(([key, value]) => {
                meta_data.push({
                    key: `attribute_${key}`,
                    value: value
                });
            });
        }

        // Add product images if available
        if (item.images && item.images.length > 0) {
            meta_data.push({
                key: '_product_image',
                value: JSON.stringify(item.images)
            });
        } else if (item.image) {
            meta_data.push({
                key: '_product_image',
                value: JSON.stringify([{ src: item.image }])
            });
        }

        // Add any additional metadata from the item
        if (item.meta_data && Array.isArray(item.meta_data)) {
            meta_data.push(...item.meta_data);
        }

        // Only add meta_data if we have any
        if (meta_data.length > 0) {
            lineItem.meta_data = meta_data;
        }

        return lineItem;
    });

    // Parse name for better formatting
    const fullName = delivery?.name || customerData.displayName || '';
    const nameParts = fullName.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Handle delivery address - enhanced to include more detailed address information
    const shipping = {
        first_name: firstName,
        last_name: lastName,
        address_1: delivery?.address || '',
        city: delivery?.city || 'Dhaka',
        state: 'BD-13', // Dhaka district code
        postcode: delivery?.zip || '1200',
        country: 'BD',
        phone: delivery?.phone || customerData.phoneNumber || '',
    };

    // Calculate the order total for ensuring consistency
    const calculatedTotal = items.reduce((sum, item) => sum + ((parseFloat(item.price) || 0) * (parseInt(item.quantity) || 1)), 0);
    const orderTotal = total || calculatedTotal || 0;

    // Prepare the final order format for WooCommerce
    return {
        customer_id: parseInt(customerData.woocommerceId, 10), payment_method: paymentMethodMap[paymentMethod] || 'pending_payment',
        payment_method_title: paymentMethod === 'cod' ? 'Cash on Delivery' :
            paymentMethod === 'online' ? 'Online Payment (SSLCommerz)' :
                'Payment Pending',
        set_paid: paymentStatus === 'paid',
        status: statusMap[status] || 'pending',
        currency: 'BDT',
        prices_include_tax: false,
        line_items,
        shipping_lines: [
            {
                method_id: 'flat_rate',
                method_title: 'Flat Rate',
                total: (deliveryFee || 60).toString()
            }
        ],
        fee_lines: discount ? [
            {
                name: 'Discount',
                total: (-parseFloat(discount)).toString(),
                tax_status: 'none'
            }
        ] : [],
        billing: {
            first_name: firstName,
            last_name: lastName,
            email: customerData.email || '',
            phone: delivery?.phone || customerData.phoneNumber || '',
            address_1: delivery?.address || '',
            city: delivery?.city || 'Dhaka',
            state: 'BD-13',
            postcode: delivery?.zip || '1200',
            country: 'BD'
        },
        shipping,
        // Include metadata for our app-specific details
        meta_data: [
            { key: 'app_order_id', value: orderData.id },
            { key: 'app_payment_status', value: paymentStatus || 'unpaid' },
            { key: 'delivery_time', value: delivery?.deliveryTime || 'standard' },
            // Critical: Store Firebase UID in order metadata for cross-device access
            { key: 'firebase_uid', value: orderData.userId || customerData.firebaseUid }
        ],
        // Include customer note if available
        ...(delivery?.notes ? { customer_note: delivery.notes } : {})
    };
}
