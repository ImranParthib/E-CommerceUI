'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
    ChevronRight
} from 'lucide-react';
import { useSidebar } from '../../context/SidebarContext';
import { useCategories } from '../../context/CategoryContext';

const SideNavigation = () => {
    const { isSidebarOpen, toggleSidebar } = useSidebar();
    const [expandedItems, setExpandedItems] = useState(new Set());
    const { setCategories } = useCategories();

    const toggleItem = (categoryName) => {
        setExpandedItems(prev => {
            const newSet = new Set(prev);
            if (newSet.has(categoryName)) {
                newSet.delete(categoryName);
            } else {
                newSet.add(categoryName);
            }
            return newSet;
        });
    };

    const topCategories = [
        { name: 'Grocery', icon: <ShoppingBag className="w-3.5 h-3.5" />, color: 'bg-red-400' },
        { name: 'Pharmacy', icon: <ShoppingBag className="w-3.5 h-3.5" />, color: 'bg-blue-400' },
        { name: 'Cookups', icon: <ShoppingBag className="w-3.5 h-3.5" />, color: 'bg-green-400' }
    ];

    const mainCategories = [
        { name: 'Favourites', icon: <Heart className="w-3.5 h-3.5 text-red-500" />, path: '/favourites' },
        {
            name: 'Flash Sales',
            icon: <Zap className="w-3.5 h-3.5 text-yellow-500" />,
            path: '/flash-sales',
            hasProducts: true  // Mark that this category has products
        },
        {
            name: 'Popular',
            icon: <Star className="w-3.5 h-3.5 text-orange-500" />,
            path: '/popular',
            hasProducts: true  // Mark that this category has products
        },
        {
            name: 'Food',
            icon: <Apple className="w-3.5 h-3.5 text-green-500" />,
            hasSubmenu: true,
            subitems: [
                'Fresh Produce',
                'meat-and-fish',
                'Dairy',
                'Beverages',
                'Snacks'
            ]
        },
        {
            name: 'Cleaning',
            icon: <Sparkles className="w-3.5 h-3.5 text-blue-500" />,
            hasSubmenu: true,
            subitems: [
                'Laundry',
                'Household Cleaners',
                'Dishwashing',
                'Cleaning Tools'
            ]
        },
        { name: 'Personal Care', icon: <ShoppingBag className="w-3.5 h-3.5 text-purple-500" />, hasSubmenu: true },
        { name: 'Health', icon: <ShoppingBag className="w-3.5 h-3.5 text-green-500" />, hasSubmenu: true },
        { name: 'Baby Care', icon: <Baby className="w-3.5 h-3.5 text-pink-500" />, hasSubmenu: true },
        { name: 'Home & Kitchen', icon: <ChefHat className="w-3.5 h-3.5 text-orange-500" />, hasSubmenu: true },
        { name: 'Office', icon: <Pencil className="w-3.5 h-3.5 text-blue-500" />, hasSubmenu: true },
        { name: 'Pet Care', icon: <Dog className="w-3.5 h-3.5 text-yellow-500" />, hasSubmenu: true },
        { name: 'Toys & Sports', icon: <Dumbbell className="w-3.5 h-3.5 text-green-500" />, hasSubmenu: true },
        { name: 'Beauty', icon: <Palette className="w-3.5 h-3.5 text-pink-500" /> },
        { name: 'Fashion', icon: <Shirt className="w-3.5 h-3.5 text-purple-500" /> },
        { name: 'Vehicle', icon: <Car className="w-3.5 h-3.5 text-gray-500" /> },
        { name: 'Safety', icon: <Shield className="w-3.5 h-3.5 text-indigo-500" /> },
        { name: 'Premium', icon: <Crown className="w-3.5 h-3.5 text-yellow-500" /> },
        { name: 'Recipes', icon: <ChefHat className="w-3.5 h-3.5 text-green-500" /> }
    ];

    // Share categories with the context
    useEffect(() => {
        // Only share categories that have products
        const categoriesWithProducts = mainCategories.filter(cat => cat.hasProducts);
        setCategories(categoriesWithProducts);
    }, [setCategories]);

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
                        <div className="flex justify-between items-center">
                            <span className="font-medium text-sm">Offers</span>
                            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">44</span>
                        </div>
                        <div className="mt-1.5">
                            <span className="text-xs">Egg Club</span>
                        </div>
                    </div>

                    {/* Main Categories */}
                    <div className="py-1">
                        {mainCategories.map((category) => (
                            <div key={category.name}>
                                <Link
                                    href={category.path || `#`}
                                    className="flex items-center justify-between px-3 py-1.5 hover:bg-gray-50 cursor-pointer"
                                    onClick={(e) => {
                                        if (category.hasSubmenu) {
                                            e.preventDefault();
                                            toggleItem(category.name);
                                        }
                                    }}
                                >
                                    <div className="flex items-center gap-2">
                                        {category.icon}
                                        <span className="text-xs">{category.name}</span>
                                    </div>
                                    {category.hasSubmenu && (
                                        <ChevronRight className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${expandedItems.has(category.name) ? 'rotate-90' : ''
                                            }`} />
                                    )}
                                </Link>
                                {/* Subitems */}
                                {category.hasSubmenu && expandedItems.has(category.name) && (
                                    <div className="bg-gray-50 pl-8 pr-2">
                                        {category.subitems?.map((subitem) => (
                                            <Link
                                                key={subitem}
                                                href={`/food/${subitem.toLowerCase().replace(/\s+/g, '-')}`}
                                                className="block py-1.5 text-xs text-gray-600 hover:text-gray-900"
                                            >
                                                {subitem}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
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