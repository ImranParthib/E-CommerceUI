'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import ProductCard from '../ProductCard/ProductCard';
import { useCategories } from '../../context/CategoryContext';
import { Zap, Star, ShoppingBag } from 'lucide-react';
import useSWR from 'swr';

// Reusable fetcher function for SWR
const fetcher = (...args) => fetch(...args).then(res => res.json());

export default function HomeProducts() {
    const {
        categories,
        loading: contextLoading,
        getProductsByCategory,
        flashSalesProducts: contextFlashSales,
        popularProducts: contextPopular,
        updateFlashSalesProducts
    } = useCategories();

    // Directly fetch flash sales products to avoid waiting for context
    const { data: flashSaleProducts, error: flashSaleError, isLoading: flashSaleLoading } = useSWR(
        '/api/products/flashsale',
        fetcher,
        {
            revalidateOnFocus: false,
            dedupingInterval: 300000, // 5 minutes
            onSuccess: (data) => {
                // Update the context with fetched data
                if (data && data.length > 0) updateFlashSalesProducts(data);
            }
        }
    );

    // Hard-coded display configuration
    const displayConfig = [
        {
            name: 'Flash Sales',
            icon: <Zap className="w-6 h-6 text-yellow-500" />,
            path: '/flash-sales',
            titleColor: 'text-yellow-600'
        },
        {
            name: 'Popular',
            icon: <Star className="w-6 h-6 text-orange-500" />,
            path: '/popular',
            titleColor: 'text-orange-600'
        }
    ];

    // Combine context data with directly fetched data
    const flashSales = flashSaleProducts || contextFlashSales;
    const popularProducts = contextPopular;

    // Check if we should show loading state
    const isFlashSaleLoading = flashSaleLoading && flashSales.length === 0;
    const isPopularLoading = contextLoading && popularProducts.length === 0;
    const showLoading = isFlashSaleLoading && isPopularLoading;

    if (showLoading) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#fdd670]"></div>
            </div>
        );
    }

    return (
        <div className="max-w-[1200px] mx-auto my-10 px-4">
            <h2 className="text-2xl font-bold text-center mb-8">Featured Products</h2>

            {/* Flash Sales Section */}
            {flashSales && flashSales.length > 0 ? (
                <div className="mb-10">
                    <div className="flex items-center justify-between mb-6 border-b pb-2">
                        <div className="flex items-center gap-2">
                            <Zap className="w-6 h-6 text-yellow-500" />
                            <h3 className="text-xl font-semibold text-yellow-600">Flash Sales</h3>
                        </div>
                        <Link
                            href="/flash-sales"
                            prefetch={true}
                            className="text-[#0070f3] hover:underline font-medium">
                            View All
                        </Link>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {isFlashSaleLoading ? (
                            // Skeleton loaders for Flash Sales
                            Array(4).fill(0).map((_, i) => (
                                <div key={`flash-skeleton-${i}`} className="bg-white rounded-lg shadow-sm p-3 h-72">
                                    <div className="w-full h-40 bg-gray-200 rounded-md mb-4 animate-pulse"></div>
                                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2 animate-pulse"></div>
                                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-4 animate-pulse"></div>
                                    <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                                </div>
                            ))
                        ) : (
                            flashSales.slice(0, 4).map(product => (
                                <ProductCard key={`flash-${product.id}`} product={product} />
                            ))
                        )}
                    </div>
                </div>
            ) : null}

            {/* Popular Products Section */}
            {popularProducts && popularProducts.length > 0 ? (
                <div className="mb-10">
                    <div className="flex items-center justify-between mb-6 border-b pb-2">
                        <div className="flex items-center gap-2">
                            <Star className="w-6 h-6 text-orange-500" />
                            <h3 className="text-xl font-semibold text-orange-600">Popular</h3>
                        </div>
                        <Link
                            href="/popular"
                            className="text-[#0070f3] hover:underline font-medium">
                            View All
                        </Link>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {isPopularLoading ? (
                            // Skeleton loaders for Popular Products
                            Array(4).fill(0).map((_, i) => (
                                <div key={`popular-skeleton-${i}`} className="bg-white rounded-lg shadow-sm p-3 h-72">
                                    <div className="w-full h-40 bg-gray-200 rounded-md mb-4 animate-pulse"></div>
                                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2 animate-pulse"></div>
                                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-4 animate-pulse"></div>
                                    <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                                </div>
                            ))
                        ) : (
                            popularProducts.slice(0, 4).map(product => (
                                <ProductCard key={`popular-${product.id}`} product={product} />
                            ))
                        )}
                    </div>
                </div>
            ) : null}
        </div>
    );
}
