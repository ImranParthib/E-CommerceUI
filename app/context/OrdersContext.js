'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useCart } from './CartContext';
import { auth } from '@/lib/firebase';

const OrdersContext = createContext();

const USER_ORDERS_STORAGE_KEY = 'user_orders_data';

export function OrdersProvider({ children }) {
    const [userOrders, setUserOrders] = useState([]);
    const [isInitialized, setIsInitialized] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { cartItems, moveToOrder, restoreFromOrder } = useCart();

    // Load orders from localStorage on initial mount
    useEffect(() => {
        try {
            if (auth.currentUser) {
                const savedOrders = localStorage.getItem(`${USER_ORDERS_STORAGE_KEY}_${auth.currentUser.uid}`);
                if (savedOrders) {
                    setUserOrders(JSON.parse(savedOrders));
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
                    const savedOrders = localStorage.getItem(`${USER_ORDERS_STORAGE_KEY}_${user.uid}`);
                    if (savedOrders) {
                        setUserOrders(JSON.parse(savedOrders));
                    } else {
                        setUserOrders([]);
                    }
                } catch (error) {
                    console.error('Error loading orders after auth change:', error);
                    setUserOrders([]);
                }
            } else {
                // No user, clear orders
                setUserOrders([]);
            }
        });

        return () => unsubscribe();
    }, []);

    // Save orders to localStorage whenever they change
    useEffect(() => {
        if (isInitialized && auth.currentUser) {
            try {
                localStorage.setItem(
                    `${USER_ORDERS_STORAGE_KEY}_${auth.currentUser.uid}`,
                    JSON.stringify(userOrders)
                );
            } catch (error) {
                console.error('Error saving orders:', error);
                toast.error('Failed to save your order data locally');
            }
        }
    }, [userOrders, isInitialized]);

    const refreshOrders = () => {
        if (auth.currentUser) {
            try {
                const savedOrders = localStorage.getItem(`${USER_ORDERS_STORAGE_KEY}_${auth.currentUser.uid}`);
                if (savedOrders) {
                    setUserOrders(JSON.parse(savedOrders));
                }
            } catch (error) {
                console.error('Error refreshing orders:', error);
                toast.error('Error refreshing orders');
            }
        }
    };

    const getOrderById = (orderId) => {
        if (!orderId) {
            console.warn("Attempted to get order with empty ID");
            return null;
        }

        // Normalize the ID to handle potential encoding issues
        const normalizedId = decodeURIComponent(orderId);
        console.log(`Looking for order with ID: ${normalizedId}`);

        const foundOrder = userOrders.find(order => order.id === normalizedId);
        console.log(`Order found?: ${!!foundOrder}`);

        return foundOrder;
    };

    const getOrderDetails = async (orderId) => {
        try {
            // First, try direct lookup
            let order = getOrderById(orderId);

            if (!order) {
                // If not found, try to refresh orders from local storage
                refreshOrders();
                // Try again after refresh
                order = userOrders.find(order => order.id === orderId);
            }

            return order || null;
        } catch (error) {
            console.error(`Error fetching order details for ${orderId}:`, error);
            return null;
        }
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

        const orderItems = moveToOrder();

        const newOrder = {
            id: `${Date.now()}`,
            userId: auth.currentUser.uid,
            items: orderItems,
            total: orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
            status: 'pending',
            paymentMethod: 'pending',
            paymentStatus: 'unpaid',
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
                    status: 'pending',
                    timestamp: new Date().toISOString()
                }
            ]
        };

        setUserOrders(prevOrders => [newOrder, ...prevOrders]);
        toast.success('Order created successfully!');
        return newOrder;
    };

    const cancelOrder = async (orderId) => {
        setIsLoading(true);
        try {
            const orderIndex = userOrders.findIndex(order => order.id === orderId);
            if (orderIndex === -1) {
                toast.error('Order not found');
                return false;
            }

            const order = userOrders[orderIndex];
            if (order.status !== 'pending') {
                toast.error('Only pending orders can be cancelled');
                return false;
            }

            const updatedOrder = {
                ...order,
                status: 'cancelled',
                updatedAt: new Date().toISOString(),
                statusHistory: [
                    ...order.statusHistory,
                    {
                        status: 'cancelled',
                        timestamp: new Date().toISOString()
                    }
                ]
            };

            const updatedOrders = [...userOrders];
            updatedOrders[orderIndex] = updatedOrder;
            setUserOrders(updatedOrders);

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
            const orderIndex = userOrders.findIndex(order => order.id === orderId);
            if (orderIndex === -1) {
                toast.error('Order not found');
                return false;
            }

            const order = userOrders[orderIndex];
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

            const updatedOrders = [...userOrders];
            updatedOrders[orderIndex] = updatedOrder;
            setUserOrders(updatedOrders);

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
        const orderIndex = userOrders.findIndex(order => order.id === orderId);
        if (orderIndex === -1) {
            toast.error('Order not found');
            return false;
        }

        const order = userOrders[orderIndex];
        const updatedOrder = {
            ...order,
            status: paymentMethod === 'cod' ? 'confirmed' : 'processing',
            paymentMethod,
            paymentStatus: paymentMethod === 'cod' ? 'pending' : (paymentDetails?.status || 'paid'),
            updatedAt: new Date().toISOString(),
            statusHistory: [
                ...order.statusHistory,
                {
                    status: paymentMethod === 'cod' ? 'confirmed' : 'processing',
                    timestamp: new Date().toISOString()
                }
            ]
        };

        // Add payment details if provided
        if (paymentDetails) {
            if (paymentDetails.transactionId) {
                updatedOrder.transactionId = paymentDetails.transactionId;
            }
        }

        const updatedOrders = [...userOrders];
        updatedOrders[orderIndex] = updatedOrder;
        setUserOrders(updatedOrders);

        return true;
    };

    const updatePaymentStatus = (orderId, status, transactionDetails = {}) => {
        const orderIndex = userOrders.findIndex(order => order.id === orderId);
        if (orderIndex === -1) {
            return false;
        }

        const order = userOrders[orderIndex];
        const updatedOrder = {
            ...order,
            paymentStatus: status,
            ...transactionDetails,
            updatedAt: new Date().toISOString()
        };

        // If payment is successful, update order status to processing or confirmed
        if (status === 'paid') {
            updatedOrder.status = 'processing';
            updatedOrder.statusHistory = [
                ...order.statusHistory,
                {
                    status: 'processing',
                    timestamp: new Date().toISOString()
                }
            ];
        }

        const updatedOrders = [...userOrders];
        updatedOrders[orderIndex] = updatedOrder;
        setUserOrders(updatedOrders);

        return true;
    };

    return (
        <OrdersContext.Provider
            value={{
                userOrders,
                isLoading,
                createOrder,
                cancelOrder,
                updateOrderStatus,
                getOrderById,
                getOrderDetails,
                refreshOrders,
                confirmOrder,
                updatePaymentStatus
            }}
        >
            {children}
        </OrdersContext.Provider>
    );
}

export function useUserOrders() {
    const context = useContext(OrdersContext);
    if (!context) {
        throw new Error('useUserOrders must be used within an OrdersProvider');
    }
    return context;
}
