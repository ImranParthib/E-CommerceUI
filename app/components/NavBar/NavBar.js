'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Search from '../Search/Search';
import { useSidebar } from '../../context/SidebarContext';
import LoginModal from '../LoginModal/LoginModal';
import { useScrollPosition } from '@/app/hooks/useScrollPosition';
import { auth } from '@/lib/firebase';
import { toast } from 'react-toastify';
import { Heart } from 'lucide-react';
import { useFavorites } from '@/app/context/FavoritesContext';

const NavBar = () => {
    const { toggleSidebar } = useSidebar();
    const [location, setLocation] = useState('Dhaka');
    const [user, setUser] = useState(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const scrollPosition = useScrollPosition();
    const { favorites } = useFavorites();
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const dropdownRef = useRef(null);
    const timeoutRef = useRef(null);

    // Memoize event handlers with useCallback
    const handleLoginClick = useCallback(() => {
        setIsLoginModalOpen(true);
    }, []);

    const handleCloseModal = useCallback(() => {
        setIsLoginModalOpen(false);
    }, []);

    const handleSignOut = useCallback(async () => {
        try {
            await auth.signOut();
            toast.success('Successfully signed out!');
            setIsDropdownOpen(false);
        } catch (error) {
            console.error('Error signing out:', error);
            toast.error('Failed to sign out');
        }
    }, []);

    const handleMouseEnter = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        setIsDropdownOpen(true);
    }, []);

    const handleMouseLeave = useCallback(() => {
        timeoutRef.current = setTimeout(() => {
            setIsDropdownOpen(false);
        }, 300);
    }, []);

    const handleLocationChange = useCallback((e) => {
        setLocation(e.target.value);
    }, []);

    // Clean up timeouts on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    // Auth listener
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(setUser);
        return unsubscribe;
    }, []);

    // Click outside handler for dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };

        if (isDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isDropdownOpen]);

    return (
        <>
            <nav className="fixed top-0 left-0 right-0 z-50 bg-[#fdd670] px-2 sm:px-4 py-1 ">
                <div className="flex items-center justify-between gap-2   mx-auto">
                    {/* Left side - Always visible */}
                    <div className="flex items-center space-x-1 lg:space-x-1">
                        <button
                            onClick={toggleSidebar}
                            className="text-gray-700 hover:text-gray-900 focus:outline-none"
                            aria-label="Menu"
                        >
                            <Image
                                src="/icons/menu.png"
                                width={80}
                                height={30}
                                alt="Menu"
                                className="h-8 w-auto lg:h-12"
                                priority
                            />
                        </button>
                        <Link href="/" className="flex items-center">
                            <Image
                                src="/logo/chaldal.png"
                                width={80}
                                height={30}
                                alt="Chaldal"
                                className="h-6 w-auto lg:h-9"
                                priority
                            />
                        </Link>
                    </div>

                    {/* Center - Search field */}
                    <div className="flex-1 max-w-3xl">
                        <Search className="w-full" />
                    </div>

                    {/* Right side - Responsive */}
                    <div className="flex items-center space-x-2 lg:space-x-4">
                        {/* Location - Hidden on mobile */}
                        <div className="hidden md:flex items-center text-pink-500">
                            <Image
                                src="/icons/location.png"
                                width={22}
                                height={22}
                                alt="Location"
                            />
                            <select
                                value={location}
                                onChange={handleLocationChange}
                                className="bg-transparent border-none outline-none text-pink-500 text-sm"
                                aria-label="Select location"
                            >
                                <option value="Dhaka">Dhaka</option>
                                <option value="Chittagong">Chittagong</option>
                                <option value="Sylhet">Sylhet</option>
                            </select>
                        </div>

                        {/* Language Switcher - Hidden on mobile */}
                        <div className="hidden md:flex items-center space-x-1 bg-white rounded-lg">
                            <button
                                className="px-2 py-1 text-sm text-[#ff6f71] font-semibold hover:bg-yellow-300 rounded"
                                aria-label="Switch to English"
                            >
                                EN
                            </button>
                            <button
                                className="px-2 py-1 text-sm hover:bg-yellow-300 rounded font-semibold text-gray-900"
                                aria-label="Switch to Bengali"
                            >
                                বাং
                            </button>
                        </div>

                        {/* Favorites Icon */}
                        <Link href="/favourites" className="relative p-2" aria-label={`View favorites (${favorites.length})`}>
                            <Heart className="h-6 w-6" />
                            {favorites.length > 0 && (
                                <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                    {favorites.length}
                                </span>
                            )}
                        </Link>

                        {/* User Menu */}
                        {user ? (
                            <div
                                className="relative"
                                ref={dropdownRef}
                                onMouseEnter={handleMouseEnter}
                                onMouseLeave={handleMouseLeave}
                            >
                                <button
                                    className="flex items-center space-x-1 bg-white rounded-lg px-2 py-1.5 hover:bg-gray-50 transition-colors"
                                    aria-expanded={isDropdownOpen}
                                    aria-haspopup="true"
                                >
                                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    <span className="hidden md:inline text-sm font-medium text-gray-700 truncate max-w-[100px]">
                                        {user.displayName || 'User'}
                                    </span>
                                </button>

                                {isDropdownOpen && (
                                    <div
                                        className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-50"
                                        onMouseEnter={handleMouseEnter}
                                        onMouseLeave={handleMouseLeave}
                                    >
                                        {[
                                            { href: "/profile", text: "Your Profile" },
                                            { href: "/profile/orders", text: "Your Orders" },
                                            { href: "/profile/payment-history", text: "Payment History" },
                                            { href: "/profile/payment-methods", text: "Manage Payment Methods" },
                                            { href: "/profile/referral", text: "Referral Program" },
                                            { href: "/profile/change-password", text: "Change Password" }
                                        ].map((item, index) => (
                                            <Link
                                                key={index}
                                                href={item.href}
                                                className="block border-b px-4 py-2 text-sm text-gray-700 hover:bg-gray-200 transition-colors"
                                            >
                                                {item.text}
                                            </Link>
                                        ))}
                                        <button
                                            onClick={handleSignOut}
                                            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-200 transition-colors"
                                        >
                                            Sign Out
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <button
                                onClick={handleLoginClick}
                                className="bg-pink-500 text-white px-3 py-1.5 rounded text-sm hover:bg-pink-600 transition-colors"
                            >
                                Login
                            </button>
                        )}
                    </div>
                </div>
            </nav>

            <LoginModal isOpen={isLoginModalOpen} onClose={handleCloseModal} />
        </>
    );
};

export default NavBar;