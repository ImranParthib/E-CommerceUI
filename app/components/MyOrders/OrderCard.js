import React from 'react';
import { ShoppingBag, TruckIcon, AlertCircle, CheckCircle, Clock, Package } from 'lucide-react';

const OrderCard = ({ order, onSelect, isSelected }) => {
  // Format the status display with proper styling
  const getStatusStyles = (status) => {
    const statusLower = status?.toLowerCase();
    switch (statusLower) {
      case 'cancelled':
        return 'bg-red-500';
      case 'completed':
      case 'delivered':
        return 'bg-green-500';
      case 'processing':
        return 'bg-blue-500';
      case 'confirmed':
        return 'bg-purple-500';
      case 'shipped':
        return 'bg-indigo-500';
      case 'pending':
      default:
        return 'bg-yellow-500';
    }
  };

  // Get appropriate icon based on order status
  const getStatusIcon = (status) => {
    const statusLower = status?.toLowerCase();
    switch (statusLower) {
      case 'cancelled':
        return <AlertCircle className="w-4 h-4 text-white" />;
      case 'completed':
      case 'delivered':
        return <CheckCircle className="w-4 h-4 text-white" />;
      case 'processing':
        return <Clock className="w-4 h-4 text-white" />;
      case 'confirmed':
        return <Package className="w-4 h-4 text-white" />;
      case 'shipped':
        return <TruckIcon className="w-4 h-4 text-white" />;
      case 'pending':
      default:
        return <ShoppingBag className="w-4 h-4 text-white" />;
    }
  };

  // Format the price with commas
  const formatPrice = (price) => {
    if (!price && price !== 0) return '0';
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Format date to be more readable
  const formatDate = (dateString) => {
    if (!dateString) {
      // Extract date from order ID (assuming order ID starts with "order_timestamp")
      if (order.id && order.id.includes('_')) {
        try {
          // Extract timestamp part if it exists
          const timestampPart = order.id.split('_')[1];
          if (!timestampPart || isNaN(Number(timestampPart))) return '';

          const date = new Date(Number(timestampPart));
          return formatDateDisplay(date);
        } catch (error) {
          return '';
        }
      }
      return '';
    }

    // Safely parse the date string
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return ''; // Invalid date
      }
      return formatDateDisplay(date);
    } catch (error) {
      console.error("Error formatting date:", error);
      return '';
    }
  };

  const formatDateDisplay = (date) => {
    if (!(date instanceof Date) || isNaN(date)) return '';

    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    // Today or yesterday
    if (date.toDateString() === now.toDateString()) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }

    // This year
    const isThisYear = date.getFullYear() === now.getFullYear();
    if (isThisYear) {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }

    // Different year
    return date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Get readable order ID
  const getDisplayOrderId = (orderId) => {
    if (!orderId) return '';

    // If it's a long ID, truncate it
    if (typeof orderId === 'string' && orderId.length > 12) {
      return `#${orderId.substring(0, 8)}...`;
    }

    return `#${orderId}`;
  };

  // Get items count text
  const getItemsText = (itemsCount) => {
    const count = itemsCount || 0;
    return count === 1 ? '1 item' : `${count} items`;
  };

  // Make sure we have a valid amount
  const amount = order.total || order.amount || 0;

  // Get items count more reliably
  const itemsCount = Array.isArray(order.items) ? order.items.length : order.shipments || 0;

  return (
    <div
      className={`border rounded-lg transition-all duration-200 ${isSelected
        ? 'border-yellow-500 bg-yellow-50 shadow-md'
        : 'border-gray-200 hover:border-yellow-300 hover:bg-yellow-50/30'
        }`}
      onClick={() => onSelect(order.id)}
    >
      <div className="p-4">
        {/* Header with status and date */}
        <div className="flex items-center justify-between mb-3">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${getStatusStyles(order.status)}`}>
            {getStatusIcon(order.status)}
            <span className="text-white text-xs font-medium">
              {order.status?.charAt(0).toUpperCase() + order.status?.slice(1) || 'Pending'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {order.paymentMethod === 'pending' && (
              <span className="bg-orange-100 text-orange-800 text-xs px-2 py-0.5 rounded-full">
                Payment Required
              </span>
            )}
            {order.paymentMethod === 'online' && order.paymentStatus !== 'paid' && (
              <span className="bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded-full">
                Payment Pending
              </span>
            )}
            <span className="text-gray-500 text-xs">
              {formatDate(order.createdAt || order.date)}
            </span>
          </div>
        </div>

        {/* Order details */}
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center">
              <span className="text-gray-600 text-sm mr-1.5">ID:</span>
              <span className="font-medium text-sm">{getDisplayOrderId(order.id)}</span>
            </div>

            <div className="flex items-center mt-1">
              <span className="text-gray-600 text-sm mr-1.5">Total:</span>
              <span className="font-semibold text-sm">৳{formatPrice(amount)}</span>
            </div>

            <div className="flex items-center mt-1">
              <span className="text-gray-600 text-sm mr-1.5">Items:</span>
              <span className="text-sm">{getItemsText(itemsCount)}</span>
            </div>
          </div>

          {/* Action button */}
          <button
            onClick={(e) => {
              e.stopPropagation(); // Prevent the card's onClick from triggering
              onSelect(order.id);
            }}
            className={`flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${isSelected
              ? 'bg-yellow-500 text-white hover:bg-yellow-600'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            aria-expanded={isSelected}
          >
            {isSelected ? 'Hide' : 'Details'}
            <svg
              className={`ml-1 w-3.5 h-3.5 transform transition-transform ${isSelected ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderCard;