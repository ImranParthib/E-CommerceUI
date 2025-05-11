import { NextResponse } from 'next/server';
import axios from 'axios';
import { getOAuthSignature } from '../../../../lib/oauth';

export async function POST(request) {
    try {
        // Get user data from request
        const userData = await request.json();
        const { email, displayName, uid, phoneNumber } = userData;

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        const method = 'GET';
        const baseUrl = `${process.env.WOOCOMMERCE_URL}/wp-json/wc/v3/customers`;

        // First check if customer exists with this email
        const queryParams = {
            email,
            per_page: 1
        };

        // Set up OAuth parameters for the GET request
        const oauthParamsGet = {
            oauth_consumer_key: process.env.WOOCOMMERCE_CONSUMER_KEY,
            oauth_nonce: Math.random().toString(36).substring(2),
            oauth_signature_method: 'HMAC-SHA1',
            oauth_timestamp: Math.floor(Date.now() / 1000),
            oauth_version: '1.0',
            ...queryParams
        };

        // Generate signature and append to parameters for the GET request
        const signatureGet = getOAuthSignature(
            method,
            baseUrl,
            oauthParamsGet,
            process.env.WOOCOMMERCE_CONSUMER_SECRET
        );
        oauthParamsGet.oauth_signature = signatureGet;

        // Construct the final URL for checking if customer exists
        const checkUrl = `${baseUrl}?${new URLSearchParams(oauthParamsGet).toString()}`;

        // Check if customer exists
        const checkResponse = await axios.get(checkUrl);

        if (checkResponse.data && checkResponse.data.length > 0) {
            // Customer exists, return the customer data
            const customer = checkResponse.data[0];

            // Check if we need to update the customer data
            if ((customer.first_name !== displayName && displayName) ||
                (customer.meta_data?.find(m => m.key === 'firebase_uid')?.value !== uid)) {
                // Update the customer
                return await updateCustomer(customer.id, {
                    first_name: displayName || customer.first_name,
                    meta_data: [
                        ...(customer.meta_data || []).filter(m => m.key !== 'firebase_uid'),
                        { key: 'firebase_uid', value: uid }
                    ]
                });
            }

            return NextResponse.json({
                customer,
                message: 'Customer found',
                isNew: false
            });
        }

        // Customer doesn't exist, create new customer
        const customerData = {
            email,
            first_name: displayName || '',
            username: email.split('@')[0] + Math.random().toString(36).substring(2, 6),
            meta_data: [
                { key: 'firebase_uid', value: uid }
            ]
        };

        if (phoneNumber) {
            customerData.billing = { phone: phoneNumber };
        }

        // Create the customer
        const postMethod = 'POST';
        const oauthParamsPost = {
            oauth_consumer_key: process.env.WOOCOMMERCE_CONSUMER_KEY,
            oauth_nonce: Math.random().toString(36).substring(2),
            oauth_signature_method: 'HMAC-SHA1',
            oauth_timestamp: Math.floor(Date.now() / 1000),
            oauth_version: '1.0'
        };

        // Generate signature for the POST request
        const signaturePost = getOAuthSignature(
            postMethod,
            baseUrl,
            oauthParamsPost,
            process.env.WOOCOMMERCE_CONSUMER_SECRET
        );
        oauthParamsPost.oauth_signature = signaturePost;

        // Construct the final URL for creating a customer
        const createUrl = `${baseUrl}?${new URLSearchParams(oauthParamsPost).toString()}`;

        const createResponse = await axios.post(createUrl, customerData);

        // When a customer is created or found, return the customer ID as well
        return NextResponse.json({
            customer: createResponse.data,
            message: 'Customer created successfully',
            isNew: true
        });

    } catch (error) {
        console.error('Error syncing customer:', error.response?.data || error.message);

        // Return a more meaningful error message but don't expose sensitive details
        return NextResponse.json({
            error: 'Failed to sync customer data',
            message: error.response?.data?.message || error.message
        }, { status: error.response?.status || 500 });
    }
}

// Helper function to update customer
async function updateCustomer(customerId, updateData) {
    const method = 'PUT';
    const baseUrl = `${process.env.WOOCOMMERCE_URL}/wp-json/wc/v3/customers/${customerId}`;

    const oauthParams = {
        oauth_consumer_key: process.env.WOOCOMMERCE_CONSUMER_KEY,
        oauth_nonce: Math.random().toString(36).substring(2),
        oauth_signature_method: 'HMAC-SHA1',
        oauth_timestamp: Math.floor(Date.now() / 1000),
        oauth_version: '1.0'
    };

    const signature = getOAuthSignature(
        method,
        baseUrl,
        oauthParams,
        process.env.WOOCOMMERCE_CONSUMER_SECRET
    );
    oauthParams.oauth_signature = signature;

    const updateUrl = `${baseUrl}?${new URLSearchParams(oauthParams).toString()}`;
    const response = await axios.put(updateUrl, updateData);

    // Or when updating an existing customer
    return NextResponse.json({
        customer: response.data,
        message: 'Customer updated successfully',
        isNew: false
    });
}
