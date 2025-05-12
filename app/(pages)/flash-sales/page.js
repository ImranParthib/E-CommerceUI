'use client';

import { useState, useEffect } from 'react';
import { useSidebar } from '../../context/SidebarContext';
import { Zap } from 'lucide-react';
import ProductCard from '../../components/ProductCard/ProductCard';
import Image from 'next/image';
import useSWR from 'swr';

// Reusable fetcher function for SWR
const fetcher = (...args) => fetch(...args).then(res => res.json());

export default function FlashSalesPage() {
    const { isSidebarOpen } = useSidebar();
    const [currentPoster, setCurrentPoster] = useState(0);
    const [displayCount, setDisplayCount] = useState(12); // Start with fewer items
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    // Use SWR for efficient data fetching with caching
    const { data, error, isLoading } = useSWR(
        '/api/flashSales',
        fetcher,
        {
            revalidateOnFocus: false,
            dedupingInterval: 300000, // 5 minutes cache
        }
    );

    const flashSaleProducts = data?.products || [];
    const posters = data?.posters || [];

    // Add category marker to products
    const productsWithCategory = flashSaleProducts.map(product => ({
        ...product,
        category: 'flash-sales'
    }));

    // Poster rotation effect
    useEffect(() => {
        if (posters.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentPoster((prev) => (prev + 1) % posters.length);
        }, 5000);

        return () => clearInterval(interval);
    }, [posters.length]);

    const loadMore = () => {
        setIsLoadingMore(true);
        // Simulate loading delay for better UX
        setTimeout(() => {
            setDisplayCount(prev => Math.min(prev + 12, productsWithCategory.length));
            setIsLoadingMore(false);
        }, 300);
    };

    return (
        <main className={`transition-all bg-white duration-300 ${isSidebarOpen ? 'sm:ml-60' : 'ml-0'} pt-16`}>
            <div className="container mx-auto px-4 pb-12">
                {isLoading ? (
                    <div className="py-12 flex justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
                    </div>
                ) : error ? (
                    <div className="py-12 text-center">
                        <p className="text-red-500">Failed to load flash sales. Please try refreshing.</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="mt-4 px-4 py-2 bg-yellow-400 hover:bg-yellow-500 rounded-md"
                        >
                            Refresh Page
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Posters with optimized images */}
                        <div className="flex gap-3 my-6">
                            {posters.length > 0 && (
                                <div className="relative w-1/2 h-28 sm:h-64">
                                    <Image
                                        src={posters[currentPoster]}
                                        alt="Flash Sales Poster"
                                        fill
                                        priority
                                        sizes="(max-width: 640px) 50vw, 33vw"
                                        className="rounded-lg shadow-md object-cover"
                                    />
                                </div>
                            )}
                            {posters.length > 1 && (
                                <div className="relative w-1/2 h-28 sm:h-64">
                                    <Image
                                        src={posters[(currentPoster + 1) % posters.length]}
                                        alt="Flash Sales Poster"
                                        fill
                                        sizes="(max-width: 640px) 50vw, 33vw"
                                        className="rounded-lg shadow-md object-cover"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <Zap className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                                <h1 className="text-2xl font-bold text-gray-800">Flash Sales</h1>
                            </div>
                            <span className="text-gray-600">{productsWithCategory.length} products</span>
                        </div>

                        {/* Products Grid with progressive loading */}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {productsWithCategory.slice(0, displayCount).map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>

                        {/* Load more button */}
                        {displayCount < productsWithCategory.length && (
                            <div className="mt-8 text-center">
                                <button
                                    onClick={loadMore}
                                    disabled={isLoadingMore}
                                    className={`px-6 py-2 rounded-md ${isLoadingMore
                                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                            : 'bg-yellow-400 hover:bg-yellow-500 text-gray-900'
                                        }`}
                                >
                                    {isLoadingMore ? 'Loading...' : 'Load More Products'}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </main>
    );
}
