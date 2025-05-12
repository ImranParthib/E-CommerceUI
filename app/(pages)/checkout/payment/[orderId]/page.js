'use client';

import React, { useState, useEffect } from 'react';
import { ShoppingBag, CreditCard, Wallet, ExternalLink, AlertTriangle } from 'lucide-react';
import { useSidebar } from '@/app/context/SidebarContext';
import Link from 'next/link';
import { useOrders } from '@/app/context/OrderContext';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { toast } from 'react-toastify';
import Image from 'next/image';

const PaymentDetails = () => {
    const { isSidebarOpen } = useSidebar();
    const [selectedMethod, setSelectedMethod] = useState('cod');
    const [instruction, setInstruction] = useState('');
    const { getOrderById, confirmOrder } = useOrders();
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const orderId = params.orderId;
    const [order, setOrder] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentError, setPaymentError] = useState('');

    // Check for payment status in URL parameters
    useEffect(() => {
        const paymentStatus = searchParams.get('payment');
        if (paymentStatus === 'failed') {
            setPaymentError('Payment failed. Please try again or choose a different payment method.');
            toast.error('Payment failed. Please try again.');
        } else if (paymentStatus === 'cancelled') {
            setPaymentError('Payment was cancelled. Please try again when you\'re ready.');
            toast.info('Payment was cancelled.');
        }
    }, [searchParams]);

    useEffect(() => {
        const orderData = getOrderById(orderId);
        if (!orderData) {
            toast.error('Order not found');
            router.push('/profile/orders');
            return;
        }
        setOrder(orderData);
    }, [orderId, getOrderById, router]);

    const paymentMethods = [
        { id: 'cod', name: 'Cash On Delivery', icon: <Wallet className="w-5 h-5" /> },
        {
            id: 'online',
            name: 'Online Payment (SSLCommerz)',
            icon: <CreditCard className="w-5 h-5" />,
            icons: [
                '/paymentMethod/visa.png',
                '/paymentMethod/mastercard.png',
                '/paymentMethod/bkash.png',
                '/paymentMethod/nagad.png'
            ]
        }
    ];

    const handleConfirmOrder = async () => {
        if (!selectedMethod) {
            toast.error('Please select a payment method');
            return;
        }

        try {
            setIsProcessing(true);
            setPaymentError(''); // Clear any previous errors

            if (selectedMethod === 'cod') {
                // Handle Cash on Delivery
                confirmOrder(orderId, selectedMethod);
                router.push('/profile/orders');
                toast.success(`Order confirmed with Cash on Delivery`);
            } else if (selectedMethod === 'online') {
                // Handle online payment using SSLCommerz
                const response = await fetch('/api/payment/init', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        amount: order.total + 60, // Order total + delivery fee
                        orderId: orderId,
                        customer: order.delivery,
                        items: order.items,
                        successUrl: `${window.location.origin}/profile/orders?payment=success&orderId=${orderId}`,
                        failUrl: `${window.location.origin}/profile/orders?payment=failed&orderId=${orderId}`,
                        cancelUrl: `${window.location.origin}/checkout/payment/${orderId}?payment=cancelled`
                    }),
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }

                const result = await response.json();

                if (result.status === 'success' && result.redirectUrl) {
                    // Update order with transaction ID before redirecting
                    if (result.transactionId) {
                        await confirmOrder(orderId, 'online', {
                            transactionId: result.transactionId,
                            status: 'pending'
                        });
                    }

                    // Redirect to SSLCommerz payment page
                    window.location.href = result.redirectUrl;
                } else {
                    throw new Error(result.message || 'Payment initialization failed');
                }
            }
        } catch (error) {
            console.error('Error confirming order:', error);
            toast.error('Failed to process payment. Please try again.');
            setPaymentError('Payment processing failed. Please try again or choose a different payment method.');
        } finally {
            setIsProcessing(false);
        }
    };

    if (!order) {
        return (
            <div className={`min-h-screen bg-gray-50 pt-16 ${isSidebarOpen ? 'ml-64' : 'ml-0'} flex items-center justify-center`}>
                <div className="text-center p-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading order details...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen bg-gray-50 pt-16 ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
            <div className="max-w-5xl mx-auto p-4 md:p-6">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-800">Payment Details</h1>
                    <p className="text-gray-600">Complete your order by providing payment details</p>
                </div>

                {paymentError && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                        <div>
                            <h3 className="font-medium text-red-800">Payment Error</h3>
                            <p className="text-red-600 text-sm">{paymentError}</p>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column */}
                    <div className="space-y-6">
                        {/* Order Status */}
                        <div className="p-6 bg-yellow-50 rounded-xl border border-yellow-100">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-purple-600 rounded-lg">
                                    <ShoppingBag className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <div className="font-semibold text-gray-800">Order #{orderId}</div>
                                    <div className="text-sm text-gray-600">
                                        Selected Delivery: {order.delivery?.deliveryTime || 'Standard Delivery'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Payment Methods */}
                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                            <div className="p-4 bg-gray-50 border-b">
                                <h3 className="font-medium text-gray-800">Select Payment Method</h3>
                            </div>
                            <div className="p-4 space-y-3">
                                {paymentMethods.map((method) => (
                                    <div key={method.id} className="flex items-center">
                                        <input
                                            type="radio"
                                            id={method.id}
                                            name="paymentMethod"
                                            value={method.id}
                                            checked={selectedMethod === method.id}
                                            onChange={() => setSelectedMethod(method.id)}
                                            className="h-4 w-4 text-yellow-500 focus:ring-yellow-400"
                                            disabled={isProcessing}
                                        />
                                        <label
                                            htmlFor={method.id}
                                            className="ml-3 flex items-center justify-between w-full cursor-pointer"
                                        >
                                            <div className="flex items-center">
                                                {typeof method.icon === 'string' ? (
                                                    <img src={method.icon} alt={method.name} className="h-8 w-auto mr-3" />
                                                ) : (
                                                    <span className="mr-3">{method.icon}</span>
                                                )}
                                                <span>{method.name}</span>
                                            </div>
                                            {method.icons && (
                                                <div className="flex space-x-1">
                                                    {method.icons.map((icon, idx) => (
                                                        <img key={idx} src={icon} alt="" className="h-6 w-auto" />
                                                    ))}
                                                </div>
                                            )}
                                        </label>
                                    </div>
                                ))}

                                {selectedMethod === 'online' && (
                                    <div className="mt-3 p-3 bg-blue-50 rounded-md text-sm text-blue-700">
                                        <p className="flex items-center gap-1 font-medium">
                                            <ExternalLink size={16} />
                                            You'll be redirected to SSLCommerz secure payment gateway.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Delivery Instructions */}
                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                            <div className="p-4 bg-gray-50 border-b">
                                <h3 className="font-medium text-gray-800">Additional Instructions (Optional)</h3>
                            </div>
                            <div className="p-4">
                                <textarea
                                    value={instruction}
                                    onChange={(e) => setInstruction(e.target.value)}
                                    className="w-full h-24 p-2 border border-gray-300 rounded"
                                    placeholder="Special instructions for delivery"
                                    disabled={isProcessing}
                                ></textarea>
                            </div>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                        {/* Order Summary */}
                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                            <div className="p-4 bg-gray-50 border-b">
                                <h3 className="font-medium text-gray-800">Order Summary</h3>
                            </div>
                            <div className="p-4">
                                <div className="max-h-40 overflow-y-auto mb-4">
                                    {order.items.map((item) => (
                                        <div key={item.id} className="flex justify-between items-center mb-2">
                                            <div className="flex items-center">
                                                <div className="relative w-10 h-10 mr-2">
                                                    <Image
                                                        src={item.image}
                                                        alt={item.name}
                                                        fill
                                                        className="object-contain"
                                                    />
                                                </div>
                                                <span className="text-sm bg-gray-100 rounded-full w-5 h-5 flex items-center justify-center mr-2">
                                                    {item.quantity}
                                                </span>
                                                <span className="line-clamp-1 text-sm">{item.name}</span>
                                            </div>
                                            <span className="text-sm">৳{item.price * item.quantity}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="border-t pt-4 mt-4">
                                    <div className="flex justify-between mb-1">
                                        <span className="text-gray-600">Subtotal</span>
                                        <span>৳{order.total}</span>
                                    </div>
                                    <div className="flex justify-between mb-1">
                                        <span className="text-gray-600">Delivery Fee</span>
                                        <span>৳60</span>
                                    </div>
                                    <div className="flex justify-between mt-3 text-lg font-bold">
                                        <span>Total</span>
                                        <span>৳{order.total + 60}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Customer Info */}
                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                            <div className="p-4 bg-gray-50 border-b">
                                <h3 className="font-medium text-gray-800">Delivery Address</h3>
                            </div>
                            <div className="p-4">
                                <p className="font-medium">{order.delivery?.name}</p>
                                <p className="text-gray-600">{order.delivery?.phone}</p>
                                <p className="text-gray-600">{order.delivery?.address}</p>
                                <p className="text-gray-600">{order.delivery?.city}, {order.delivery?.zip}</p>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-4">
                            <Link href="/checkout" className="flex-1 py-3 text-center border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50">
                                Back
                            </Link>
                            <button
                                onClick={handleConfirmOrder}
                                disabled={isProcessing}
                                className={`flex-1 py-3 rounded-lg font-medium ${isProcessing
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-yellow-400 hover:bg-yellow-500 text-gray-900'
                                    }`}
                            >
                                {isProcessing ? 'Processing...' : selectedMethod === 'online' ? 'Pay Now' : 'Confirm Order'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentDetails;
