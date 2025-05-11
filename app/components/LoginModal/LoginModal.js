'use client';

import { useState } from 'react';
import { auth, provider, signInWithPopup } from '@/lib/firebase';
import { FcGoogle } from 'react-icons/fc';
import Image from 'next/image';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useUserProfile } from '@/app/context/UserProfileContext';

const LoginModal = ({ isOpen, onClose, redirectAfterLogin }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const { syncWooCommerceCustomer } = useUserProfile();

    if (!isOpen) return null;

    const handleGoogleSignIn = async () => {
        try {
            setIsLoading(true);
            setError(null);

            // Firebase authentication
            const result = await signInWithPopup(auth, provider);
            const { user } = result;

            // Sync with WooCommerce
            await syncWooCommerceCustomer({
                email: user.email,
                displayName: user.displayName,
                uid: user.uid,
                phoneNumber: user.phoneNumber || ''
            });

            toast.success('Successfully signed in!');
            onClose(redirectAfterLogin);
        } catch (error) {
            console.error('Login error:', error);
            setError('Failed to sign in with Google. Please try again.');
            toast.error('Failed to sign in with Google');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
            <div className="bg-white p-8 rounded-xl shadow-2xl w-[400px] relative">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Logo and Welcome Message */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center mb-4">
                        <Image
                            src="/favicon.ico"
                            alt="Logo"
                            width={60}
                            height={60}
                            className="rounded-full shadow-lg"
                        />
                    </div>
                    <h2 className="text-3xl font-extrabold text-gray-900">Welcome Back!</h2>
                    <p className="text-gray-500 mt-2 text-sm">
                        Sign in to continue to <span className="text-blue-600 font-medium">KenaKata</span>
                    </p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 text-red-500 text-sm text-center p-3 rounded-lg mb-4">
                        {error}
                    </div>
                )}

                {/* Google Sign In Button */}
                <button
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                    className={`w-full flex items-center justify-center gap-3 bg-white border border-gray-300 rounded-lg py-3 px-4 text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-400 transition-all mb-6 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                >
                    {isLoading ? (
                        <div className="w-5 h-5 border-t-2 border-gray-500 border-solid rounded-full animate-spin"></div>
                    ) : (
                        <FcGoogle className="text-2xl" />
                    )}
                    {isLoading ? 'Signing in...' : 'Continue with Google'}
                </button>
                {/* Terms and Privacy */}
                <p className="text-xs text-gray-500 text-center mt-6">
                    By continuing, you agree to our{' '}
                    <a href="#" className="text-blue-600 hover:underline">Terms of Service</a>
                    {' '}and{' '}
                    <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>
                </p>

                {/* Toast Container */}
                <ToastContainer
                    position="top-right"
                    autoClose={3000}
                    hideProgressBar={false}
                    newestOnTop
                    closeOnClick
                    rtl={false}
                    pauseOnFocusLoss
                    draggable
                    pauseOnHover
                />
            </div>
        </div>
    );
};

export default LoginModal;