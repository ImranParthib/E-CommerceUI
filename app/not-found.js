'use client';

import Link from 'next/link';
import { useSidebar } from './context/SidebarContext';

export default function NotFound() {
    const { isSidebarOpen } = useSidebar();

    return (
        <main className={`transition-all duration-300 h-screen ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
            <div className=" h-screen flex items-center justify-center bg-gray-50 px-4">
                <div className="text-center">
                    <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
                    <h2 className="text-2xl font-semibold text-gray-700 mb-4">
                        Page Not Found
                    </h2>
                    <p className="text-gray-600 mb-8">
                        The page you are looking for might have been removed or is temporarily unavailable.
                    </p>
                    <Link
                        href="/"
                        className="inline-block bg-[#fdd670] text-gray-900 px-6 py-3 rounded-lg font-medium hover:bg-[#fcc550] transition-colors"
                    >
                        Go Back Home
                    </Link>
                </div>
            </div>
        </main>
    );
}
