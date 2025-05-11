"use client"
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ShoppingBag, Minus, Plus, X, ChevronRight, AlertCircle } from 'lucide-react';
import { useCart } from '@/app/context/CartContext';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { DELIVERY_FEE, FREE_DELIVERY_THRESHOLD } from '@/app/config/constants';
import { useUserProfile } from '@/app/context/UserProfileContext';

const StickyCart = () => {
	const [isExpanded, setIsExpanded] = useState(false);
	const [isPlacingOrder, setIsPlacingOrder] = useState(false);
	const [isAnimating, setIsAnimating] = useState(false);
	const cartRef = useRef(null);
	const {
		cartItems,
		getCartTotal,
		getCartItemsCount,
		updateQuantity,
		removeFromCart
	} = useCart();
	const { userProfile, getDefaultAddress } = useUserProfile();
	const router = useRouter();
	const pathname = usePathname();
	const itemCount = getCartItemsCount();
	const cartTotal = getCartTotal();

	// Memoize toggle function to prevent rerenders
	const toggleCart = useCallback(() => {
		if (!isAnimating) {
			setIsAnimating(true);
			setIsExpanded(prev => !prev);
			// Reset animation flag after animation completes
			setTimeout(() => setIsAnimating(false), 300);
		}
	}, [isAnimating]);

	// Handle clicks outside the cart to close it
	useEffect(() => {
		const handleClickOutside = (event) => {
			if (isExpanded && cartRef.current && !cartRef.current.contains(event.target)) {
				toggleCart();
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, [isExpanded, toggleCart]);

	// Reset placing order state when pathname changes
	useEffect(() => {
		if (isPlacingOrder) {
			setIsPlacingOrder(false);
		}

		// Close cart when navigating to a new page
		if (isExpanded) {
			setIsExpanded(false);
		}
	}, [pathname]);

	// Add effect to adjust document body
	useEffect(() => {
		const pageWrapper = document.getElementById('page-wrapper');
		if (!pageWrapper) return;

		const handleResize = () => {
			if (window.innerWidth >= 1024) { // Large devices
				pageWrapper.style.marginRight = isExpanded ? '250px' : '0';
				pageWrapper.style.transition = 'margin-right 0.3s ease';
			} else {
				pageWrapper.style.marginRight = '0';
			}
		};

		handleResize(); // Initial check
		window.addEventListener('resize', handleResize);

		// Cleanup
		return () => {
			if (pageWrapper) pageWrapper.style.marginRight = '0';
			window.removeEventListener('resize', handleResize);
		};
	}, [isExpanded]);

	// Handle keyboard accessibility
	useEffect(() => {
		const handleEscape = (e) => {
			if (e.key === 'Escape' && isExpanded) {
				toggleCart();
			}
		};

		window.addEventListener('keydown', handleEscape);
		return () => window.removeEventListener('keydown', handleEscape);
	}, [isExpanded, toggleCart]);

	// Add animation when item count changes to highlight the cart
	useEffect(() => {
		if (itemCount > 0 && !isExpanded) {
			const cartButton = document.getElementById('cart-button');
			if (cartButton) {
				cartButton.classList.add('animate-bounce');
				setTimeout(() => {
					cartButton.classList.remove('animate-bounce');
				}, 1000);
			}
		}
	}, [itemCount, isExpanded]);

	const handlePlaceOrder = () => {
		try {
			if (itemCount === 0) {
				toast.error("Your cart is empty. Please add some items first.");
				return;
			}

			setIsPlacingOrder(true);
			router.push('/checkout');

			// Set a timeout as fallback to reset the state
			setTimeout(() => {
				setIsPlacingOrder(false);
			}, 3000);
		} catch (error) {
			console.error("Navigation error:", error);
			setIsPlacingOrder(false);
			toast.error("Something went wrong. Please try again.");
		}
	};

	const handleQuantityChange = (item, newQuantity) => {
		try {
			// Use the whole item object to ensure we're targeting the exact item with its attributes
			if (newQuantity >= 1) {
				updateQuantity(item, newQuantity, item.category, item.selectedAttributes);
			} else {
				removeFromCart(item, item.category, item.selectedAttributes);
				toast.info(`${item.name} removed from cart`);
			}
		} catch (error) {
			console.error('Error updating cart:', error);
		}
	};

	// Calculate actual delivery fee based on cart total and location
	const calculateDeliveryFee = () => {
		if (cartTotal >= FREE_DELIVERY_THRESHOLD) {
			return 0;
		}

		// Get user's default address to determine delivery fee
		const defaultAddress = userProfile ? getDefaultAddress() : null;
		const userLocation = defaultAddress ? defaultAddress.city : null;

		// Calculate fee based on location
		const baseFee = userLocation && userLocation.toLowerCase() === 'dhaka'
			? DELIVERY_FEE.INSIDE_DHAKA
			: DELIVERY_FEE.OUTSIDE_DHAKA;

		return baseFee;
	};

	// Format price with commas
	const formatPrice = (price) => {
		if (price === null || price === undefined) return '0';
		return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	};

	return (
		<>
			{/* Collapsed cart button */}
			<AnimatePresence>
				{!isExpanded && (
					<motion.div
						id="cart-button"
						initial={{ x: 100 }}
						animate={{ x: 0 }}
						exit={{ x: 100 }}
						transition={{ duration: 0.3 }}
						className="fixed top-1/2 right-0 transform -translate-y-1/2 z-40"
					>
						<button
							onClick={toggleCart}
							className="shadow-lg rounded-l-lg flex flex-col items-center focus:outline-none focus:ring-2 focus:ring-yellow-400"
							aria-label={`Open shopping cart with ${itemCount} items`}
							aria-expanded={isExpanded}
						>
							<div className="flex flex-col items-center bg-slate-700 p-3 rounded-tl-lg">
								<div className="relative">
									<ShoppingBag className="text-yellow-400 w-6 h-6 mb-1" />
									{itemCount > 0 && (
										<span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
											{itemCount > 99 ? '99+' : itemCount}
										</span>
									)}
								</div>
								<div className="text-sm font-medium text-yellow-400">
									{itemCount} {itemCount === 1 ? 'ITEM' : 'ITEMS'}
								</div>
							</div>
							<div className="text-sm font-medium bg-yellow-400 text-slate-900 px-3 py-2 rounded-bl-lg w-full text-center">
								৳{formatPrice(cartTotal)}
							</div>
						</button>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Expanded cart panel */}
			<AnimatePresence>
				{isExpanded && (
					<motion.div
						ref={cartRef}
						initial={{ x: '100%' }}
						animate={{ x: 0 }}
						exit={{ x: '100%' }}
						transition={{ duration: 0.3, ease: 'easeInOut' }}
						className="fixed top-14 right-0 bottom-0 w-[240px] sm:w-[260px] md:w-[265px] z-40 bg-white shadow-lg flex flex-col"
						aria-modal="true"
						role="dialog"
						aria-label="Shopping cart"
					>
						<div className="p-4 bg-slate-700 flex justify-between items-center text-white">
							<div className="flex items-center space-x-2">
								<ShoppingBag className="text-yellow-400" />
								<span className="font-medium">
									{itemCount} {itemCount === 1 ? 'ITEM' : 'ITEMS'}
								</span>
							</div>
							<button
								onClick={toggleCart}
								className="text-white hover:text-yellow-400 transition-colors"
								aria-label="Close cart"
							>
								<X className="w-5 h-5" />
							</button>
						</div>

						<div className="flex-1 overflow-y-auto">
							{cartItems.length > 0 ? (
								<div className="p-4 space-y-4">
									{cartItems.map((item) => (
										<motion.div
											key={item.id}
											className="flex gap-4 border-b pb-4"
											initial={{ opacity: 0, y: 10 }}
											animate={{ opacity: 1, y: 0 }}
											transition={{ duration: 0.2 }}
											exit={{ opacity: 0, height: 0, marginBottom: 0 }}
										>
											<div className="relative w-20 h-20 bg-gray-50 rounded">
												{item.images?.[0] ? (
													<img
														src={item.images[0].src}
														alt={item.name}
														className="object-contain w-full h-full p-1"
													/>
												) : (
													<img
														src={item.image}
														alt={item.name}
														className="object-contain w-full h-full p-1"
													/>
												)}
											</div>
											<div className="flex-1">
												<h4 className="text-sm font-medium line-clamp-2">{item.name}</h4>

												{/* Display product attributes if available */}
												{item.selectedAttributes && Object.keys(item.selectedAttributes).length > 0 && (
													<div className="mt-1 mb-1">
														<p className="text-xs text-blue-600">
															{Object.entries(item.selectedAttributes).map(([key, value]) => (
																<span key={key} className="mr-1">{key}: {value}</span>
															))}
														</p>
													</div>
												)}

												<div className="flex items-center justify-between mt-2">
													<div className="flex items-center border rounded">
														<button
															onClick={() => handleQuantityChange(item, item.quantity - 1)}
															className="p-1 hover:bg-gray-100 transition-colors"
															aria-label={`Decrease quantity of ${item.name}`}
														>
															<Minus className="w-4 h-4" />
														</button>
														<span className="px-2 min-w-[24px] text-center">{item.quantity}</span>
														<button
															onClick={() => handleQuantityChange(item, item.quantity + 1)}
															className="p-1 hover:bg-gray-100 transition-colors"
															aria-label={`Increase quantity of ${item.name}`}
														>
															<Plus className="w-4 h-4" />
														</button>
													</div>
													<span className="font-medium">৳{formatPrice(item.price * item.quantity)}</span>
													{/* Remove button */}
													<button
														onClick={(e) => {
															e.preventDefault();
															e.stopPropagation();
															handleQuantityChange(item, 0);
														}}
														className="text-red-500 hover:text-red-700 transition-colors p-1"
														aria-label={`Remove ${item.name} from cart`}
													>
														<X className="w-4 h-4" />
													</button>
												</div>
											</div>
										</motion.div>
									))}
								</div>
							) : (
								<div className="p-8 flex flex-col items-center justify-center h-full">
									<div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
										<ShoppingBag className="w-12 h-12 text-yellow-500" />
									</div>
									<p className="text-gray-600 text-center mb-4">
										Your shopping bag is empty
									</p>
									<button
										onClick={() => {
											toggleCart();
											router.push('/');
										}}
										className="flex items-center text-yellow-600 hover:text-yellow-800 font-medium"
									>
										Start shopping <ChevronRight className="w-4 h-4 ml-1" />
									</button>
								</div>
							)}
						</div>

						{cartItems.length > 0 && (
							<div className="p-4 border-t bg-white">
								<div className="flex justify-between mb-1">
									<span className="text-gray-600">Subtotal:</span>
									<span className="font-medium">৳{formatPrice(cartTotal)}</span>
								</div>
								<div className="flex justify-between mb-4">
									<span className="text-gray-600">Delivery:</span>
									<span className="font-medium">
										{calculateDeliveryFee() === 0
											? 'Free'
											: `৳${formatPrice(calculateDeliveryFee())}`
										}
									</span>
								</div>
								<div className="flex justify-between mb-4 text-lg font-bold">
									<span>Total:</span>
									<span>৳{formatPrice(cartTotal + calculateDeliveryFee())}</span>
								</div>

								{cartTotal < FREE_DELIVERY_THRESHOLD && (
									<div className="mb-4 p-2 bg-yellow-50 text-xs rounded flex items-center">
										<AlertCircle className="h-4 w-4 text-yellow-600 mr-1" />
										<span>Add ৳{formatPrice(FREE_DELIVERY_THRESHOLD - cartTotal)} more for free delivery!</span>
									</div>
								)}

								<button
									onClick={handlePlaceOrder}
									disabled={isPlacingOrder || cartItems.length === 0}
									className={`w-full py-3 rounded-lg font-medium transition-all ${isPlacingOrder
										? 'bg-gray-200 text-gray-500 cursor-not-allowed'
										: cartItems.length === 0
											? 'bg-gray-200 text-gray-500 cursor-not-allowed'
											: 'bg-[#fdd670] hover:bg-[#fcc550] text-gray-900 hover:shadow-md'
										}`}
								>
									{isPlacingOrder ? 'Processing...' : 'Place Order'}
								</button>
							</div>
						)}

						<div className="p-3 bg-gray-50 text-center text-gray-600 border-t flex justify-center items-center space-x-2">
							<span className="font-medium">Need help?</span>
							<a href="tel:16710" className="text-yellow-600 hover:text-yellow-800 font-bold">
								Call 16710
							</a>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</>
	);
};

export default StickyCart;