import React, { useState, useEffect, useMemo } from 'react';
import OrderCard from './OrderCard';
import OrderDetails from './OrderDetails';
import { useUserOrders } from '@/app/context/OrdersContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-toastify';
import { Loader2, Search, Filter, SortDesc, SortAsc, ShoppingBag, RefreshCw } from 'lucide-react';

const MyOrder = ({ initialOrderId, paymentStatus }) => {
  const {
    userOrders,
    isLoading,
    isSyncingFromWooCommerce,
    updateOrderStatus,
    updatePaymentStatus,
    getOrderById,
    syncOrdersFromWooCommerce
  } = useUserOrders();

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [expandedCardId, setExpandedCardId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortDirection, setSortDirection] = useState('desc'); // 'desc' for newest first
  const [localLoading, setLocalLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Handle initial order selection when redirected with orderId
  useEffect(() => {
    if (initialOrderId && userOrders.length > 0) {
      const order = getOrderById(initialOrderId);
      if (order) {
        setSelectedOrder(order);
        setExpandedCardId(initialOrderId);

        // Handle payment status update
        if (paymentStatus === 'success') {
          updatePaymentStatus(initialOrderId, 'paid', {
            transactionId: searchParams.get('tran_id') || 'UNKNOWN'
          });
        }
      }
    }
  }, [initialOrderId, userOrders, getOrderById, paymentStatus, updatePaymentStatus, searchParams]);

  // Improved loading experience
  useEffect(() => {
    // If we have orders, we're no longer loading
    if (userOrders.length > 0) {
      setLocalLoading(false);
    } else {
      // Show loading for a minimum time to avoid flickering
      const timer = setTimeout(() => {
        setLocalLoading(false);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [userOrders]);

  // Handle payment status updates from URL params with better feedback
  useEffect(() => {
    const paymentStatus = searchParams.get('payment');
    const orderId = searchParams.get('orderId');
    const tranId = searchParams.get('tran_id');

    if (paymentStatus && orderId) {
      // Check if the order exists
      const orderExists = userOrders.some(order => order.id === orderId);

      if (orderExists) {
        if (paymentStatus === 'success') {
          // Get the current order to check its status
          const currentOrder = userOrders.find(order => order.id === orderId);

          // Only update if payment status isn't already 'paid'
          if (currentOrder && currentOrder.paymentStatus !== 'paid') {
            updatePaymentStatus(orderId, 'paid', {
              transactionId: tranId || 'UNKNOWN'
            });
            toast.success('Payment completed successfully!');
          }

          // Auto-select the order that was just paid for
          const paidOrder = userOrders.find(order => order.id === orderId);
          if (paidOrder) {
            setSelectedOrder(paidOrder);
            setExpandedCardId(orderId);
          }
        } else if (paymentStatus === 'failed') {
          toast.error('Payment failed. You can try again from your order details.');

          // Auto-select the order that failed payment
          const failedOrder = userOrders.find(order => order.id === orderId);
          if (failedOrder) {
            setSelectedOrder(failedOrder);
            setExpandedCardId(orderId);
          }
        }
      }

      // Clean up URL params by redirecting back to the orders page
      // This is done with a slight delay to ensure the toast is visible
      setTimeout(() => {
        router.push('/profile/orders');
      }, 300);
    }
  }, [searchParams, updatePaymentStatus, router, userOrders]);

  // Handle selecting an order
  const handleSelectOrder = (orderId) => {
    // If the order is already selected, we hide it
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder(null);
    } else {
      // Otherwise, we show the new order
      const order = getOrderById(orderId);
      if (order) {
        setSelectedOrder(order);

        // If payment is required, show a toast notification with link to payment
        if (order.paymentMethod === 'pending' ||
          (order.paymentMethod === 'online' && order.paymentStatus !== 'paid')) {
          toast.info(
            <div>
              This order requires payment.
              <button
                onClick={() => router.push(`/checkout/payment/${order.id}`)}
                className="ml-2 underline text-blue-600"
              >
                Complete Payment
              </button>
            </div>,
            { autoClose: 8000 }
          );
        }
      } else {
        toast.error('Could not load order details');
      }
    }
  };

  // When an order is toggled on mobile
  const handleToggleDetails = (orderId) => {
    // If this order is already expanded, collapse it
    if (expandedCardId === orderId) {
      setExpandedCardId(null);
      setSelectedOrder(null);
    } else {
      // Otherwise expand this one and collapse any others
      setExpandedCardId(orderId);
      const order = getOrderById(orderId);
      if (order) {
        setSelectedOrder(order);
      } else {
        toast.error('Could not load order details');
      }
    }
  };

  // Handle refreshing orders from WooCommerce
  const handleRefreshOrders = async () => {
    try {
      await syncOrdersFromWooCommerce();
      toast.success('Orders refreshed from server');
    } catch (error) {
      toast.error('Failed to refresh orders');
      console.error('Error refreshing orders:', error);
    }
  };

  // Filter and sort orders for better organization
  const filteredAndSortedOrders = useMemo(() => {
    // Create a Map to store unique orders by ID
    const uniqueOrders = new Map();

    // Add orders to the Map, keeping only the most recent version of each order
    userOrders.forEach(order => {
      uniqueOrders.set(order.id, order);
    });

    // Convert Map back to array
    let result = Array.from(uniqueOrders.values());

    // Filter by search term (order ID)
    if (searchTerm) {
      result = result.filter(order =>
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.delivery?.name && order.delivery.name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filter by status
    if (filterStatus !== 'all') {
      result = result.filter(order => order.status === filterStatus);
    }

    // Sort by date
    result.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortDirection === 'desc' ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [userOrders, searchTerm, filterStatus, sortDirection]);

  // Get unique status values for filter dropdown
  const statusOptions = useMemo(() => {
    const statuses = userOrders.map(order => order.status);
    return ['all', ...new Set(statuses)];
  }, [userOrders]);

  const toggleSortDirection = () => {
    setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc');
  };

  if (isLoading || localLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
        <span className="ml-2">Loading your orders...</span>
      </div>
    );
  }

  // Improved empty state message
  if (userOrders.length === 0 && !isLoading) {
    return (
      <div className="border border-gray-200 rounded-lg p-12 text-center bg-white">
        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShoppingBag className="w-8 h-8 text-yellow-500" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Orders Yet</h3>
        <p className="text-gray-500 mb-4">When you place orders, they will appear here</p>
        <button
          onClick={() => router.push('/')}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
        >
          Start Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Order filter and search section */}
      <div className="bg-white p-4 border border-gray-200 rounded-lg">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search orders by ID or name"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring focus:ring-yellow-500 focus:ring-opacity-50"
            />
          </div>

          <div className="flex gap-2">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-4 w-4 text-gray-400" />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="pl-10 rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring focus:ring-yellow-500 focus:ring-opacity-50"
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status === 'all' ? 'All Status' : status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={toggleSortDirection}
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm flex items-center text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
            >
              {sortDirection === 'desc' ? (
                <SortDesc className="h-4 w-4 text-gray-400" />
              ) : (
                <SortAsc className="h-4 w-4 text-gray-400" />
              )}
              <span className="ml-2">{sortDirection === 'desc' ? 'Newest' : 'Oldest'}</span>
            </button>

            <button
              onClick={handleRefreshOrders}
              disabled={isSyncingFromWooCommerce}
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm flex items-center text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 text-gray-400 ${isSyncingFromWooCommerce ? 'animate-spin' : ''}`} />
              <span className="ml-2">Sync</span>
            </button>
          </div>
        </div>
      </div>

      {/* Orders count indicator */}
      {filteredAndSortedOrders.length > 0 && (
        <p className="text-sm text-gray-600">
          Showing {filteredAndSortedOrders.length} {filteredAndSortedOrders.length === 1 ? 'order' : 'orders'}
          {filterStatus !== 'all' ? ` with status "${filterStatus}"` : ''}
          {searchTerm ? ` matching "${searchTerm}"` : ''}
        </p>
      )}

      {/* Desktop layout - orders on left, selected order details on right */}
      <div className="hidden md:grid grid-cols-12 gap-4">
        <div className={`${selectedOrder ? 'col-span-5' : 'col-span-12'} space-y-4`}>
          {filteredAndSortedOrders.length > 0 ? (
            filteredAndSortedOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={{
                  id: order.id,
                  total: order.total,
                  items: order.items,
                  status: order.status,
                  createdAt: order.createdAt
                }}
                onSelect={() => handleSelectOrder(order.id)}
                isSelected={selectedOrder?.id === order.id}
              />
            ))
          ) : (
            <div className="text-center p-8 bg-white border border-gray-200 rounded-lg">
              <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 mb-2">No orders match your filters</p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterStatus('all');
                }}
                className="text-yellow-600 hover:text-yellow-800 text-sm font-medium"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>

        {selectedOrder && (
          <div className="col-span-7">
            <div className="sticky top-20">
              <OrderDetails order={selectedOrder} />
            </div>
          </div>
        )}
      </div>

      {/* Mobile layout - stacked with expanding cards */}
      <div className="md:hidden space-y-4">
        {filteredAndSortedOrders.length > 0 ? (
          <>
            {filteredAndSortedOrders.map((order) => (
              <div key={order.id} className="space-y-2">
                <OrderCard
                  order={{
                    id: order.id,
                    total: order.total,
                    items: order.items,
                    status: order.status,
                    createdAt: order.createdAt
                  }}
                  onSelect={() => handleToggleDetails(order.id)}
                  isSelected={expandedCardId === order.id}
                />

                {/* Mobile Order Details - shows underneath the card when expanded */}
                {expandedCardId === order.id && (
                  <div className="mt-2 animate-fadeIn">
                    <OrderDetails order={selectedOrder} />
                  </div>
                )}
              </div>
            ))}
          </>
        ) : (
          <div className="text-center p-8 bg-white border border-gray-200 rounded-lg">
            <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 mb-2">No orders match your filters</p>
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterStatus('all');
              }}
              className="text-yellow-600 hover:text-yellow-800 text-sm font-medium"
            >
              Clear filters
            </button>
          </div>
        )}

        {isSyncingFromWooCommerce && (
          <div className="fixed bottom-4 right-4 bg-yellow-100 text-yellow-800 p-3 rounded-md shadow-lg flex items-center">
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            <span className="text-xs font-medium">Syncing orders...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyOrder;