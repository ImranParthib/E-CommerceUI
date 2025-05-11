'use client';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ShoppingBag, Zap } from 'lucide-react';
import { useSidebar } from '@/app/context/SidebarContext';
import ProductCard from '@/app/components/ProductCard/ProductCard';
import { useCategories } from '@/app/context/CategoryContext';

export default function CategoryPage({ params }) {
    const unwrappedParams = React.use(params);
    const { slug } = unwrappedParams;
    const { isSidebarOpen } = useSidebar();
    const { categories } = useCategories();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [categoryName, setCategoryName] = useState('');

    // Format the slug for display (replace hyphens with spaces and capitalize)
    const formatCategoryName = (slug) => {
        return slug
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    useEffect(() => {
        const fetchCategory = async () => {
            try {
                // Try to find the category name from the context first
                const category = categories.find(cat => cat.slug === slug);
                if (category) {
                    setCategoryName(category.name);
                } else {
                    // Fallback to formatted slug if category not found in context
                    setCategoryName(formatCategoryName(slug));
                }
            } catch (error) {
                setCategoryName(formatCategoryName(slug));
            }
        };

        fetchCategory();
    }, [slug, categories]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const res = await axios.get('/api/products');
                const filteredProducts = res.data.filter(product =>
                    product.categories?.some(cat =>
                        cat.slug === slug ||
                        cat.name.toLowerCase() === slug.replace(/-/g, ' ').toLowerCase()
                    )
                );
                setProducts(filteredProducts);
            } catch (error) {
                console.error('Error fetching products:', error);
                setError('There was an issue loading the products.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [slug]);

    // Get a suitable icon based on category slug
    const getCategoryIcon = () => {
        if (slug.includes('flash') || slug.includes('sale')) {
            return <Zap className="w-6 h-6 text-yellow-500" />;
        }
        // Add more category-specific icons as needed
        return <ShoppingBag className="w-6 h-6 text-blue-500" />;
    };

    return (
        <div className={`transition-all duration-300 ${isSidebarOpen ? 'ml-0 sm:ml-60' : 'ml-0'} pt-16`}>
            <div className="container mx-auto px-4 py-8">
                <div className="flex items-center gap-3 mb-6">
                    {getCategoryIcon()}
                    <h1 className="text-2xl font-bold text-gray-800">{categoryName}</h1>
                </div>
                <p className="text-gray-600 mb-8">
                    Explore our selection of high-quality {categoryName.toLowerCase()} products.
                </p>
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                ) : error ? (
                    <div className="text-center py-12">
                        <h3 className="text-xl font-medium text-red-500">{error}</h3>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-2 sm:gap-3">
                        {products.length > 0 ? (
                            products.map(product => (
                                <ProductCard key={product.id} product={product} />
                            ))
                        ) : (
                            <div className="col-span-full text-center py-12">
                                <h3 className="text-xl font-medium text-gray-700">No products found</h3>
                                <p className="text-gray-500 mt-2">We couldn&apos;t find any products in this category. Please check back later.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}