'use client';

import { useState } from 'react';
import ProductCard from '../ProductCard/ProductCard';

const CategoryPage = ({ title, description, icon: Icon, products }) => {
    const [sortBy, setSortBy] = useState('popularity');

    return (
        <section className="py-8 px-4 md:px-8">
            <div className="container mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        {Icon && <Icon className="w-6 h-6" />}
                        <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
                    </div>
                    {description && (
                        <p className="text-gray-600">{description}</p>
                    )}
                </div>

                {/* Filters and Sorting */}
                <div className="flex justify-between items-center mb-6">
                    <div className="flex gap-4">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="border rounded-lg px-3 py-2"
                        >
                            <option value="popularity">Sort by Popularity</option>
                            <option value="price-low">Price: Low to High</option>
                            <option value="price-high">Price: High to Low</option>
                            <option value="newest">Newest First</option>
                        </select>
                    </div>
                    <div className="text-gray-600">
                        {products.length} Products
                    </div>
                </div>

                {/* Products Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {products.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default CategoryPage;
