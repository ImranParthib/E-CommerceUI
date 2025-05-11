'use client';

import React, { useState, useEffect } from 'react';
import { useCategories } from '@/app/context/CategoryContext';
import { useCart } from '@/app/context/CartContext';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import ProductCard from '@/app/components/ProductCard/ProductCard';
import Link from 'next/link';
import axios from 'axios';

const BrandShowcase = () => {
    // State for showcase categories and products
    const [activeTab, setActiveTab] = useState('popular');
    const [products, setProducts] = useState({
        popular: [],
        latest: [],
        deals: [],
        selling: []
    });
    const [loading, setLoading] = useState(true);
    const { popularProducts } = useCategories();
    const { cartItems } = useCart();

    // Fetch products for different categories
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true);

                // Fetch all products from API
                const response = await axios.get('/api/products');
                const allProducts = response.data || [];

                if (!allProducts.length) {
                    setLoading(false);
                    return;
                }

                // POPULAR PRODUCTS: First try context data, then ratings, then featured status
                let popular = [];
                if (popularProducts && popularProducts.length > 0) {
                    // Use products from context if available
                    popular = popularProducts.slice(0, 10);
                } else {
                    // Otherwise, use products with highest ratings
                    popular = [...allProducts]
                        .sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0))
                        .slice(0, 10);

                    // If no ratings, use featured products or first 10 products
                    if (popular.every(p => !p.average_rating)) {
                        popular = allProducts.filter(p => p.featured).slice(0, 10);
                        if (popular.length < 5) {
                            popular = allProducts.slice(0, 10);
                        }
                    }
                }

                // LATEST PRODUCTS: Sort by creation date, ensure they're different from popular
                const latest = [...allProducts]
                    .sort((a, b) => new Date(b.date_created) - new Date(a.date_created))
                    // Ensure some difference from popular products if possible
                    .filter(p => allProducts.length > 20 ? !popular.some(pop => pop.id === p.id) : true)
                    .slice(0, 10);

                // DEALS: Products with discounts, sorted by discount percentage
                const deals = [...allProducts]
                    .filter(p => p.on_sale || (p.regular_price && p.sale_price))
                    .sort((a, b) => {
                        const discountA = a.regular_price ? ((a.regular_price - a.sale_price) / a.regular_price) : 0;
                        const discountB = b.regular_price ? ((b.regular_price - b.sale_price) / b.regular_price) : 0;
                        return discountB - discountA;
                    })
                    .slice(0, 10);

                // MOST SELLING: First try sales data, then cart data, finally create a curated selection 
                // that's different from the other categories
                let selling = [];

                // Try using total_sales data
                const productsWithSales = allProducts.filter(p => p.total_sales);

                if (productsWithSales.length >= 5) {
                    selling = productsWithSales
                        .sort((a, b) => b.total_sales - a.total_sales)
                        .slice(0, 10);
                } else {
                    // Create a frequency map from cart items
                    const productFrequency = {};
                    cartItems.forEach(item => {
                        productFrequency[item.id] = (productFrequency[item.id] || 0) + item.quantity;
                    });

                    // Get any products that are in carts
                    const productsInCarts = allProducts.filter(p => productFrequency[p.id]);

                    // If we have enough cart data, use that
                    if (productsInCarts.length >= 5) {
                        selling = [...productsInCarts]
                            .sort((a, b) => (productFrequency[b.id] || 0) - (productFrequency[a.id] || 0))
                            .slice(0, 10);
                    } else {
                        // Otherwise, create a distinct selection based on price (high price products)
                        // This ensures this tab is visually different from the others
                        selling = [...allProducts]
                            .sort((a, b) => parseFloat(b.price || 0) - parseFloat(a.price || 0))
                            // Actively try to exclude products from other tabs
                            .filter(p => !popular.some(pop => pop.id === p.id) && !latest.slice(0, 5).some(l => l.id === p.id))
                            .slice(0, 10);
                    }
                }

                // If any category still doesn't have enough products, fill in with random products
                const fillMissingProducts = () => {
                    // Create a pool of products not yet assigned to categories
                    const usedProductIds = new Set([
                        ...popular.map(p => p.id),
                        ...latest.map(p => p.id),
                        ...deals.map(p => p.id),
                        ...selling.map(p => p.id)
                    ]);

                    const availableProducts = allProducts.filter(p => !usedProductIds.has(p.id));

                    // Process all categories in parallel
                    [popular, latest, deals, selling].forEach(category => {
                        if (category.length < 5 && allProducts.length >= 5) {
                            // Get the number of products needed
                            const neededCount = Math.min(10 - category.length, availableProducts.length);

                            // Get random products from the available pool
                            const randomProducts = availableProducts
                                .sort(() => 0.5 - Math.random())
                                .slice(0, neededCount);

                            // Add to category and remove from available pool
                            category.push(...randomProducts);
                            randomProducts.forEach(p => {
                                const index = availableProducts.findIndex(ap => ap.id === p.id);
                                if (index > -1) availableProducts.splice(index, 1);
                            });
                        }
                    });
                };

                // Fill any missing products in all categories at once
                fillMissingProducts();

                // Set all processed categories at once
                setProducts({
                    popular,
                    latest,
                    deals,
                    selling
                });

            } catch (error) {
                console.error('Error fetching products:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [popularProducts]); // Removed cartItems dependency to prevent re-renders when cart changes

    // Scroll functionality for horizontal category tabs
    const scrollLeft = () => {
        const container = document.getElementById('showcase-tabs');
        if (container) {
            container.scrollLeft -= 200;
        }
    };

    const scrollRight = () => {
        const container = document.getElementById('showcase-tabs');
        if (container) {
            container.scrollLeft += 200;
        }
    };

    // Categories for the tabs
    const categories = [
        { id: 'popular', name: 'Most Popular', link: '/category/popular' },
        { id: 'latest', name: 'Latest Products', link: '/latest-products' },
        { id: 'deals', name: "Today's Deals", link: '/flash-sales' },
        { id: 'selling', name: 'Most Selling', link: '/best-selling' }
    ];

    // Get the current products to display based on active tab
    const currentProducts = products[activeTab] || [];

    return (
        <section className="bg-white py-12">
            <div className="container mx-auto px-4">
                <div className="flex flex-col space-y-6">
                    {/* Section heading */}
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Featured Products</h2>
                        <Link href="/category/popular" className="text-yellow-600 hover:text-yellow-700 text-sm font-medium flex items-center">
                            View all <ChevronRight size={16} className="ml-1" />
                        </Link>
                    </div>

                    {/* Category tabs with scroll control */}
                    <div className="relative">
                        {/* Tab scroll buttons */}
                        <button
                            onClick={scrollLeft}
                            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-md rounded-full p-2 hover:bg-gray-100"
                            aria-label="Scroll left"
                        >
                            <ChevronLeft size={18} />
                        </button>

                        <div className="mx-8 overflow-x-auto scrollbar-hide" id="showcase-tabs">
                            <div className="flex space-x-4 py-2">
                                {categories.map((category) => (
                                    <button
                                        key={category.id}
                                        onClick={() => setActiveTab(category.id)}
                                        className={`whitespace-nowrap px-6 py-2 rounded-full transition-all duration-300 
                                        ${activeTab === category.id
                                                ? 'bg-yellow-500 text-white font-medium shadow-md'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                    >
                                        {category.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={scrollRight}
                            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-md rounded-full p-2 hover:bg-gray-100"
                            aria-label="Scroll right"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>

                    {/* Products grid */}
                    <div className="mt-6">
                        {loading ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="bg-gray-100 animate-pulse h-72 rounded-lg"></div>
                                ))}
                            </div>
                        ) : currentProducts.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                                {currentProducts.map(product => (
                                    <ProductCard key={`${activeTab}-${product.id}`} product={product} />
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-16 bg-gray-50 rounded-lg">
                                <p className="text-gray-500 text-center mb-4">No products found in this category</p>
                                <Link href="/" className="bg-yellow-500 text-white px-6 py-2 rounded-md hover:bg-yellow-600">
                                    Browse all products
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default BrandShowcase;