import { NextResponse } from 'next/server';
import axios from 'axios';
import { getOAuthSignature } from '../../../lib/oauth';

export async function GET(request) {
    const method = 'GET';
    const { searchParams } = new URL(request.url);

    // Get pagination parameters from request or use defaults
    const per_page = searchParams.get('per_page') || 100; // Default to 100 categories
    const page = searchParams.get('page') || 1;

    // Build base URL with query parameters
    const baseUrl = `${process.env.WOOCOMMERCE_URL}/wp-json/wc/v3/products/categories`;

    // Add query parameters to OAuth signature calculation
    const queryParams = {
        per_page,
        page
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

    // Generate signature and append to parameters
    const signature = getOAuthSignature(method, baseUrl, oauthParams, process.env.WOOCOMMERCE_CONSUMER_SECRET);
    oauthParams.oauth_signature = signature;

    // Construct the final URL with query parameters
    const queryString = new URLSearchParams(oauthParams).toString();
    const finalUrl = `${baseUrl}?${queryString}`;

    try {
        const response = await axios.get(finalUrl);

        // Include total count in the response headers
        const totalCategories = response.headers['x-wp-total'] || response.data.length;
        const totalPages = response.headers['x-wp-totalpages'] || 1;

        return NextResponse.json(response.data, {
            headers: {
                'X-Total-Count': totalCategories,
                'X-Total-Pages': totalPages
            }
        });
    } catch (error) {
        console.error('Error fetching categories:', error.response?.data || error.message);
        return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
    }
}