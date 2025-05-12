'use client';

import React, { useState, useEffect, memo } from 'react';
import Image from 'next/image';
import { Heart, Minus, Plus, Info, ShoppingBag, Trash2 } from 'lucide-react';
import { useCart } from '@/app/context/CartContext';
import { useFavorites } from '@/app/context/FavoritesContext';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation'; // Import the router

// Memoize the ProductCard component to prevent unnecessary re-renders
const ProductCard = memo(({ product }) => {
    const router = useRouter(); // Initialize the router
    const { addToCart, updateQuantity, cartItems, removeFromCart } = useCart();
    const { toggleFavorite, isFavorite } = useFavorites();
    const [isQuickView, setIsQuickView] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [priceAnimation, setPriceAnimation] = useState(false);
    const [lastPrice, setLastPrice] = useState(0);

    // Combine ID and category to uniquely identify this product
    const productIdentifier = `${product.id}${product.category ? `-${product.category}` : ''}`;

    // Generate a unique key for a product - matching the CartContext implementation
    const generateProductKey = (product) => {
        return product.category ? `${product.id}-${product.category}` : `${product.id}`;
    };

    // Check if product is already in cart - match by ID only since we've fixed the backend
    const cartItem = cartItems.find(item =>
        generateProductKey(item) === generateProductKey(product)
    );
    const cartItemQty = cartItem ? cartItem.quantity : 0;

    useEffect(() => {
        // Trigger price animation when cartItemQty changes
        if (cartItem) {
            setLastPrice(cartItem.price);
            setPriceAnimation(true);
            const timer = setTimeout(() => setPriceAnimation(false), 500);
            return () => clearTimeout(timer);
        }
    }, [cartItemQty, cartItem]);

    // Function to handle product click - navigate to product detail page
    const handleProductClick = (e) => {
        e.preventDefault();

        // Check if we should show modal or navigate
        if (product.slug) {
            router.push(`/product/${product.slug}`);
        } else {
            setIsModalOpen(true);
        }
    };

    // Function to increment quantity and add to cart directly
    const incrementQty = (e) => {
        e.stopPropagation();
        if (cartItem) {
            updateQuantity(product.id, cartItemQty + 1, product.category);
        } else {
            addToCart(product, 1);
        }
    };

    // Function to decrement quantity and update cart directly
    const decrementQty = (e) => {
        e.stopPropagation();
        if (cartItem && cartItemQty > 1) {
            updateQuantity(product.id, cartItemQty - 1, product.category);
        } else if (cartItem && cartItemQty === 1) {
            removeFromCart(product.id, product.category);
        }
    };

    // Format price with commas
    const formatPrice = (price) => {
        return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    };

    // Calculate discount percentage
    const discountPercentage = product.originalPrice > product.price
        ? Math.round((1 - product.price / product.originalPrice) * 100)
        : 0;

    return (
        <>
            <div
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 relative h-full flex flex-col overflow-hidden"
                onMouseEnter={() => setIsQuickView(true)}
                onMouseLeave={() => setIsQuickView(false)}
                onClick={handleProductClick} // Use the new handler
            >
                {/* Top section with image and badges */}
                <div className="relative pt-3 px-3 pb-2">
                    {/* Discount badge */}
                    {discountPercentage > 0 && (
                        <div className="absolute top-3 left-3 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium z-10">
                            {discountPercentage}% OFF
                        </div>
                    )}

                    {/* Wishlist Heart Icon */}
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleFavorite(product);
                        }}
                        className={`absolute top-3 right-3 w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center ${isFavorite(product.id) ? 'text-red-500' : 'text-gray-400'
                            } hover:text-red-500 transition-colors z-10`}
                        aria-label="Add to favorites"
                    >
                        <Heart className="w-5 h-5" fill={isFavorite(product.id) ? "currentColor" : "none"} />
                    </button>

                    {/* Product Image with hover effect */}
                    <div className="relative w-full aspect-square mb-2 group cursor-pointer">
                        <div className="absolute inset-0 bg-gray-50 rounded-lg">
                            <Image
                                src={product.image}
                                alt={product.name}
                                fill
                                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                className={`object-contain p-2 transition-transform duration-300 ${isQuickView ? 'scale-90' : 'scale-100'}`}
                            />
                        </div>

                        {/* Quick View Button */}
                        <Transition
                            show={isQuickView}
                            enter="transition-opacity duration-200"
                            enterFrom="opacity-0"
                            enterTo="opacity-100"
                            leave="transition-opacity duration-200"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                        >
                            <div className="absolute bottom-0 left-0 right-0 flex justify-center p-2">
                                <button
                                    className="bg-white bg-opacity-90 text-gray-800 text-xs font-medium py-1.5 px-3 rounded-full shadow-sm hover:bg-opacity-100 transition-all"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsModalOpen(true);
                                    }}
                                >
                                    Quick View
                                </button>
                            </div>
                        </Transition>

                        {/* Combo Pack Badge */}
                        {product.isCombo && (
                            <div className="absolute top-1/2 left-0 right-0 flex items-center justify-center">
                                <div className="bg-gradient-to-r from-transparent via-red-500 to-transparent w-full h-0.5" />
                                <div className="absolute bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-medium transform -translate-y-1/2">
                                    Combo Pack
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Product Info Section */}
                <div className="flex-1 flex flex-col p-3 pt-0">
                    {/* Product Name with Fixed Height */}
                    <h3 className="text-sm font-medium text-gray-800 line-clamp-2 mb-1 min-h-[2.5rem]">
                        {product.name}
                    </h3>

                    {/* Quantity if applicable */}
                    {product.quantity && (
                        <p className="text-xs text-gray-500 mb-1">
                            {product.quantity} pcs
                        </p>
                    )}

                    {/* Price Section */}
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg font-bold text-gray-900">
                            ৳{formatPrice(product.price)}
                        </span>

                        {discountPercentage > 0 && (
                            <span className="text-xs text-gray-500 line-through">
                                ৳{formatPrice(product.originalPrice)}
                            </span>
                        )}
                    </div>

                    {/* Cart Controls Section */}
                    <div className="mt-auto">
                        {cartItemQty > 0 ? (
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center justify-between text-sm text-green-600 font-medium">
                                    <span>In cart:</span>
                                    <span>৳{formatPrice(product.price * cartItemQty)}</span>
                                </div>
                                <div className="flex items-center justify-between border border-gray-200 rounded-lg">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (cartItemQty === 1) {
                                                removeFromCart(product.id, product.category);
                                            } else {
                                                decrementQty(e);
                                            }
                                        }}
                                        className="w-8 h-8 flex items-center justify-center text-gray-700 hover:bg-gray-100 rounded-l-lg"
                                    >
                                        {cartItemQty === 1 ? (
                                            <Trash2 className="w-4 h-4 text-red-500" />
                                        ) : (
                                            <Minus className="w-4 h-4" />
                                        )}
                                    </button>
                                    <span className="flex-1 text-center font-medium">{cartItemQty}</span>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            incrementQty(e);
                                        }}
                                        className="w-8 h-8 flex items-center justify-center text-gray-700 hover:bg-gray-100 rounded-r-lg"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    incrementQty(e);
                                }}
                                className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
                            >
                                <ShoppingBag className="w-4 h-4" />
                                Add to cart
                            </button>
                        )}
                    </div>
                </div>

                {/* Price Animation */}
                <AnimatePresence>
                    {priceAnimation && (
                        <motion.div
                            initial={{ opacity: 1, y: 0, x: 0 }}
                            animate={{ opacity: 0, y: -50, x: 30 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.5 }}
                            className="absolute z-50 right-4 bottom-20 bg-green-500 text-white px-2 py-1 rounded-full text-sm font-medium"
                        >
                            +৳{formatPrice(lastPrice)}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Product Details Modal */}
            <Transition appear show={isModalOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={() => setIsModalOpen(false)}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black bg-opacity-60" />
                    </Transition.Child>

                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-white shadow-xl transition-all">
                                    {/* Close button */}
                                    <button
                                        type="button"
                                        className="absolute right-4 top-4 text-gray-400 hover:text-gray-500"
                                        onClick={() => setIsModalOpen(false)}
                                    >
                                        <span className="sr-only">Close</span>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>

                                    <div className="grid md:grid-cols-2 gap-4">
                                        {/* Product Image Section */}
                                        <div className="bg-gray-50 p-6 relative">
                                            {/* Discount badge */}
                                            {discountPercentage > 0 && (
                                                <div className="absolute top-3 left-3 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium z-10">
                                                    {discountPercentage}% OFF
                                                </div>
                                            )}

                                            <div className="relative h-48 w-full">
                                                <Image
                                                    src={product.image}
                                                    alt={product.name}
                                                    fill
                                                    className="object-contain"
                                                />
                                            </div>
                                        </div>

                                        {/* Product Details Section */}
                                        <div className="p-6 pt-4">
                                            <Dialog.Title
                                                as="h3"
                                                className="text-lg font-medium text-gray-900"
                                            >
                                                {product.name}
                                            </Dialog.Title>

                                            {product.quantity && (
                                                <p className="text-sm text-gray-600 mt-1">
                                                    {product.quantity} pcs
                                                </p>
                                            )}

                                            <div className="mt-3 space-y-4">
                                                {/* Price info */}
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-xl font-bold text-gray-900">
                                                        ৳{formatPrice(product.price)}
                                                    </span>

                                                    {discountPercentage > 0 && (
                                                        <span className="text-sm text-gray-500 line-through">
                                                            ৳{formatPrice(product.originalPrice)}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Description */}
                                                {product.description && (
                                                    <p className="text-sm text-gray-600">
                                                        {product.description}
                                                    </p>
                                                )}

                                                {/* Features */}
                                                {product.features && product.features.length > 0 && (
                                                    <div>
                                                        <h4 className="text-sm font-medium text-gray-900 mb-1">Features:</h4>
                                                        <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
                                                            {product.features.map((feature, index) => (
                                                                <li key={index}>{feature}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}

                                                {/* Category */}
                                                {product.category && (
                                                    <p className="text-sm text-gray-600">
                                                        <span className="font-medium">Category:</span> {product.category}
                                                    </p>
                                                )}

                                                {/* Cart summary if in cart */}
                                                {cartItemQty > 0 && (
                                                    <div className="bg-green-50 p-3 rounded-lg">
                                                        <div className="flex justify-between items-center text-sm">
                                                            <span className="font-medium text-green-600">In your bag:</span>
                                                            <span className="font-medium text-green-600">
                                                                {cartItemQty} × ৳{formatPrice(product.price)} = ৳{formatPrice(product.price * cartItemQty)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Add to cart section */}
                                            <div className="mt-6">
                                                {cartItemQty > 0 ? (
                                                    <div className="flex flex-col gap-3">
                                                        <div className="flex items-center border border-gray-200 rounded-lg w-full">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (cartItemQty === 1) {
                                                                        removeFromCart(product.id, product.category);
                                                                    } else {
                                                                        decrementQty(e);
                                                                    }
                                                                }}
                                                                className="w-12 h-12 flex items-center justify-center text-gray-700 hover:bg-gray-100 rounded-l-lg"
                                                            >
                                                                {cartItemQty === 1 ? (
                                                                    <Trash2 className="w-5 h-5 text-red-500" />
                                                                ) : (
                                                                    <Minus className="w-5 h-5" />
                                                                )}
                                                            </button>
                                                            <span className="flex-1 text-center font-medium text-lg">{cartItemQty}</span>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    incrementQty(e);
                                                                }}
                                                                className="w-12 h-12 flex items-center justify-center text-gray-700 hover:bg-gray-100 rounded-r-lg"
                                                            >
                                                                <Plus className="w-5 h-5" />
                                                            </button>
                                                        </div>
                                                        <button
                                                            onClick={() => setIsModalOpen(false)}
                                                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium"
                                                        >
                                                            Continue Shopping
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            incrementQty(e);
                                                            setIsModalOpen(false);
                                                        }}
                                                        className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 py-3 px-4 rounded-lg flex items-center justify-center gap-2 font-medium"
                                                    >
                                                        <ShoppingBag className="w-5 h-5" />
                                                        Add to Cart
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </>
    );
});

// Define proper displayName for React DevTools
ProductCard.displayName = 'ProductCard';

export default ProductCard;