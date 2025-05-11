'use client';

import { createContext, useContext, useState } from 'react';
import { useOrders } from './OrderContext';
import { useUserProfile } from './UserProfileContext';
import { toast } from 'react-toastify';

const OrderSyncContext = createContext();

export function OrderSyncProvider({ children }) {
    const [isSyncing, setIsSyncing] = useState(false);
    const { orders, updateOrderStatus } = useOrders();
    const { userProfile } = useUserProfile();

    // Sync a single order with WooCommerce
    const syncOrderWithWooCommerce = async (order) => {
        if (!userProfile?.woocommerceId) {
            console.warn('No WooCommerce customer ID found, skipping order sync');
            return null;
        }

        if (!order) {
            console.error('No order provided for syncing');
            return null;
        }

        setIsSyncing(true);
        try {
            // Prepare customer data from user profile
            const customerData = {
                woocommerceId: userProfile.woocommerceId,
                email: userProfile.email,
                displayName: userProfile.displayName || '',
                phoneNumber: userProfile.phoneNumber || ''
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
                throw new Error(result.message || 'Failed to sync order with WooCommerce');
            }

            // Return the WooCommerce order data
            return {
                ...result,
                originalOrderId: order.id
            };
        } catch (error) {
            console.error('Error syncing order with WooCommerce:', error);
            return {
                success: false,
                error: error.message
            };
        } finally {
            setIsSyncing(false);
        }
    };

    // Sync all unsynced orders with WooCommerce
    const syncAllOrders = async () => {
        if (!userProfile?.woocommerceId) {
            toast.warning('You need to be logged in with a WooCommerce account to sync orders');
            return { success: false, message: 'No WooCommerce customer ID found' };
        }

        setIsSyncing(true);
        const results = { success: [], failed: [] };

        try {
            // Find all orders that don't have a WooCommerce ID
            const unsyncedOrders = orders.filter(order => !order.woocommerceId);

            if (unsyncedOrders.length === 0) {
                toast.info('All orders are already synced with WooCommerce');
                return { success: true, message: 'No unsynced orders found' };
            }

            toast.info(`Syncing ${unsyncedOrders.length} orders with WooCommerce...`);

            // Sync each order sequentially to avoid rate limiting
            for (const order of unsyncedOrders) {
                const result = await syncOrderWithWooCommerce(order);

                if (result?.success) {
                    results.success.push({
                        orderId: order.id,
                        wcOrderId: result.wcOrderId
                    });

                    // Update the order with WooCommerce ID
                    await updateOrderStatus(order.id, order.status, {
                        woocommerceId: result.wcOrderId,
                        lastSynced: new Date().toISOString()
                    });
                } else {
                    results.failed.push({
                        orderId: order.id,
                        error: result?.error || 'Unknown error'
                    });
                }
            }

            const message = `Successfully synced ${results.success.length} orders. ${results.failed.length > 0 ? `Failed to sync ${results.failed.length} orders.` : ''}`;

            if (results.success.length > 0) {
                toast.success(`Synced ${results.success.length} orders with WooCommerce`);
            }

            if (results.failed.length > 0) {
                toast.error(`Failed to sync ${results.failed.length} orders`);
            }

            return {
                success: results.failed.length === 0,
                message,
                results
            };
        } catch (error) {
            console.error('Error syncing orders:', error);
            toast.error('Failed to sync orders with WooCommerce');
            return {
                success: false,
                message: error.message,
                error
            };
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <OrderSyncContext.Provider value={{
            syncOrderWithWooCommerce,
            syncAllOrders,
            isSyncing
        }}>
            {children}
        </OrderSyncContext.Provider>
    );
}

export const useOrderSync = () => {
    const context = useContext(OrderSyncContext);
    if (!context) {
        throw new Error('useOrderSync must be used within an OrderSyncProvider');
    }
    return context;
};
