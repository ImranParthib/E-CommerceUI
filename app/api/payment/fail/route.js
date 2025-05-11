import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req) {
    try {
        const formData = await req.formData();
        const paymentData = Object.fromEntries(formData);

        // Log the failed payment data
        console.log('Payment Failed:', paymentData);

        // Extract order ID from value_a which we set during payment initialization
        const { value_a: orderId } = paymentData;

        // Store the payment failure info in a cookie for client-side access
        const cookieStore = cookies();
        await cookieStore.set('paymentStatus', 'failed', {
            path: '/',
            maxAge: 60 * 5, // 5 minutes
            httpOnly: false
        });

        // Make sure we have a valid base URL
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

        try {
            // Check if we have a valid orderId
            if (!orderId) {
                // If no orderId, just redirect to orders page
                return NextResponse.redirect(new URL('/profile/orders', baseUrl));
            }

            // Create the URL to the payment page with the orderId as part of the path
            const redirectUrl = new URL(`/checkout/payment/${encodeURIComponent(orderId)}`, baseUrl);

            // Add the payment status as a query parameter
            redirectUrl.searchParams.append('payment', 'failed');

            return NextResponse.redirect(redirectUrl);
        } catch (urlError) {
            console.error("Error creating redirect URL:", urlError);
            return NextResponse.redirect(new URL('/profile/orders', baseUrl));
        }
    } catch (error) {
        console.error("Error in payment failure handler:", error);
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        return NextResponse.redirect(new URL('/profile/orders', baseUrl));
    }
}
