'use client'

import { useState, useEffect } from 'react';
import { useSidebar } from '@/app/context/SidebarContext';
import MyOrder from '@/app/components/MyOrders/MyOrder';
import { useSearchParams, useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle, XCircle, CreditCard } from 'lucide-react';

export default function OrdersPage() {
  const { isSidebarOpen } = useSidebar();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [showPaymentBanner, setShowPaymentBanner] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [paymentOrderId, setPaymentOrderId] = useState(null);

  useEffect(() => {
    // Check for payment status in URL parameters
    const status = searchParams.get('payment');
    const orderId = searchParams.get('orderId');

    if (status) {
      setPaymentStatus(status);
      setPaymentOrderId(orderId || null);
      setShowPaymentBanner(true);

      // For orders requiring additional payment steps
      if (status === 'needs_payment' && orderId) {
        // Redirect to payment page after a short delay
        const timer = setTimeout(() => {
          router.push(`/checkout/payment/${orderId}`);
        }, 2000);
        return () => clearTimeout(timer);
      }

      // Hide banner after 5 seconds for other statuses
      const timer = setTimeout(() => {
        setShowPaymentBanner(false);

        // Clean up URL params after the banner disappears
        if (status && window.history.replaceState) {
          const url = new URL(window.location.href);
          url.searchParams.delete('payment');
          url.searchParams.delete('orderId');
          window.history.replaceState({}, '', url);
        }
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [searchParams, router]);

  return (
    <div className={`transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-20'} pt-16`}>
      {showPaymentBanner && (
        <div className={`p-4 mb-4 mx-4 border-l-4 rounded-r flex items-start ${paymentStatus === 'success' || paymentStatus === 'paid'
            ? 'bg-green-50 border-green-500 text-green-700'
            : paymentStatus === 'failed'
              ? 'bg-red-50 border-red-500 text-red-700'
              : paymentStatus === 'needs_payment'
                ? 'bg-yellow-50 border-yellow-500 text-yellow-700'
                : 'bg-blue-50 border-blue-500 text-blue-700'
          }`}>
          <div className="mr-3 mt-0.5">
            {paymentStatus === 'success' || paymentStatus === 'paid' ? (
              <CheckCircle className="h-5 w-5" />
            ) : paymentStatus === 'failed' ? (
              <XCircle className="h-5 w-5" />
            ) : paymentStatus === 'needs_payment' ? (
              <CreditCard className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
          </div>

          <div>
            {paymentStatus === 'success' && (
              <>
                <p className="font-medium">Payment successful!</p>
                <p className="text-sm">
                  Your order {paymentOrderId ? `#${paymentOrderId}` : ''} has been confirmed and is now being processed.
                </p>
              </>
            )}

            {paymentStatus === 'paid' && (
              <>
                <p className="font-medium">Payment completed!</p>
                <p className="text-sm">
                  Your payment for order {paymentOrderId ? `#${paymentOrderId}` : ''} has been processed.
                </p>
              </>
            )}

            {paymentStatus === 'failed' && (
              <>
                <p className="font-medium">Payment failed</p>
                <p className="text-sm">
                  Sorry, there was an issue processing your payment for order {paymentOrderId ? `#${paymentOrderId}` : ''}.
                  Please try again from your order details.
                </p>
              </>
            )}

            {paymentStatus === 'needs_payment' && (
              <>
                <p className="font-medium">Payment required</p>
                <p className="text-sm">
                  Your order {paymentOrderId ? `#${paymentOrderId}` : ''} requires payment.
                  Redirecting to payment page...
                </p>
              </>
            )}
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto p-4">
        <h1 className="text-2xl text-gray-700 font-normal mb-6">My Orders</h1>
        <MyOrder initialOrderId={paymentOrderId} paymentStatus={paymentStatus} />
      </div>
    </div>
  );
}