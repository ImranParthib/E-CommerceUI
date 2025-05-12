'use client';

import { useState } from 'react';
import { auth, provider, signInWithPopup } from '@/lib/firebase';
import { FcGoogle } from 'react-icons/fc';
import Image from 'next/image';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const LoginModal = ({ isOpen, onClose }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    if (!isOpen) return null;

    const handleGoogleSignIn = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const result = await signInWithPopup(auth, provider);
            toast.success('Successfully signed in!');
            onClose();
        } catch (error) {
            setError('Failed to sign in with Google. Please try again.');
            toast.error('Failed to sign in with Google');
            console.error(error);
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
                <div className="text-center mb-6">
                    <Image
                        src="/logo/chaldal.png"
                        alt="Logo"
                        width={80}
                        height={80}
                        className="mx-auto mb-4"
                    />
                    <h2 className="text-2xl font-bold text-gray-800">Welcome Back!</h2>
                    <p className="text-gray-600 mt-2">Login to access your account</p>
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

                {/* Divider */}
                <div className="relative mb-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500">or create an account</span>
                    </div>
                </div>

                {/* Sign Up Link */}
                <div className="text-center space-y-4">
                    <p className="text-gray-600">New to our store?</p>
                    <button
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                        onClick={() => {/* Handle registration navigation */ }}
                        disabled={isLoading}
                    >
                        Create Account
                    </button>
                </div>

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