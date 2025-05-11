import { NextResponse } from 'next/server';
import axios from 'axios';
import { getOAuthSignature } from '../../../../lib/oauth';

export async function POST(req) {
    try {
        const data = await req.json();
        const { orderId, status, paymentStatus, transactionId, amount, woocommerceId } = data;

        if (!orderId) {
            return NextResponse.json({
                success: false,
                message: 'Order ID is required'
            }, { status: 400 });
        }

        console.log('Updating order status:', {
            orderId,
            status,
            paymentStatus,
            transactionId,
            amount,
            woocommerceId
        });

        // If we have a WooCommerce order ID, update it in WooCommerce as well
        if (woocommerceId) {
            try {
                await syncOrderStatusWithWooCommerce(woocommerceId, status, paymentStatus);
                console.log('Successfully updated WooCommerce order status');
            } catch (wcError) {
                console.error('Failed to update WooCommerce order:', wcError);
                // Continue with the local update even if WooCommerce update fails
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Order status updated successfully',
            data: {
                orderId,
                status
            }
        });
    } catch (error) {
        console.error("Error updating order status:", error);
        return NextResponse.json({
            success: false,
            message: 'Error updating order status',
            error: error.message
        }, { status: 500 });
    }
}

// New function to sync order status with WooCommerce
async function syncOrderStatusWithWooCommerce(wcOrderId, status, paymentStatus) {
    // Map our statuses to WooCommerce statuses
    const statusMap = {
        'pending': 'pending',
        'processing': 'processing',
        'confirmed': 'processing',
        'shipped': 'completed',
        'delivered': 'completed',
        'completed': 'completed',
        'cancelled': 'cancelled'
    };

    const wcStatus = statusMap[status] || status;

    // Set up the request to WooCommerce API
    const method = 'PUT';
    const baseUrl = `${process.env.WOOCOMMERCE_URL}/wp-json/wc/v3/orders/${wcOrderId}`;

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

    // Update data for WooCommerce
    const updateData = { status: wcStatus };

    // If payment status is available, add it as meta data
    if (paymentStatus) {
        updateData.meta_data = [
            { key: 'payment_status', value: paymentStatus }
        ];
    }

    // Make the API call to update WooCommerce order
    await axios.put(finalUrl, updateData);
}
