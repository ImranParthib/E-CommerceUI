import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req) {
    try {
        // Extract form data from the request
        const formData = await req.formData();
        const paymentData = Object.fromEntries(formData);

        // Log the successful payment data
        console.log('Payment Successful:', paymentData);

        // Extract important information
        const { val_id, store_amount, tran_id, card_type, value_a } = paymentData;

        // Store the payment success info in cookies for client-side access
        const cookieStore = cookies();

        // Set payment status cookie
        cookieStore.set('paymentStatus', 'success', {
            path: '/',
            maxAge: 60 * 10, // 10 minutes
            httpOnly: false
        });

        // Ensure we have valid data before storing in cookies
        const orderInfo = {
            orderId: value_a || 'unknown',
            transactionId: tran_id || '',
            amount: store_amount || '0',
            paymentMethod: card_type || 'online'
        };

        // Set payment info cookie
        cookieStore.set('paymentInfo', JSON.stringify(orderInfo), {
            path: '/',
            maxAge: 60 * 10,
            httpOnly: false
        });

        // Get base URL from environment or use default
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

        // Create redirect URL with query parameters
        const redirectUrl = new URL('/profile/orders', baseUrl);
        redirectUrl.searchParams.append('payment', 'success');

        // Add orderId parameter if available
        if (value_a) {
            redirectUrl.searchParams.append('orderId', encodeURIComponent(value_a));
        }

        return NextResponse.redirect(redirectUrl);
    } catch (error) {
        console.error("Error in payment success handler:", error);

        // Fallback URL in case of errors
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        return NextResponse.redirect(new URL('/profile/orders', baseUrl));
    }
}