'use client';

import React, { useState, useEffect } from 'react';
import Image from "next/image";
import { useScrollPosition } from "@/app/hooks/useScrollPosition";
import { ArrowRight, Truck, Clock, Shield } from "lucide-react";
import Link from 'next/link';
import { auth } from '@/lib/firebase';
import CategoryCarousel from '../CategoryCarousel/CategoryCarousel';

const Banner = () => {
    const scrollPosition = useScrollPosition();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Check if user is authenticated
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((authUser) => {
            setUser(authUser);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Parallax effect calculation
    const imageOffset = Math.min(scrollPosition * 0.3, 100);

    // Features data
    const features = [
        { icon: <Truck className="w-6 h-6" />, text: "Free Delivery" },
        { icon: <Clock className="w-6 h-6" />, text: "24/7 Service" },
        { icon: <Shield className="w-6 h-6" />, text: "Secure Payment" }
    ];

    // Show loading state while checking authentication
    if (loading) {
        return (
            <div className="flex justify-center items-center h-64 bg-gradient-to-r from-yellow-100 to-yellow-300">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-600"></div>
            </div>
        );
    }

    // If user is logged in, show the category carousel
    if (user) {
        return <CategoryCarousel />;
    }

    // If user is not logged in, show the banner
    return (
        <div id="banner" className="relative overflow-hidden bg-gradient-to-r from-yellow-100 to-yellow-300">
            {/* Main Content Container */}
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row min-h-[500px] relative">
                    {/* Left Section */}
                    <div className="flex-1 flex flex-col justify-center px-6 lg:px-16 py-12 space-y-6 md:space-y-8  ">
                        {/* Main Heading with Animation */}
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-800 max-w-xl leading-tight animate-fade-in sm:pt-24 pt-16">
                            Fresh Groceries
                            <span className="block text-yellow-600">Delivered Daily</span>
                        </h1>

                        {/* Subheading */}
                        <p className="text-lg text-gray-600 max-w-lg">
                            Get your daily essentials delivered right to your doorstep with our premium delivery service.
                        </p>

                        {/* CTA Button */}
                        <Link href="/category/flash-sales" className="bg-gray-800 text-white px-8 py-4 rounded-full rounded-br-sm inline-flex items-center space-x-2 hover:bg-gray-700 transition-colors w-fit group">
                            <span>Shop Now</span>
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Link>

                        {/* Features Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-8">
                            {features.map((feature, index) => (
                                <div
                                    key={index}
                                    className="flex items-center space-x-2 text-gray-700"
                                >
                                    {feature.icon}
                                    <span className="text-sm font-medium">{feature.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Section - Image with Parallax */}
                    <div className="flex-1 relative min-h-[200px] md:min-h-0 ">
                        <div
                            className="absolute inset-0"
                            style={{
                                transform: `translateY(${imageOffset}px)`,
                            }}
                        >
                            <Image
                                src="/Banner/banner.png"
                                alt="Fresh Groceries Delivery"
                                fill
                                priority
                                className="object-contain object-center sm:pt-24"
                                sizes="(max-width: 768px) 100vw, 50vw"
                            />
                        </div>

                        {/* Decorative Elements */}
                        <div className="absolute -bottom-4 left-0 right-0 h-16 bg-gradient-to-t from-yellow-600 to-transparent" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Banner;