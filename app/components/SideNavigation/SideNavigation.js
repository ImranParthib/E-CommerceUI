'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
    ShoppingBag,
    Heart,
    Zap,
    Star,
    Apple,
    Sparkles,
    Baby,
    ChefHat,
    Pencil,
    Dog,
    Dumbbell,
    Palette,
    Shirt,
    Car,
    Shield,
    Crown,
    HelpCircle,
    MessageCircle,
    ChevronRight,
    Egg,
    Fish,
    UtensilsCrossed,
    ShoppingCart,
    Brush,
    User,
    Beef
} from 'lucide-react';
import { useSidebar } from '../../context/SidebarContext';
import { useCategories } from '../../context/CategoryContext';

const SideNavigation = () => {
    const { isSidebarOpen, toggleSidebar } = useSidebar();
    const [expandedItems, setExpandedItems] = useState(new Set());
    const { categories, setCategories } = useCategories();
    const [fetchedCategories, setFetchedCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [organizedCategories, setOrganizedCategories] = useState([]);
    const [offersCount, setOffersCount] = useState(0);

    // Fetch categories from API
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                setIsLoading(true);
                const response = await fetch('/api/categories');
                if (!response.ok) {
                    throw new Error('Failed to fetch categories');
                }
                const data = await response.json();
                setFetchedCategories(data);

                // Log the raw data to help with debugging
                console.log('Raw categories data:', data);

                // Organize the categories
                organizeCategories(data);

                // Fetch products and count discounted ones
                const productsResponse = await fetch('/api/products');
                const productsData = await productsResponse.json();

                // Count products that are on sale or have a discount
                const discountedCount = productsData.filter(product =>
                    product.on_sale ||
                    (product.regular_price && product.sale_price) ||
                    (product.originalPrice && product.price < product.originalPrice)
                ).length;

                setOffersCount(discountedCount);
            } catch (error) {
                console.error('Error fetching categories:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCategories();
    }, []);

    // Organize categories into parent-child hierarchy
    const organizeCategories = (categories) => {
        // Find parent categories (parent = 0)
        const parents = categories.filter(cat => cat.parent === 0);

        // Create a map with children under their parents
        const organized = parents.map(parent => {
            // Find children of this parent
            const children = categories.filter(cat => cat.parent === parent.id);

            // Log parent-child relationships to debug
            if (parent.name === 'Personal Care') {
                console.log(`Children of ${parent.name}:`, children);
            }

            return {
                ...parent,
                children: children
            };
        });

        setOrganizedCategories(organized);
    };

    const toggleItem = (categoryId) => {
        setExpandedItems(prev => {
            const newSet = new Set(prev);
            if (newSet.has(categoryId)) {
                newSet.delete(categoryId);
            } else {
                newSet.add(categoryId);
            }
            return newSet;
        });
    };

    const topCategories = [
        { name: 'Grocery', icon: <ShoppingCart className="w-3.5 h-3.5" />, color: 'bg-red-400' },
        { name: 'Pharmacy', icon: <ShoppingBag className="w-3.5 h-3.5" />, color: 'bg-blue-400' },
        { name: 'Cookups', icon: <ChefHat className="w-3.5 h-3.5" />, color: 'bg-green-400' }
    ];

    // Map the icon based on the category name/slug
    const getCategoryIcon = (category) => {
        const name = category.name.toLowerCase();
        const slug = category.slug.toLowerCase();

        if (name.includes('flash') || slug.includes('flash'))
            return <Zap className="w-3.5 h-3.5 text-yellow-500" />;
        if (name.includes('popular') || slug.includes('popular'))
            return <Star className="w-3.5 h-3.5 text-orange-500" />;
        if (name.includes('food') || slug.includes('food'))
            return <Apple className="w-3.5 h-3.5 text-green-500" />;
        if (name.includes('clean') || slug.includes('clean'))
            return <Sparkles className="w-3.5 h-3.5 text-blue-500" />;
        if (name.includes('personal') || slug.includes('personal'))
            return <User className="w-3.5 h-3.5 text-purple-500" />;
        if (name.includes('dairy') || slug.includes('dairy'))
            return <Egg className="w-3.5 h-3.5 text-yellow-100" />;
        if (name.includes('meat') || slug.includes('meat') || name.includes('fish') || slug.includes('fish'))
            return <Fish className="w-3.5 h-3.5 text-red-600" />;
        if (name.includes('cook') || slug.includes('cook'))
            return <UtensilsCrossed className="w-3.5 h-3.5 text-orange-400" />;
        if (name.includes('fashion') || slug.includes('fashion'))
            return <Shirt className="w-3.5 h-3.5 text-purple-500" />;
        if (name.includes('men') || slug.includes('men'))
            return <User className="w-3.5 h-3.5 text-blue-500" />;
        if (name.includes('female') || slug.includes('female'))
            return <User className="w-3.5 h-3.5 text-pink-500" />;

        // Default icon if no match
        return <ShoppingBag className="w-3.5 h-3.5 text-gray-500" />;
    };

    // Expand all parent categories by default
    useEffect(() => {
        if (organizedCategories.length > 0) {
            const parentIds = organizedCategories
                .filter(cat => cat.children && cat.children.length > 0)
                .map(cat => cat.id);

            setExpandedItems(new Set(parentIds));
        }
    }, [organizedCategories]);

    // Share categories with the context
    useEffect(() => {
        // Share all categories that have products plus favorites
        if (organizedCategories.length > 0) {
            const allCategories = [
                { name: 'Favourites', icon: <Heart className="w-3.5 h-3.5 text-red-500" />, path: '/favourites', hasProducts: true },
                ...organizedCategories
            ];

            setCategories(allCategories);
        }
    }, [organizedCategories, setCategories]);

    return (
        <>
            {/* Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                    onClick={toggleSidebar}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed top-12 bottom-0 left-0 w-52 sm:w-56 md:w-60
                bg-white shadow-lg z-40
                transform transition-transform duration-300 ease-in-out
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                flex flex-col
            `}>
                {/* Content Container */}
                <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 text-black">
                    {/* Top Categories */}
                    <div className="flex justify-between p-3 border-b">
                        {topCategories.map((category) => (
                            <div key={category.name} className="flex flex-col items-center border border-gray-200 rounded-lg p-1.5">
                                <div className={`p-2 rounded-lg ${category.color} mb-1`}>
                                    {category.icon}
                                </div>
                                <span className="text-xs truncate max-w-16">{category.name}</span>
                            </div>
                        ))}
                    </div>

                    {/* Offers Section */}
                    <div className="p-3 border-b">
                        <Link href="/offers" className="flex justify-between items-center hover:bg-gray-100 rounded-lg p-2 transition-colors">
                            <span className="font-medium text-sm">Offers</span>
                            <div className="flex items-center">
                                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                                    {offersCount}
                                </span>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </Link>
                    </div>

                    {/* Main Categories */}
                    <div className="py-1">
                        {isLoading ? (
                            <div className="flex justify-center p-4">
                                <div className="animate-pulse text-xs">Loading categories...</div>
                            </div>
                        ) : (
                            <>
                                {/* Favorites - Static */}
                                <div key="favourites">
                                    <Link
                                        href="/favourites"
                                        className="flex items-center justify-between px-3 py-1.5 hover:bg-gray-50 cursor-pointer"
                                    >
                                        <div className="flex items-center gap-2">
                                            <Heart className="w-3.5 h-3.5 text-red-500" />
                                            <span className="text-xs">Favourites</span>
                                        </div>
                                    </Link>
                                </div>

                                {/* Special categories: Flash Sales and Popular */}
                                {organizedCategories.filter(cat =>
                                    cat.slug === 'flash-sales' || cat.slug === 'popular'
                                ).map((category) => (
                                    <div key={category.id}>
                                        <Link
                                            href={`/category/${category.slug}`}
                                            className="flex items-center justify-between px-3 py-1.5 hover:bg-gray-50 cursor-pointer"
                                        >
                                            <div className="flex items-center gap-2">
                                                {getCategoryIcon(category)}
                                                <span className="text-xs">{category.name}</span>
                                            </div>
                                        </Link>
                                    </div>
                                ))}

                                {/* Other main categories with their children */}
                                {organizedCategories.filter(cat =>
                                    cat.slug !== 'flash-sales' && cat.slug !== 'popular'
                                ).map((category) => (
                                    <div key={category.id || category.slug}>
                                        <Link
                                            href={category.children && category.children.length > 0 ? '#' : `/category/${category.slug}`}
                                            className="flex items-center justify-between px-3 py-1.5 hover:bg-gray-50 cursor-pointer"
                                            onClick={(e) => {
                                                if (category.children && category.children.length > 0) {
                                                    e.preventDefault();
                                                    toggleItem(category.id);
                                                }
                                            }}
                                        >
                                            <div className="flex items-center gap-2">
                                                {getCategoryIcon(category)}
                                                <span className="text-xs">{category.name}</span>
                                                {category.name === 'Personal Care' && (
                                                    <span className="text-xs text-red-500">({category.children?.length || 0})</span>
                                                )}
                                            </div>
                                            {category.children && category.children.length > 0 && (
                                                <ChevronRight
                                                    className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 
                                                    ${expandedItems.has(category.id) ? 'rotate-90' : ''}`}
                                                />
                                            )}
                                        </Link>

                                        {/* Subcategories */}
                                        {category.children && category.children.length > 0 && expandedItems.has(category.id) && (
                                            <div className="bg-gray-50 pl-8 pr-2">
                                                {category.children.map((subcat) => (
                                                    <Link
                                                        key={subcat.id || subcat.slug}
                                                        href={`/category/${subcat.slug}`}
                                                        className="block py-1.5 text-xs text-gray-600 hover:text-gray-900"
                                                    >
                                                        <div className="flex items-center gap-1.5">
                                                            {getCategoryIcon(subcat)}
                                                            <span>{subcat.name}</span>
                                                        </div>
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                </div>

                {/* Footer - Always visible at bottom */}
                <div className="border-t flex bg-white shadow-md mt-auto">
                    <div className="flex-1 flex items-center gap-1.5 px-3 py-2 hover:bg-gray-50 cursor-pointer text-center">
                        <HelpCircle className="w-3.5 h-3.5 text-gray-500" />
                        <span className="text-xs">Help</span>
                    </div>
                    <div className="flex-1 flex items-center gap-1.5 px-3 py-2 hover:bg-gray-50 cursor-pointer text-center">
                        <MessageCircle className="w-3.5 h-3.5 text-gray-500" />
                        <span className="text-xs">Complaint</span>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default SideNavigation;