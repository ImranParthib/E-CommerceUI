import React from 'react';
import {
    ShoppingCart,
    Clock,
    Truck,
    BadgePercent,
    ShieldCheck,
    Leaf,
    CreditCard,
    HeartHandshake
} from 'lucide-react';

const FeatureCard = ({ icon, title, description, index }) => {
    return (
        <div
            className="group relative flex flex-col items-center p-8 bg-white rounded-2xl 
                       border border-gray-200 hover:border-yellow-200
                       transition-all duration-500 hover:shadow-xl
                       hover:-translate-y-1"
        >
            {/* Decorative Background Element */}
            <div className="absolute inset-0 bg-gradient-to-b from-yellow-50 to-transparent 
                          opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity duration-500"
            />

            {/* Icon Container with Animation */}
            <div className="relative flex-shrink-0 w-16 h-16 flex items-center justify-center
                          rounded-xl bg-yellow-50 text-yellow-600 mb-6
                          group-hover:bg-yellow-500 group-hover:text-white
                          transition-all duration-500 transform group-hover:rotate-6"
            >
                {icon}
            </div>

            {/* Content Container */}
            <div className="relative flex flex-col items-center text-center space-y-2 max-w-xs">
                <h3 className="text-xl font-bold text-gray-900 group-hover:text-yellow-600 
                             transition-colors duration-300">
                    {title}
                </h3>
                <p className="text-gray-600 group-hover:text-gray-700 transition-colors duration-300">
                    {description}
                </p>
            </div>

            {/* Hover Line Effect */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-1 
                          bg-yellow-400 group-hover:w-2/3 transition-all duration-500"
            />
        </div>
    );
};

const Features = () => {
    const features = [
        {
            icon: <ShoppingCart className="w-8 h-8" />,
            title: "Vast Selection",
            description: "Over 15,000 carefully curated products from premium brands and local favorites",
        },
        {
            icon: <Clock className="w-8 h-8" />,
            title: "Express Delivery",
            description: "Lightning-fast 1-hour delivery to your doorstep, 7 days a week",
        },
        {
            icon: <ShieldCheck className="w-8 h-8" />,
            title: "Quality Assured",
            description: "100% quality guarantee with our strict product verification process",
        },
        {
            icon: <BadgePercent className="w-8 h-8" />,
            title: "Smart Savings",
            description: "Regular deals, loyalty rewards, and personalized offers just for you",
        },
        {
            icon: <Leaf className="w-8 h-8" />,
            title: "Fresh Produce",
            description: "Farm-fresh vegetables and fruits delivered directly to your kitchen",
        },
        {
            icon: <CreditCard className="w-8 h-8" />,
            title: "Secure Payments",
            description: "Multiple payment options with bank-grade security protocols",
        },
        {
            icon: <Truck className="w-8 h-8" />,
            title: "Free Shipping",
            description: "Complimentary delivery on orders above the minimum purchase",
        },
        {
            icon: <HeartHandshake className="w-8 h-8" />,
            title: "24/7 Support",
            description: "Round-the-clock customer service to assist you anytime",
        }
    ];

    return (
        <section className="w-full py-16 lg:py-24 bg-gradient-to-b from-white to-gray-50">
            <div className="container mx-auto px-4 max-w-7xl">
                {/* Section Header */}
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                        Why Choose Us
                    </h2>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                        Experience the perfect blend of convenience, quality, and reliability
                    </p>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
                    {features.map((feature, index) => (
                        <FeatureCard key={index} {...feature} index={index} />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Features;