'use client';

import React, { useState, useEffect, memo } from 'react';
import { Heart, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { useCart } from '@/app/context/CartContext';
import { useFavorites } from '@/app/context/FavoritesContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import ProductBadges from './ProductBadges';
import ProductImage from './ProductImage';
import ProductInfo from './ProductInfo';
import CartControls from './CartControls';
import ProductModal from './ProductModal';
import { formatPrice, calculateDiscountPercentage } from './utils';
import { toast } from 'react-toastify';

const ProductCard = memo(({ product }) => {
  const router = useRouter();
  const { addToCart, updateQuantity, cartItems, removeFromCart } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();
  const [isQuickView, setIsQuickView] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [priceAnimation, setPriceAnimation] = useState(false);
  const [lastPrice, setLastPrice] = useState(0);

  // Generate a unique key for a product - matching the CartContext implementation
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

  // Check if product is already in cart
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

  // Function to handle product click - always open the modal instead of navigation
  const handleProductClick = (e) => {
    e.preventDefault();
    setIsModalOpen(true);
  };

  // Function to increment quantity and add to cart directly
  const incrementQty = (e, productWithAttributes) => {
    e.stopPropagation();

    // If we received a product with attributes from the modal, use that
    if (productWithAttributes && productWithAttributes.attributesSelected) {
      // Check if the exact product with these attributes is already in cart
      const productKey = generateProductKey(productWithAttributes);
      const existingItem = cartItems.find(item => generateProductKey(item) === productKey);

      if (existingItem) {
        // If it exists, increase its quantity
        updateQuantity(productWithAttributes, existingItem.quantity + 1, productWithAttributes.category, productWithAttributes.selectedAttributes);
      } else {
        // If it doesn't exist, add it as a new item
        addToCart(productWithAttributes, 1);
      }
      return;
    }

    // Otherwise check if product requires attribute selection
    if (product.requires_attribute_selection || (product.attributes && product.attributes.length > 0)) {
      // Open modal instead of directly adding to cart
      setIsModalOpen(true);
      // Show toast notification
      toast.info("Please select options before adding to cart");
      return;
    }

    // For products without required attributes
    if (cartItem) {
      updateQuantity(cartItem, cartItemQty + 1, product.category, cartItem.selectedAttributes || {});
    } else {
      addToCart(product, 1);
    }
  };

  // Function to decrement quantity and update cart directly
  const decrementQty = (e) => {
    e.stopPropagation();
    if (!cartItem) return;

    if (cartItemQty > 1) {
      updateQuantity(cartItem, cartItemQty - 1, product.category, cartItem.selectedAttributes || {});
    } else if (cartItemQty === 1) {
      removeFromCart(cartItem, product.category, cartItem.selectedAttributes || {});
    }
  };

  // Calculate price based on sale status
  const getPrice = () => {
    if (product.on_sale) {
      return product.sale_price;
    }
    return product.price;
  };

  // Get original price for comparison
  const getOriginalPrice = () => {
    if (product.on_sale) {
      return product.regular_price;
    }
    return product.originalPrice || null;
  };

  // Calculate discount percentage
  const discountPercentage = calculateDiscountPercentage(product);

  return (
    <>
      <div
        className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 relative flex flex-col overflow-hidden h-auto min-h-[280px] w-full"
        onMouseEnter={() => setIsQuickView(true)}
        onMouseLeave={() => setIsQuickView(false)}
        onClick={handleProductClick}
      >
        {/* Top section with image and badges */}
        <div className="relative pt-1 px-1 pb-0">
          <ProductBadges
            discountPercentage={discountPercentage}
            stockStatus={product.stock_status}
          />

          {/* Wishlist Heart Icon */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleFavorite(product);
            }}
            className={`absolute top-2 right-2 w-7 h-7 rounded-full bg-white shadow-sm flex items-center justify-center 
              ${isFavorite(product.id) ? 'text-red-500' : 'text-gray-400'} hover:text-red-500 transition-colors z-10`}
            aria-label="Add to favorites"
          >
            <Heart className="w-4 h-4" fill={isFavorite(product.id) ? "currentColor" : "none"} />
          </button>

          {/* Product Image with hover effect */}
          <ProductImage
            product={product}
            isQuickView={isQuickView}
            setIsModalOpen={setIsModalOpen}
          />
        </div>

        {/* Product Info Section */}
        <div className="flex-1 flex flex-col p-2 pt-0">
          <ProductInfo
            product={product}
            getPrice={getPrice}
            getOriginalPrice={getOriginalPrice}
            discountPercentage={discountPercentage}
          />

          {/* Cart Controls Section */}
          <div className="mt-auto">
            <CartControls
              product={product}
              cartItemQty={cartItemQty}
              getPrice={getPrice}
              incrementQty={incrementQty}
              decrementQty={decrementQty}
              removeFromCart={() => removeFromCart(product.id, product.category)}
            />
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
      <ProductModal
        isOpen={isModalOpen}
        setIsOpen={setIsModalOpen}
        product={product}
        cartItemQty={cartItemQty}
        discountPercentage={discountPercentage}
        getPrice={getPrice}
        getOriginalPrice={getOriginalPrice}
        incrementQty={incrementQty}
        decrementQty={decrementQty}
        removeFromCart={() => removeFromCart(product.id, product.category)}
      />
    </>
  );
});

// Define proper displayName for React DevTools
ProductCard.displayName = 'ProductCard';

export default ProductCard;