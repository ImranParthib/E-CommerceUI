'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, ShoppingCart } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/app/context/CartContext';

const SearchBar = ({ products = [] }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const router = useRouter();
    const searchRef = useRef(null);
    const inputRef = useRef(null);
    const { recentItems, addToCart, isInCart } = useCart();

    // Filter products when query changes
    useEffect(() => {
        if (query.trim() === '') {
            setResults([]);
            return;
        }

        const filteredResults = products.filter(product =>
            product.name.toLowerCase().includes(query.toLowerCase()) ||
            (product.category && product.category.toLowerCase().includes(query.toLowerCase()))
        );

        setResults(filteredResults.slice(0, 8)); // Limit to 8 results
    }, [query, products]);

    // Handle clicks outside of search component
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setIsFocused(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Handle search submission
    const handleSubmit = (e) => {
        e.preventDefault();
        if (query.trim()) {
            router.push(`/search?q=${encodeURIComponent(query)}`);
            setIsFocused(false);
        }
    };

    // Clear search input
    const clearSearch = () => {
        setQuery('');
        setResults([]);
        inputRef.current?.focus();
    };

    // Toggle mobile search
    const toggleSearch = () => {
        setIsSearchOpen(!isSearchOpen);
        if (!isSearchOpen) {
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
        }
    };

    const handleAddToCart = (e, product) => {
        e.preventDefault();
        e.stopPropagation();
        addToCart(product);
    };

    return (
        <>
            {/* Mobile search button */}
            <button
                onClick={toggleSearch}
                className="md:hidden flex items-center justify-center w-10 h-10 text-gray-600"
                aria-label="Open search"
            >
                <Search className="h-5 w-5" />
            </button>

            {/* Search container */}
            <div
                ref={searchRef}
                className={`
                    relative z-50
                    ${isSearchOpen ? 'absolute top-0 left-0 right-0 p-2 bg-white shadow-lg' : 'hidden md:block'}
                `}
            >
                <form onSubmit={handleSubmit} className="relative">
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onFocus={() => setIsFocused(true)}
                        placeholder="Search for products..."
                        className="w-full pl-10 pr-10 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        aria-label="Search"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    {query && (
                        <button
                            type="button"
                            onClick={clearSearch}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            aria-label="Clear search"
                        >
                            <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                        </button>
                    )}
                    {isSearchOpen && (
                        <button
                            type="button"
                            onClick={toggleSearch}
                            className="absolute right-0 top-0 -mr-1 -mt-1 bg-gray-200 rounded-full p-1"
                            aria-label="Close search"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    )}
                </form>

                {/* Search results */}
                {isFocused && (
                    <div className="absolute mt-1 w-full bg-white shadow-lg rounded-md border overflow-hidden z-50">
                        {query.trim() === '' ? (
                            <div className="p-4">
                                {recentItems.length > 0 ? (
                                    <>
                                        <h3 className="text-sm font-medium text-gray-900 mb-2">Recently viewed</h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {recentItems.slice(0, 4).map(item => (
                                                <Link
                                                    key={item.id}
                                                    href={`/product/${item.id}`}
                                                    className="flex items-center p-2 hover:bg-gray-50 rounded-md"
                                                    onClick={() => setIsFocused(false)}
                                                >
                                                    <div className="relative h-10 w-10 flex-shrink-0">
                                                        <Image
                                                            src={item.image}
                                                            alt={item.name}
                                                            fill
                                                            className="object-contain"
                                                        />
                                                    </div>
                                                    <span className="ml-3 text-sm text-gray-700 line-clamp-1">{item.name}</span>
                                                </Link>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-sm text-gray-500">Start typing to search products...</p>
                                )}
                            </div>
                        ) : results.length > 0 ? (
                            <ul>
                                {results.map(product => (
                                    <li key={product.id} className="border-b last:border-b-0">
                                        <Link
                                            href={`/product/${product.id}`}
                                            className="flex justify-between items-center p-3 hover:bg-gray-50"
                                            onClick={() => setIsFocused(false)}
                                        >
                                            <div className="flex items-center">
                                                <div className="relative h-12 w-12 flex-shrink-0">
                                                    <Image
                                                        src={product.image}
                                                        alt={product.name}
                                                        fill
                                                        className="object-contain"
                                                    />
                                                </div>
                                                <div className="ml-3">
                                                    <p className="text-sm font-medium text-gray-900 line-clamp-1">{product.name}</p>
                                                    <p className="text-sm text-gray-500">৳{product.price}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={(e) => handleAddToCart(e, product)}
                                                className={`p-2 rounded-full ${isInCart(product.id)
                                                        ? 'bg-yellow-100 text-yellow-500'
                                                        : 'bg-gray-100 hover:bg-yellow-50 text-gray-500 hover:text-yellow-500'
                                                    }`}
                                            >
                                                <ShoppingCart className="h-4 w-4" />
                                            </button>
                                        </Link>
                                    </li>
                                ))}
                                <li className="p-2">
                                    <button
                                        onClick={handleSubmit}
                                        className="w-full py-2 bg-yellow-400 hover:bg-yellow-500 text-sm font-medium text-gray-900 rounded-md"
                                    >
                                        See all results for "{query}"
                                    </button>
                                </li>
                            </ul>
                        ) : (
                            <div className="p-4 text-center">
                                <p className="text-gray-500">No products found for "{query}"</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </>
    );
};

export default SearchBar;