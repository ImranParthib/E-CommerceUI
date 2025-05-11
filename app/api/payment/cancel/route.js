import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req) {
    try {
        const formData = await req.formData();
        const paymentData = Object.fromEntries(formData);

        // Log the cancelled payment data
        console.log('Payment Cancelled:', paymentData);

        // Extract order ID from value_a which we set during payment initialization
        const { value_a: orderId } = paymentData;

        // Store the payment cancellation info in a cookie for client-side access
        const cookieStore = cookies();
        await cookieStore.set('paymentStatus', 'cancelled', {
            path: '/',
            maxAge: 60 * 5, // 5 minutes
            httpOnly: false
        });

        // Make sure we have a valid base URL and orderId
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const safeOrderId = orderId || 'unknown';

        // Redirect to checkout with the order ID
        return NextResponse.redirect(
            new URL(`/checkout/payment/${safeOrderId}?payment=cancelled`, baseUrl)
        );
    } catch (error) {
        console.error("Error in payment cancellation handler:", error);
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        return NextResponse.redirect(
            new URL('/checkout?error=payment_cancelled', baseUrl)
        );
    }
}
