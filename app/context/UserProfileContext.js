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

    // Fetch user profile on auth state change
    useEffect(() => {
        let isMounted = true;
        setError(null); // Reset error state on auth change

        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (!isMounted) return;

            if (user) {
                try {
                    await fetchUserProfile(user.uid);
                } catch (error) {
                    console.error('Error fetching user profile:', error);
                    if (isMounted) {
                        setError('Failed to load user profile. Please try again.');
                        setIsLoading(false);
                    }
                }
            } else {
                if (isMounted) {
                    setUserProfile(null);
                    setIsLoading(false);
                }
            }
        });

        return () => {
            isMounted = false;
            unsubscribe();
        };
    }, [retryCount]); // Add retryCount to dependencies to allow refreshing this effect

    const fetchUserProfile = async (uid) => {
        setIsLoading(true);
        setError(null);

        try {
            // Get profile from localStorage
            const savedProfile = localStorage.getItem(`${USER_PROFILE_STORAGE_KEY}_${uid}`);

            if (savedProfile) {
                setUserProfile(JSON.parse(savedProfile));
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
                    createdAt: new Date().toISOString(),
                };

                // Save the new profile to localStorage
                localStorage.setItem(`${USER_PROFILE_STORAGE_KEY}_${uid}`, JSON.stringify(newProfile));
                setUserProfile(newProfile);
            }
        } catch (error) {
            console.error('Error loading user profile:', error);
            setError('Failed to load profile data');
        } finally {
            setIsLoading(false);
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
        <UserProfileContext.Provider value={{
            userProfile,
            isLoading,
            error,
            updateProfile,
            addAddress,
            updateAddress,
            removeAddress,
            setDefaultAddress,
            getDefaultAddress
        }}>
            {children}
        </UserProfileContext.Provider>
    );
}
