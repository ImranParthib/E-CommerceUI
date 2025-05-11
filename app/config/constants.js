/**
 * E-commerce application constants
 * This file contains global configuration values used across the application
 */

// Delivery & shipping settings
export const DELIVERY_FEE = {
    INSIDE_DHAKA: 50,
    OUTSIDE_DHAKA: 100
};
export const EXPRESS_DELIVERY_SURCHARGE = 50;
export const FREE_DELIVERY_THRESHOLD = 2000;

// Payment & order related constants
export const ORDER_STATUSES = {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    PROCESSING: 'processing',
    SHIPPED: 'shipped',
    COMPLETED: 'completed',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled'
};

export const PAYMENT_STATUSES = {
    UNPAID: 'unpaid',
    PENDING: 'pending',
    PAID: 'paid',
    FAILED: 'failed',
    REFUNDED: 'refunded'
};