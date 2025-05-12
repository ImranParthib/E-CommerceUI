'use client';

import { useState, useEffect } from 'react';
import { MapPin, Home, Briefcase, ShoppingBag } from 'lucide-react';

export default function DeliveryForm({
    onSubmit,
    errors,
    cartItems,
    isProcessing,
    savedAddresses, // Array of user's saved addresses
    prefillData
}) {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        address: '',
        city: 'Dhaka',
        zip: '1200', // Default ZIP for Dhaka
        notes: '',
        deliveryTime: 'standard',
    });

    const [selectedAddressId, setSelectedAddressId] = useState(null);

    // Set initial form data
    useEffect(() => {
        if (prefillData) {
            setFormData(prev => ({
                ...prev,
                ...prefillData
            }));
        }
    }, [prefillData]);

    // Handle selecting a saved address
    const handleAddressSelect = (address) => {
        if (!address) return;

        // For delivery, we combine fullAddress and area
        const deliveryAddress = `${address.fullAddress}${address.area ? ', ' + address.area : ''}`;

        setFormData({
            name: prefillData?.name || '',
            phone: address.phoneNumber || '',
            email: prefillData?.email || '',
            address: deliveryAddress,
            city: address.city || 'Dhaka',
            zip: '1200', // Default Dhaka ZIP code
            notes: '',
            deliveryTime: 'standard',
        });

        setSelectedAddressId(address.id);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const getAddressIcon = (type) => {
        switch (type?.toLowerCase()) {
            case 'home':
                return <Home size={16} />;
            case 'work':
                return <Briefcase size={16} />;
            case 'other':
            default:
                return <ShoppingBag size={16} />;
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Delivery Details</h2>

            {/* Saved Addresses Section */}
            {savedAddresses && savedAddresses.length > 0 && (
                <div className="mb-6 border-2 border-yellow-200 rounded-lg overflow-hidden">
                    <div className="bg-yellow-50 p-3 border-b border-yellow-200">
                        <h3 className="font-medium flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            Select a Saved Address
                        </h3>
                    </div>

                    <div className="p-3 grid gap-3">
                        {savedAddresses.map(address => (
                            <label
                                key={address.id}
                                className={`flex items-start border rounded-lg p-3 cursor-pointer transition-colors ${selectedAddressId === address.id
                                        ? 'bg-blue-50 border-blue-300'
                                        : 'bg-white border-gray-200 hover:bg-gray-50'
                                    }`}
                            >
                                <input
                                    type="radio"
                                    name="savedAddress"
                                    className="mt-1 mr-3"
                                    checked={selectedAddressId === address.id}
                                    onChange={() => handleAddressSelect(address)}
                                />
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center justify-center w-5 h-5 rounded-full bg-gray-200">
                                            {getAddressIcon(address.type)}
                                        </div>
                                        <span className="font-medium text-sm">{address.type}</span>
                                        {address.isDefault && (
                                            <span className="bg-green-100 text-green-800 text-xs px-1.5 py-0.5 rounded">
                                                Default
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm mt-1">{address.fullAddress}</p>
                                    <p className="text-sm text-gray-500">{address.area}, {address.city}</p>
                                    <p className="text-sm text-gray-600 mt-1">{address.phoneNumber}</p>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>
            )}

            {/* Form Fields - Hidden when address selected */}
            {!selectedAddressId && (
                <div className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full Name*</label>
                        <input
                            id="name"
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className={`w-full p-2 border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-md`}
                            required
                        />
                        {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                    </div>

                    <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone Number*</label>
                        <input
                            id="phone"
                            type="text"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            className={`w-full p-2 border ${errors.phone ? 'border-red-500' : 'border-gray-300'} rounded-md`}
                            required
                        />
                        {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
                    </div>

                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                        <input
                            id="email"
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full p-2 border border-gray-300 rounded-md"
                        />
                    </div>

                    <div>
                        <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">Delivery Address*</label>
                        <textarea
                            id="address"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            className={`w-full p-2 border ${errors.address ? 'border-red-500' : 'border-gray-300'} rounded-md`}
                            rows="3"
                            required
                        ></textarea>
                        {errors.address && <p className="mt-1 text-xs text-red-500">{errors.address}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">City*</label>
                            <select
                                id="city"
                                name="city"
                                value={formData.city}
                                onChange={handleChange}
                                className={`w-full p-2 border ${errors.city ? 'border-red-500' : 'border-gray-300'} rounded-md`}
                                required
                            >
                                <option value="Dhaka">Dhaka</option>
                                <option value="Chittagong">Chittagong</option>
                                <option value="Sylhet">Sylhet</option>
                                <option value="Khulna">Khulna</option>
                                <option value="Rajshahi">Rajshahi</option>
                            </select>
                            {errors.city && <p className="mt-1 text-xs text-red-500">{errors.city}</p>}
                        </div>

                        <div>
                            <label htmlFor="zip" className="block text-sm font-medium text-gray-700 mb-1">ZIP Code*</label>
                            <input
                                id="zip"
                                type="text"
                                name="zip"
                                value={formData.zip}
                                onChange={handleChange}
                                className={`w-full p-2 border ${errors.zip ? 'border-red-500' : 'border-gray-300'} rounded-md`}
                                required
                            />
                            {errors.zip && <p className="mt-1 text-xs text-red-500">{errors.zip}</p>}
                        </div>
                    </div>
                </div>
            )}

            {/* Always visible options */}
            <div className="space-y-4 mt-6">
                <div>
                    <label htmlFor="deliveryTime" className="block text-sm font-medium text-gray-700 mb-1">
                        Delivery Time
                    </label>
                    <select
                        id="deliveryTime"
                        name="deliveryTime"
                        value={formData.deliveryTime}
                        onChange={handleChange}
                        className="w-full p-2 border border-gray-300 rounded-md"
                    >
                        <option value="standard">Standard Delivery (Within 24hrs)</option>
                        <option value="express">Express Delivery (3-5 hrs, +৳50)</option>
                    </select>
                </div>

                <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                        Delivery Notes (Optional)
                    </label>
                    <textarea
                        id="notes"
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        className="w-full p-2 border border-gray-300 rounded-md"
                        rows="2"
                        placeholder="Any special instructions for delivery?"
                    ></textarea>
                </div>
            </div>

            {/* Order Summary */}
            {selectedAddressId && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <h3 className="font-medium text-sm mb-2">Your Delivery Information</h3>
                    <div className="grid grid-cols-1 gap-1 text-sm">
                        <div><span className="font-medium">Name:</span> {formData.name}</div>
                        <div><span className="font-medium">Phone:</span> {formData.phone}</div>
                        <div><span className="font-medium">Address:</span> {formData.address}</div>
                    </div>
                </div>
            )}

            <div className="mt-6">
                <button
                    type="submit"
                    disabled={isProcessing}
                    className={`w-full py-3 px-4 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-medium rounded-md flex justify-center ${isProcessing ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                    {isProcessing ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing...
                        </>
                    ) : (
                        'Place Order'
                    )}
                </button>
            </div>
        </form>
    );
}