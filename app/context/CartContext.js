'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const CartContext = createContext();

const CART_STORAGE_KEY = 'kenakata_cart_items';
const RECENT_ITEMS_KEY = 'kenakata_recent_items';
const WISHLIST_KEY = 'kenakata_wishlist';

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

        // Ensure we preserve all important attributes
        const enhancedProduct = {
            ...product,
            price: product.price || product.sale_price || 0,
            // Preserve selected attributes if they exist
            selectedAttributes: product.selectedAttributes || {},
            // Preserve color, size and other attributes if available
            attributes: product.attributes || [],
            // Preserve variations
            variation_id: product.variation_id || null,
            // Preserve any metadata
            meta_data: product.meta_data || []
        };

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
            setCartItems(prevItems => [...prevItems, { ...enhancedProduct, quantity }]);
        }

        // Add to recent items
        addToRecentItems(enhancedProduct);
    };

    // Generate a unique key for a product
    const generateProductKey = (product) => {
        // Base key from product ID and category
        let key = product.category ? `${product.id}-${product.category}` : `${product.id}`;

        // Include selected attributes in the key to differentiate between same product with different attributes
        if (product.selectedAttributes && Object.keys(product.selectedAttributes).length > 0) {
            // Sort keys to ensure consistent ordering regardless of how attributes were selected
            const attributeKeys = Object.keys(product.selectedAttributes).sort();
            const attributeString = attributeKeys
                .map(key => `${key}-${product.selectedAttributes[key]}`)
                .join('_');

            key = `${key}-${attributeString}`;
        }

        return key;
    };

    // Remove an item from cart
    const removeFromCart = (productId, category, selectedAttributes = {}) => {
        // First try to find the item using the full key (with attributes)
        const itemToRemove = cartItems.find(item => {
            // If we're provided with a full item object that already has a key structure
            if (typeof productId === 'object') {
                return generateProductKey(productId) === generateProductKey(item);
            }

            // Otherwise construct a temporary object to generate a matching key
            const tempProduct = {
                id: productId,
                category,
                selectedAttributes
            };
            return generateProductKey(tempProduct) === generateProductKey(item);
        });

        if (itemToRemove) {
            setCartItems(prevItems => prevItems.filter(item => generateProductKey(item) !== generateProductKey(itemToRemove)));
        }
    };

    const updateQuantity = (productId, quantity, category, selectedAttributes = {}) => {
        if (quantity <= 0) {
            // Find the item first to get its name for the toast
            const itemToRemove = cartItems.find(item => {
                // If we're provided with a full item object
                if (typeof productId === 'object') {
                    return generateProductKey(productId) === generateProductKey(item);
                }

                // Build a temp product for key generation
                const tempProduct = {
                    id: productId,
                    category,
                    selectedAttributes
                };
                return generateProductKey(tempProduct) === generateProductKey(item);
            });

            if (itemToRemove) {
                toast.info(`${itemToRemove.name} removed from cart`);
                removeFromCart(productId, category, selectedAttributes);
            }
            return;
        }

        // Update quantity of the specific item matching all criteria including attributes
        setCartItems(prevItems =>
            prevItems.map(item => {
                if (typeof productId === 'object') {
                    return generateProductKey(productId) === generateProductKey(item)
                        ? { ...item, quantity }
                        : item;
                }

                // Build a temp product for key comparison
                const tempProduct = {
                    id: productId,
                    category,
                    selectedAttributes
                };
                return generateProductKey(tempProduct) === generateProductKey(item)
                    ? { ...item, quantity }
                    : item;
            })
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

    const isInCart = (productId, category, selectedAttributes = {}) => {
        // If we have a full product object
        if (typeof productId === 'object') {
            const productKey = generateProductKey(productId);
            return cartItems.some(item => generateProductKey(item) === productKey);
        }

        // Otherwise construct a temporary object with the provided details
        const tempProduct = {
            id: productId,
            category,
            selectedAttributes
        };
        const productKey = generateProductKey(tempProduct);
        return cartItems.some(item => generateProductKey(item) === productKey);
    };

    const bulkAddToCart = (products) => {
        if (!Array.isArray(products) || products.length === 0) return;

        let addedCount = 0;

        const updatedCartItems = [...cartItems];

        products.forEach(product => {
            // Create a unique key for the product
            const key = generateProductKey(product);

            // Ensure we preserve all important attributes
            const enhancedProduct = {
                ...product,
                price: product.price || product.sale_price || 0,
                // Preserve selected attributes if they exist
                selectedAttributes: product.selectedAttributes || {},
                // Preserve color, size and other attributes if available
                attributes: product.attributes || [],
                // Preserve variations
                variation_id: product.variation_id || null,
                // Preserve any metadata
                meta_data: product.meta_data || []
            };

            const existingItemIndex = updatedCartItems.findIndex(item => generateProductKey(item) === key);

            if (existingItemIndex !== -1) {
                updatedCartItems[existingItemIndex].quantity += (product.quantity || 1);
            } else {
                updatedCartItems.push({
                    ...enhancedProduct,
                    quantity: product.quantity || 1
                });
            }
            addedCount++;
        });

        setCartItems(updatedCartItems);

        // The toast is already shown in OrderDetails.js so we don't need it here
        // toast.success(`${addedCount} item${addedCount > 1 ? 's' : ''} added to cart`);
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