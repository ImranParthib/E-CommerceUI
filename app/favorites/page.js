'use client';

import React from 'react';
import { useFavorites } from '../context/FavoritesContext';
import ProductCard from '../components/ProductCard/ProductCard';

export default function FavoritesPage() {
    const { favorites = [] } = useFavorites() || {};  // Add default empty array

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-6">My Favorite Products</h1>

            {!favorites || favorites.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-gray-600">You haven't added any products to your favorites yet.</p>
                    <a
                        href="/"
                        className="inline-block mt-4 px-6 py-2 text-sm font-medium text-center text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                    >
                        Continue Shopping
                    </a>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {favorites.map(product => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            )}
        </div>
    );
}
