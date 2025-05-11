'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCategories } from '@/app/context/CategoryContext';
import {
    ShoppingBag, Heart, User, Apple, Sparkles,
    Egg, Fish, UtensilsCrossed, Shirt, Star, Zap
} from 'lucide-react';

// Map of category keywords to icons - moved outside component for better memory usage
const CATEGORY_ICON_MAP = {
    flash: <Zap className="w-5 h-5 text-yellow-500" />,
    popular: <Star className="w-5 h-5 text-orange-500" />,
    food: <Apple className="w-5 h-5 text-green-500" />,
    clean: <Sparkles className="w-5 h-5 text-blue-500" />,
    personal: <User className="w-5 h-5 text-purple-500" />,
    dairy: <Egg className="w-5 h-5 text-yellow-400" />,
    meat: <Fish className="w-5 h-5 text-red-600" />,
    fish: <Fish className="w-5 h-5 text-red-600" />,
    cook: <UtensilsCrossed className="w-5 h-5 text-orange-400" />,
    fashion: <Shirt className="w-5 h-5 text-purple-500" />,
    love: <Heart className="w-5 h-5 text-red-500" />,
    favorite: <Heart className="w-5 h-5 text-red-500" />,
    favourite: <Heart className="w-5 h-5 text-red-500" />,
    default: <ShoppingBag className="w-5 h-5 text-gray-600" />
};

// Helper function to get appropriate icon - pure function moved outside component
const getCategoryIcon = (category) => {
    if (!category) return CATEGORY_ICON_MAP.default;

    const name = category.name?.toLowerCase() || '';
    const slug = category.slug?.toLowerCase() || '';

    for (const [keyword, icon] of Object.entries(CATEGORY_ICON_MAP)) {
        if (name.includes(keyword) || slug.includes(keyword)) {
            return icon;
        }
    }

    return CATEGORY_ICON_MAP.default;
};

// Optimized Category Card - pure functional component
function CategoryCard({ category, index }) {
    // Determine if this is a high priority image (first visible items)
    const priority = index < 4;

    return (
        <Link
            href={`/category/${category.slug}`}
            className="flex-shrink-0 mx-3 group"
            style={{ width: "12rem" }}
            aria-label={`Browse ${category.name} category`}
            prefetch={false}
        >
            <div className="w-40 h-40 sm:w-44 sm:h-44 md:w-48 md:h-48 bg-white rounded-lg shadow-md overflow-hidden transform transition-transform group-hover:scale-105 relative">
                {category.image?.src ? (
                    <Image
                        src={category.image.src}
                        alt={category.name}
                        fill
                        className="object-cover p-1"
                        sizes="(max-width: 640px) 10rem, 12rem"
                        priority={priority}
                        loading={priority ? "eager" : "lazy"}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                        {getCategoryIcon(category)}
                    </div>
                )}
                <div className="absolute inset-0 bg-black bg-opacity-30 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity p-2">
                    <div className="bg-white p-2 rounded-full mb-2">
                        {getCategoryIcon(category)}
                    </div>
                    <span className="text-white font-medium text-center text-base line-clamp-2">{category.name}</span>
                </div>
                <h3 className="absolute bottom-0 w-full bg-white bg-opacity-80 py-2 text-center text-sm font-medium text-gray-800 truncate px-2">
                    {category.name}
                </h3>
            </div>
        </Link>
    );
}

// Improved deterministic shuffle algorithm with better performance
function deterministicShuffle(array, seed) {
    if (!Array.isArray(array) || array.length === 0) return [];

    // Work with a copy to avoid mutation
    const result = [...array];

    // Fisher-Yates shuffle with deterministic seed
    let i = result.length;
    while (i > 0) {
        // Use a more performant deterministic approach
        const hash = (seed * i) % 2147483647;
        const j = hash % i;
        i--;
        [result[i], result[j]] = [result[j], result[i]];
    }

    return result;
}

// Main carousel component
export default function CategoryCarousel() {
    const { categories = [] } = useCategories();

    // Process categories once with useMemo
    const { parentCategories, childCategories } = useMemo(() => {
        // Generate a stable seed for shuffling
        const shuffleSeed = typeof window !== 'undefined' ?
            window.location.pathname.length * 31 : 123;

        // Early return if no categories
        if (!Array.isArray(categories) || categories.length === 0) {
            return { parentCategories: [], childCategories: [] };
        }

        // Filter and validate categories
        const validCategories = categories.filter(cat =>
            cat && typeof cat === 'object' && cat.id && cat.name &&
            typeof cat.name === 'string'
        );

        // Filter parents & children with images
        const parents = validCategories.filter(cat =>
            cat.parent === 0 && cat.image?.src
        );

        const children = validCategories.filter(cat =>
            cat.parent !== 0 && cat.image?.src
        );

        // Use deterministic shuffle for stable ordering
        return {
            parentCategories: deterministicShuffle(parents, shuffleSeed).slice(0, 12),
            childCategories: deterministicShuffle(children, shuffleSeed + 1).slice(0, 12)
        };
    }, [categories]);

    // Render minimal UI if no categories are available
    if (parentCategories.length === 0 && childCategories.length === 0) {
        return (
            <div className="bg-gradient-to-r from-yellow-100 to-yellow-300 py-8">
                <div className="px-4 text-center">Loading categories...</div>
            </div>
        );
    }

    // Calculate how many items to duplicate for smooth infinite scrolling
    // This approach creates just enough duplicates for seamless scrolling
    const duplicateCount = Math.min(6, Math.ceil(12 / Math.max(1, parentCategories.length)));

    return (
        <section
            className="overflow-hidden bg-gradient-to-r from-yellow-100 to-yellow-300 py-8"
            aria-label="Category Carousel"
        >
            {/* Top row - parent categories */}
            <div className="relative overflow-hidden mb-8">
                <h2 className="sr-only">Featured Categories</h2>
                <div className="carousel-container">
                    <div className="carousel-track flex animate-carousel-right hover:pause-animation focus-within:pause-animation">
                        {/* Original categories */}
                        {parentCategories.map((category, index) => (
                            <CategoryCard
                                key={`parent-${category.id}`}
                                category={category}
                                index={index}
                            />
                        ))}

                        {/* Only duplicate what's needed for infinite scrolling */}
                        {Array.from({ length: duplicateCount }).flatMap((_, dupIndex) =>
                            parentCategories.map((category, index) => (
                                <CategoryCard
                                    key={`parent-dup-${dupIndex}-${category.id}`}
                                    category={category}
                                    index={parentCategories.length + index}
                                />
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom row - child categories */}
            <div className="relative overflow-hidden">
                <h2 className="sr-only">Subcategories</h2>
                <div className="carousel-container">
                    <div className="carousel-track flex animate-carousel-left hover:pause-animation focus-within:pause-animation">
                        {/* Original categories */}
                        {childCategories.map((category, index) => (
                            <CategoryCard
                                key={`child-${category.id}`}
                                category={category}
                                index={index}
                            />
                        ))}

                        {/* Only duplicate what's needed for infinite scrolling */}
                        {Array.from({ length: duplicateCount }).flatMap((_, dupIndex) =>
                            childCategories.map((category, index) => (
                                <CategoryCard
                                    key={`child-dup-${dupIndex}-${category.id}`}
                                    category={category}
                                    index={childCategories.length + index}
                                />
                            ))
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}