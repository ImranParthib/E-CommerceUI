import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import productsData from '@/app/data/products.json';
import ProductCard from '@/app/components/ProductCard/ProductCard';

export async function generateMetadata({ params }) {
  const query = params.query;
  return {
    title: `Search results for "${query}" | Your Store Name`,
    description: `Browse products matching "${query}"`,
  };
}

export default function SearchResultsPage({ params }) {
  const query = decodeURIComponent(params.query);
  
  // Filter products based on the search query
  const filteredProducts = productsData.products.filter(product =>
    product.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
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
      
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="py-10 text-center">
          <h2 className="text-xl font-medium mb-2">No products found</h2>
          <p className="text-gray-500 mb-6">Try searching with different keywords</p>
          <Link 
            href="/"
            className="inline-block bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded-md transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      )}
    </div>
  );
}
