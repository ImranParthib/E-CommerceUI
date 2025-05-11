'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { useCart } from './CartContext';
import { auth } from '@/lib/firebase';

const OrdersContext = createContext();

const USER_ORDERS_STORAGE_KEY = 'user_orders_data';

export function OrdersProvider({ children }) {
    const [userOrders, setUserOrders] = useState([]);
    const [isInitialized, setIsInitialized] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSyncingFromWooCommerce, setIsSyncingFromWooCommerce] = useState(false);
    const { cartItems, moveToOrder, restoreFromOrder } = useCart();

    // Add normalizeOrderData function directly in this component
    const normalizeOrderData = useCallback((order) => {
        if (!order) return null;

        // Ensure order has all the required fields
        return {
            id: order.id || `order_${Date.now()}`,
            userId: order.userId || auth.currentUser?.uid,
            items: order.items || [],
            status: order.status || 'pending',
            paymentStatus: order.paymentStatus || 'unpaid',
            paymentMethod: order.paymentMethod || 'pending',
            total: order.total || order.totalAmount ||
                (order.items ? order.items.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0) : 0),
            createdAt: order.createdAt || new Date().toISOString(),
            updatedAt: order.updatedAt || new Date().toISOString(),
            delivery: order.delivery || {},
            statusHistory: order.statusHistory || [
                {
                    status: order.status || 'pending',
                    timestamp: order.createdAt || new Date().toISOString()
                }
            ],
            woocommerceId: order.woocommerceId || null,
            ...order // Preserve any other fields
        };
    }, []);

    // Helper function to deduplicate status history entries
    const deduplicateStatusHistory = (statusHistory) => {
        if (!statusHistory || !Array.isArray(statusHistory)) return [];

        // Get unique statuses, keeping only the latest timestamp for each
        const statusMap = new Map();

        // Go through in chronological order
        [...statusHistory].sort((a, b) => {
            const dateA = new Date(a.timestamp).getTime();
            const dateB = new Date(b.timestamp).getTime();
            return dateA - dateB;
        }).forEach(entry => {
            statusMap.set(entry.status, entry);
        });

        // Convert back to array and sort by timestamp
        return Array.from(statusMap.values()).sort((a, b) => {
            const dateA = new Date(a.timestamp).getTime();
            const dateB = new Date(b.timestamp).getTime();
            return dateA - dateB;
        });
    };

    // Load orders from both localStorage and WooCommerce on initial mount
    useEffect(() => {
        async function initializeOrders() {
            try {
                if (auth.currentUser) {
                    // First, load orders from localStorage as a fallback
                    const savedOrders = localStorage.getItem(`${USER_ORDERS_STORAGE_KEY}_${auth.currentUser.uid}`);
                    if (savedOrders) {
                        // Normalize orders before setting to state
                        const parsedOrders = JSON.parse(savedOrders);
                        const normalizedOrders = parsedOrders.map(order => normalizeOrderData(order));
                        setUserOrders(normalizedOrders);
                    }

                    // Then fetch orders from WooCommerce to get the most up-to-date data
                    await syncOrdersFromWooCommerce();
                }
            } catch (error) {
                console.error('Error loading orders:', error);
            } finally {
                setIsInitialized(true);
            }
        }

        initializeOrders();
    }, [normalizeOrderData]);

    // Listen for auth changes
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                try {
                    // First load from localStorage as a fallback
                    const savedOrders = localStorage.getItem(`${USER_ORDERS_STORAGE_KEY}_${user.uid}`);
                    if (savedOrders) {
                        // Normalize orders before setting to state
                        const parsedOrders = JSON.parse(savedOrders);
                        const normalizedOrders = parsedOrders.map(order => normalizeOrderData(order));
                        setUserOrders(normalizedOrders);
                    } else {
                        setUserOrders([]);
                    }

                    // Then attempt to fetch from WooCommerce
                    syncOrdersFromWooCommerce();
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
    }, [normalizeOrderData]);

    // New function to fetch orders from WooCommerce
    const syncOrdersFromWooCommerce = async () => {
        if (!auth.currentUser) return;

        setIsSyncingFromWooCommerce(true);
        try {
            const response = await fetch(`/api/orders/fetch?firebase_uid=${auth.currentUser.uid}`);
            const result = await response.json();

            if (response.ok && result.success && result.orders) {
                // Get current local orders
                const localOrders = [...userOrders];

                // Create a merged order list, preferring WooCommerce versions but keeping local-only orders
                const mergedOrders = [];
                const woocommerceOrderIds = new Set();

                // First add all WooCommerce orders
                result.orders.forEach(wcOrder => {
                    // Find if we already have this order locally (by app ID or WooCommerce ID)
                    const localOrder = localOrders.find(
                        lo => lo.id === wcOrder.id ||
                            (lo.woocommerceId && lo.woocommerceId === wcOrder.woocommerceId)
                    );

                    // If found locally, merge any local-only data
                    if (localOrder) {
                        // Keep local statusHistory if it has more entries
                        if (localOrder.statusHistory?.length > wcOrder.statusHistory?.length) {
                            wcOrder.statusHistory = localOrder.statusHistory;
                        }
                    }

                    mergedOrders.push(wcOrder);
                    woocommerceOrderIds.add(wcOrder.id);
                    if (wcOrder.woocommerceId) {
                        woocommerceOrderIds.add(wcOrder.woocommerceId);
                    }
                });

                // Then add any local-only orders
                localOrders.forEach(localOrder => {
                    // Only add if it's not already included from WooCommerce
                    const orderExistsInWooCommerce =
                        woocommerceOrderIds.has(localOrder.id) ||
                        (localOrder.woocommerceId && woocommerceOrderIds.has(localOrder.woocommerceId));

                    if (!orderExistsInWooCommerce) {
                        mergedOrders.push(localOrder);
                    }
                });

                // Sort by date (newest first)
                mergedOrders.sort((a, b) =>
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                );

                // Update state and localStorage
                setUserOrders(mergedOrders);
                localStorage.setItem(
                    `${USER_ORDERS_STORAGE_KEY}_${auth.currentUser.uid}`,
                    JSON.stringify(mergedOrders)
                );

                return mergedOrders;
            } else {
                console.error('Failed to fetch orders from WooCommerce:', result.error || 'Unknown error');
            }
        } catch (error) {
            console.error('Error syncing orders from WooCommerce:', error);
        } finally {
            setIsSyncingFromWooCommerce(false);
        }

        return null;
    };

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

        // Return normalized order data
        return foundOrder ? normalizeOrderData(foundOrder) : null;
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
                order = order ? normalizeOrderData(order) : null;
            }

            return order;
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

        const orderItems = cartItems.map(item => ({
            ...item,
            quantity: item.quantity || 1,
            // Ensure all product attributes are preserved
            price: item.price || item.sale_price || 0,
            selectedAttributes: item.selectedAttributes || {},
            attributes: item.attributes || [],
            variation_id: item.variation_id || null,
            meta_data: item.meta_data || []
        }));

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
                zip: deliveryDetails.zip,
                // Store the original address reference if available
                originalAddressId: deliveryDetails.selectedAddressId || null
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

        // Sync with WooCommerce if we have a customer ID
        syncOrderWithWooCommerce(newOrder);

        return newOrder;
    };

    // New function to sync order with WooCommerce
    const syncOrderWithWooCommerce = async (order) => {
        try {
            // Get user profile to check for WooCommerce customer ID
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

            // Find original address if an ID was stored
            let originalAddress = null;
            if (order.delivery?.originalAddressId && userProfile.addresses) {
                originalAddress = userProfile.addresses.find(
                    addr => addr.id === order.delivery.originalAddressId
                );
            }

            // Prepare customer data with enhanced address information
            const customerData = {
                woocommerceId: userProfile.woocommerceId,
                email: userProfile.email || auth.currentUser.email,
                displayName: userProfile.displayName || auth.currentUser.displayName,
                phoneNumber: userProfile.phoneNumber,
                // Include original address data if available
                address: originalAddress
            };

            // Call our API endpoint to sync with WooCommerce
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

            // Update the order with WooCommerce ID
            const orderIndex = userOrders.findIndex(o => o.id === order.id);
            if (orderIndex !== -1) {
                const updatedOrders = [...userOrders];
                updatedOrders[orderIndex] = {
                    ...userOrders[orderIndex],
                    woocommerceId: result.wcOrderId,
                    lastSynced: new Date().toISOString()
                };
                setUserOrders(updatedOrders);

                // Save updated orders to localStorage
                if (auth.currentUser && isInitialized) {
                    try {
                        localStorage.setItem(
                            `${USER_ORDERS_STORAGE_KEY}_${auth.currentUser.uid}`,
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
            // Don't show error to user as the local order was still created successfully
        }
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

            // Return the updated order to the calling component
            return updatedOrder;
        } catch (error) {
            console.error('Error cancelling order:', error);
            toast.error('Failed to cancel order');
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    // When updating an order, make sure to normalize it
    const updateOrderStatus = async (orderId, newStatus) => {
        setIsLoading(true);
        try {
            const orderIndex = userOrders.findIndex(order => order.id === orderId);
            if (orderIndex === -1) {
                toast.error('Order not found');
                return false;
            }

            const order = userOrders[orderIndex];
            const updatedOrder = normalizeOrderData({
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
            });

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

        // Set appropriate status based on payment method
        let newStatus;
        let newPaymentStatus;

        if (paymentMethod === 'cod') {
            // For COD, mark as confirmed and payment as pending
            newStatus = 'confirmed';
            newPaymentStatus = 'pending';
        } else if (paymentMethod === 'online') {
            // For online payment, status depends on payment details
            if (paymentDetails?.status === 'paid' && paymentDetails?.transactionId) {
                // Only mark as processing if we have transaction proof
                newStatus = 'processing';
                newPaymentStatus = 'paid';
            } else {
                // If payment isn't confirmed, keep as pending
                newStatus = 'pending';
                newPaymentStatus = 'pending';
            }
        } else {
            // Default (including 'pending' payment method)
            newStatus = 'pending';
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

        // Skip update if status is already the same
        if (order.paymentStatus === status) {
            return true;
        }

        const updatedOrder = {
            ...order,
            paymentStatus: status,
            ...transactionDetails,
            updatedAt: new Date().toISOString()
        };

        // If payment is successful, update order status to processing or confirmed
        // But ONLY if the payment status is actually 'paid' and has valid transaction details
        if (status === 'paid' && transactionDetails?.transactionId && order.status === 'pending') {
            updatedOrder.status = 'processing';

            // Only add a new status history entry if we don't already have a processing status
            if (!order.statusHistory.some(s => s.status === 'processing')) {
                updatedOrder.statusHistory = [
                    ...order.statusHistory,
                    {
                        status: 'processing',
                        timestamp: new Date().toISOString()
                    }
                ];

                // Deduplicate the status history to avoid multiple identical entries
                updatedOrder.statusHistory = deduplicateStatusHistory(updatedOrder.statusHistory);
            }
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
                isSyncingFromWooCommerce,
                createOrder,
                cancelOrder,
                updateOrderStatus,
                getOrderById,
                getOrderDetails,
                refreshOrders,
                confirmOrder,
                updatePaymentStatus,
                syncOrderWithWooCommerce,
                syncOrdersFromWooCommerce
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
