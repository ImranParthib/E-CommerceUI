'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useSidebar } from '@/app/context/SidebarContext';
import { useOrders } from '@/app/context/OrderContext';
import { useUserOrders } from '@/app/context/OrdersContext';
import { useOrdersAPI } from '@/app/services/ordersService';
import {
    ShoppingBag,
    ChevronRight,
    RefreshCcw,
    Clock,
    CheckCircle,
    XCircle,
    Package,
    ChevronLeft,
    MapPin,
    ArrowRight,
    AlertTriangle,
    ShoppingCart,
    Loader2
} from 'lucide-react';
import { toast } from 'react-toastify';
import { auth } from '@/lib/firebase';
import OrdersWithSearchParams from './OrdersWithSearchParams';

export default function OrdersPage() {
    const { isSidebarOpen } = useSidebar();
    const router = useRouter();
    const { orders, isLoading } = useOrders();
    const [filter, setFilter] = useState('all');
    const [isRefreshing, setIsRefreshing] = useState(false);

    // States for order details panel
    const [selectedOrderId, setSelectedOrderId] = useState(null);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);
    const [detailsError, setDetailsError] = useState(null);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);

    // Import for order details fetching 
    const { getOrderById, updateOrderStatus } = useUserOrders();
    const { getOrderDetails, cancelOrder } = useOrdersAPI();

    // Ensure the user is logged in
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (!user) {
                router.push('/login?redirect=/profile/orders');
            }
        });

        return () => unsubscribe();
    }, [router]);

    // Effect to load order details when selected order changes
    useEffect(() => {
        async function loadOrderDetails() {
            if (!selectedOrderId) {
                setSelectedOrder(null);
                return;
            }

            setIsLoadingDetails(true);
            setDetailsError(null);
            setShowCancelConfirm(false); // Reset cancel confirmation when loading a new order

            try {
                // First try to get order from context directly (faster)
                const contextOrder = getOrderById(selectedOrderId);

                if (contextOrder) {
                    console.log("Order found in context:", contextOrder);
                    setSelectedOrder(contextOrder);
                } else {
                    // If not found in context, try API
                    console.log("Order not found in context, trying API for ID:", selectedOrderId);
                    const apiOrder = await getOrderDetails(selectedOrderId);

                    if (apiOrder) {
                        console.log("Order found via API:", apiOrder);
                        setSelectedOrder(apiOrder);
                    } else {
                        console.error("Order not found in context or API:", selectedOrderId);
                        setDetailsError('Order details not found. Please try refreshing the page.');
                    }
                }
            } catch (error) {
                console.error('Error loading order details:', error);
                setDetailsError('Failed to load order details. Please try again later.');
            } finally {
                setIsLoadingDetails(false);
            }
        }

        loadOrderDetails();
    }, [selectedOrderId, getOrderById, getOrderDetails]);

    // Debug effect to log available orders (can be removed in production)
    useEffect(() => {
        if (process.env.NODE_ENV !== 'production') {
            console.log("Available orders in context:", orders.map(o => ({ id: o.id, status: o.status })));
        }
    }, [orders]);

    const handleRefresh = () => {
        setIsRefreshing(true);
        // In a real app, you might fetch fresh data from an API
        setTimeout(() => {
            setIsRefreshing(false);
            toast.success("Order list refreshed");
        }, 1000);
    };

    const getFilteredOrders = () => {
        if (filter === 'all') return orders;
        return orders.filter(order => order.status === filter);
    };

    const toggleOrderDetails = (orderId) => {
        if (selectedOrderId === orderId) {
            // If already selected, deselect it (hide details)
            setSelectedOrderId(null);
        } else {
            // Otherwise select this order (show details)
            setSelectedOrderId(orderId);
        }
    };

    const handleAddToBag = (order) => {
        // This would actually re-add items to the cart
        toast.success("Items added to your bag");
    };

    const handleChangePayment = (order) => {
        // This would handle payment method changes
        toast.info("Payment change requested");
    };

    const handleReschedule = (order) => {
        // This would handle delivery rescheduling
        toast.info("Reschedule requested");
    };

    const handleCancelOrder = async (order) => {
        if (!showCancelConfirm) {
            setShowCancelConfirm(true);
            return;
        }

        setIsCancelling(true);
        try {
            // Call API to cancel order
            await cancelOrder(order.id);
            toast.success("Order cancelled successfully");
            // Refresh order data after cancellation
            setIsRefreshing(true);
            setTimeout(() => {
                setIsRefreshing(false);
                // Deselect the order to close details panel
                setShowCancelConfirm(false);
                setSelectedOrderId(null);
            }, 1000);
        } catch (error) {
            toast.error("Failed to cancel order");
        } finally {
            setIsCancelling(false);
        }
    };

    const getOrderStatusBadge = (status) => {
        switch (status) {
            case 'pending':
                return (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                        <Clock className="w-3 h-3 mr-1" /> Pending
                    </span>
                );
            case 'confirmed':
                return (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        <CheckCircle className="w-3 h-3 mr-1" /> Confirmed
                    </span>
                );
            case 'processing':
                return (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                        <Package className="w-3 h-3 mr-1" /> Processing
                    </span>
                );
            case 'completed':
                return (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" /> Completed
                    </span>
                );
            case 'cancelled':
                return (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                        <XCircle className="w-3 h-3 mr-1" /> Cancelled
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                        {status}
                    </span>
                );
        }
    };

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'confirmed': return 'bg-blue-100 text-blue-800';
            case 'processing': return 'bg-purple-100 text-purple-800';
            case 'shipped': return 'bg-indigo-100 text-indigo-800';
            case 'delivered': return 'bg-green-100 text-green-800';
            case 'completed': return 'bg-green-100 text-green-800';
            case 'cancelled': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'pending': return <Clock className="w-5 h-5" />;
            case 'confirmed': return <CheckCircle className="w-5 h-5" />;
            case 'processing': return <Package className="w-5 h-5" />;
            case 'shipped': return <Package className="w-5 h-5" />;
            case 'delivered': return <CheckCircle className="w-5 h-5" />;
            case 'completed': return <CheckCircle className="w-5 h-5" />;
            case 'cancelled': return <XCircle className="w-5 h-5" />;
            default: return <Package className="w-5 h-5" />;
        }
    };

    // Order details rendering component
    const OrderDetails = ({ order, isLoading, error }) => {
        if (isLoading) {
            return (
                <div className="flex flex-col items-center justify-center h-full p-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
                    <p className="mt-4 text-gray-600">Loading order details...</p>
                </div>
            );
        }

        if (error || !order) {
            return (
                <div className="flex flex-col items-center justify-center h-full p-8">
                    <AlertTriangle className="h-16 w-16 text-red-500 mb-4" />
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Order Not Found</h2>
                    <p className="text-gray-600">{error || "We couldn't find this order's details."}</p>
                </div>
            );
        }

        return (
            <div className="bg-white rounded-lg shadow-sm p-4 h-full overflow-y-auto">
                <div className="border-b pb-4 mb-4">
                    <div className="flex justify-between items-center mb-2">
                        <h2 className="text-xl font-bold">Order #{order.id.slice(-6)}</h2>
                        <span className={`px-3 py-1 rounded-full text-xs ${getStatusColor(order.status)}`}>
                            {order.status.toUpperCase()}
                        </span>
                    </div>
                    <p className="text-sm text-gray-500">Placed on {formatDate(order.createdAt)}</p>
                </div>

                {/* Action buttons row */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                    <button
                        onClick={() => handleAddToBag(order)}
                        className="flex items-center justify-center py-2 border border-red-500 text-red-500 hover:bg-red-50 rounded text-sm font-medium"
                        disabled={order.status === 'cancelled'}
                    >
                        <ShoppingCart className="w-4 h-4 mr-1" />  Add to cart
                    </button>
                    <button
                        onClick={() => handleChangePayment(order)}
                        className="flex items-center justify-center py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded text-sm font-medium"
                        disabled={order.status === 'cancelled' || order.status === 'completed'}
                    >
                        Change Payment
                    </button>
                    <button
                        onClick={() => handleReschedule(order)}
                        className="flex items-center justify-center py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded text-sm font-medium"
                        disabled={order.status === 'cancelled' || order.status === 'completed'}
                    >
                        <Clock className="w-4 h-4 mr-1" /> Reschedule
                    </button>
                </div>

                {/* Delivery Address */}
                <div className="flex items-start mb-4 p-3 bg-gray-50 rounded">
                    <MapPin className="w-5 h-5 text-gray-500 mr-2 mt-1 flex-shrink-0" />
                    <div>
                        <p className="text-sm font-medium">{order.delivery?.name}</p>
                        <p className="text-sm text-gray-700">{order.delivery?.address}</p>
                        <p className="text-sm text-gray-700">{order.delivery?.city}, {order.delivery?.zip}</p>
                        <p className="text-sm text-gray-700 mt-1">
                            <span className="font-medium">Phone:</span> {order.delivery?.phone}
                        </p>
                    </div>
                </div>

                {/* Shipment info */}
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-medium">Shipment ID {order.id.slice(-6)}A</h3>
                        <p className="text-sm text-gray-600">Today | 12:00PM - 2:00PM</p>
                    </div>
                    {/* Delivery status notification */}
                    <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4 flex items-start">
                        <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0" />
                        <p className="text-sm">A Delivery Associate will be assigned to you when order is picked up</p>
                    </div>
                </div>

                {/* Items */}
                <div className="mb-6">
                    <h3 className="font-medium mb-2">Items</h3>
                    <div className="space-y-3">
                        {order.items?.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-3 pb-3 border-b">
                                <div className="relative w-14 h-14 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                                    {item.image ? (
                                        <Image
                                            src={item.image}
                                            alt={item.name}
                                            fill
                                            className="object-contain p-1"
                                            sizes="56px"
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center h-full">
                                            <Package className="w-5 h-5 text-gray-400" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium line-clamp-2">{item.name}</div>
                                    <div className="text-xs text-gray-500">
                                        {item.quantity} × ৳{item.price.toLocaleString()}
                                    </div>
                                    <div className="text-sm font-medium">
                                        ৳{(item.price * item.quantity).toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Order summary */}
                <div className="mb-6">
                    <div className="flex justify-between text-sm mb-1">
                        <span>Subtotal:</span>
                        <span>৳{order.total.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-1">
                        <span>Delivery:</span>
                        <span>৳60</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg pt-2 border-t mt-2">
                        <span>Total:</span>
                        <span>৳{(order.total + 60).toLocaleString()}</span>
                    </div>
                </div>

                {/* Payment info */}
                <div className="mb-6">
                    <h3 className="font-medium mb-2">Payment</h3>
                    <div className="text-sm">
                        <div><span className="text-gray-500">Method:</span> {order.paymentMethod === 'cod' ? 'Cash On Delivery' : order.paymentMethod}</div>
                        <div><span className="text-gray-500">Status:</span> <span className={order.paymentStatus === 'paid' ? 'text-green-600' : 'text-yellow-600'}>{order.paymentStatus}</span></div>
                    </div>
                </div>

                {/* Full details button */}
                <div className="mt-8 flex flex-col gap-3">
                    <button
                        onClick={() => router.push(`/profile/orders/${order.id}`)}
                        className="w-full py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 rounded text-sm font-medium"
                    >
                        Full Details
                    </button>

                    {/* Cancel Order button and confirmation */}
                    {order.status !== 'cancelled' && order.status !== 'completed' && (
                        <>
                            {showCancelConfirm ? (
                                <div className="mt-2">
                                    <p className="text-sm text-gray-700 mb-2">Would you like to cancel this order?</p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setShowCancelConfirm(false)}
                                            className="flex-1 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded text-sm"
                                        >
                                            No, Keep Order
                                        </button>
                                        <button
                                            onClick={() => handleCancelOrder(order)}
                                            className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white rounded text-sm"
                                            disabled={isCancelling}
                                        >
                                            {isCancelling ? 'Cancelling...' : 'Yes, Cancel'}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setShowCancelConfirm(true)}
                                    className="w-full py-2 border border-red-500 text-red-500 hover:bg-red-50 rounded text-sm font-medium"
                                >
                                    Cancel Order
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>
        );
    };

    return (
        <main className={`transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-0'} pt-16`}>
            <Suspense fallback={
                <div className="flex justify-center items-center min-h-[200px]">
                    <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
                </div>
            }>
                <OrdersWithSearchParams
                    selectedOrderId={selectedOrderId}
                    setSelectedOrderId={setSelectedOrderId}
                    updateOrderStatus={updateOrderStatus}
                />
            </Suspense>

            <div className="max-w-7xl mx-auto p-4 md:p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
                    <button
                        onClick={handleRefresh}
                        className="p-2 hover:bg-gray-100 rounded-full"
                        disabled={isRefreshing}
                        aria-label="Refresh orders"
                    >
                        <RefreshCcw className={`w-5 h-5 ${isRefreshing ? 'animate-spin text-yellow-500' : 'text-gray-600'}`} />
                    </button>
                </div>

                {/* Filters */}
                <div className="mb-6 flex overflow-x-auto pb-2 gap-2">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${filter === 'all' ? 'bg-yellow-400 text-gray-900' : 'bg-white text-gray-600 border'}`}
                    >
                        All Orders
                    </button>
                    <button
                        onClick={() => setFilter('pending')}
                        className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${filter === 'pending' ? 'bg-yellow-400 text-gray-900' : 'bg-white text-gray-600 border'}`}
                    >
                        Pending
                    </button>
                    <button
                        onClick={() => setFilter('confirmed')}
                        className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${filter === 'confirmed' ? 'bg-yellow-400 text-gray-900' : 'bg-white text-gray-600 border'}`}
                    >
                        Confirmed
                    </button>
                    <button
                        onClick={() => setFilter('processing')}
                        className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${filter === 'processing' ? 'bg-yellow-400 text-gray-900' : 'bg-white text-gray-600 border'}`}
                    >
                        Processing
                    </button>
                    <button
                        onClick={() => setFilter('completed')}
                        className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${filter === 'completed' ? 'bg-yellow-400 text-gray-900' : 'bg-white text-gray-600 border'}`}
                    >
                        Completed
                    </button>
                    <button
                        onClick={() => setFilter('cancelled')}
                        className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${filter === 'cancelled' ? 'bg-yellow-400 text-gray-900' : 'bg-white text-gray-600 border'}`}
                    >
                        Cancelled
                    </button>
                </div>

                {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
                    </div>
                ) : getFilteredOrders().length === 0 ? (
                    <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                        <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-gray-100">
                            <ShoppingBag className="h-12 w-12 text-gray-400" />
                        </div>
                        <h3 className="mt-4 text-lg font-medium text-gray-900">No orders found</h3>
                        <p className="mt-2 text-gray-500">
                            {filter === 'all'
                                ? "You haven't placed any orders yet."
                                : `You don't have any ${filter} orders.`}
                        </p>
                        <div className="mt-6">
                            <button
                                onClick={() => router.push('/flash-sales')}
                                className="inline-flex items-center px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 rounded-md font-medium"
                            >
                                Start Shopping
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Orders list (left side) */}
                        <div className={selectedOrderId ? "lg:col-span-1" : "lg:col-span-3"}>
                            <div className="space-y-4">
                                {getFilteredOrders().map((order) => (
                                    <div
                                        key={order.id}
                                        className={`bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200 ${selectedOrderId === order.id ? 'border-2 border-yellow-400' : ''}`}
                                    >
                                        <div className="p-4 border-b flex justify-between items-center">
                                            <div>
                                                <p className="text-sm text-gray-500">Order #{order.id.slice(-6)}</p>
                                                <p className="text-xs text-gray-400">{formatDate(order.createdAt)}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {getOrderStatusBadge(order.status)}
                                                <p className="font-medium text-gray-900">৳{order.total.toLocaleString()}</p>
                                            </div>
                                        </div>
                                        <div className="p-4">
                                            <div className="flex flex-col gap-2">
                                                <div className="flex justify-between items-center">
                                                    <div className="text-sm text-gray-500">
                                                        {order.items?.length || 0} {order.items?.length === 1 ? 'item' : 'items'}
                                                    </div>
                                                    <div className="text-sm">
                                                        Payment: <span className={order.paymentStatus === 'paid' ? 'text-green-600' : 'text-yellow-600'}>
                                                            {order.paymentMethod === 'cod' ? 'Cash On Delivery' : order.paymentMethod?.toUpperCase() || 'N/A'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="mt-1 flex flex-wrap gap-2">
                                                    {order.items?.slice(0, 2).map((item, idx) => (
                                                        <div key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                                                            <div className="relative w-8 h-8 rounded-md bg-gray-100 overflow-hidden flex-shrink-0">
                                                                {item.image ? (
                                                                    <Image
                                                                        src={item.image}
                                                                        alt={item.name}
                                                                        fill
                                                                        className="object-contain"
                                                                        sizes="32px"
                                                                    />
                                                                ) : (
                                                                    <div className="flex items-center justify-center h-full w-full">
                                                                        <Package className="w-4 h-4 text-gray-400" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <span className="bg-gray-100 text-gray-600 px-1.5 rounded-full text-xs">{item.quantity}</span>
                                                            <span className="line-clamp-1">{item.name}</span>
                                                        </div>
                                                    ))}
                                                    {order.items?.length > 2 && (
                                                        <span className="text-sm text-gray-500">
                                                            +{order.items.length - 2} more
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="mt-4 flex justify-end">
                                                <button
                                                    onClick={() => toggleOrderDetails(order.id)}
                                                    className={`inline-flex items-center px-3 py-1.5 text-sm ${selectedOrderId === order.id ? 'bg-yellow-400 text-gray-900' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'} rounded-md`}
                                                >
                                                    {selectedOrderId === order.id ? (
                                                        <>
                                                            Hide Details
                                                            <ChevronLeft className="w-4 h-4 ml-1" />
                                                        </>
                                                    ) : (
                                                        <>
                                                            View Details
                                                            <ChevronRight className="w-4 h-4 ml-1" />
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Order details (right side) */}
                        {selectedOrderId && (
                            <div className="lg:col-span-2">
                                <OrderDetails
                                    order={selectedOrder}
                                    isLoading={isLoadingDetails}
                                    error={detailsError}
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>
        </main>
    );
}