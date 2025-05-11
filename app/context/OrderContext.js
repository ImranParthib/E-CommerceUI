'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { useCart } from './CartContext';
import { auth } from '@/lib/firebase';
import {
    ORDER_STATUSES,
    PAYMENT_STATUSES,
    DELIVERY_FEE,
    EXPRESS_DELIVERY_SURCHARGE
} from '@/app/config/constants';

const OrderContext = createContext();

const ORDER_STORAGE_KEY = 'kenakata_orders';

export function OrderProvider({ children }) {
    const [orders, setOrders] = useState([]);
    const [isInitialized, setIsInitialized] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { cartItems, clearCart, getCartTotal } = useCart();

    // Load orders from localStorage on initial mount
    useEffect(() => {
        try {
            if (auth.currentUser) {
                const userId = auth.currentUser.uid;
                const savedOrders = localStorage.getItem(`${ORDER_STORAGE_KEY}_${userId}`);
                if (savedOrders) {
                    setOrders(JSON.parse(savedOrders));
                }
            }
        } catch (error) {
            console.error('Error loading orders:', error);
        } finally {
            setIsInitialized(true);
        }
    }, []);

    // Listen for auth changes
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                try {
                    const userId = user.uid;
                    const savedOrders = localStorage.getItem(`${ORDER_STORAGE_KEY}_${userId}`);
                    if (savedOrders) {
                        setOrders(JSON.parse(savedOrders));
                    } else {
                        setOrders([]);
                    }
                } catch (error) {
                    console.error('Error loading orders after auth change:', error);
                    setOrders([]);
                }
            } else {
                // No user, clear orders
                setOrders([]);
            }
        });

        return () => unsubscribe();
    }, []);

    // Save orders to localStorage whenever they change
    useEffect(() => {
        if (isInitialized && auth.currentUser) {
            try {
                const userId = auth.currentUser.uid;
                localStorage.setItem(
                    `${ORDER_STORAGE_KEY}_${userId}`,
                    JSON.stringify(orders)
                );
            } catch (error) {
                console.error('Error saving orders:', error);
            }
        }
    }, [orders, isInitialized]);

    const getOrderById = (orderId) => {
        return orders.find(order => order.id === orderId);
    };

    const getOrderDetails = async (orderId) => {
        return getOrderById(orderId);
    };

    const normalizeOrderData = useCallback((order) => {
        if (!order) return null;

        // Calculate order total from items if not provided
        const calculatedTotal = order.items ?
            order.items.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0) : 0;

        // Determine delivery fee based on city or use INSIDE_DHAKA as fallback
        const baseFee = order.delivery?.city && order.delivery.city.toLowerCase() !== 'dhaka'
            ? DELIVERY_FEE.OUTSIDE_DHAKA
            : DELIVERY_FEE.INSIDE_DHAKA;

        // Calculate final delivery fee
        const deliveryFee = order.deliveryTime === 'express'
            ? baseFee + EXPRESS_DELIVERY_SURCHARGE
            : baseFee;

        // Ensure order has all required fields in a logical sequence
        return {
            id: order.id || `order_${Date.now()}`,
            userId: order.userId || auth.currentUser?.uid,
            status: order.status || ORDER_STATUSES.PENDING,
            paymentStatus: order.paymentStatus || PAYMENT_STATUSES.UNPAID,
            paymentMethod: order.paymentMethod || 'pending',
            items: order.items || [],
            total: order.total || order.totalAmount || calculatedTotal,
            discount: order.discount || 0,
            deliveryFee: order.deliveryFee || deliveryFee,
            delivery: order.delivery || {},
            createdAt: order.createdAt || new Date().toISOString(),
            updatedAt: order.updatedAt || new Date().toISOString(),
            statusHistory: order.statusHistory || [
                {
                    status: order.status || ORDER_STATUSES.PENDING,
                    timestamp: order.createdAt || new Date().toISOString()
                }
            ],
            ...order // Preserve other custom fields
        };
    }, []);

    const createOrder = (deliveryDetails) => {
        if (!auth.currentUser) {
            toast.error('Please login to place an order');
            return null;
        }

        if (cartItems.length === 0) {
            toast.error('Your cart is empty');
            return null;
        }

        const orderItems = cartItems.map(item => ({
            ...item,
            quantity: item.quantity || 1,
            // Ensure all product details are preserved
            price: item.price || item.sale_price || 0,
            selectedAttributes: item.selectedAttributes || {},
            attributes: item.attributes || [],
            variation_id: item.variation_id || null,
            meta_data: item.meta_data || []
        }));

        // Determine delivery fee based on city
        const baseFee = deliveryDetails.city && deliveryDetails.city.toLowerCase() !== 'dhaka'
            ? DELIVERY_FEE.OUTSIDE_DHAKA
            : DELIVERY_FEE.INSIDE_DHAKA;

        // Calculate final delivery fee
        const deliveryFee = deliveryDetails.deliveryTime === 'express'
            ? baseFee + EXPRESS_DELIVERY_SURCHARGE
            : baseFee;

        const newOrder = normalizeOrderData({
            id: `order_${Date.now()}`,
            userId: auth.currentUser.uid,
            items: orderItems,
            total: orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
            deliveryFee: deliveryFee,
            status: ORDER_STATUSES.PENDING,
            paymentMethod: 'pending',
            paymentStatus: PAYMENT_STATUSES.UNPAID,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            delivery: {
                name: deliveryDetails.name,
                phone: deliveryDetails.phone,
                address: deliveryDetails.address,
                city: deliveryDetails.city,
                zip: deliveryDetails.zip
            },
            deliveryTime: deliveryDetails.deliveryTime,
            deliveryNotes: deliveryDetails.notes,
            statusHistory: [
                {
                    status: ORDER_STATUSES.PENDING,
                    timestamp: new Date().toISOString()
                }
            ]
        });

        // Update state with new order
        setOrders(prevOrders => [newOrder, ...prevOrders]);

        // Clear the cart after creating order
        clearCart();

        toast.success('Order created successfully!');

        // Sync with WooCommerce if we have a customer ID
        syncOrderWithWooCommerce(newOrder);

        return newOrder;
    };

    const syncOrderWithWooCommerce = async (order) => {
        try {
            const userProfileData = localStorage.getItem(`user_profile_data_${auth.currentUser.uid}`);
            if (!userProfileData) {
                console.warn('No user profile found, skipping WooCommerce sync');
                return;
            }

            const userProfile = JSON.parse(userProfileData);
            if (!userProfile.woocommerceId) {
                console.warn('No WooCommerce customer ID found, skipping WooCommerce sync');
                return;
            }

            const customerData = {
                woocommerceId: userProfile.woocommerceId,
                email: userProfile.email || auth.currentUser.email,
                displayName: userProfile.displayName || auth.currentUser.displayName,
                phoneNumber: userProfile.phoneNumber
            };

            const response = await fetch('/api/orders/sync', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...order,
                    customerData
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Failed to sync with WooCommerce');
            }

            const orderIndex = orders.findIndex(o => o.id === order.id);
            if (orderIndex !== -1) {
                const updatedOrders = [...orders];
                updatedOrders[orderIndex] = {
                    ...orders[orderIndex],
                    woocommerceId: result.wcOrderId,
                    lastSynced: new Date().toISOString()
                };
                setOrders(updatedOrders);

                if (auth.currentUser) {
                    try {
                        const userId = auth.currentUser.uid;
                        localStorage.setItem(
                            `${ORDER_STORAGE_KEY}_${userId}`,
                            JSON.stringify(updatedOrders)
                        );
                    } catch (error) {
                        console.error('Error saving orders:', error);
                    }
                }
            }

            console.log('Order synced with WooCommerce:', result);
            return result;
        } catch (error) {
            console.error('Error syncing order with WooCommerce:', error);
        }
    };

    const cancelOrder = async (orderId) => {
        setIsLoading(true);
        try {
            const orderIndex = orders.findIndex(order => order.id === orderId);
            if (orderIndex === -1) {
                toast.error('Order not found');
                return false;
            }

            const order = orders[orderIndex];
            if (order.status !== ORDER_STATUSES.PENDING) {
                toast.error('Only pending orders can be cancelled');
                return false;
            }

            const updatedOrder = {
                ...order,
                status: ORDER_STATUSES.CANCELLED,
                updatedAt: new Date().toISOString(),
                statusHistory: [
                    ...order.statusHistory,
                    {
                        status: ORDER_STATUSES.CANCELLED,
                        timestamp: new Date().toISOString()
                    }
                ]
            };

            const updatedOrders = [...orders];
            updatedOrders[orderIndex] = updatedOrder;
            setOrders(updatedOrders);

            return updatedOrder;
        } catch (error) {
            console.error('Error cancelling order:', error);
            toast.error('Failed to cancel order');
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    const updateOrderStatus = async (orderId, newStatus) => {
        setIsLoading(true);
        try {
            const orderIndex = orders.findIndex(order => order.id === orderId);
            if (orderIndex === -1) {
                toast.error('Order not found');
                return false;
            }

            const order = orders[orderIndex];
            const updatedOrder = {
                ...order,
                status: newStatus,
                updatedAt: new Date().toISOString(),
                statusHistory: [
                    ...order.statusHistory,
                    {
                        status: newStatus,
                        timestamp: new Date().toISOString()
                    }
                ]
            };

            const updatedOrders = [...orders];
            updatedOrders[orderIndex] = updatedOrder;
            setOrders(updatedOrders);

            return true;
        } catch (error) {
            console.error('Error updating order status:', error);
            toast.error('Failed to update order status');
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    const confirmOrder = (orderId, paymentMethod, paymentDetails = null) => {
        try {
            const orderIndex = orders.findIndex(order => order.id === orderId);
            if (orderIndex === -1) {
                console.error(`Order not found: ${orderId}`);
                toast.error('Order not found');
                return false;
            }

            const order = orders[orderIndex];

            // Set appropriate statuses based on payment method
            let newStatus;
            let newPaymentStatus;

            if (paymentMethod === 'cod') {
                // For Cash on Delivery, mark as confirmed and payment as pending
                newStatus = ORDER_STATUSES.CONFIRMED;
                newPaymentStatus = 'pending';
            } else if (paymentMethod === 'online') {
                // For online payment, status depends on payment details
                if (paymentDetails?.status === 'paid') {
                    // If payment was successful, mark as processing
                    newStatus = ORDER_STATUSES.PROCESSING;
                    newPaymentStatus = 'paid';
                } else {
                    // If payment is still pending, keep order as pending
                    newStatus = ORDER_STATUSES.PENDING;
                    newPaymentStatus = 'pending';
                }
            } else if (paymentMethod === 'pending') {
                // If payment method is still pending, keep order as pending
                newStatus = ORDER_STATUSES.PENDING;
                newPaymentStatus = 'pending';
            } else {
                // Default fallback
                newStatus = ORDER_STATUSES.PENDING;
                newPaymentStatus = 'pending';
            }

            const updatedOrder = {
                ...order,
                status: newStatus,
                paymentMethod,
                paymentStatus: newPaymentStatus,
                updatedAt: new Date().toISOString(),
                statusHistory: [
                    ...order.statusHistory,
                    {
                        status: newStatus,
                        timestamp: new Date().toISOString()
                    }
                ]
            };

            // Add payment details if provided
            if (paymentDetails) {
                if (paymentDetails.transactionId) {
                    updatedOrder.transactionId = paymentDetails.transactionId;
                }
                if (paymentDetails.status) {
                    updatedOrder.paymentStatus = paymentDetails.status;
                }
            }

            const updatedOrders = [...orders];
            updatedOrders[orderIndex] = updatedOrder;
            setOrders(updatedOrders);

            console.log(`Order ${orderId} confirmed with payment method: ${paymentMethod}`, updatedOrder);
            return true;
        } catch (error) {
            console.error(`Error confirming order ${orderId}:`, error);
            toast.error('Failed to confirm order');
            return false;
        }
    };

    const deduplicateStatusHistory = (statusHistory) => {
        if (!statusHistory || !Array.isArray(statusHistory)) return [];

        const latestStatusMap = new Map();

        [...statusHistory].sort((a, b) => {
            const timeA = new Date(a.timestamp).getTime();
            const timeB = new Date(b.timestamp).getTime();
            return timeA - timeB;
        }).forEach(entry => {
            latestStatusMap.set(entry.status, entry);
        });

        return Array.from(latestStatusMap.values()).sort((a, b) => {
            const timeA = new Date(a.timestamp).getTime();
            const timeB = new Date(b.timestamp).getTime();
            return timeA - timeB;
        });
    };

    const updatePaymentStatus = (orderId, status, details = {}) => {
        const orderIndex = orders.findIndex(order => order.id === orderId);
        if (orderIndex === -1) {
            return false;
        }

        const order = orders[orderIndex];

        if (order.paymentStatus === status) {
            return true;
        }

        const updatedOrder = {
            ...order,
            paymentStatus: status,
            updatedAt: new Date().toISOString(),
        };

        if (details.transactionId) {
            updatedOrder.transactionId = details.transactionId;
        }

        if (status === 'paid' && order.status !== ORDER_STATUSES.PROCESSING) {
            updatedOrder.status = ORDER_STATUSES.PROCESSING;

            if (!order.statusHistory.some(s => s.status === ORDER_STATUSES.PROCESSING)) {
                updatedOrder.statusHistory = [
                    ...order.statusHistory,
                    {
                        status: ORDER_STATUSES.PROCESSING,
                        timestamp: new Date().toISOString()
                    }
                ];

                updatedOrder.statusHistory = deduplicateStatusHistory(updatedOrder.statusHistory);
            }
        }

        const updatedOrders = [...orders];
        updatedOrders[orderIndex] = updatedOrder;
        setOrders(updatedOrders);

        return true;
    };

    return (
        <OrderContext.Provider value={{
            orders,
            isLoading,
            createOrder,
            cancelOrder,
            updateOrderStatus,
            getOrderById,
            getOrderDetails,
            confirmOrder,
            updatePaymentStatus,
            syncOrderWithWooCommerce,
            ORDER_STATUSES,
            PAYMENT_STATUSES
        }}>
            {children}
        </OrderContext.Provider>
    );
}

export function useOrders() {
    const context = useContext(OrderContext);
    if (!context) {
        throw new Error('useOrders must be used within an OrderProvider');
    }
    return context;
}
