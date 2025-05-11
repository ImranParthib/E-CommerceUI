import { NextResponse } from 'next/server';
import axios from 'axios';
import { getOAuthSignature } from '../../../lib/oauth';

export async function GET(request) {
    const method = 'GET';
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
        return NextResponse.json({ products: [] });
    }

    try {
        // Build base URL with query parameters for WooCommerce API
        const baseUrl = `${process.env.WOOCOMMERCE_URL}/wp-json/wc/v3/products`;

        // Add query parameters for search
        const queryParams = {
            search: query,
            per_page: 20, // Limit to 20 results for performance
            page: 1
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

        // Make request to WooCommerce API
        const response = await axios.get(finalUrl);

        return NextResponse.json({
            products: response.data,
            total: response.headers['x-wp-total'] || response.data.length
        });
    } catch (error) {
        console.error('Search error:', error.response?.data || error.message);

        // If WooCommerce API is not available, fallback to empty response
        return NextResponse.json({
            products: [],
            error: 'Failed to fetch search results'
        }, { status: error.response?.status || 500 });
    }
}