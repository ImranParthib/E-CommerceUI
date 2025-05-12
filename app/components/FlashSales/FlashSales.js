'use client';

import { Zap } from 'lucide-react';
import ProductCard from '../ProductCard/ProductCard';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useCategories } from '../../context/CategoryContext';
import Link from 'next/link';
import useSWR from 'swr';

// Reusable fetcher function for SWR
const fetcher = (...args) => fetch(...args).then(res => res.json());

const FlashSales = () => {
    const [currentPoster, setCurrentPoster] = useState(0);
    const { updateFlashSalesProducts } = useCategories();

    // Use SWR for efficient data fetching with caching
    const { data, error, isLoading } = useSWR(
        '/api/flashSales',
        fetcher,
        {
            revalidateOnFocus: false,
            dedupingInterval: 300000, // 5 minutes cache
        }
    );

    const posters = data?.posters || [];
    const flashSaleProducts = data?.products || [];

    // Process products and update context when data changes
    useEffect(() => {
        if (flashSaleProducts.length > 0) {
            // Add category marker to each product
            const productsWithCategory = flashSaleProducts.map(product => ({
                ...product,
                category: 'flash-sales'
            }));

            // Share data with CategoryContext
            updateFlashSalesProducts(productsWithCategory);
        }
    }, [flashSaleProducts, updateFlashSalesProducts]);

    // Poster rotation effect
    useEffect(() => {
        if (posters.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentPoster((prev) => (prev + 1) % posters.length);
        }, 5000);

        return () => clearInterval(interval);
    }, [posters.length]);

    // Show limited products on home page for better performance
    const limitedProducts = flashSaleProducts.slice(0, 8).map(product => ({
        ...product,
        category: 'flash-sales'
    }));

    return (
        <section className="py-4 sm:py-8 px-4 md:px-8">
            <div className="container mx-auto">
                {/* Posters with optimized loading */}
                <div className="flex gap-2 sm:gap-4 mb-6">
                    <div className="relative w-1/2 h-28 sm:h-64">
                        {posters.length > 0 && (
                            <Image
                                src={posters[currentPoster]}
                                alt="Flash Sales Poster"
                                fill
                                sizes="(max-width: 640px) 50vw, 33vw"
                                className="rounded-lg shadow-md object-cover"
                            />
                        )}
                    </div>
                    <div className="relative w-1/2 h-28 sm:h-64">
                        {posters.length > 1 && (
                            <Image
                                src={posters[posters.length > 1 ? (currentPoster + 1) % posters.length : 0]}
                                alt="Flash Sales Poster"
                                fill
                                sizes="(max-width: 640px) 50vw, 33vw"
                                className="rounded-lg shadow-md object-cover"
                            />
                        )}
                    </div>
                </div>

                {/* Header with proper link */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <Zap className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                        <h2 className="text-2xl font-bold text-gray-800">Flash Sales</h2>
                    </div>
                    <Link href="/flash-sales" className="text-[#ff6f71] hover:text-red-600 font-medium">
                        View All →
                    </Link>
                </div>

                {/* Loading state */}
                {isLoading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="bg-white rounded-lg shadow-sm p-3 h-64">
                                <div className="w-full h-40 bg-gray-200 rounded-md mb-4 animate-pulse"></div>
                                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2 animate-pulse"></div>
                                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4 animate-pulse"></div>
                                <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {limitedProducts.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
};

export default FlashSales;