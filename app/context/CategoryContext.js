'use client';

import { createContext, useContext, useState } from 'react';

const CategoryContext = createContext();

export function CategoryProvider({ children }) {
    const [categories, setCategories] = useState([]);
    const [flashSalesProducts, setFlashSalesProducts] = useState([]);
    const [popularProducts, setPopularProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    // Method for other components to update the flash sales products
    const updateFlashSalesProducts = (products) => {
        setFlashSalesProducts(products);
        setLoading(false);
    };

    // Method for other components to update popular products
    const updatePopularProducts = (products) => {
        setPopularProducts(products);
        setLoading(false);
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
