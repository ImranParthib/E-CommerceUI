import SSLCommerzPayment from 'sslcommerz-lts';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req) {
    try {
        const data = await req.json();
        const { amount, customer, items, orderId } = data;

        if (!process.env.SSLCOMMERZ_STORE_ID || !process.env.SSLCOMMERZ_STORE_PASSWORD) {
            console.error("Missing SSLCommerz credentials in environment variables");
            return Response.json({
                status: 'error',
                message: 'Payment service configuration error',
            }, { status: 500 });
        }

        // Generate a unique transaction ID
        const tranId = `TXN_${orderId}_${Date.now()}`;

        const sslcommerz = new SSLCommerzPayment(
            process.env.SSLCOMMERZ_STORE_ID,
            process.env.SSLCOMMERZ_STORE_PASSWORD,
            false // false for sandbox mode
        );

        // Override the API endpoint to use v3 instead of default v4
        const baseURL = 'https://sandbox.sslcommerz.com';
        const initURL = baseURL + '/gwprocess/v3/api.php';

        // Ensure all required URLs are properly set
        const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

        const paymentData = {
            total_amount: amount,
            currency: 'BDT',
            tran_id: tranId,
            success_url: `${appBaseUrl}/api/payment/success`,
            fail_url: `${appBaseUrl}/api/payment/fail`,
            cancel_url: `${appBaseUrl}/api/payment/cancel`,
            ipn_url: `${appBaseUrl}/api/payment/notification`,
            shipping_method: 'Standard Delivery',
            product_name: items?.map(item => item.name).join(', ') || 'E-commerce Products',
            product_category: 'General',
            product_profile: 'general',
            cus_name: customer?.name || 'John Doe',
            cus_email: customer?.email || 'customer@example.com',
            cus_add1: customer?.address || 'Dhaka',
            cus_add2: '',
            cus_city: customer?.city || 'Dhaka',
            cus_state: '',
            cus_postcode: customer?.zip || '1200',
            cus_country: 'Bangladesh',
            cus_phone: customer?.phone || '01700000000',
            cus_fax: '',
            value_a: orderId, // pass orderId as custom value for reference
            value_b: amount,
        };

        console.log("Payment initialization with data:", paymentData);

        // Use custom initURL for the API call
        const response = await fetch(initURL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                ...paymentData,
                store_id: process.env.SSLCOMMERZ_STORE_ID,
                store_passwd: process.env.SSLCOMMERZ_STORE_PASSWORD
            }).toString()
        });

        const result = await response.json();
        console.log("SSLCommerz response:", result);

        if (result?.status === 'SUCCESS') {
            return Response.json({
                status: 'success',
                redirectUrl: result.GatewayPageURL,
                transactionId: tranId,
                data: result
            });
        } else {
            console.error("SSLCommerz initialization failed:", result);
            return Response.json({
                status: 'error',
                message: result?.failedreason || 'Payment initialization failed',
                data: result
            }, { status: 400 });
        }
    } catch (error) {
        console.error("Error in payment initialization:", error);
        return Response.json({
            status: 'error',
            message: 'Internal server error',
            error: error.message
        }, { status: 500 });
    }
}
