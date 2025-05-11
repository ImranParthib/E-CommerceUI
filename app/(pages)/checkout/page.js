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
import { MapPin, Truck } from 'lucide-react';
import {
    DELIVERY_FEE,
    EXPRESS_DELIVERY_SURCHARGE,
    FREE_DELIVERY_THRESHOLD
} from '@/app/config/constants';

// Helper function to format price numbers
const formatPrice = (price) => {
    if (price === null || price === undefined) return 0;
    return typeof price === 'number' ? price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : 0;
};

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
    const [isRedirectingToPayment, setIsRedirectingToPayment] = useState(false);
    const [deliveryTime, setDeliveryTime] = useState('standard');
    const [deliveryLocation, setDeliveryLocation] = useState(null);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (!user && !isLoginModalOpen) {
                setIsLoginModalOpen(true);
            }
        });

        return () => unsubscribe();
    }, [isLoginModalOpen]);

    useEffect(() => {
        if (userProfile) {
            const defaultAddress = getDefaultAddress();

            if (defaultAddress) {
                setDeliveryLocation(defaultAddress.city);

                const formattedAddress = formatDeliveryAddress(defaultAddress);

                setPrefillData({
                    name: userProfile.displayName || auth.currentUser?.displayName || '',
                    phone: defaultAddress.phoneNumber || userProfile.phoneNumber || '',
                    email: userProfile.email || auth.currentUser?.email || '',
                    address: formattedAddress,
                    city: defaultAddress.city || 'Dhaka',
                    zip: '1200',
                    selectedAddressId: defaultAddress.id
                });
            } else {
                setPrefillData({
                    name: userProfile.displayName || auth.currentUser?.displayName || '',
                    phone: userProfile.phoneNumber || '',
                    email: userProfile.email || auth.currentUser?.email || ''
                });
            }
        }
    }, [userProfile, getDefaultAddress]);

    const formatDeliveryAddress = (address) => {
        if (!address) return '';

        let formattedAddress = address.fullAddress || '';

        if (address.area) {
            formattedAddress += formattedAddress ? `, ${address.area}` : address.area;
        }

        return formattedAddress;
    };

    useEffect(() => {
        if (cartItems.length === 0 && !isRedirectingToPayment) {
            const timer = setTimeout(() => {
                router.push('/');
            }, 3000);

            return () => clearTimeout(timer);
        }
    }, [cartItems.length, router, isRedirectingToPayment]);

    const handleLoginModalClose = () => {
        setIsLoginModalOpen(false);
        if (!auth.currentUser) {
            router.push('/');
        }
    };

    const validateDeliveryDetails = (details) => {
        const errors = {};
        if (!details.name) errors.name = "Name is required";
        if (!details.address) errors.address = "Address is required";
        if (!details.phone) errors.phone = "Phone number is required";

        if (details.phone && !/^\+?[\d\s-]{8,15}$/.test(details.phone.replace(/[^0-9+\s-]/g, '')))
            errors.phone = "Please enter a valid phone number";

        return errors;
    }; const handleCheckout = async (details) => {
        const validationErrors = validateDeliveryDetails(details);
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        if (!auth.currentUser) {
            setIsLoginModalOpen(true);
            return;
        }

        setDeliveryLocation(details.city);

        try {
            setIsProcessing(true);

            const orderDetails = {
                ...details,
                deliveryFee: calculateDeliveryFee(deliveryTime, details.city),
                deliveryTime: deliveryTime
            };

            // Create order with pending payment method
            // The payment method will be selected on the next screen
            const order = createOrder(orderDetails);

            if (order) {
                setIsRedirectingToPayment(true);
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

    if (cartItems.length === 0 && !isRedirectingToPayment) {
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

    const calculateDeliveryFee = (deliverySpeed, location = deliveryLocation) => {
        const subtotal = getCartTotal();

        if (subtotal >= FREE_DELIVERY_THRESHOLD) {
            return 0;
        }

        let baseFee = location && location.toLowerCase() === 'dhaka'
            ? DELIVERY_FEE.INSIDE_DHAKA
            : DELIVERY_FEE.OUTSIDE_DHAKA;

        return deliverySpeed === 'express'
            ? baseFee + EXPRESS_DELIVERY_SURCHARGE
            : baseFee;
    };

    const handleDeliveryTimeChange = (e) => {
        setDeliveryTime(e.target.value);
    };

    const currentDeliveryFee = calculateDeliveryFee(deliveryTime);
    const orderTotal = getCartTotal() + currentDeliveryFee;
    const isFreeShipping = getCartTotal() >= FREE_DELIVERY_THRESHOLD;

    return (
        <>
            <div className={`min-h-screen bg-gray-50 pt-16 ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
                <div className="max-w-6xl mx-auto px-4 py-8">
                    <h1 className="text-2xl font-bold mb-6">Checkout</h1>

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
                                                {item.images && item.images[0]?.src ? (
                                                    <img
                                                        src={item.images[0].src}
                                                        alt={item.name}
                                                        className="h-full w-full object-contain object-center"
                                                    />
                                                ) : item.image ? (
                                                    <img
                                                        src={item.image}
                                                        alt={item.name}
                                                        className="h-full w-full object-contain object-center"
                                                    />
                                                ) : (
                                                    <div className="h-full w-full flex items-center justify-center bg-gray-100">
                                                        <span className="text-gray-400 text-xs">No image</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                                                {item.selectedAttributes && Object.keys(item.selectedAttributes).length > 0 && (
                                                    <p className="text-xs text-blue-600 mt-0.5 mb-0.5">
                                                        {Object.entries(item.selectedAttributes).map(([key, value]) => (
                                                            <span key={key} className="mr-1">{key}: {value}</span>
                                                        ))}
                                                    </p>
                                                )}
                                                <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                                            </div>
                                            <p className="text-sm font-medium text-gray-900">৳{formatPrice(item.price * item.quantity)}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="mb-4">
                                    <h3 className="text-sm font-medium mb-2">Delivery Options</h3>
                                    <div className="bg-gray-50 p-3 rounded-md mb-2">
                                        <div className="flex items-start">
                                            <input
                                                id="standard-delivery"
                                                name="deliveryTime"
                                                type="radio"
                                                className="mt-1.5"
                                                value="standard"
                                                checked={deliveryTime === 'standard'}
                                                onChange={handleDeliveryTimeChange}
                                            />
                                            <label htmlFor="standard-delivery" className="ml-2 block text-sm">
                                                <span className="font-medium text-gray-900">Standard Delivery</span>
                                                <span className="block text-gray-500 text-xs">Delivery within 2-3 days</span>
                                            </label>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded-md">
                                        <div className="flex items-start">
                                            <input
                                                id="express-delivery"
                                                name="deliveryTime"
                                                type="radio"
                                                className="mt-1.5"
                                                value="express"
                                                checked={deliveryTime === 'express'}
                                                onChange={handleDeliveryTimeChange}
                                            />
                                            <label htmlFor="express-delivery" className="ml-2 block text-sm">
                                                <span className="font-medium text-gray-900">Express Delivery (+৳{formatPrice(EXPRESS_DELIVERY_SURCHARGE)})</span>
                                                <span className="block text-gray-500 text-xs">Delivery within 24 hours</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <p className="text-gray-600">Subtotal</p>
                                        <p className="font-medium">৳{formatPrice(getCartTotal())}</p>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center">
                                            <p className="text-gray-600 mr-1">Shipping</p>
                                            {isFreeShipping && (
                                                <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">FREE</span>
                                            )}
                                        </div>
                                        <p className="font-medium">
                                            {isFreeShipping ? (
                                                <span className="line-through text-gray-400 mr-1">৳{formatPrice(calculateDeliveryFee(deliveryTime, 'Dhaka'))}</span>
                                            ) : ''}
                                            ৳{formatPrice(currentDeliveryFee)}
                                        </p>
                                    </div>
                                    {!isFreeShipping && getCartTotal() > 0 && (
                                        <div className="bg-blue-50 p-2 rounded text-xs text-blue-700 flex items-center">
                                            <Truck className="w-3 h-3 mr-1 flex-shrink-0" />
                                            <span>
                                                Add ৳{formatPrice(FREE_DELIVERY_THRESHOLD - getCartTotal())} more for free shipping!
                                            </span>
                                        </div>
                                    )}
                                    <div className="border-t pt-2 mt-2">
                                        <div className="flex justify-between font-medium text-lg">
                                            <p>Total</p>
                                            <p>৳{formatPrice(orderTotal)}</p>
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