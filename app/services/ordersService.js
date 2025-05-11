'use client';

import { useState, useCallback } from 'react';
import { auth } from '@/lib/firebase';
import { toast } from 'react-toastify';

// Fallback to local storage when Firestore isn't working
const LOCAL_STORAGE_KEY = 'user_orders_data';
const USER_PROFILE_STORAGE_KEY = 'user_profile_data';

export function useOrdersAPI() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [hasMore, setHasMore] = useState(false);
    const [lastDoc, setLastDoc] = useState(null);

    // Helper function to get orders from local storage
    const getOrdersFromLocalStorage = useCallback((userId) => {
        try {
            const savedOrders = localStorage.getItem(`${LOCAL_STORAGE_KEY}_${userId}`);
            return savedOrders ? JSON.parse(savedOrders) : [];
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return [];
        }
    }, []);

    // Helper function to get user profile from local storage
    const getUserProfile = useCallback((userId) => {
        try {
            const savedProfile = localStorage.getItem(`${USER_PROFILE_STORAGE_KEY}_${userId}`);
            return savedProfile ? JSON.parse(savedProfile) : null;
        } catch (error) {
            console.error('Error reading profile from localStorage:', error);
            return null;
        }
    }, []);

    // New helper function to normalize order data for consistency
    const normalizeOrderData = useCallback((order) => {
        if (!order) return null;

        // Ensure order has all the required fields in a consistent sequence
        return {
            id: order.id || `order_${Date.now()}`,
            userId: order.userId || auth.currentUser?.uid,
            status: order.status || 'pending',
            paymentStatus: order.paymentStatus || 'unpaid',
            paymentMethod: order.paymentMethod || 'pending',
            items: order.items || [],
            total: order.total || order.totalAmount || calculateOrderTotal(order.items || []),
            delivery: order.delivery || {},
            discount: order.discount || 0,
            deliveryFee: order.deliveryFee || 60,
            createdAt: order.createdAt || new Date().toISOString(),
            updatedAt: order.updatedAt || new Date().toISOString(),
            statusHistory: order.statusHistory || [
                {
                    status: order.status || 'pending',
                    timestamp: order.createdAt || new Date().toISOString()
                }
            ],
            // Include WooCommerce customer ID if available
            woocommerceId: order.woocommerceId || null,
            woocommerceCustomerId: order.woocommerceCustomerId || null,
            lastSynced: order.lastSynced || null,
            ...order // Preserve any other fields
        };
    }, []);

    // Get user orders from local storage (simulating API call)
    const fetchUserOrders = useCallback(async (userId) => {
        setIsLoading(true);
        setError(null);

        try {
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 500));

            const orders = getOrdersFromLocalStorage(userId);

            // Normalize all orders for consistency
            const normalizedOrders = orders.map(order => normalizeOrderData(order));

            // Sort by most recent first
            normalizedOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            // Simulate pagination functionality
            setHasMore(normalizedOrders.length > 10);
            setLastDoc(10);

            return { orders: normalizedOrders.slice(0, 10) };
        } catch (error) {
            setError('Failed to load orders. Using local data instead.');
            console.error('Error fetching orders:', error);
            return { orders: [] };
        } finally {
            setIsLoading(false);
        }
    }, [getOrdersFromLocalStorage, normalizeOrderData]);

    // Get more user orders (for pagination)
    const fetchMoreUserOrders = useCallback(async (userId) => {
        if (!lastDoc || !hasMore) return { orders: [] };

        setIsLoading(true);
        try {
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 500));

            const allOrders = getOrdersFromLocalStorage(userId);
            const nextBatch = allOrders.slice(lastDoc, lastDoc + 10);

            setLastDoc(prev => prev + 10);
            setHasMore(lastDoc + 10 < allOrders.length);

            return { orders: nextBatch };
        } catch (error) {
            setError('Failed to load more orders');
            console.error('Error fetching more orders:', error);
            return { orders: [] };
        } finally {
            setIsLoading(false);
        }
    }, [lastDoc, hasMore, getOrdersFromLocalStorage]);

    // Get order details
    const getOrderDetails = useCallback(async (orderId) => {
        setIsLoading(true);
        try {
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 300));

            // Since we can't query by orderId directly in local storage,
            // we need to get all orders for the current user and filter
            const userId = auth.currentUser?.uid;
            if (!userId) return null;

            const allOrders = getOrdersFromLocalStorage(userId);
            const order = allOrders.find(order => order.id === orderId);

            // Return normalized order data
            return normalizeOrderData(order);
        } catch (error) {
            console.error('Error fetching order details:', error);
            setError('Failed to load order details');
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [getOrdersFromLocalStorage, normalizeOrderData]);

    const updateOrderStatus = async (orderId, newStatus, paymentDetails = null) => {
        if (!orderId) {
            setError("Order ID is required");
            return false;
        }

        setIsLoading(true);
        setError(null);
        try {
            const userId = auth.currentUser?.uid;
            if (!userId) {
                throw new Error('User not authenticated');
            }

            const allOrders = getOrdersFromLocalStorage(userId);
            const orderIndex = allOrders.findIndex(order => order.id === orderId);

            if (orderIndex === -1) {
                throw new Error('Order not found');
            }

            const statusUpdate = {
                status: newStatus,
                timestamp: new Date().toISOString()
            };

            // Update the order with new status
            allOrders[orderIndex].status = newStatus;
            allOrders[orderIndex].updatedAt = new Date().toISOString();

            // If we have payment details, update payment status as well
            if (paymentDetails) {
                if (paymentDetails.status) {
                    allOrders[orderIndex].paymentStatus = paymentDetails.status;
                }
                if (paymentDetails.transactionId) {
                    allOrders[orderIndex].transactionId = paymentDetails.transactionId;
                }
                if (paymentDetails.paymentMethod) {
                    allOrders[orderIndex].paymentMethod = paymentDetails.paymentMethod;

                    // Set appropriate status based on payment method
                    if (paymentDetails.paymentMethod === 'cod') {
                        // For COD, status should be confirmed
                        allOrders[orderIndex].status = 'confirmed';
                        statusUpdate.status = 'confirmed';
                    } else if (paymentDetails.paymentMethod === 'online' && paymentDetails.status === 'paid') {
                        // For successful online payment, status should be processing
                        allOrders[orderIndex].status = 'processing';
                        statusUpdate.status = 'processing';
                    } else if (paymentDetails.paymentMethod === 'online') {
                        // For pending online payment, status remains pending
                        allOrders[orderIndex].status = 'pending';
                        statusUpdate.status = 'pending';
                    }
                }
            }

            // Add to status history if it exists, or create it
            if (!allOrders[orderIndex].statusHistory) {
                allOrders[orderIndex].statusHistory = [];
            }
            allOrders[orderIndex].statusHistory.push(statusUpdate);

            // Save back to localStorage
            localStorage.setItem(`${LOCAL_STORAGE_KEY}_${userId}`, JSON.stringify(allOrders));

            return true;
        } catch (err) {
            setError(err.message);
            console.error('Error updating order status:', err);
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    const createNewOrder = async (orderData) => {
        if (!orderData || !orderData.userId) {
            setError("Invalid order data or missing user ID");
            return null;
        }

        setIsLoading(true);
        setError(null);
        try {
            // Validate order items
            if (!orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
                throw new Error("Order must contain at least one item");
            }

            const userId = orderData.userId;
            const allOrders = getOrdersFromLocalStorage(userId);

            // Get user profile to include WooCommerce customer ID if available
            const userProfile = getUserProfile(userId);
            const woocommerceCustomerId = userProfile?.woocommerceId || null;

            // Create a new order with a unique ID
            const newOrderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            // Add calculated fields
            const enhancedOrderData = {
                ...orderData,
                id: newOrderId,
                status: 'pending',
                statusHistory: [{
                    status: 'pending',
                    timestamp: new Date().toISOString()
                }],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                totalAmount: calculateOrderTotal(orderData.items),
                woocommerceCustomerId // Add WooCommerce customer ID
            };

            // Add to local storage
            allOrders.push(enhancedOrderData);
            localStorage.setItem(`${LOCAL_STORAGE_KEY}_${userId}`, JSON.stringify(allOrders));

            return enhancedOrderData;
        } catch (err) {
            setError(err.message);
            console.error('Error creating order:', err);
            return null;
        } finally {
            setIsLoading(false);
        }
    };

    const calculateOrderTotal = (items) => {
        if (!items || !Array.isArray(items)) return 0;
        return items.reduce((total, item) => {
            const quantity = item.quantity || 1;
            const price = parseFloat(item.price) || 0;
            return total + (price * quantity);
        }, 0);
    };

    return {
        fetchUserOrders,
        fetchMoreUserOrders,
        updateOrderStatus,
        getOrderDetails,
        createNewOrder,
        isLoading,
        error,
        hasMore,
        normalizeOrderData // Export the normalize function for use in other components
    };
}
