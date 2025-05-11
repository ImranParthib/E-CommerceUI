'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useSidebar } from '@/app/context/SidebarContext';

export default function FavouritesError({
    error,
    reset,
}) {
    // Import the sidebar context to maintain layout consistency
    const { isSidebarOpen } = useSidebar();

    useEffect(() => {
        // Log the error to an error reporting service
        console.error('Favourites error:', error);
    }, [error]);

    const handleReset = () => {
        // Clear any cached data that might be causing the error
        window.localStorage.removeItem('favourites_error_state');
        // Call the reset function provided by Next.js
        reset();
    };

    return (
        <div className={`min-h-screen flex items-center justify-center bg-gray-50 px-4 pt-16 ${isSidebarOpen ? 'ml-0 sm:ml-64' : 'ml-0'}`}>
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
                <div className="mb-6">
                    <svg className="w-16 h-16 mx-auto text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                    </svg>
                </div>

                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                    Something went wrong
                </h1>
                <p className="text-gray-600 mb-8">
                    We couldn't load your favorites. Please try again or return to the home page.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                        onClick={handleReset}
                        className="w-full sm:w-auto bg-[#fdd670] text-gray-900 px-6 py-3 rounded-lg font-medium hover:bg-[#fcc550] transition-colors focus:outline-none focus:ring-2 focus:ring-[#fcc550] focus:ring-opacity-50"
                    >
                        Try again
                    </button>
                    <Link
                        href="/"
                        className="w-full sm:w-auto bg-white text-gray-900 px-6 py-3 rounded-lg font-medium border border-gray-200 hover:border-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200 focus:ring-opacity-50"
                    >
                        Go Back Home
                    </Link>
                </div>

                {/* Display error details in development mode */}
                {process.env.NODE_ENV === 'development' && (
                    <div className="mt-8 p-4 bg-gray-50 rounded-lg text-left">
                        <p className="text-sm font-medium text-gray-700 mb-2">Error details (development only):</p>
                        <pre className="text-xs text-red-600 overflow-auto max-h-40 p-2 bg-gray-100 rounded">
                            {error?.message || 'Unknown error'}
                        </pre>
                    </div>
                )}
            </div>
        </div>
    );
}
