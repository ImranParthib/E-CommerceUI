import React, { useState, useEffect } from 'react';
import { useCart } from '@/app/context/CartContext';
import { useOrders } from '@/app/context/OrderContext';
import { format, formatDistanceToNow } from 'date-fns';
import { toast } from 'react-toastify';
import {
  Clock,
  Check,
  X,
  ShoppingBag,
  CreditCard,
  RefreshCw,
  Truck,
  MapPin,
  Phone,
  User,
  FileText,
  Package,
  AlertTriangle,
  Download,
  Share2
} from 'lucide-react';
import { useRouter } from 'next/navigation';

// Constants for order statuses and payment methods
const ORDER_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  CONFIRMED: 'confirmed',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

const PAYMENT_STATUS = {
  PAID: 'paid',
  PENDING: 'pending',
  PENDING_PAYMENT: 'pending_payment',
  FAILED: 'failed',
  UNPAID: 'unpaid'
};

const PAYMENT_METHOD = {
  COD: 'cod',
  ONLINE: 'online',
  PENDING: 'pending',
  PENDING_PAYMENT: 'pending_payment'
};

const OrderDetails = ({ order: initialOrder }) => {
  const [order, setOrder] = useState(initialOrder);
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [generatingInvoice, setGeneratingInvoice] = useState(false);
  const { bulkAddToCart } = useCart();
  const { updateOrderStatus, cancelOrder, getOrderById } = useOrders();
  const router = useRouter();

  // Normalize and set the order data
  useEffect(() => {
    if (initialOrder?.id) {
      setOrder(normalizeOrderData(initialOrder));
    }
  }, [initialOrder]);

  // Function to normalize order data to handle inconsistencies
  const normalizeOrderData = (orderData) => {
    if (!orderData) return null;

    // Ensure all required fields exist
    return {
      ...orderData,
      status: orderData.status?.toLowerCase() || ORDER_STATUS.PENDING,
      paymentMethod: orderData.paymentMethod?.toLowerCase() || PAYMENT_METHOD.PENDING,
      paymentStatus: orderData.paymentStatus?.toLowerCase() || PAYMENT_STATUS.PENDING,
      items: Array.isArray(orderData.items) ? orderData.items : [],
      total: calculateOrderTotal(orderData),
      deliveryFee: orderData.deliveryFee || 60,
      discount: orderData.discount || 0,
      statusHistory: Array.isArray(orderData.statusHistory) ? orderData.statusHistory : [],
      delivery: orderData.delivery || {}
    };
  };

  // Calculate order total from items
  const calculateOrderTotal = (orderData) => {
    if (orderData.total) return orderData.total;
    if (orderData.totalAmount) return orderData.totalAmount;

    if (Array.isArray(orderData.items) && orderData.items.length > 0) {
      return orderData.items.reduce((sum, item) => {
        const price = Number(item.price) || 0;
        const quantity = Number(item.quantity) || 1;
        return sum + (price * quantity);
      }, 0);
    }

    return 0;
  };

  // Format price with commas
  const formatPrice = (price) => {
    if (price === undefined || price === null) return '0';
    return Number(price).toLocaleString('en-US');
  };

  // Format date string
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return format(date, 'MMM dd, yyyy');
    } catch {
      return dateString;
    }
  };

  // Format time
  const formatTime = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return format(date, 'h:mm a');
    } catch {
      return '';
    }
  };

  // Format relative time
  const formatRelativeTime = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return '';
    }
  };

  // Add all items to cart
  const handleAddToCart = async () => {
    if (!order?.items?.length) {
      toast.error("No items available to add to cart");
      return;
    }

    setLoading(true);
    try {
      await bulkAddToCart(order.items);
      toast.success("All items from this order added to your cart");
    } catch (error) {
      console.error("Add to cart error:", error);
      toast.error("Failed to add items to cart");
    } finally {
      setLoading(false);
    }
  };

  // Navigate to payment page
  const handleCompletePayment = () => {
    setPaymentLoading(true);
    try {
      router.push(`/checkout/payment/${order.id}?source=orders`);
    } catch (error) {
      console.error('Navigation error:', error);
      toast.error('Failed to navigate to payment page');
      setPaymentLoading(false);
    }
  };

  // Cancel the order
  const handleCancelOrder = async () => {
    setShowConfirmation(false);
    setLoading(true);

    try {
      const updatedOrder = await cancelOrder(order.id);
      if (updatedOrder) {
        setOrder(normalizeOrderData(updatedOrder));
        toast.success("Order cancelled successfully");
      } else {
        throw new Error("Failed to update order");
      }
    } catch (error) {
      console.error("Cancel order error:", error);
      toast.error("Failed to cancel order");
    } finally {
      setLoading(false);
    }
  };

  // Download invoice
  const handleDownloadInvoice = () => {
    setGeneratingInvoice(true);
    toast.info("Generating invoice for download...");

    // Simulate API call
    setTimeout(() => {
      setGeneratingInvoice(false);
      toast.success("Invoice downloaded successfully");
    }, 1500);
  };

  // Share order details
  const handleShareOrder = () => {
    try {
      if (navigator.share) {
        navigator.share({
          title: `Order #${order.id}`,
          text: `Check out my order #${order.id}`,
          url: window.location.href,
        }).catch(() => {
          copyToClipboard();
        });
      } else {
        copyToClipboard();
      }
    } catch (error) {
      copyToClipboard();
    }
  };

  // Copy URL to clipboard as fallback
  const copyToClipboard = () => {
    try {
      navigator.clipboard.writeText(window.location.href);
      toast.info("Order link copied to clipboard");
    } catch {
      toast.error("Could not copy to clipboard");
    }
  };

  // Check if order can be cancelled
  const canCancelOrder = () => {
    if (!order) return false;

    // Can cancel if order is pending and either:
    // - Payment method is COD
    // - Payment method is not selected
    // - Payment is not completed for online payments
    return order.status === ORDER_STATUS.PENDING && (
      order.paymentMethod === PAYMENT_METHOD.COD ||
      order.paymentMethod === PAYMENT_METHOD.PENDING ||
      order.paymentMethod === PAYMENT_METHOD.PENDING_PAYMENT ||
      (order.paymentMethod === PAYMENT_METHOD.ONLINE && order.paymentStatus !== PAYMENT_STATUS.PAID)
    );
  };

  // Check if payment button should be shown
  const shouldShowPaymentButton = () => {
    if (!order) return false;

    // Show payment button if:
    // - Payment method is not selected
    // - Payment is pending or failed for online payments
    return (
      order.paymentMethod === PAYMENT_METHOD.PENDING ||
      order.paymentMethod === PAYMENT_METHOD.PENDING_PAYMENT ||
      (order.paymentMethod === PAYMENT_METHOD.ONLINE &&
        (order.paymentStatus === PAYMENT_STATUS.PENDING ||
          order.paymentStatus === PAYMENT_STATUS.PENDING_PAYMENT ||
          order.paymentStatus === PAYMENT_STATUS.FAILED ||
          order.paymentStatus === PAYMENT_STATUS.UNPAID))
    );
  };

  // Get status color based on status
  const getStatusColor = (status) => {
    if (!status) return 'bg-gray-100 text-gray-800';

    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case ORDER_STATUS.CANCELLED:
        return 'bg-red-100 text-red-800';
      case ORDER_STATUS.COMPLETED:
      case ORDER_STATUS.DELIVERED:
        return 'bg-green-100 text-green-800';
      case ORDER_STATUS.PROCESSING:
        return 'bg-blue-100 text-blue-800';
      case ORDER_STATUS.CONFIRMED:
        return 'bg-purple-100 text-purple-800';
      case ORDER_STATUS.SHIPPED:
        return 'bg-indigo-100 text-indigo-800';
      case ORDER_STATUS.PENDING:
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  // Get status icon based on status
  const getStatusIcon = (status) => {
    if (!status) return <Clock className="h-4 w-4" />;

    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case ORDER_STATUS.CANCELLED:
        return <X className="h-4 w-4" />;
      case ORDER_STATUS.COMPLETED:
      case ORDER_STATUS.DELIVERED:
        return <Check className="h-4 w-4" />;
      case ORDER_STATUS.PROCESSING:
        return <RefreshCw className="h-4 w-4" />;
      case ORDER_STATUS.CONFIRMED:
        return <Package className="h-4 w-4" />;
      case ORDER_STATUS.SHIPPED:
        return <Truck className="h-4 w-4" />;
      case ORDER_STATUS.PENDING:
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  // Get payment method display name
  const getPaymentMethodDisplay = (method) => {
    if (!method || method === PAYMENT_METHOD.PENDING || method === PAYMENT_METHOD.PENDING_PAYMENT) {
      return 'Payment Method Not Selected';
    }

    switch (method.toLowerCase()) {
      case PAYMENT_METHOD.COD:
        return 'Cash on Delivery';
      case PAYMENT_METHOD.ONLINE:
        return 'Online Payment';
      default:
        return method;
    }
  };

  // Get payment status display
  const getPaymentStatusDisplay = (status, method) => {
    if (!method || method === PAYMENT_METHOD.PENDING || method === PAYMENT_METHOD.PENDING_PAYMENT) {
      return 'Not Selected';
    }

    if (method === PAYMENT_METHOD.ONLINE) {
      switch (status?.toLowerCase()) {
        case PAYMENT_STATUS.PAID:
          return 'Paid';
        case PAYMENT_STATUS.PENDING:
        case PAYMENT_STATUS.PENDING_PAYMENT:
          return 'Pending';
        case PAYMENT_STATUS.FAILED:
          return 'Failed';
        case PAYMENT_STATUS.UNPAID:
          return 'Unpaid';
        default:
          return status?.toLowerCase() === 'paid' ? 'Paid' : 'Pending';
      }
    }

    if (method === PAYMENT_METHOD.COD) {
      return order.status === ORDER_STATUS.DELIVERED ? 'Paid' : 'Pending';
    }

    return status?.toLowerCase() === 'paid' ? 'Paid' : 'Pending';
  };

  // Get payment status color
  const getPaymentStatusColor = (status, method) => {
    if (!method || method === PAYMENT_METHOD.PENDING || method === PAYMENT_METHOD.PENDING_PAYMENT) {
      return 'text-gray-600';
    }

    if (method === PAYMENT_METHOD.COD && order.status === ORDER_STATUS.DELIVERED) {
      return 'text-green-600';
    }

    switch (status?.toLowerCase()) {
      case PAYMENT_STATUS.PAID:
        return 'text-green-600';
      case PAYMENT_STATUS.PENDING:
      case PAYMENT_STATUS.PENDING_PAYMENT:
        return 'text-yellow-600';
      case PAYMENT_STATUS.FAILED:
      case PAYMENT_STATUS.UNPAID:
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  // Calculate total price with delivery fee and discount
  const calculateTotalPrice = () => {
    const subtotal = order.total || 0;
    const deliveryFee = order.deliveryFee || 0;
    const discount = order.discount || 0;
    return subtotal + deliveryFee - discount;
  };

  // Get deduplicated and sorted status history
  const getOrderTimeline = () => {
    if (!order?.statusHistory?.length) return [];

    // Create a map keyed by status to deduplicate entries
    const statusMap = new Map();

    // Populate map with the latest entry for each status
    order.statusHistory.forEach(status => {
      if (!statusMap.has(status.status) ||
        new Date(status.timestamp) > new Date(statusMap.get(status.status).timestamp)) {
        statusMap.set(status.status, status);
      }
    });

    // Convert map values to array and sort by timestamp
    return Array.from(statusMap.values())
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  };

  // Render empty state if no order
  if (!order) {
    return (
      <div className="border border-gray-200 rounded-lg p-6 flex items-center justify-center">
        <p className="text-gray-500">Order details not available</p>
      </div>
    );
  }

  // Get order timeline
  const orderTimeline = getOrderTimeline();

  return (
    <div className="border border-gray-200 rounded-lg bg-white shadow-sm">
      {/* Order details header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl text-gray-800 font-semibold mb-1">Order Details</h2>
            <p className="text-gray-500 text-sm">
              {order.createdAt ? `Placed ${formatRelativeTime(order.createdAt)}` : 'Order date not available'}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`px-3 py-1 rounded-full text-sm flex items-center gap-1.5 ${getStatusColor(order.status)}`}>
              {getStatusIcon(order.status)}
              <span className="capitalize">{order.status || 'Unknown'}</span>
            </div>
          </div>
        </div>

        {/* Quick action buttons */}
        <div className="flex flex-wrap gap-2 mt-4">
          <button
            onClick={handleDownloadInvoice}
            disabled={generatingInvoice}
            className="px-3 py-1 rounded-full text-xs flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 disabled:opacity-50"
          >
            {generatingInvoice ? (
              <RefreshCw className="w-3 h-3 animate-spin" />
            ) : (
              <Download className="w-3 h-3" />
            )}
            <span>Invoice</span>
          </button>

          <button
            onClick={handleShareOrder}
            className="px-3 py-1 rounded-full text-xs flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700"
          >
            <Share2 className="w-3 h-3" />
            <span>Share</span>
          </button>
        </div>
      </div>

      {/* Order Info */}
      <div className="p-4 border-b border-gray-100">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">Order ID</p>
            <p className="font-medium text-sm">{order.id || 'N/A'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Date Placed</p>
            <p className="font-medium text-sm">{formatDate(order.createdAt) || 'N/A'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Payment Method</p>
            <p className="font-medium text-sm">{getPaymentMethodDisplay(order.paymentMethod)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Payment Status</p>
            <p className={`font-medium text-sm ${getPaymentStatusColor(order.paymentStatus, order.paymentMethod)}`}>
              {getPaymentStatusDisplay(order.paymentStatus, order.paymentMethod)}
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex flex-col md:flex-row flex-wrap gap-2">
          {/* Payment Button */}
          {shouldShowPaymentButton() && (
            <button
              onClick={handleCompletePayment}
              disabled={paymentLoading || loading}
              className="w-full md:w-1/3 bg-yellow-500 text-white rounded-md py-2.5 flex items-center justify-center hover:bg-yellow-600 disabled:opacity-50"
            >
              {paymentLoading ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CreditCard className="w-4 h-4 mr-2" />
              )}
              Complete Payment
            </button>
          )}

          {/* Cancel Button */}
          {canCancelOrder() && (
            <button
              onClick={() => setShowConfirmation(true)}
              disabled={loading}
              className="w-full md:w-1/3 border border-red-300 text-red-500 rounded-md py-2.5 flex items-center justify-center hover:bg-red-50 disabled:opacity-50"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel Order
            </button>
          )}

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            disabled={loading || !order.items?.length}
            className="w-full md:w-1/3 border border-yellow-400 text-yellow-600 rounded-md py-2.5 flex items-center justify-center hover:bg-yellow-50 disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <ShoppingBag className="w-4 h-4 mr-2" />
            )}
            Add to Cart
          </button>
        </div>
      </div>

      {/* Product Details */}
      <div className="p-4">
        <h3 className="font-medium mb-3 text-sm flex items-center">
          <Package className="w-4 h-4 mr-1.5 text-gray-500" />
          Order Items
        </h3>
        <div className="bg-gray-50 rounded-lg overflow-hidden">
          {order.items?.length > 0 ? (
            order.items.map((item, index) => (
              <div
                key={`${item.id || index}-${item.name}`}
                className={`p-3 flex items-center justify-between ${index !== order.items.length - 1 ? 'border-b border-gray-100' : ''
                  }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white rounded-md flex items-center justify-center overflow-hidden border border-gray-100">
                    {item.images?.[0]?.src ? (
                      <img
                        src={item.images[0].src}
                        alt={item.name}
                        className="w-full h-full object-contain"
                      />
                    ) : item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <Package className="w-6 h-6 text-gray-300" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{item.name || 'Unnamed Product'}</p>

                    {/* Display attributes if available */}
                    {item.selectedAttributes && Object.keys(item.selectedAttributes).length > 0 && (
                      <p className="text-xs text-blue-600">
                        {Object.entries(item.selectedAttributes).map(([key, value], i, arr) => (
                          <span key={key}>
                            {key}: {value}{i < arr.length - 1 ? ', ' : ''}
                          </span>
                        ))}
                      </p>
                    )}

                    <p className="text-xs text-gray-500">
                      {item.weight ? item.weight : `${item.quantity || 1} pcs`}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-sm">৳ {formatPrice(item.price)}</p>
                  <p className="text-xs text-gray-500">Qty: {item.quantity || 1}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-gray-500">
              No items in this order
            </div>
          )}

          {/* Order Summary */}
          <div className="p-4 border-t border-gray-200 bg-white">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-600">Subtotal</span>
              <span className="text-sm">৳{formatPrice(order.total)}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-600">Delivery Fee</span>
              <span className="text-sm">৳{formatPrice(order.deliveryFee)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between mb-2">
                <span className="text-sm text-green-600">Discount</span>
                <span className="text-sm text-green-600">-৳{formatPrice(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-gray-100 font-bold">
              <span className="text-gray-800">Total</span>
              <span className="text-gray-800">৳{formatPrice(calculateTotalPrice())}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Delivery Information */}
      <div className="p-4 border-b border-gray-100">
        <h3 className="font-medium mb-3 text-sm flex items-center">
          <MapPin className="w-4 h-4 mr-1.5 text-gray-500" />
          Delivery Information
        </h3>
        <div className="p-3 bg-gray-50 rounded-lg">
          {order.delivery && Object.keys(order.delivery).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center mb-2">
                  <User className="w-3.5 h-3.5 mr-1.5 text-gray-500" />
                  <p className="font-medium text-sm text-gray-700">{order.delivery.name || 'N/A'}</p>
                </div>
                <div className="flex items-center mb-2">
                  <Phone className="w-3.5 h-3.5 mr-1.5 text-gray-500" />
                  <p className="text-sm text-gray-600">{order.delivery.phone || 'N/A'}</p>
                </div>
                <div className="flex items-start">
                  <MapPin className="w-3.5 h-3.5 mr-1.5 mt-0.5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">{order.delivery.address || 'N/A'}</p>
                    {(order.delivery.city || order.delivery.zip) && (
                      <p className="text-sm text-gray-600">
                        {[order.delivery.city, order.delivery.zip].filter(Boolean).join(', ')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <div className="flex items-center mb-2">
                  <Truck className="w-3.5 h-3.5 mr-1.5 text-gray-500" />
                  <p className="text-sm text-gray-600">
                    {order.delivery.deliveryTime === 'express' ?
                      'Express Delivery (3-5 hrs)' :
                      'Standard Delivery (Within 24 hrs)'}
                  </p>
                </div>
                {order.delivery.notes && (
                  <div className="flex items-start">
                    <FileText className="w-3.5 h-3.5 mr-1.5 mt-0.5 text-gray-500" />
                    <p className="text-sm text-gray-600">{order.delivery.notes}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-2">Delivery information not available</p>
          )}
        </div>
      </div>

      {/* Order Status Timeline */}
      {orderTimeline.length > 0 && (
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-medium mb-3 text-sm">Order Timeline</h3>
          <div className="space-y-3">
            {orderTimeline.map((status, index, timeline) => (
              <div key={`${status.status}-${status.timestamp}`} className="flex items-start relative">
                {/* Vertical timeline connector */}
                {index < timeline.length - 1 && (
                  <div className="absolute left-[0.7rem] top-6 bottom-0 w-0.5 bg-gray-200 h-8"></div>
                )}

                <div className={`rounded-full p-1.5 mt-0.5 mr-3 z-10 ${status.status === ORDER_STATUS.CANCELLED ? 'bg-red-100' :
                  status.status === ORDER_STATUS.CONFIRMED ||
                    status.status === ORDER_STATUS.COMPLETED ? 'bg-green-100' :
                    status.status === ORDER_STATUS.PROCESSING ? 'bg-blue-100' :
                      status.status === ORDER_STATUS.SHIPPED ? 'bg-indigo-100' : 'bg-yellow-100'
                  }`}>
                  {status.status === ORDER_STATUS.CANCELLED ? (
                    <X className="h-3 w-3 text-red-600" />
                  ) : status.status === ORDER_STATUS.CONFIRMED ||
                    status.status === ORDER_STATUS.COMPLETED ? (
                    <Check className="h-3 w-3 text-green-600" />
                  ) : status.status === ORDER_STATUS.SHIPPED ? (
                    <Truck className="h-3 w-3 text-indigo-600" />
                  ) : status.status === ORDER_STATUS.PROCESSING ? (
                    <RefreshCw className="h-3 w-3 text-blue-600" />
                  ) : (
                    <Clock className="h-3 w-3 text-yellow-600" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline justify-between">
                    <p className="font-medium text-sm capitalize">
                      {status.status || 'Unknown'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatTime(status.timestamp) || 'N/A'}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {formatDate(status.timestamp) || 'N/A'}
                  </p>
                  {status.notes && (
                    <p className="text-xs text-gray-600 mt-1 bg-gray-50 p-2 rounded">{status.notes}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cancel confirmation modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center mb-4 text-red-600">
              <AlertTriangle className="w-6 h-6 mr-2" />
              <h3 className="text-lg font-medium">Cancel Order</h3>
            </div>
            <p className="text-gray-600 mb-6">Are you sure you want to cancel this order? This action cannot be undone.</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowConfirmation(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                No, Keep Order
              </button>
              <button
                onClick={handleCancelOrder}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Yes, Cancel Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetails;



