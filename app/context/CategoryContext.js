'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const CategoryContext = createContext();

// Cache key for local storage
const CATEGORIES_CACHE_KEY = 'kenakata_categories_cache';
const CACHE_EXPIRY_TIME = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export function CategoryProvider({ children }) {
    const [categories, setCategories] = useState([]);
    const [flashSalesProducts, setFlashSalesProducts] = useState([]);
    const [popularProducts, setPopularProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [categoriesLoaded, setCategoriesLoaded] = useState(false);

    // Initialize with cached categories and fetch fresh data
    useEffect(() => {
        // Try to load from cache first for immediate display
        const loadCachedCategories = () => {
            try {
                const cachedData = localStorage.getItem(CATEGORIES_CACHE_KEY);
                if (cachedData) {
                    const { data, timestamp } = JSON.parse(cachedData);
                    const isExpired = Date.now() - timestamp > CACHE_EXPIRY_TIME;

                    if (!isExpired && Array.isArray(data) && data.length > 0) {
                        setCategories(data);
                        setCategoriesLoaded(true);
                        setLoading(false);
                        return true;
                    }
                }
                return false;
            } catch (error) {
                console.error('Error loading categories from cache:', error);
                return false;
            }
        };

        // If we didn't get valid cached data, fetch from API
        const fetchCategories = async () => {
            try {
                const response = await fetch('/api/categories');
                if (!response.ok) throw new Error('Failed to fetch categories');
                const data = await response.json();

                if (Array.isArray(data) && data.length > 0) {
                    setCategories(data);

                    // Update cache with fresh data
                    try {
                        localStorage.setItem(
                            CATEGORIES_CACHE_KEY,
                            JSON.stringify({
                                data,
                                timestamp: Date.now()
                            })
                        );
                    } catch (error) {
                        console.error('Error caching categories:', error);
                    }
                }

                setCategoriesLoaded(true);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching categories:', error);
                setLoading(false);
                setCategoriesLoaded(true);
            }
        };

        const hasCachedData = loadCachedCategories();
        // Always fetch fresh data, even if we have cached data
        fetchCategories();
    }, []);

    // Method for other components to update the flash sales products
    const updateFlashSalesProducts = (products) => {
        setFlashSalesProducts(products);
    };

    // Method for other components to update popular products
    const updatePopularProducts = (products) => {
        setPopularProducts(products);
    };

    const getProductsByCategory = (categoryName) => {
        // Return appropriate products based on category name
        switch (categoryName) {
            case 'Flash Sales':
                return flashSalesProducts.slice(0, 8); // Show first 8 products
            case 'Popular':
                return popularProducts.slice(0, 8);
            default:
                return [];
        }
    };

    return (
        <CategoryContext.Provider
            value={{
                categories,
                setCategories,
                loading,
                categoriesLoaded,
                flashSalesProducts,
                popularProducts,
                updateFlashSalesProducts,
                updatePopularProducts,
                getProductsByCategory
            }}
        >
            {children}
        </CategoryContext.Provider>
    );
}

export function useCategories() {
    const context = useContext(CategoryContext);
    if (!context) {
        throw new Error('useCategories must be used within a CategoryProvider');
    }
    return context;
}
