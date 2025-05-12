'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const FavoritesContext = createContext();

const FAVORITES_STORAGE_KEY = 'chaldal_favorite_items';

export function FavoritesProvider({ children }) {
    const [favorites, setFavorites] = useState([]);
    const [isInitialized, setIsInitialized] = useState(false);
    const [isBrowser, setIsBrowser] = useState(false);

    // Check if we're in the browser
    useEffect(() => {
        setIsBrowser(true);
    }, []);

    // Load favorites from localStorage on initial mount - only in browser
    useEffect(() => {
        if (isBrowser) {
            try {
                const savedFavorites = localStorage.getItem(FAVORITES_STORAGE_KEY);
                if (savedFavorites) {
                    setFavorites(JSON.parse(savedFavorites));
                }
            } catch (error) {
                console.error('Error loading favorites from localStorage:', error);
            } finally {
                setIsInitialized(true);
            }
        }
    }, [isBrowser]);

    // Save favorites to localStorage whenever they change
    useEffect(() => {
        if (isInitialized && isBrowser) {
            try {
                localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
            } catch (error) {
                console.error('Error saving favorites to localStorage:', error);
            }
        }
    }, [favorites, isInitialized, isBrowser]);

    const addToFavorites = (product) => {
        setFavorites(prevFavorites => {
            // Check if product is already in favorites
            if (prevFavorites.some(item => item.id === product.id)) {
                return prevFavorites;
            }
            return [...prevFavorites, product];
        });
    };

    const removeFromFavorites = (productId) => {
        setFavorites(prevFavorites => {
            return prevFavorites.filter(item => item.id !== productId);
        });
    };

    const toggleFavorite = (product) => {
        const isAlreadyFavorite = favorites.some(item => item.id === product.id);

        if (isAlreadyFavorite) {
            removeFromFavorites(product.id);
            if (isBrowser) toast.info(`${product.name} removed from favorites`);
        } else {
            addToFavorites(product);
            if (isBrowser) toast.success(`${product.name} added to favorites`);
        }
    };

    const isFavorite = (productId) => {
        return favorites.some(product => product.id === productId);
    };

    const clearFavorites = () => {
        setFavorites([]);
        if (isBrowser) {
            localStorage.removeItem(FAVORITES_STORAGE_KEY);
            toast.success('All favorites cleared');
        }
    };

    return (
        <FavoritesContext.Provider value={{
            favorites,
            addToFavorites,
            removeFromFavorites,
            toggleFavorite,
            isFavorite,
            clearFavorites
        }}>
            {children}
        </FavoritesContext.Provider>
    );
}

// Modify the useFavorites function to ensure we always return a unique array
export function useFavorites() {
    const context = useContext(FavoritesContext);
    if (!context) {
        // Return a default value instead of throwing during SSR
        return {
            favorites: [],
            addToFavorites: () => { },
            removeFromFavorites: () => { },
            toggleFavorite: () => { },
            isFavorite: () => false,
            clearFavorites: () => { }
        };
    }

    // Ensure favorites has unique items by ID
    if (context.favorites) {
        const uniqueFavorites = [];
        const seen = new Set();

        context.favorites.forEach(item => {
            if (!seen.has(item.id)) {
                seen.add(item.id);
                uniqueFavorites.push(item);
            }
        });

        context.favorites = uniqueFavorites;
    }

    return context;
}
