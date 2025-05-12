'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
    error,
    reset,
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error(error);
    }, [error]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="text-center">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                    Something went wrong!
                </h1>
                <p className="text-gray-600 mb-8">
                    We apologize for the inconvenience. Please try again.
                </p>
                <div className="space-x-4">
                    <button
                        onClick={reset}
                        className="inline-block bg-[#fdd670] text-gray-900 px-6 py-3 rounded-lg font-medium hover:bg-[#fcc550] transition-colors"
                    >
                        Try again
                    </button>
                    <Link
                        href="/"
                        className="inline-block bg-white text-gray-900 px-6 py-3 rounded-lg font-medium border border-gray-200 hover:border-gray-300 transition-colors"
                    >
                        Go Back Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
