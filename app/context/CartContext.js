'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const CartContext = createContext();

const CART_STORAGE_KEY = 'chaldal_cart_items';
const RECENT_ITEMS_KEY = 'chaldal_recent_items';
const WISHLIST_KEY = 'chaldal_wishlist';

export function CartProvider({ children }) {
    const [cartItems, setCartItems] = useState([]);
    const [recentItems, setRecentItems] = useState([]);
    const [wishlist, setWishlist] = useState([]);
    const [isInitialized, setIsInitialized] = useState(false);

    // Load cart items from localStorage on initial mount
    useEffect(() => {
        try {
            const savedCart = localStorage.getItem(CART_STORAGE_KEY);
            if (savedCart) {
                setCartItems(JSON.parse(savedCart));
            }

            const savedRecentItems = localStorage.getItem(RECENT_ITEMS_KEY);
            if (savedRecentItems) {
                setRecentItems(JSON.parse(savedRecentItems));
            }

            const savedWishlist = localStorage.getItem(WISHLIST_KEY);
            if (savedWishlist) {
                setWishlist(JSON.parse(savedWishlist));
            }
        } catch (error) {
            console.error('Error loading cart from localStorage:', error);
        } finally {
            setIsInitialized(true);
        }
    }, []);

    // Save cart items to localStorage whenever they change
    useEffect(() => {
        if (isInitialized) {
            try {
                localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
            } catch (error) {
                console.error('Error saving cart to localStorage:', error);
                toast.error('Failed to save cart. Please check your browser settings.');
            }
        }
    }, [cartItems, isInitialized]);

    // Save recent items to localStorage
    useEffect(() => {
        if (isInitialized && recentItems.length > 0) {
            try {
                localStorage.setItem(RECENT_ITEMS_KEY, JSON.stringify(recentItems));
            } catch (error) {
                console.error('Error saving recent items to localStorage:', error);
            }
        }
    }, [recentItems, isInitialized]);

    // Save wishlist to localStorage
    useEffect(() => {
        if (isInitialized) {
            try {
                localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
            } catch (error) {
                console.error('Error saving wishlist to localStorage:', error);
            }
        }
    }, [wishlist, isInitialized]);

    const addToCart = (product, quantity = 1) => {
        // Create a unique key for the product based on its ID and category
        // This ensures products are uniquely identified across different sections
        const productKey = generateProductKey(product);

        const existingItem = cartItems.find(item => generateProductKey(item) === productKey);

        if (existingItem) {
            toast.success(`Updated ${product.name} quantity in cart`);
            setCartItems(prevItems => prevItems.map(item =>
                generateProductKey(item) === productKey
                    ? { ...item, quantity: item.quantity + quantity }
                    : item
            ));
        } else {
            toast.success(`${product.name} added to cart`);
            setCartItems(prevItems => [...prevItems, { ...product, quantity }]);
        }

        // Add to recent items
        addToRecentItems(product);
    };

    // Generate a unique key for a product
    const generateProductKey = (product) => {
        // Use the product ID as the primary identifier for uniqueness across sections
        // If the product is from a specific section, we can add section info
        return product.category ? `${product.id}-${product.category}` : `${product.id}`;
    };

    // Remove an item from cart
    const removeFromCart = (productId, category) => {
        // Create the same key format for lookup
        const lookupKey = category ? `${productId}-${category}` : productId;

        const itemToRemove = cartItems.find(item => generateProductKey(item) === lookupKey);
        if (itemToRemove) {
            setCartItems(prevItems => prevItems.filter(item => generateProductKey(item) !== lookupKey));
        }
    };

    const updateQuantity = (productId, quantity, category) => {
        if (quantity <= 0) {
            removeFromCart(productId, category);
            return;
        }

        // Create the same key format for lookup
        const lookupKey = category ? `${productId}-${category}` : productId;

        setCartItems(prevItems =>
            prevItems.map(item =>
                generateProductKey(item) === lookupKey
                    ? { ...item, quantity }
                    : item
            )
        );
    };

    const getCartTotal = () => {
        return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    };

    const getCartItemsCount = () => {
        return cartItems.reduce((total, item) => total + item.quantity, 0);
    };

    const clearCart = () => {
        setCartItems([]);
        localStorage.removeItem(CART_STORAGE_KEY);
    };

    const moveItemsToOrder = (items) => {
        setCartItems(prevItems =>
            prevItems.filter(item => !items.some(orderItem => orderItem.id === item.id))
        );
    };

    const moveToOrder = () => {
        const orderItems = [...cartItems];
        clearCart();
        toast.success('Cart items moved to order');
        return orderItems;
    };

    const restoreFromOrder = (orderItems) => {
        clearCart();
        orderItems.forEach(item => {
            addToCart(item, item.quantity);
        });
        toast.success('Order items restored to cart');
    };

    const isInCart = (productId, category) => {
        // Create the same key format for lookup
        const lookupKey = category ? `${productId}-${category}` : productId;
        return cartItems.some(item => generateProductKey(item) === lookupKey);
    };

    const bulkAddToCart = (products) => {
        if (!products || products.length === 0) return;

        products.forEach(product => {
            addToCart(product, product.quantity || 1);
        });
        toast.success('All items added to cart');
    };

    // Wishlist functionality
    const addToWishlist = (product) => {
        if (!wishlist.some(item => item.id === product.id)) {
            setWishlist(prev => [...prev, product]);
            toast.success(`${product.name} added to wishlist`);
        }
    };

    const removeFromWishlist = (productId) => {
        setWishlist(prev => prev.filter(item => item.id !== productId));
        toast.info(`Removed from wishlist`);
    };

    const isInWishlist = (productId) => {
        return wishlist.some(item => item.id === productId);
    };

    const moveFromWishlistToCart = (productId) => {
        const product = wishlist.find(item => item.id === productId);
        if (product) {
            addToCart(product);
            removeFromWishlist(productId);
        }
    };

    // Add to recent items
    const addToRecentItems = (product) => {
        // Remove product if it already exists in the recent items
        const filteredItems = recentItems.filter(item => item.id !== product.id);
        // Add product to the beginning of the array
        const updatedItems = [product, ...filteredItems].slice(0, 10); // Keep only 10 most recent
        setRecentItems(updatedItems);
    };

    return (
        <CartContext.Provider value={{
            cartItems,
            recentItems,
            wishlist,
            addToCart,
            removeFromCart,
            updateQuantity,
            getCartTotal,
            getCartItemsCount,
            clearCart,
            moveItemsToOrder,
            moveToOrder,
            restoreFromOrder,
            isInCart,
            bulkAddToCart,
            addToWishlist,
            removeFromWishlist,
            isInWishlist,
            moveFromWishlistToCart
        }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}