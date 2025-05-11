import { NextResponse } from 'next/server';
import axios from 'axios';
import { getOAuthSignature } from '../../../../../lib/oauth';

export async function POST(request) {
    try {
        // Get address data from request
        const { customerId, address } = await request.json();

        // Validate required fields
        if (!customerId || !address) {
            return NextResponse.json({
                error: 'Customer ID and address are required'
            }, { status: 400 });
        }

        // Set up the request to WooCommerce API
        const method = 'PUT';
        const baseUrl = `${process.env.WOOCOMMERCE_URL}/wp-json/wc/v3/customers/${customerId}`;

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

        // Prepare the data for WooCommerce
        const customerData = {
            billing: {
                ...address,
                // Ensure required fields are present
                first_name: address.first_name || '',
                last_name: address.last_name || '',
                address_1: address.address_1 || '',
                city: address.city || 'Dhaka',
                state: address.state || 'BD-13',
                postcode: address.postcode || '1200',
                country: address.country || 'BD',
                phone: address.phone || '',
                email: address.email || ''
            },
            shipping: {
                ...address,
                // Ensure required fields are present
                first_name: address.first_name || '',
                last_name: address.last_name || '',
                address_1: address.address_1 || '',
                city: address.city || 'Dhaka',
                state: address.state || 'BD-13',
                postcode: address.postcode || '1200',
                country: address.country || 'BD',
                phone: address.phone || '',
                email: address.email || ''
            }
        };

        console.log('Updating WooCommerce customer address:', customerId, JSON.stringify(customerData, null, 2));

        // Make the API call to WooCommerce
        const response = await axios.put(finalUrl, customerData);

        // Return the WooCommerce customer data
        return NextResponse.json({
            success: true,
            customer: response.data,
            message: 'Customer address updated successfully'
        });

    } catch (error) {
        console.error('Error updating customer address:', error.response?.data || error.message);

        // If we have more specific error data from WooCommerce, include it
        const wcErrorData = error.response?.data?.data || {};
        const wcErrorMessage = error.response?.data?.message || 'Unknown error from WooCommerce';

        return NextResponse.json({
            error: 'Failed to update customer address',
            message: wcErrorMessage,
            details: wcErrorData,
            originalError: error.message
        }, { status: error.response?.status || 500 });
    }
}
