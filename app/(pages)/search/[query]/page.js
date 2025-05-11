'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronRight, Search } from 'lucide-react';
import ProductCard from '@/app/components/ProductCard/ProductCard';
import { useSidebar } from '@/app/context/SidebarContext';
import axios from 'axios';

// Remove the metadata export from this client component
// The metadata can be defined in a separate layout.js file if needed

export default function SearchResultsPage({ params }) {
  const query = decodeURIComponent(params.query);
  const { isSidebarOpen } = useSidebar();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalResults, setTotalResults] = useState(0);

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`/api/search?q=${encodeURIComponent(query)}`);
        setProducts(response.data.products || []);
        setTotalResults(response.data.total || response.data.products?.length || 0);
      } catch (err) {
        console.error('Search error:', err);
        setError('Failed to load search results. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query]);

  return (
    <div className={`transition-all duration-300 ${isSidebarOpen ? 'ml-0 sm:ml-60' : 'ml-0'} pt-16`}>
      <div className="container mx-auto px-4 py-6">
        {/* Simple Breadcrumb */}
        <nav className="flex py-3 text-sm text-gray-500 mb-4">
          <ol className="flex items-center flex-wrap">
            <li className="flex items-center">
              <Link href="/" className="hover:text-yellow-600 hover:underline transition-colors">
                Home
              </Link>
              <ChevronRight className="h-4 w-4 mx-2 text-gray-400" />
            </li>
            <li>
              <span className="font-medium text-gray-900">Search: {query}</span>
            </li>
          </ol>
        </nav>

        <h1 className="text-2xl font-bold mb-6">Search Results for "{query}"</h1>

        {/* Search stats & loading indicator */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <p className="text-red-700">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-red-600 underline mt-2"
            >
              Try again
            </button>
          </div>
        ) : (
          <>
            <p className="text-gray-600 mb-6">
              {totalResults} {totalResults === 1 ? 'result' : 'results'} found for "{query}"
            </p>

            {products.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {products.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <Search className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h2 className="text-xl font-medium text-gray-700 mb-2">No results found</h2>
                <p className="text-gray-500 mb-6">
                  We couldn't find any products matching "{query}"
                </p>
                <Link
                  href="/"
                  className="inline-block px-6 py-3 bg-yellow-500 text-white font-medium rounded-md hover:bg-yellow-600 transition-colors"
                >
                  Continue Shopping
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
