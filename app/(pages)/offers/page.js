'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import ProductCard from '@/app/components/ProductCard/ProductCard';
import { Zap } from 'lucide-react';
import { useSidebar } from '@/app/context/SidebarContext';

const OffersPage = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { isSidebarOpen } = useSidebar();

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true);
                const response = await axios.get('/api/products');

                // Filter products that are on sale or have a discount
                const discountedProducts = response.data.filter(product =>
                    product.on_sale ||
                    (product.regular_price && product.sale_price) ||
                    (product.originalPrice && product.price < product.originalPrice)
                );

                // Sort by discount percentage (highest first)
                const sortedProducts = discountedProducts.sort((a, b) => {
                    const discountA = a.regular_price ? ((a.regular_price - a.sale_price) / a.regular_price) : 0;
                    const discountB = b.regular_price ? ((b.regular_price - b.sale_price) / b.regular_price) : 0;
                    return discountB - discountA;
                });

                setProducts(sortedProducts);
            } catch (error) {
                console.error('Error fetching products:', error);
                setError('Failed to load offers. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, []);

    if (loading) {
        return (
            <div className={`transition-all duration-300 ${isSidebarOpen ? 'ml-0 sm:ml-60' : 'ml-0'} pt-16`}>
                <div className="container mx-auto px-4 py-8">
                    <div className="flex items-center justify-center min-h-[60vh]">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`transition-all duration-300 ${isSidebarOpen ? 'ml-0 sm:ml-60' : 'ml-0'} pt-16`}>
                <div className="container mx-auto px-4 py-8">
                    <div className="flex flex-col items-center justify-center min-h-[60vh]">
                        <p className="text-red-500 mb-4">{error}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`transition-all duration-300 ${isSidebarOpen ? 'ml-0 sm:ml-60' : 'ml-0'} pt-16`}>
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center gap-2 mb-8">
                    <Zap className="w-6 h-6 text-yellow-500" />
                    <h1 className="text-2xl font-bold">Special Offers</h1>
                </div>

                {/* Products Grid */}
                {products.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {products.map(product => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-16 bg-gray-50 rounded-lg">
                        <p className="text-gray-500 text-center mb-4">No offers available at the moment</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                        >
                            Refresh
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OffersPage; 