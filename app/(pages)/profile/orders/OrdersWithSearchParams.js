'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'react-toastify';

export default function OrdersWithSearchParams({
    selectedOrderId,
    setSelectedOrderId,
    updateOrderStatus
}) {
    // This component safely uses useSearchParams inside a client component
    const searchParams = useSearchParams();

    // Handle payment success/failure from URL parameters
    useEffect(() => {
        const paymentStatus = searchParams.get('payment');
        const orderId = searchParams.get('orderId');

        if (paymentStatus && orderId) {
            try {
                // Properly decode the orderId from the URL
                const decodedOrderId = decodeURIComponent(orderId);
                console.log(`Payment ${paymentStatus} for order: ${decodedOrderId}`);

                if (paymentStatus === 'success') {
                    toast.success('Payment successful! Your order has been confirmed.');

                    // Auto-select the completed order for display
                    setSelectedOrderId(decodedOrderId);

                    // Update order status if needed
                    if (updateOrderStatus) {
                        updateOrderStatus(decodedOrderId, 'processing')
                            .then(success => {
                                if (success) {
                                    console.log(`Order ${decodedOrderId} status updated to processing`);
                                } else {
                                    console.warn(`Failed to update order ${decodedOrderId} status`);
                                }
                            })
                            .catch(error => console.error("Error updating order status:", error));
                    }
                } else if (paymentStatus === 'failed') {
                    toast.error('Payment failed. Please try again or contact support.');
                    setSelectedOrderId(decodedOrderId);
                }

                // Clean the URL - use window.history to avoid full page reload
                if (typeof window !== 'undefined') {
                    window.history.replaceState({}, document.title, window.location.pathname);
                }
            } catch (err) {
                console.error("Error processing payment status from URL:", err);
                toast.error("There was an error processing your payment status");
            }
        }
    }, [searchParams, setSelectedOrderId, updateOrderStatus]);

    // This component doesn't render anything visible
    return null;
}
