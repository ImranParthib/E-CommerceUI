'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { toast } from 'react-toastify';

const UserProfileContext = createContext();
const USER_PROFILE_STORAGE_KEY = 'user_profile_data';

export const useUserProfile = () => useContext(UserProfileContext);

export function UserProfileProvider({ children }) {
    const [userProfile, setUserProfile] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [retryCount, setRetryCount] = useState(0);

    // Load and initialize user profile
    useEffect(() => {
        const loadProfile = async () => {
            if (!auth.currentUser) {
                setIsLoading(false);
                return;
            }

            setIsLoading(true);

            try {
                const uid = auth.currentUser.uid;

                // First, try to get profile from localStorage as a fallback
                const savedProfile = localStorage.getItem(`${USER_PROFILE_STORAGE_KEY}_${uid}`);
                if (savedProfile) {
                    setUserProfile(JSON.parse(savedProfile));
                }

                // Then, try to fetch profile from WooCommerce for the most up-to-date data
                await fetchProfileFromWooCommerce(uid);

            } catch (error) {
                console.error('Error loading user profile:', error);
                setError('Failed to load profile data');
            } finally {
                setIsLoading(false);
            }
        };

        loadProfile();
    }, [retryCount]); // Add retryCount to dependencies to allow refreshing this effect

    const fetchProfileFromWooCommerce = async (uid) => {
        try {
            // Fetch customer data from WooCommerce by Firebase UID
            const response = await fetch(`/api/customers/woocommerce/fetch?firebase_uid=${uid}`);
            const result = await response.json();

            if (response.ok && result.success && result.customer) {
                // Get local profile for merging
                const savedProfile = localStorage.getItem(`${USER_PROFILE_STORAGE_KEY}_${uid}`);
                const localProfile = savedProfile ? JSON.parse(savedProfile) : null;

                // Create a merged profile, preferring WooCommerce data but keeping local-only data
                const wcProfile = result.customer;
                const mergedProfile = {
                    uid,
                    woocommerceId: wcProfile.id,
                    email: wcProfile.email,
                    displayName: wcProfile.displayName,
                    phoneNumber: wcProfile.phoneNumber,
                    addresses: wcProfile.addresses || [],
                    // Keep any other local data that might not be in WooCommerce
                    ...localProfile,
                    // Preserve Firebase auth data
                    uid,
                    email: auth.currentUser.email || wcProfile.email,
                    displayName: auth.currentUser.displayName || wcProfile.displayName,
                    // Add sync info
                    woocommerceData: {
                        lastSynced: new Date().toISOString(),
                        isNew: false
                    }
                };

                // Update state and localStorage
                localStorage.setItem(`${USER_PROFILE_STORAGE_KEY}_${uid}`, JSON.stringify(mergedProfile));
                setUserProfile(mergedProfile);

                return mergedProfile;
            } else if (!result.success) {
                console.warn('Could not find customer in WooCommerce, will create one:', result.message);
                await syncWooCommerceCustomer({
                    uid,
                    email: auth.currentUser.email,
                    displayName: auth.currentUser.displayName,
                    phoneNumber: ''
                });
            }
        } catch (error) {
            console.error('Error fetching profile from WooCommerce:', error);
            // Don't throw here - we'll fall back to local data
        }

        return null;
    };

    const fetchUserProfile = async (uid) => {
        setIsLoading(true);
        setError(null);

        try {
            // First check localStorage for faster loading
            const savedProfile = localStorage.getItem(`${USER_PROFILE_STORAGE_KEY}_${uid}`);

            if (savedProfile) {
                setUserProfile(JSON.parse(savedProfile));

                // Try to fetch updated data from WooCommerce in the background
                fetchProfileFromWooCommerce(uid).catch(console.error);
            } else {
                // Create a new profile if one doesn't exist
                const newProfile = {
                    uid,
                    displayName: auth.currentUser?.displayName || '',
                    email: auth.currentUser?.email || '',
                    phoneNumber: '',
                    gender: '',
                    dateOfBirth: '',
                    addresses: [],
                    woocommerceId: null, // Add WooCommerce customer ID
                    createdAt: new Date().toISOString(),
                };

                // Save the new profile to localStorage
                localStorage.setItem(`${USER_PROFILE_STORAGE_KEY}_${uid}`, JSON.stringify(newProfile));
                setUserProfile(newProfile);

                // Create a WooCommerce customer for this user
                await syncWooCommerceCustomer({
                    uid,
                    email: auth.currentUser.email,
                    displayName: auth.currentUser.displayName,
                    phoneNumber: ''
                });
            }
        } catch (error) {
            console.error('Error loading user profile:', error);
            setError('Failed to load profile data');
        } finally {
            setIsLoading(false);
        }
    };

    // Function to sync with WooCommerce customer API
    const syncWooCommerceCustomer = async (userData) => {
        try {
            // Call our API route to create or sync WooCommerce customer
            const response = await fetch('/api/customers/sync', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to sync with WooCommerce');
            }

            // If successful, update local profile with WooCommerce customer ID
            if (auth.currentUser) {
                const uid = auth.currentUser.uid;
                const savedProfile = localStorage.getItem(`${USER_PROFILE_STORAGE_KEY}_${uid}`);
                const profile = savedProfile ? JSON.parse(savedProfile) : {};

                const updatedProfile = {
                    ...profile,
                    woocommerceId: data.customer.id,
                    woocommerceData: {
                        lastSynced: new Date().toISOString(),
                        isNew: data.isNew
                    }
                };

                localStorage.setItem(`${USER_PROFILE_STORAGE_KEY}_${uid}`, JSON.stringify(updatedProfile));
                setUserProfile(updatedProfile);

                // Show feedback based on whether customer was created or just synced
                if (data.isNew) {
                    toast.success('Account created successfully!');
                }

                // If we have addresses, sync them with WooCommerce
                if (updatedProfile.addresses && updatedProfile.addresses.length > 0) {
                    syncAddressesWithWooCommerce(updatedProfile.addresses, data.customer.id);
                }
            }

            return data;
        } catch (error) {
            console.error('Error syncing WooCommerce customer:', error);
            toast.error('Account sync failed. You can still use the app.');
            return null;
        }
    };

    // New function to sync addresses with WooCommerce
    const syncAddressesWithWooCommerce = async (addresses, customerId) => {
        if (!addresses || addresses.length === 0 || !customerId) return;

        try {
            // Find the default address
            const defaultAddress = addresses.find(addr => addr.isDefault) || addresses[0];

            // Format address for WooCommerce
            const formattedAddress = {
                customerId,
                address: {
                    first_name: userProfile?.displayName?.split(' ')[0] || '',
                    last_name: userProfile?.displayName?.split(' ').slice(1).join(' ') || '',
                    address_1: defaultAddress.fullAddress || '',
                    city: defaultAddress.city || 'Dhaka',
                    state: 'BD-13', // Dhaka district code for Bangladesh
                    postcode: '1200', // Default Dhaka postcode
                    country: 'BD',
                    phone: defaultAddress.phoneNumber || userProfile?.phoneNumber || '',
                    email: userProfile?.email || auth.currentUser?.email || ''
                }
            };

            // Send to API endpoint
            const response = await fetch('/api/customers/address/sync', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formattedAddress),
            });

            const result = await response.json();

            if (!response.ok) {
                console.warn('Failed to sync address with WooCommerce:', result.message);
            } else {
                console.log('Successfully synced address with WooCommerce');
            }
        } catch (error) {
            console.error('Error syncing addresses with WooCommerce:', error);
        }
    };

    const updateProfile = async (profileData) => {
        if (!auth.currentUser) return;

        try {
            const uid = auth.currentUser.uid;
            const updatedProfile = {
                ...userProfile,
                ...profileData,
                updatedAt: new Date().toISOString()
            };

            // Save to localStorage
            localStorage.setItem(`${USER_PROFILE_STORAGE_KEY}_${uid}`, JSON.stringify(updatedProfile));
            setUserProfile(updatedProfile);
            toast.success('Profile updated successfully');
        } catch (error) {
            console.error('Error updating profile:', error);
            setError('Failed to update profile');
            toast.error('Failed to update profile');
        }
    };

    const addAddress = async (address) => {
        if (!userProfile || !auth.currentUser) return;

        try {
            const uid = auth.currentUser.uid;
            const newAddressId = Date.now().toString();
            const newAddress = {
                id: newAddressId,
                isDefault: userProfile.addresses?.length === 0, // First address is default
                ...address
            };

            const updatedProfile = {
                ...userProfile,
                addresses: [...(userProfile.addresses || []), newAddress]
            };

            // Save to localStorage
            localStorage.setItem(`${USER_PROFILE_STORAGE_KEY}_${uid}`, JSON.stringify(updatedProfile));
            setUserProfile(updatedProfile);
            toast.success('Address added successfully');

            // If we have a WooCommerce customer ID, sync this address
            if (userProfile.woocommerceId && newAddress.isDefault) {
                syncAddressesWithWooCommerce([newAddress], userProfile.woocommerceId);
            }
        } catch (error) {
            console.error('Error adding address:', error);
            setError('Failed to add address');
            toast.error('Failed to add address');
        }
    };

    const updateAddress = async (addressId, addressData) => {
        if (!userProfile || !auth.currentUser) return;

        try {
            const uid = auth.currentUser.uid;
            const addresses = [...(userProfile.addresses || [])];
            const index = addresses.findIndex(addr => addr.id === addressId);

            if (index !== -1) {
                addresses[index] = { ...addresses[index], ...addressData };
            }

            const updatedProfile = { ...userProfile, addresses };

            // Save to localStorage
            localStorage.setItem(`${USER_PROFILE_STORAGE_KEY}_${uid}`, JSON.stringify(updatedProfile));
            setUserProfile(updatedProfile);
            toast.success('Address updated');

            // If this is the default address and we have a WooCommerce customer ID, sync it
            if (addresses[index].isDefault && userProfile.woocommerceId) {
                syncAddressesWithWooCommerce([addresses[index]], userProfile.woocommerceId);
            }
        } catch (error) {
            console.error('Error updating address:', error);
            setError('Failed to update address');
            toast.error('Failed to update address');
        }
    };

    const removeAddress = async (addressId) => {
        if (!userProfile || !auth.currentUser) return;

        try {
            const uid = auth.currentUser.uid;
            const addresses = (userProfile.addresses || []).filter(addr => addr.id !== addressId);

            // If we're removing the default address and there are other addresses left,
            // make the first one the default
            if (addresses.length > 0 && userProfile.addresses.find(addr => addr.id === addressId && addr.isDefault)) {
                addresses[0].isDefault = true;
            }

            const updatedProfile = { ...userProfile, addresses };

            // Save to localStorage
            localStorage.setItem(`${USER_PROFILE_STORAGE_KEY}_${uid}`, JSON.stringify(updatedProfile));
            setUserProfile(updatedProfile);
            toast.success('Address removed');
        } catch (error) {
            console.error('Error removing address:', error);
            setError('Failed to remove address');
            toast.error('Failed to remove address');
        }
    };

    const setDefaultAddress = async (addressId) => {
        if (!userProfile || !auth.currentUser) return;

        try {
            const uid = auth.currentUser.uid;
            const addresses = (userProfile.addresses || []).map(addr => ({
                ...addr,
                isDefault: addr.id === addressId
            }));

            const updatedProfile = { ...userProfile, addresses };

            // Save to localStorage
            localStorage.setItem(`${USER_PROFILE_STORAGE_KEY}_${uid}`, JSON.stringify(updatedProfile));
            setUserProfile(updatedProfile);
            toast.success('Default address updated');

            // If we have a WooCommerce customer ID, sync the new default address
            if (userProfile.woocommerceId) {
                const newDefaultAddress = addresses.find(addr => addr.id === addressId);
                if (newDefaultAddress) {
                    syncAddressesWithWooCommerce([newDefaultAddress], userProfile.woocommerceId);
                }
            }
        } catch (error) {
            console.error('Error setting default address:', error);
            setError('Failed to set default address');
            toast.error('Failed to update default address');
        }
    };

    const getDefaultAddress = () => {
        if (!userProfile || !userProfile.addresses) return null;

        return userProfile.addresses.find(addr => addr.isDefault) ||
            (userProfile.addresses.length > 0 ? userProfile.addresses[0] : null);
    };

    return (
        <UserProfileContext.Provider
            value={{
                userProfile,
                isLoading,
                error,
                fetchUserProfile,
                updateProfile,
                addAddress,
                updateAddress,
                removeAddress,
                setDefaultAddress,
                getDefaultAddress,
                syncWooCommerceCustomer,
                syncAddressesWithWooCommerce,
                fetchProfileFromWooCommerce,
                retryProfileLoad: () => setRetryCount(count => count + 1)
            }}
        >
            {children}
        </UserProfileContext.Provider>
    );
}
