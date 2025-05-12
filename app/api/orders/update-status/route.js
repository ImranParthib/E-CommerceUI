import { NextResponse } from 'next/server';

export async function POST(req) {
    try {
        const data = await req.json();
        const { orderId, status, paymentStatus, transactionId, amount } = data;

        if (!orderId) {
            return NextResponse.json({
                success: false,
                message: 'Order ID is required'
            }, { status: 400 });
        }

        // Here you would typically update your database
        // For now, we'll just log the data and return success
        console.log('Updating order status:', {
            orderId,
            status,
            paymentStatus,
            transactionId,
            amount
        });

        // You could emit events here or perform other necessary actions

        return NextResponse.json({
            success: true,
            message: 'Order status updated successfully',
            data: {
                orderId,
                status
            }
        });
    } catch (error) {
        console.error("Error updating order status:", error);
        return NextResponse.json({
            success: false,
            message: 'Error updating order status',
            error: error.message
        }, { status: 500 });
    }
}
