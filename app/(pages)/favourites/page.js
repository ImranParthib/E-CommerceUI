'use client';

import React, { useState, useEffect } from 'react';
import { useFavorites } from '@/app/context/FavoritesContext';
import { useCart } from '@/app/context/CartContext';
import ProductCard from '@/app/components/ProductCard/ProductCard';
import { useSidebar } from '@/app/context/SidebarContext';
import { ArrowLeft, ShoppingCart, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-toastify';

export default function FavouritesPage() {
  const [isClient, setIsClient] = useState(false);
  const { favorites = [], clearFavorites } = useFavorites() || {};
  const { isSidebarOpen } = useSidebar() || { isSidebarOpen: false };
  const { addToCart } = useCart() || { addToCart: () => { } };
  const [isLoading, setIsLoading] = useState(true);

  // Fix hydration issues by confirming we're on the client
  useEffect(() => {
    setIsClient(true);
    // Give a small delay to ensure favorites are loaded
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const addAllToCart = () => {
    if (favorites && favorites.length) {
      favorites.forEach(product => {
        addToCart(product);
      });
      toast.success(`${favorites.length} items added to your cart`);
    }
  };

  const handleClearFavorites = () => {
    if (window.confirm('Are you sure you want to remove all items from your favorites?')) {
      clearFavorites();
    }
  };

  // Don't render until we're client-side to avoid hydration issues
  if (!isClient || isLoading) {
    return (
      <div className={`transition-all bg-white duration-300 ${isSidebarOpen ? 'ml-0 sm:ml-60' : 'ml-0'} pt-20 sm:pt-24 min-h-screen flex items-center justify-center`}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  return (
    <div className={`transition-all bg-white duration-300 ${isSidebarOpen ? 'ml-0 sm:ml-60' : 'ml-0'} pt-20 sm:pt-24 px-4 md:px-8 lg:px-16 pb-16 min-h-screen`}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Link href="/" className="text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold">My Favorites</h1>
        </div>

        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {favorites && favorites.length > 0 && (
            <>
              <button
                onClick={addAllToCart}
                className="flex items-center gap-1 px-2 sm:px-3 py-2 text-sm sm:text-base bg-green-600 text-white rounded-lg hover:bg-green-700 flex-1 sm:flex-none justify-center"
              >
                <ShoppingCart className="w-4 h-4" />
                <span className="hidden xs:inline">Add All to Cart</span>
                <span className="xs:hidden">Add All</span>
              </button>

              <button
                onClick={handleClearFavorites}
                className="flex items-center gap-1 px-2 sm:px-3 py-2 text-sm sm:text-base bg-red-500 text-white rounded-lg hover:bg-red-600 flex-1 sm:flex-none justify-center"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden xs:inline">Clear All</span>
                <span className="xs:hidden">Clear</span>
              </button>
            </>
          )}
        </div>
      </div>

      {!favorites || favorites.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 sm:py-12 px-4 text-center">
          <div className="text-4xl sm:text-5xl mb-4">❤️</div>
          <h2 className="text-lg sm:text-xl font-medium mb-2">Your favorites list is empty</h2>
          <p className="text-gray-500 mb-6 text-sm sm:text-base">Add items to your favorites by clicking the heart icon on products</p>
          <Link
            href="/"
            className="px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm sm:text-base"
          >
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          {favorites.map((product, index) => (
            <ProductCard
              key={`${product.id}-${index}`}
              product={product}
            />
          ))}
        </div>
      )}
    </div>
  );
}