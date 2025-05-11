import { NextResponse } from 'next/server';
import axios from 'axios';
import { getOAuthSignature } from '../../../../../lib/oauth';

export async function GET(request) {
    try {
        // Get Firebase UID from query parameters
        const { searchParams } = new URL(request.url);
        const firebaseUid = searchParams.get('firebase_uid');

        if (!firebaseUid) {
            return NextResponse.json({
                error: 'Firebase UID is required'
            }, { status: 400 });
        }

        // Set up the request to WooCommerce API
        const method = 'GET';
        const baseUrl = `${process.env.WOOCOMMERCE_URL}/wp-json/wc/v3/customers`;

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

        // Make the API call to WooCommerce
        const response = await axios.get(finalUrl);

        // Find customer with matching Firebase UID
        const customer = response.data.find(c =>
            c.meta_data?.some(m => m.key === 'firebase_uid' && m.value === firebaseUid)
        );

        if (!customer) {
            return NextResponse.json({
                success: false,
                message: 'Customer not found'
            }, { status: 404 });
        }

        // Extract the relevant data for our app
        const normalizedCustomer = {
            id: customer.id,
            woocommerceId: customer.id,
            email: customer.email,
            displayName: `${customer.first_name} ${customer.last_name}`.trim(),
            firstName: customer.first_name,
            lastName: customer.last_name,
            phoneNumber: customer.billing?.phone || '',
            addresses: [
                // Billing address
                {
                    id: 'billing',
                    type: 'billing',
                    fullAddress: customer.billing?.address_1 || '',
                    city: customer.billing?.city || 'Dhaka',
                    area: customer.billing?.address_2 || '',
                    phoneNumber: customer.billing?.phone || '',
                    isDefault: true
                },
                // Shipping address (if different)
                ...(customer.shipping && customer.shipping.address_1 ? [{
                    id: 'shipping',
                    type: 'shipping',
                    fullAddress: customer.shipping.address_1 || '',
                    city: customer.shipping.city || 'Dhaka',
                    area: customer.shipping.address_2 || '',
                    phoneNumber: customer.shipping.phone || customer.billing?.phone || '',
                    isDefault: false
                }] : [])
            ],
            meta_data: customer.meta_data || []
        };

        return NextResponse.json({
            success: true,
            customer: normalizedCustomer
        });

    } catch (error) {
        console.error('Error fetching customer from WooCommerce:', error.response?.data || error.message);

        return NextResponse.json({
            success: false,
            error: 'Failed to fetch customer from WooCommerce',
            message: error.response?.data?.message || error.message
        }, { status: error.response?.status || 500 });
    }
}