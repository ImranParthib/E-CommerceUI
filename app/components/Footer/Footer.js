import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { GlobeAltIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { FaFacebook, FaTwitter, FaInstagram } from 'react-icons/fa';

const FooterSection = ({ title, links }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="w-full border-b border-gray-200 py-3 md:border-0 md:py-0">
            {/* Mobile Accordion Header */}
            <div
                className="flex justify-between items-center cursor-pointer md:cursor-default"
                onClick={() => setIsOpen(!isOpen)}
            >
                <h3 className="text-gray-700 font-semibold mb-1 md:mb-3">{title}</h3>
                <div className="md:hidden">
                    {isOpen ? (
                        <ChevronUpIcon className="h-5 w-5 text-gray-500" />
                    ) : (
                        <ChevronDownIcon className="h-5 w-5 text-gray-500" />
                    )}
                </div>
            </div>

            {/* Links - Always visible on desktop, toggle on mobile */}
            <ul className={`space-y-2 overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-48 py-2' : 'max-h-0 md:max-h-48'}`}>
                {links.map((link, index) => (
                    <li key={index}>
                        <Link
                            href={link.href}
                            className="text-gray-600 hover:text-[#ff6f71] transition-colors"
                        >
                            {link.label}
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
};

const Footer = () => {
    const cities = [
        { href: '/dhaka', label: 'Dhaka' },
        { href: '/chattogram', label: 'Chattogram' },
        { href: '/jashore', label: 'Jashore' }
    ];

    const footerSections = {
        about: [
            { href: '/our-story', label: 'Our Story' },
            { href: '/team', label: 'Team' },
            { href: '/privacy', label: 'Privacy Policy' },
            { href: '/terms', label: 'Terms of Use' }
        ],
        customerService: [
            { href: '/contact', label: 'Contact Us' },
            { href: '/faq', label: 'FAQ' }
        ],
        business: [
            { href: '/corporate', label: 'Corporate' }
        ]
    };

    const paymentMethods = [
        { src: '/paymentMethod/amex.png', alt: 'American Express' },
        { src: '/paymentMethod/mastercard.png', alt: 'Mastercard' },
        { src: '/paymentMethod/visa.png', alt: 'Visa' },
        { src: '/paymentMethod/bkash.png', alt: 'bKash' }
    ];

    return (
        <>
            {/* Cities Navigation */}
            <div className="bg-gray-100 border-b border-gray-200">
                <div className="container mx-auto px-4 lg:px-8">
                    <div className="py-3 text-sm">
                        <div className="flex flex-wrap items-center">
                            <span className="text-gray-600 font-bold mr-2 mb-1">Cities:</span>
                            <nav className="flex flex-wrap">
                                <ul className="flex flex-wrap gap-2">
                                    {cities.map((city, index) => (
                                        <li key={index} className="flex items-center before:content-['•'] before:mr-1 before:text-gray-400 text-sm">
                                            <Link href={city.href} className="text-gray-600 hover:text-yellow-600 transition-colors underline">
                                                {city.label}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </nav>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Footer */}
            <footer className="bg-gray-100 py-4 md:py-6">
                <div className="container mx-auto px-4 lg:px-8">
                    {/* Main Footer Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-1 md:gap-6">
                        {/* About Section with Payment Methods */}
                        <div className="space-y-1 mb-2 md:mb-0">
                            <FooterSection title="About Chaldal" links={footerSections.about} />
                            <div className="pt-2 md:pt-4">
                                <div className="flex flex-col items-start gap-2">
                                    <span className="text-base font-bold text-gray-600 whitespace-nowrap">Payment Methods:</span>
                                    <div className="flex flex-wrap gap-2">
                                        {paymentMethods.map((method, index) => (
                                            <Image
                                                key={index}
                                                src={method.src}
                                                alt={method.alt}
                                                width={42}
                                                height={24}
                                                className="h-6 w-auto"
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Other Sections */}
                        <FooterSection title="Customer Service" links={footerSections.customerService} />
                        <FooterSection title="For Business" links={footerSections.business} />

                        {/* Contact Info */}
                        <div className="space-y-4 py-4 md:py-0">
                            <div className="flex">
                                <input
                                    type="text"
                                    defaultValue="+88"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-l-md text-black focus:outline-none focus:border-purple-600 text-sm"
                                />
                                <button className="bg-purple-600 text-white px-4 rounded-r-md text-sm font-medium hover:bg-purple-700 transition-colors whitespace-nowrap">
                                    Get app
                                </button>
                            </div>
                            <div className="flex justify-center gap-3">
                                {['playStore.png', 'appstore.png'].map((store, index) => (
                                    <Link key={index} href={index === 0 ? '/android-app' : '/ios-app'}>
                                        <Image
                                            src={`/mobileApp/${store}`}
                                            alt={index === 0 ? 'Google Play' : 'App Store'}
                                            width={100}
                                            height={30}
                                            className="h-10 w-auto"
                                        />
                                    </Link>
                                ))}
                            </div>
                            <div className="text-center md:text-right">
                                <div className="text-gray-700 text-xl font-medium mb-1">16710</div>
                                <div className="text-base">
                                    <span className="text-gray-500">or</span>{' '}
                                    <span className="text-[#456aa0cc] hover:text-[#ff6f71] cursor-pointer">
                                        support@chaldal.com
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Section */}
                <div className="bg-white mt-3 border-t border-b">
                    <div className="container mx-auto px-4 lg:px-8">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-3 py-3">
                            <div className="text-sm text-gray-600 text-center md:text-left">
                                © 2013 Chaldal Limited
                            </div>
                            <div className="flex flex-wrap items-center justify-center gap-3">
                                <div className="flex items-center gap-3">
                                    {[FaFacebook, FaTwitter, FaInstagram].map((Icon, index) => (
                                        <Link
                                            key={index}
                                            href={`/${Icon.name.toLowerCase().replace('fa', '')}`}
                                            className="bg-gray-100 p-2 rounded-full text-gray-600 hover:text-purple-600 transition-colors"
                                        >
                                            <Icon className="h-4 w-4" />
                                        </Link>
                                    ))}
                                </div>
                                <div className="flex items-center gap-1 px-3 py-1">
                                    <GlobeAltIcon className="h-4 w-4 text-gray-600" />
                                    <span className="text-gray-600 text-sm">English (EN)</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>
        </>
    );
};

export default Footer;