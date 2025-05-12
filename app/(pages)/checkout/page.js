"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/app/context/CartContext';
import DeliveryForm from '@/app/components/DeliveryForm/DeliveryForm';
import { useSidebar } from '@/app/context/SidebarContext';
import { auth } from '@/lib/firebase';
import LoginModal from '@/app/components/LoginModal/LoginModal';
import { useOrders } from '@/app/context/OrderContext';
import { useUserProfile } from '@/app/context/UserProfileContext';
import { toast } from 'react-toastify';
import { MapPin } from 'lucide-react';
import Image from 'next/image';

export default function CheckoutPage() {
    const { cartItems, getCartTotal } = useCart();
    const { createOrder } = useOrders();
    const { isSidebarOpen } = useSidebar();
    const { userProfile, getDefaultAddress } = useUserProfile();
    const router = useRouter();
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [errors, setErrors] = useState({});
    const [isProcessing, setIsProcessing] = useState(false);
    const [prefillData, setPrefillData] = useState(null);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            // Only show login modal if user is not logged in
            if (!user && !isLoginModalOpen) {
                setIsLoginModalOpen(true);
            }
        });

        return () => unsubscribe();
    }, [isLoginModalOpen]);

    // Enhanced the effect to handle building correct address format for the form
    useEffect(() => {
        if (userProfile) {
            // Get default address if available
            const defaultAddress = getDefaultAddress();

            if (defaultAddress) {
                // Create a complete profile with default address info
                setPrefillData({
                    name: userProfile.displayName || auth.currentUser?.displayName || '',
                    phone: defaultAddress.phoneNumber || userProfile.phoneNumber || '',
                    email: userProfile.email || auth.currentUser?.email || '',
                    // Combine full address and area for delivery
                    address: `${defaultAddress.fullAddress}${defaultAddress.area ? ', ' + defaultAddress.area : ''}`,
                    city: defaultAddress.city || 'Dhaka',
                    zip: '1200'  // Default ZIP for Dhaka
                });
            } else {
                // Otherwise, just prefill with the user's basic info
                setPrefillData({
                    name: userProfile.displayName || auth.currentUser?.displayName || '',
                    phone: userProfile.phoneNumber || '',
                    email: userProfile.email || auth.currentUser?.email || ''
                });
            }
        }
    }, [userProfile, getDefaultAddress]);

    // If cart is empty, redirect to home after a short delay
    useEffect(() => {
        if (cartItems.length === 0) {
            const timer = setTimeout(() => {
                router.push('/');
            }, 3000);

            return () => clearTimeout(timer);
        }
    }, [cartItems.length, router]);

    const handleLoginModalClose = () => {
        setIsLoginModalOpen(false);
        if (!auth.currentUser) {
            router.push('/');
        }
    };

    const validateDeliveryDetails = (details) => {
        const errors = {};
        // Make validation less strict - focus on essential fields
        if (!details.name) errors.name = "Name is required";
        if (!details.address) errors.address = "Address is required";
        if (!details.phone) errors.phone = "Phone number is required";

        // Make phone validation more flexible
        if (details.phone && !/^\+?[\d\s-]{8,15}$/.test(details.phone.replace(/[^0-9+\s-]/g, '')))
            errors.phone = "Please enter a valid phone number";

        return errors;
    };

    const handleCheckout = async (details) => {
        const validationErrors = validateDeliveryDetails(details);
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        if (!auth.currentUser) {
            setIsLoginModalOpen(true);
            return;
        }

        try {
            setIsProcessing(true);

            // Create order with the form data
            const order = createOrder(details);

            if (order) {
                // Navigate to payment page with the new order ID
                router.push(`/checkout/payment/${order.id}`);
            } else {
                toast.error("Something went wrong. Please try again.");
            }
        } catch (error) {
            console.error("Checkout error:", error);
            toast.error("Failed to create your order. Please try again.");
        } finally {
            setIsProcessing(false);
        }
    };

    if (cartItems.length === 0) {
        return (
            <div className={`container flex flex-col justify-center items-center h-screen mx-auto px-4 py-8 bg-white transition-all duration-300 ${isSidebarOpen ? 'ml-72' : 'ml-0'}`}>
                <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
                <p>Please add some items to your cart before checking out.</p>
                <button
                    onClick={() => router.push('/')}
                    className="mt-6 px-4 py-2 bg-yellow-400 hover:bg-yellow-500 rounded font-medium"
                >
                    Return to Shopping
                </button>
            </div>
        );
    }

    return (
        <>
            <div className={`min-h-screen bg-gray-50 pt-16 ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
                <div className="max-w-6xl mx-auto px-4 py-8">
                    <h1 className="text-2xl font-bold mb-6">Checkout</h1>

                    {/* Add a notice about using saved addresses */}
                    {userProfile?.addresses && userProfile.addresses.length > 0 && (
                        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-sm flex items-center gap-1">
                                <MapPin size={16} className="text-yellow-600" />
                                <span>Choose from your saved addresses for faster checkout</span>
                            </p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2">
                            <DeliveryForm
                                onSubmit={handleCheckout}
                                errors={errors}
                                cartItems={cartItems}
                                isProcessing={isProcessing}
                                savedAddresses={userProfile?.addresses || []}
                                prefillData={prefillData}
                            />
                        </div>
                        <div>
                            <div className="bg-white p-6 rounded-lg shadow-sm sticky top-24">
                                <h2 className="text-lg font-medium mb-4">Order Summary</h2>
                                <div className="max-h-64 overflow-auto mb-4">
                                    {cartItems.map((item) => (
                                        <div key={item.id} className="flex items-center py-3 border-b">
                                            <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-gray-200 mr-4">
                                                {item.image && (
                                                    <Image
                                                        src={item.image}
                                                        alt={item.name}
                                                        className="h-full w-full object-contain object-center"
                                                        width={64}
                                                        height={64}
                                                    />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                                                <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                                            </div>
                                            <p className="text-sm font-medium text-gray-900">৳{item.price * item.quantity}</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <p className="text-gray-600">Subtotal</p>
                                        <p className="font-medium">৳{getCartTotal()}</p>
                                    </div>
                                    <div className="flex justify-between">
                                        <p className="text-gray-600">Shipping</p>
                                        <p className="font-medium">৳60</p>
                                    </div>
                                    <div className="border-t pt-2 mt-2">
                                        <div className="flex justify-between font-medium text-lg">
                                            <p>Total</p>
                                            <p>৳{getCartTotal() + 60}</p>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">Including VAT</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {!auth.currentUser && (
                <LoginModal
                    isOpen={isLoginModalOpen}
                    onClose={handleLoginModalClose}
                    redirectAfterLogin="/checkout"
                />
            )}
        </>
    );
}