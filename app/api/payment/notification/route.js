import { NextResponse } from 'next/server';

export async function POST(req) {
    try {
        const formData = await req.formData();
        const ipnData = Object.fromEntries(formData);

        // Log the IPN notification
        console.log('Payment IPN Notification:', ipnData);

        // Extract important information
        const {
            tran_id,
            val_id,
            status,
            value_a, // This is our order ID
            store_amount
        } = ipnData;

        // Here we could update the order in a database
        // For now, we'll implement fetch to our internal API to update the order status
        if (value_a && status === 'VALID') {
            try {
                const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
                const updateResponse = await fetch(`${baseUrl}/api/orders/update-status`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        orderId: value_a,
                        status: 'processing',
                        paymentStatus: 'paid',
                        transactionId: tran_id,
                        amount: store_amount
                    }),
                });

                const result = await updateResponse.json();
                console.log('Order status update result:', result);
            } catch (updateError) {
                console.error('Error updating order status via IPN:', updateError);
            }
        }

        return Response.json({ success: true, message: 'IPN received and processed' });
    } catch (error) {
        console.error("Error in IPN handler:", error);
        return Response.json({
            success: false,
            message: 'Error processing IPN notification',
            error: error.message
        }, { status: 500 });
    }
}
