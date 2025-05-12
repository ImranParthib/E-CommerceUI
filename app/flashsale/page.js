'use client';

import React, { useEffect, useState } from 'react';
import ProductCard from '../components/ProductCard/ProductCard';
import { Zap } from 'lucide-react';
import useSWR from 'swr';

// Reusable fetcher function for SWR
const fetcher = (...args) => fetch(...args).then(res => res.json());

export default function FlashSalePage() {
    const [isClient, setIsClient] = useState(false);

    // Use SWR for data fetching with caching
    const { data: flashSaleProducts, error, isLoading } = useSWR(
        '/api/products/flashsale',
        fetcher,
        {
            revalidateOnFocus: false,
            dedupingInterval: 300000 // 5 minutes
        }
    );

    // Fix hydration issues by confirming we're on the client
    useEffect(() => {
        setIsClient(true);
    }, []);

    // Display loading state
    if (!isClient || isLoading) {
        return (
            <div className="container mx-auto p-4">
                <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <Zap className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                    Flash Sale
                </h1>
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
                </div>
            </div>
        );
    }

    // Display error state
    if (error) {
        return (
            <div className="container mx-auto p-4">
                <h1 className="text-2xl font-bold mb-6">Flash Sale</h1>
                <div className="text-center py-12">
                    <p className="text-red-600">Error loading flash sale products. Please try again.</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 px-4 py-2 bg-yellow-400 text-gray-900 rounded-md hover:bg-yellow-500"
                    >
                        Reload
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Zap className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                Flash Sale
            </h1>

            {!flashSaleProducts || flashSaleProducts.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-gray-600">No flash sale products available right now.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {flashSaleProducts.map(product => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            )}
        </div>
    );
}
