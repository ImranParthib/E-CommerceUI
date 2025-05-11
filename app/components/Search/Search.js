'use client';

import { useState, useRef, useEffect } from 'react';
import { Search as SearchIcon, ShoppingBag, X } from "lucide-react";
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const Search = ({ className = '' }) => {
    const router = useRouter();
    const [query, setQuery] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const searchRef = useRef(null);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (query) {
                handleSearch();
            } else {
                setSearchResults([]);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleSearch = async () => {
        if (!query) return;

        setIsLoading(true);
        try {
            const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
            const data = await response.json();
            setSearchResults(data.products);
            setShowSuggestions(true);
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const clearSearch = () => {
        setQuery('');
        setSearchResults([]);
        setShowSuggestions(false);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (query.trim()) {
            router.push(`/search/${encodeURIComponent(query.trim())}`);
            setShowSuggestions(false);
        }
    };

    const handleProductClick = (productName) => {
        setShowSuggestions(false);
        router.push(`/search/${encodeURIComponent(productName)}`);
    };

    // Helper function to get the correct product image URL
    const getProductImage = (product) => {
        if (product.images && product.images[0] && product.images[0].src) {
            return product.images[0].src;
        } else if (product.image) {
            return product.image;
        }
        return '/placeholder-image.jpg'; // Fallback image
    };

    return (
        <div className={`relative ${className}`} ref={searchRef}>
            <form onSubmit={handleSubmit} className="relative">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setShowSuggestions(true)}
                    placeholder="Search for products (e.g. eggs, milk, potato)"
                    className="w-full text-gray-900 px-4 py-4 pl-4 pr-10 rounded-lg
                        border-2 border-gray-200 focus:border-yellow-400
                        focus:outline-none focus:ring-1 focus:ring-yellow-400
                        transition-all bg-white h-9"
                />
                {query && (
                    <button
                        type="button"
                        onClick={clearSearch}
                        className="absolute right-12 top-1/2 -translate-y-1/2"
                    >
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                )}
                <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2">
                    <SearchIcon className="w-5 h-5 text-gray-400" />
                </button>
            </form>

            {/* Search Results */}
            {showSuggestions && (query || searchResults.length > 0) && (
                <div className="absolute w-full bg-white mt-2 rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto z-50">
                    {isLoading ? (
                        <div className="p-4 text-center text-gray-500">Loading...</div>
                    ) : searchResults.length > 0 ? (
                        <div className="py-2">
                            {searchResults.map((product) => (
                                <div
                                    key={product.id}
                                    className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 cursor-pointer"
                                    onClick={() => handleProductClick(product.name)}
                                >
                                    <div className="relative w-10 h-10 bg-gray-50 rounded">
                                        <div className="absolute inset-0 bg-gray-50 rounded">
                                            <img
                                                src={getProductImage(product)}
                                                alt={product.name}
                                                className="w-full h-full object-contain p-1"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-900">{product.name}</p>
                                        <p className="text-sm text-gray-500">{product.quantity}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-gray-900">৳{product.price}</p>
                                        {product.originalPrice > product.price && (
                                            <p className="text-xs text-gray-500 line-through">৳{product.originalPrice}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-4 text-center text-gray-500">
                            No products found
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Search;