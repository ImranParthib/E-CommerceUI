'use client';

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, RefreshCcw, Clock, ShoppingBag, Home, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import { useCart } from '@/app/context/CartContext';
import { useUserOrders } from '@/app/context/OrdersContext';
import { format, formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';

const OrderDetailsModal = ({ isOpen, order, onClose }) => {
    const router = useRouter();
    const { bulkAddToCart } = useCart();
    const { cancelOrder } = useUserOrders();

    if (!order) {
        return null;
    }

    const handleReorder = () => {
        bulkAddToCart(order.items);
        onClose();
        router.push('/cart');
    };

    const handleCancel = async () => {
        if (window.confirm("Are you sure you want to cancel this order?")) {
            await cancelOrder(order.id);
            onClose();
        }
    };

    // Helper functions
    const formatPrice = (price) => {
        return parseFloat(price).toLocaleString('en-US');
    };

    const formatDate = (dateString) => {
        try {
            const date = new Date(dateString);
            return formatDistanceToNow(date, { addSuffix: true });
        } catch (e) {
            return dateString;
        }
    };

    const formatFullDate = (dateString) => {
        try {
            return format(new Date(dateString), 'PPP p');
        } catch (e) {
            return dateString;
        }
    };

    const getStatusColor = (status) => {
        switch (status.toLowerCase()) {
            case 'pending': return 'bg-yellow-500 text-white';
            case 'confirmed': return 'bg-blue-500 text-white';
            case 'processing': return 'bg-indigo-500 text-white';
            case 'completed': return 'bg-green-500 text-white';
            case 'cancelled': return 'bg-gray-500 text-white';
            default: return 'bg-gray-400 text-white';
        }
    };

    const getStatusIcon = (status) => {
        switch (status.toLowerCase()) {
            case 'pending': return <Clock className="w-4 h-4 mr-1" />;
            case 'confirmed': return <ShoppingBag className="w-4 h-4 mr-1" />;
            case 'processing': return <RefreshCcw className="w-4 h-4 mr-1" />;
            case 'completed': return <Home className="w-4 h-4 mr-1" />;
            case 'cancelled': return <X className="w-4 h-4 mr-1" />;
            default: return <AlertCircle className="w-4 h-4 mr-1" />;
        }
    };

    return (
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 z-10 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center sm:items-center sm:p-0">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            enterTo="opacity-100 translate-y-0 sm:scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                        >
                            <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
                                <div className="absolute right-0 top-0 pr-4 pt-4">
                                    <button
                                        type="button"
                                        className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                        onClick={onClose}
                                    >
                                        <span className="sr-only">Close</span>
                                        <X className="h-6 w-6" aria-hidden="true" />
                                    </button>
                                </div>

                                <div className="sm:flex sm:items-start">
                                    <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-yellow-100 sm:mx-0 sm:h-10 sm:w-10">
                                        <ShoppingBag className="h-6 w-6 text-yellow-600" aria-hidden="true" />
                                    </div>
                                    <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                                        <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900">
                                            Order Details
                                        </Dialog.Title>
                                        <div className="mt-1">
                                            <p className="text-sm text-gray-500">
                                                Order #{order.id.substring(0, 8)} • {formatFullDate(order.createdAt)}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 flow-root">
                                    {/* Order Summary */}
                                    <div className="mb-6">
                                        <div className="flex items-center space-x-2">
                                            <div className={`flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                                {getStatusIcon(order.status)}
                                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                            </div>
                                        </div>

                                        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                                            <div>
                                                <p className="font-medium text-gray-500">Items</p>
                                                <p className="text-gray-900">{order.items.length}</p>
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-500">Total</p>
                                                <p className="text-gray-900">৳{formatPrice(order.total)}</p>
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-500">Payment</p>
                                                <p className="text-gray-900">{order.paymentMethod}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Delivery details */}
                                    <div className="mb-6 bg-gray-50 p-4 rounded-md">
                                        <h4 className="text-sm font-medium text-gray-900 mb-2">Delivery Details</h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <p className="font-medium text-gray-500">Name</p>
                                                <p className="text-gray-900">{order.delivery.name}</p>
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-500">Phone</p>
                                                <p className="text-gray-900">{order.delivery.phone}</p>
                                            </div>
                                            <div className="sm:col-span-2">
                                                <p className="font-medium text-gray-500">Address</p>
                                                <p className="text-gray-900">{order.delivery.address}, {order.delivery.city}, {order.delivery.zip}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Status timeline */}
                                    <div className="mb-6">
                                        <h4 className="text-sm font-medium text-gray-900 mb-3">Order Timeline</h4>
                                        <div className="flow-root">
                                            <ul className="-mb-8">
                                                {order.statusHistory.map((statusChange, idx) => (
                                                    <li key={idx}>
                                                        <div className="relative pb-8">
                                                            {idx !== order.statusHistory.length - 1 ? (
                                                                <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                                                            ) : null}
                                                            <div className="relative flex items-start space-x-3">
                                                                <div className="relative">
                                                                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${getStatusColor(statusChange.status)}`}>
                                                                        {getStatusIcon(statusChange.status)}
                                                                    </div>
                                                                </div>
                                                                <div className="min-w-0 flex-1">
                                                                    <p className="text-sm font-medium text-gray-900">
                                                                        {statusChange.status.charAt(0).toUpperCase() + statusChange.status.slice(1)}
                                                                    </p>
                                                                    <p className="text-sm text-gray-500">
                                                                        {formatDate(statusChange.timestamp)}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>

                                    {/* Order items */}
                                    <h4 className="text-sm font-medium text-gray-900 mb-3">Items in this order</h4>
                                    <div className="max-h-60 overflow-y-auto mb-6">
                                        <div className="space-y-4">
                                            {order.items.map((item) => (
                                                <div key={`${order.id}-${item.id}`} className="flex border-b border-gray-200 pb-4">
                                                    <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                                                        <Image
                                                            src={item.image}
                                                            alt={item.name}
                                                            fill
                                                            sizes="64px"
                                                            className="object-contain"
                                                        />
                                                    </div>
                                                    <div className="ml-4 flex flex-1 flex-col">
                                                        <div>
                                                            <div className="flex justify-between">
                                                                <h5 className="text-sm text-gray-800">{item.name}</h5>
                                                                <p className="ml-4 text-sm font-medium text-gray-900">৳{formatPrice(item.price * item.quantity)}</p>
                                                            </div>
                                                            <p className="mt-1 text-sm text-gray-500">Qty {item.quantity} x ৳{formatPrice(item.price)}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                                    <button
                                        type="button"
                                        className="inline-flex w-full justify-center rounded-md bg-yellow-400 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-yellow-500 sm:ml-3 sm:w-auto"
                                        onClick={handleReorder}
                                    >
                                        <RefreshCcw className="h-4 w-4 mr-2" /> Reorder Items
                                    </button>

                                    {order.status === 'pending' && (
                                        <button
                                            type="button"
                                            className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-medium text-red-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-red-50 sm:mt-0 sm:w-auto"
                                            onClick={handleCancel}
                                        >
                                            <X className="h-4 w-4 mr-2" /> Cancel Order
                                        </button>
                                    )}

                                    <button
                                        type="button"
                                        className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-medium text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                                        onClick={onClose}
                                    >
                                        Close
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
};

export default OrderDetailsModal;
