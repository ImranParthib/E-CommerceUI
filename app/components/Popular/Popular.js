'use client';

import { Star } from 'lucide-react';
import ProductCard from '../ProductCard/ProductCard';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useCategories } from '../../context/CategoryContext';

const PopularItem = () => {
    const [currentPoster, setCurrentPoster] = useState(0);
    const [posters, setPosters] = useState([]);
    const [popularItems, setPopularItems] = useState([]);
    const { updatePopularProducts } = useCategories();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('/api/popular');
                const data = await response.json();
                setPosters(data.posters);

                // Add category marker to each product
                const productsWithCategory = data.products.map(product => ({
                    ...product,
                    category: 'popular' // Add a category marker
                }));

                setPopularItems(productsWithCategory);

                // Share data with CategoryContext
                updatePopularProducts(productsWithCategory);
            } catch (error) {
                console.error('Error fetching popular items:', error);
            }
        };

        fetchData();
    }, [updatePopularProducts]);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentPoster((prev) => (prev + 1) % posters.length);
        }, 5000);

        return () => clearInterval(interval);
    }, [posters.length]);

    return (
        <section className="py-4 sm:py-8 px-2 sm:px-4 md:px-8">
            <div className="container mx-auto">
                {/* Posters */}
                <div className="flex gap-2 sm:gap-4 mb-6">
                    <div className="relative w-1/2 h-28 sm:h-64">
                        {posters.length > 0 && (
                            <Image
                                src={posters[currentPoster]}
                                alt="Popular Items Poster"
                                layout="fill"
                                className="rounded-lg shadow-md object-cover"
                            />
                        )}
                    </div>
                    <div className="relative w-1/2 h-28 sm:h-64">
                        <Image
                            src="/popular/posters/poster3.png"
                            alt="Fixed Poster"
                            layout="fill"
                            className="rounded-lg shadow-md object-cover"
                        />
                    </div>
                </div>

                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                        <h2 className="text-2xl font-bold text-gray-800">Popular Items</h2>
                    </div>
                    <button className="text-[#ff6f71] hover:text-red-600 font-medium">
                        View All →
                    </button>
                </div>

                {/* Products Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {popularItems.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default PopularItem;