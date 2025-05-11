import { NextResponse } from 'next/server';
import SSLCommerzPayment from 'sslcommerz-lts';

export async function POST(req) {
    try {
        // Get the payment data from the request
        const data = await req.json();
        const { val_id, store_id, store_passwd } = data;

        if (!val_id) {
            return NextResponse.json({
                status: 'error',
                message: 'Validation ID is required'
            }, { status: 400 });
        }

        // Use the SSLCommerz SDK to validate the payment
        const sslcommerz = new SSLCommerzPayment(
            process.env.SSLCOMMERZ_STORE_ID || store_id,
            process.env.SSLCOMMERZ_STORE_PASSWORD || store_passwd,
            false // false for sandbox mode
        );

        try {
            // Validate the payment
            const validationResult = await sslcommerz.validate(val_id);

            if (validationResult?.status === 'VALID' || validationResult?.status === 'VALIDATED') {
                return NextResponse.json({
                    status: 'success',
                    message: 'Payment validation successful',
                    data: validationResult
                });
            } else {
                return NextResponse.json({
                    status: 'error',
                    message: 'Payment validation failed',
                    data: validationResult
                }, { status: 400 });
            }
        } catch (validationError) {
            console.error('Payment validation error:', validationError);

            // Try manual validation as fallback
            try {
                const baseUrl = process.env.SSLCOMMERZ_API_URL || 'https://sandbox.sslcommerz.com';
                const validateUrl = `${baseUrl}/validator/api/validationserverAPI.php`;

                const response = await fetch(validateUrl, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    // Append required parameters to URL
                    url: `${validateUrl}?val_id=${val_id}&store_id=${store_id}&store_passwd=${store_passwd}`
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }

                const result = await response.json();

                if (result?.status === 'VALID' || result?.status === 'VALIDATED') {
                    return NextResponse.json({
                        status: 'success',
                        message: 'Payment validation successful',
                        data: result
                    });
                } else {
                    throw new Error('Payment validation failed');
                }
            } catch (fallbackError) {
                return NextResponse.json({
                    status: 'error',
                    message: 'Payment validation failed',
                    error: fallbackError.message
                }, { status: 500 });
            }
        }
    } catch (error) {
        console.error('Error in payment verification:', error);

        return NextResponse.json({
            status: 'error',
            message: 'Internal server error',
            error: error.message
        }, { status: 500 });
    }
}
