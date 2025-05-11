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
import { Heart, ShoppingCart, ChevronDown, User, LogOut, Package, CreditCard, Users, Lock, MapPin } from 'lucide-react';
import { useFavorites } from '@/app/context/FavoritesContext';
import { useCart } from '@/app/context/CartContext';
import { useUserProfile } from '@/app/context/UserProfileContext';

const NavBar = () => {
    const { toggleSidebar } = useSidebar();
    const [user, setUser] = useState(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const scrollPosition = useScrollPosition();
    const { favorites } = useFavorites();
    const { cartItems } = useCart();
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const { userProfile, getDefaultAddress } = useUserProfile();
    const dropdownRef = useRef(null);
    const mobileMenuRef = useRef(null);
    const timeoutRef = useRef(null);

    const totalCartItems = cartItems?.length || 0;

    // Get the user's default address if available
    const defaultAddress = userProfile ? getDefaultAddress() : null;
    const userLocation = defaultAddress ? defaultAddress.city : null;

    // Memoize event handlers with useCallback
    const handleLoginClick = useCallback(() => {
        setIsLoginModalOpen(true);
        setIsMobileMenuOpen(false);
    }, []);

    const handleCloseModal = useCallback((redirectAfterLogin) => {
        setIsLoginModalOpen(false);
        if (redirectAfterLogin) {
            // Handle redirect logic here
        }
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

    const toggleMobileMenu = useCallback(() => {
        setIsMobileMenuOpen(prev => !prev);
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

    // Click outside handlers
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
            if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
                setIsMobileMenuOpen(false);
            }
        };

        if (isDropdownOpen || isMobileMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isDropdownOpen, isMobileMenuOpen]);

    // Dynamic navbar styling based on scroll
    const navbarStyle = scrollPosition > 50
        ? "shadow-md bg-[#fdd670] transition-all duration-300"
        : "bg-[#fdd670] transition-all duration-300";

    // Menu items config for reusability
    const userMenuItems = [
        { href: "/profile", text: "Your Profile", icon: <User size={16} /> },
        { href: "/profile/orders", text: "Your Orders", icon: <Package size={16} /> },
        { href: "/profile/payment-history", text: "Payment History", icon: <CreditCard size={16} /> },
        { href: "/profile/payment-methods", text: "Manage Payments", icon: <CreditCard size={16} /> },
        { href: "/profile/referral", text: "Referral Program", icon: <Users size={16} /> },
        { href: "/profile/change-password", text: "Change Password", icon: <Lock size={16} /> }
    ];

    return (
        <>
            <nav className={`fixed top-0 left-0 right-0 z-50 px-3 sm:px-4 py-2 ${navbarStyle}`}>
                <div className="  mx-auto">
                    <div className="flex items-center justify-between gap-2">
                        {/* Left Section */}
                        <div className="flex items-center space-x-2 lg:space-x-4">
                            <button
                                onClick={toggleSidebar}
                                className="text-gray-700 hover:text-gray-900 focus:outline-none p-1 rounded-md hover:bg-yellow-400 transition-colors"
                                aria-label="Menu"
                            >
                                <Image
                                    src="/icons/menu.png"
                                    width={32}
                                    height={32}
                                    alt="Menu"
                                    className="h-6 w-6 lg:h-9 lg:w-9"
                                    priority
                                />
                            </button>
                            <Link href="/" className="flex items-center space-x-2">
                                <Image
                                    src="/favicon.ico"
                                    width={40}
                                    height={40}
                                    alt="Kenakata Logo"
                                    className="h-8 w-8 lg:h-9 lg:w-9 rounded-full"
                                    priority
                                />
                                <span className="text-lg lg:text-xl font-bold text-gray-800 hidden sm:inline">
                                    Kenakata
                                </span>
                            </Link>
                        </div>

                        {/* Middle Section - Search */}
                        <div className="flex-1 max-w-2xl mx-2 sm:mx-4">
                            <Search className="w-full" />
                        </div>

                        {/* Right Section */}
                        <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-4">
                            {/* Location Display - Hidden on smaller screens */}
                            <div className="hidden md:flex items-center text-pink-500 bg-white bg-opacity-30 rounded-lg px-2 py-1">
                                <MapPin size={18} className="mr-1" />
                                {user ? (
                                    userLocation ? (
                                        <span className="text-sm font-medium">{userLocation}</span>
                                    ) : (
                                        <Link href="/profile" className="text-sm font-medium hover:underline">
                                            Set Location
                                        </Link>
                                    )
                                ) : (
                                    <Link href="/" onClick={handleLoginClick} className="text-sm font-medium hover:underline">
                                        Login to Set Location
                                    </Link>
                                )}
                            </div>

                            {/* Language Switcher - Hidden on smaller screens */}
                            <div className="hidden md:flex items-center space-x-0 bg-white rounded-lg overflow-hidden">
                                <button
                                    className="px-2 py-1 text-sm text-[#ff6f71] font-semibold hover:bg-yellow-300 transition-colors"
                                    aria-label="Switch to English"
                                >
                                    EN
                                </button>
                                <button
                                    className="px-2 py-1 text-sm hover:bg-yellow-300 transition-colors font-semibold text-gray-900"
                                    aria-label="Switch to Bengali"
                                >
                                    বাং
                                </button>
                            </div>



                            {/* Favorites Icon */}
                            <Link
                                href="/favourites"
                                className="relative p-2 hover:bg-yellow-400 rounded-full transition-colors"
                                aria-label={`View favorites (${favorites.length})`}
                            >
                                <Heart className="h-5 w-5 sm:h-6 sm:w-6" />
                                {favorites.length > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                        {favorites.length}
                                    </span>
                                )}
                            </Link>

                            {/* User Menu - Desktop */}
                            {user ? (
                                <div
                                    className="relative hidden sm:block"
                                    ref={dropdownRef}
                                    onMouseEnter={handleMouseEnter}
                                    onMouseLeave={handleMouseLeave}
                                >
                                    <button
                                        className="flex items-center space-x-1 bg-white rounded-lg px-3 py-1.5 hover:bg-yellow-200 transition-colors"
                                        aria-expanded={isDropdownOpen}
                                        aria-haspopup="true"
                                    >
                                        <User className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
                                        <span className="hidden md:inline text-sm font-medium text-gray-700 truncate max-w-[100px]">
                                            {user.displayName?.split(' ')[0] || 'User'}
                                        </span>
                                        <ChevronDown className="w-4 h-4 text-gray-500" />
                                    </button>

                                    {isDropdownOpen && (
                                        <div
                                            className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-1 z-50"
                                            onMouseEnter={handleMouseEnter}
                                            onMouseLeave={handleMouseLeave}
                                        >
                                            <div className="px-4 py-3 border-b border-gray-100">
                                                <p className="text-sm text-gray-500">Signed in as</p>
                                                <p className="text-sm font-medium text-gray-800 truncate">{user.email}</p>
                                            </div>

                                            {userMenuItems.map((item, index) => (
                                                <Link
                                                    key={index}
                                                    href={item.href}
                                                    className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                                >
                                                    {item.icon}
                                                    <span>{item.text}</span>
                                                </Link>
                                            ))}

                                            <button
                                                onClick={handleSignOut}
                                                className="flex items-center space-x-2 w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 transition-colors"
                                            >
                                                <LogOut size={16} />
                                                <span>Sign Out</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <button
                                    onClick={handleLoginClick}
                                    className="hidden sm:block bg-pink-500 text-white px-3 py-1.5 rounded text-sm hover:bg-pink-600 transition-colors"
                                >
                                    Login
                                </button>
                            )}

                            {/* Mobile User Menu Toggle */}
                            <button
                                onClick={toggleMobileMenu}
                                className="sm:hidden p-2 hover:bg-yellow-400 rounded-full transition-colors"
                                aria-label="User menu"
                            >
                                {user ? (
                                    <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center border border-gray-300">
                                        <User size={16} className="text-gray-700" />
                                    </div>
                                ) : (
                                    <User size={20} className="text-gray-700" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Mobile Menu Dropdown */}
            {isMobileMenuOpen && (
                <div
                    ref={mobileMenuRef}
                    className="fixed top-14 right-2 w-56 bg-white rounded-lg shadow-lg py-2 z-50 sm:hidden"
                >
                    {/* Location display for mobile */}
                    <div className="px-4 py-2 border-b border-gray-100">
                        <div className="flex items-center text-pink-500">
                            <MapPin size={16} className="mr-2" />
                            {user ? (
                                userLocation ? (
                                    <span className="text-sm font-medium">{userLocation}</span>
                                ) : (
                                    <Link href="/profile" className="text-sm font-medium hover:underline" onClick={() => setIsMobileMenuOpen(false)}>
                                        Set Location
                                    </Link>
                                )
                            ) : (
                                <span className="text-sm font-medium">Login to Set Location</span>
                            )}
                        </div>
                    </div>

                    {/* Language switcher for mobile */}
                    <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-xs text-gray-500 mb-1">Language</p>
                        <div className="flex space-x-2">
                            <button className="px-2 py-1 text-sm bg-pink-50 text-pink-500 rounded-md font-medium">EN</button>
                            <button className="px-2 py-1 text-sm bg-gray-50 text-gray-700 rounded-md font-medium">বাং</button>
                        </div>
                    </div>

                    {user ? (
                        <>
                            <div className="px-4 py-2 border-b border-gray-100">
                                <p className="text-xs text-gray-500">Signed in as</p>
                                <p className="text-sm font-medium text-gray-800 truncate">{user.email}</p>
                            </div>

                            {userMenuItems.map((item, index) => (
                                <Link
                                    key={index}
                                    href={item.href}
                                    className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    {item.icon}
                                    <span>{item.text}</span>
                                </Link>
                            ))}

                            <button
                                onClick={handleSignOut}
                                className="flex items-center space-x-2 w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 transition-colors"
                            >
                                <LogOut size={16} />
                                <span>Sign Out</span>
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={handleLoginClick}
                            className="flex items-center space-x-2 w-full text-left px-4 py-2 text-sm text-pink-600 hover:bg-gray-100 transition-colors font-medium"
                        >
                            <User size={16} />
                            <span>Login</span>
                        </button>
                    )}
                </div>
            )}

            {/* Login Modal */}
            <LoginModal isOpen={isLoginModalOpen} onClose={handleCloseModal} redirectAfterLogin="/" />
        </>
    );
};

export default NavBar;