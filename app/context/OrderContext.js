'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useCart } from './CartContext';
import { auth } from '@/lib/firebase';

const OrderContext = createContext();

const ORDER_STORAGE_KEY = 'chaldal_orders';

export function OrderProvider({ children }) {
    const [orders, setOrders] = useState([]);
    const [isInitialized, setIsInitialized] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { cartItems, clearCart, getCartTotal } = useCart();

    const ORDER_STATUSES = {
        PENDING: 'pending',
        CONFIRMED: 'confirmed',
        PROCESSING: 'processing',
        COMPLETED: 'completed',
        CANCELLED: 'cancelled'
    };

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

    const createOrder = (deliveryDetails) => {
        if (!auth.currentUser) {
            toast.error('Please login to place an order');
            return null;
        }

        if (cartItems.length === 0) {
            toast.error('Your cart is empty');
            return null;
        }

        const newOrder = {
            id: `order_${Date.now()}`,
            userId: auth.currentUser.uid,
            items: [...cartItems], // Make a copy of cart items
            total: getCartTotal(),
            status: ORDER_STATUSES.PENDING,
            paymentMethod: 'pending',
            paymentStatus: 'unpaid',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            delivery: deliveryDetails,
            statusHistory: [
                {
                    status: ORDER_STATUSES.PENDING,
                    timestamp: new Date().toISOString()
                }
            ]
        };

        // Update state with new order
        setOrders(prevOrders => [newOrder, ...prevOrders]);

        // Clear the cart after creating order
        clearCart();

        toast.success('Order created successfully!');
        return newOrder;
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

            toast.success('Order cancelled successfully');
            return true;
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
        const orderIndex = orders.findIndex(order => order.id === orderId);
        if (orderIndex === -1) {
            toast.error('Order not found');
            return false;
        }

        const order = orders[orderIndex];
        const updatedOrder = {
            ...order,
            status: paymentMethod === 'cod' ? ORDER_STATUSES.CONFIRMED : ORDER_STATUSES.PROCESSING,
            paymentMethod,
            paymentStatus: paymentMethod === 'cod' ? 'pending' : 'paid',
            updatedAt: new Date().toISOString(),
            statusHistory: [
                ...order.statusHistory,
                {
                    status: paymentMethod === 'cod' ? ORDER_STATUSES.CONFIRMED : ORDER_STATUSES.PROCESSING,
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

        return true;
    };

    // Add a method to handle payment status updates
    const updatePaymentStatus = (orderId, status, details = {}) => {
        const orderIndex = orders.findIndex(order => order.id === orderId);
        if (orderIndex === -1) {
            return false;
        }

        const order = orders[orderIndex];
        const updatedOrder = {
            ...order,
            paymentStatus: status,
            updatedAt: new Date().toISOString(),
        };

        if (details.transactionId) {
            updatedOrder.transactionId = details.transactionId;
        }

        // If payment is completed successfully, update order status accordingly
        if (status === 'paid') {
            updatedOrder.status = ORDER_STATUSES.PROCESSING;
            updatedOrder.statusHistory.push({
                status: ORDER_STATUSES.PROCESSING,
                timestamp: new Date().toISOString()
            });
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
            ORDER_STATUSES
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
