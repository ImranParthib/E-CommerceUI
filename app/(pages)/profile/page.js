'use client';

import { useEffect, useState } from 'react';
import { useSidebar } from '@/app/context/SidebarContext';
import { useUserProfile } from '@/app/context/UserProfileContext';
import { auth } from '@/lib/firebase';
import { toast } from 'react-toastify';
import { Home, Briefcase, ShoppingBag, PlusCircle, Edit2, Trash2, CheckCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import LoginModal from '@/app/components/LoginModal/LoginModal';

export default function ProfilePage() {
	const { isSidebarOpen } = useSidebar();
	const {
		userProfile,
		isLoading: profileLoading,
		error,
		updateProfile,
		addAddress,
		updateAddress,
		removeAddress,
		setDefaultAddress
	} = useUserProfile();

	const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
	const [isAddingAddress, setIsAddingAddress] = useState(false);
	const [isEditingAddress, setIsEditingAddress] = useState(null);
	const [formData, setFormData] = useState({
		phoneNumber: '',
		gender: '',
		dateOfBirth: '',
	});
	const [addressForm, setAddressForm] = useState({
		fullAddress: '',
		city: 'Dhaka',
		area: '',
		type: 'Home',
		phoneNumber: '',
	});
	const [edited, setEdited] = useState(false);
	const [authChecking, setAuthChecking] = useState(true);
	const [authUser, setAuthUser] = useState(null);

	// Set initial form data when userProfile changes
	useEffect(() => {
		if (userProfile) {
			setFormData({
				phoneNumber: userProfile.phoneNumber || '',
				gender: userProfile.gender || '',
				dateOfBirth: userProfile.dateOfBirth || '',
			});
		}
	}, [userProfile]);

	// Auth state listener
	useEffect(() => {
		const unsubscribe = auth.onAuthStateChanged((user) => {
			setAuthUser(user);
			setAuthChecking(false);
			if (!user) {
				setIsLoginModalOpen(true);
			}
		});

		return () => unsubscribe();
	}, []);

	const handleInputChange = (e) => {
		const { name, value } = e.target;
		setFormData({
			...formData,
			[name]: value,
		});
		setEdited(true);
	};

	const handleAddressFormChange = (e) => {
		const { name, value } = e.target;
		setAddressForm({
			...addressForm,
			[name]: value,
		});
	};

	const handleProfileSubmit = (e) => {
		e.preventDefault();
		updateProfile(formData);
		setEdited(false);
	};

	const handleAddAddress = (e) => {
		e.preventDefault();

		if (!addressForm.fullAddress || !addressForm.area || !addressForm.phoneNumber) {
			toast.error('Please fill in all required fields');
			return;
		}

		addAddress(addressForm);
		setAddressForm({
			fullAddress: '',
			city: 'Dhaka',
			area: '',
			type: 'Home',
			phoneNumber: '',
		});
		setIsAddingAddress(false);
	};

	const handleEditAddress = (address) => {
		setIsEditingAddress(address.id);
		setAddressForm({
			fullAddress: address.fullAddress || '',
			city: address.city || 'Dhaka',
			area: address.area || '',
			type: address.type || 'Home',
			phoneNumber: address.phoneNumber || '',
		});
		setIsAddingAddress(true);
	};

	const handleUpdateAddress = (e) => {
		e.preventDefault();

		if (!addressForm.fullAddress || !addressForm.area || !addressForm.phoneNumber) {
			toast.error('Please fill in all required fields');
			return;
		}

		updateAddress(isEditingAddress, addressForm);
		setAddressForm({
			fullAddress: '',
			city: 'Dhaka',
			area: '',
			type: 'Home',
			phoneNumber: '',
		});
		setIsAddingAddress(false);
		setIsEditingAddress(null);
	};

	const handleDeleteAddress = (addressId) => {
		if (confirm('Are you sure you want to delete this address?')) {
			removeAddress(addressId);
		}
	};

	const getAddressIcon = (type) => {
		switch (type.toLowerCase()) {
			case 'home':
				return <Home size={16} />;
			case 'work':
				return <Briefcase size={16} />;
			case 'other':
			default:
				return <ShoppingBag size={16} />;
		}
	};

	// Show loading state when checking auth
	if (authChecking) {
		return (
			<main className={`transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-0'} pt-16`}>
				<div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
					<div className="text-center">
						<Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-500" />
						<p className="mt-2 text-gray-600">Loading profile...</p>
					</div>
				</div>
			</main>
		);
	}

	if (!authUser) {
		return (
			<main className={`transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-0'} pt-16`}>
				<div className="container mx-auto px-4 py-8 text-center">
					<h1 className="text-2xl font-semibold mb-4">Please log in to view your profile</h1>
					<button
						onClick={() => setIsLoginModalOpen(true)}
						className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
					>
						Log In
					</button>
					<LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
				</div>
			</main>
		);
	}

	// Show error message if there's an error from the userProfile context
	if (error) {
		return (
			<main className={`transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-0'} pt-16`}>
				<div className="container mx-auto px-4 py-8 text-center">
					<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
						<p>Error loading profile: {error}</p>
						<button
							onClick={() => window.location.reload()}
							className="mt-2 text-sm underline hover:text-red-800"
						>
							Try again
						</button>
					</div>
				</div>
			</main>
		);
	}

	return (
		<main className={`transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-0'} pt-16`}>
			<div className="container mx-auto px-4 py-6 bg-white">
				<h1 className="text-2xl font-semibold mb-6 text-gray-700">Your Profile</h1>

				{userProfile && !profileLoading ? (
					<div className="space-y-6 max-w-3xl mx-auto">
						<form onSubmit={handleProfileSubmit}>
							{/* Name */}
							<div className="border-b pb-4">
								<label className="text-sm text-gray-600 block mb-1">Name</label>
								<p className="text-base">{userProfile.displayName || authUser.displayName || "User"}</p>
							</div>

							{/* Email */}
							<div className="border-b py-4">
								<label className="text-sm text-gray-600 block mb-1">Email Address</label>
								<div className="flex justify-between items-center">
									<p className="text-base">{userProfile.email || authUser.email}</p>
									{authUser && !authUser.emailVerified && (
										<button
											type="button"
											className="bg-red-400 hover:bg-red-500 text-white px-6 py-1 rounded text-sm"
										>
											VERIFY
										</button>
									)}
								</div>
								{authUser && !authUser.emailVerified && (
									<div className="flex items-center gap-2 text-sm text-green-500 mt-2">
										<span>🎁</span>
										<span>Verify your email address & Get 1 free delivery</span>
									</div>
								)}
							</div>

							{/* Phone Number */}
							<div className="border-b py-4">
								<label htmlFor="phoneNumber" className="text-sm text-gray-600 block mb-1">Phone Number</label>
								<input
									id="phoneNumber"
									name="phoneNumber"
									type="text"
									value={formData.phoneNumber}
									onChange={handleInputChange}
									placeholder="+8801XXXXXXXXX"
									className="mt-1 w-full p-3 border border-gray-200 rounded text-base focus:border-blue-500 focus:ring focus:ring-blue-200"
								/>
							</div>

							{/* Gender */}
							<div className="border-b py-4">
								<label htmlFor="gender" className="text-sm text-gray-600 block mb-1">Gender</label>
								<select
									id="gender"
									name="gender"
									value={formData.gender}
									onChange={handleInputChange}
									className="mt-1 w-full p-3 border border-gray-200 rounded text-base focus:border-blue-500 focus:ring focus:ring-blue-200"
								>
									<option value="">Select Gender</option>
									<option value="Male">Male</option>
									<option value="Female">Female</option>
									<option value="Other">Other</option>
								</select>
							</div>

							{/* Date of Birth */}
							<div className="border-b py-4">
								<label htmlFor="dateOfBirth" className="text-sm text-gray-600 block mb-1">Date of Birth</label>
								<input
									id="dateOfBirth"
									name="dateOfBirth"
									type="date"
									value={formData.dateOfBirth}
									onChange={handleInputChange}
									className="mt-1 w-full p-3 border border-gray-200 rounded text-base focus:border-blue-500 focus:ring focus:ring-blue-200"
								/>
							</div>

							{/* Submit Button */}
							{edited && (
								<div className="py-4 flex justify-center">
									<button
										type="submit"
										className="bg-yellow-300 hover:bg-yellow-400 text-gray-900 font-medium px-6 py-2 rounded transition-colors"
									>
										Save Changes
									</button>
								</div>
							)}
						</form>

						{/* Address Book */}
						<div className="border rounded-lg mt-8">
							<div className="p-4 border-b flex items-center gap-2 bg-gray-50">
								<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path d="M12 13.5C13.933 13.5 15.5 11.933 15.5 10C15.5 8.067 13.933 6.5 12 6.5C10.067 6.5 8.5 8.067 8.5 10C8.5 11.933 10.067 13.5 12 13.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
									<path d="M12 22C16 18 20 14.4183 20 10C20 5.58172 16.4183 2 12 2C7.58172 2 4 5.58172 4 10C4 14.4183 8 18 12 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
								</svg>
								<span className="font-medium">Address Book</span>
							</div>

							<div className="p-4">
								{!isAddingAddress ? (
									<button
										onClick={() => {
											setIsAddingAddress(true);
											setIsEditingAddress(null);
											setAddressForm({
												fullAddress: '',
												city: 'Dhaka',
												area: '',
												type: 'Home',
												phoneNumber: userProfile.phoneNumber || '',
											});
										}}
										className="w-full border border-gray-300 rounded p-3 flex justify-center items-center gap-2 hover:bg-gray-50 transition-colors"
									>
										<PlusCircle size={18} />
										<span>Add New Address</span>
									</button>
								) : (
									<div className="border rounded-lg p-4 bg-gray-50 mb-4">
										<h3 className="font-medium mb-3">
											{isEditingAddress ? 'Edit Address' : 'Add New Address'}
										</h3>
										<form onSubmit={isEditingAddress ? handleUpdateAddress : handleAddAddress}>
											<div className="space-y-3">
												<div>
													<label htmlFor="type" className="text-sm text-gray-600 block mb-1">Address Type</label>
													<select
														id="type"
														name="type"
														value={addressForm.type}
														onChange={handleAddressFormChange}
														className="w-full p-2 border border-gray-200 rounded"
													>
														<option value="Home">Home</option>
														<option value="Work">Work</option>
														<option value="Other">Other</option>
													</select>
												</div>

												<div>
													<label htmlFor="fullAddress" className="text-sm text-gray-600 block mb-1">Full Address*</label>
													<input
														id="fullAddress"
														name="fullAddress"
														type="text"
														value={addressForm.fullAddress}
														onChange={handleAddressFormChange}
														placeholder="House/Flat/Road number, Area"
														className="w-full p-2 border border-gray-200 rounded"
														required
													/>
												</div>

												<div className="grid grid-cols-2 gap-3">
													<div>
														<label htmlFor="city" className="text-sm text-gray-600 block mb-1">City</label>
														<select
															id="city"
															name="city"
															value={addressForm.city}
															onChange={handleAddressFormChange}
															className="w-full p-2 border border-gray-200 rounded"
														>
															<option value="Dhaka">Dhaka</option>
															<option value="Chittagong">Chittagong</option>
															<option value="Sylhet">Sylhet</option>
															<option value="Khulna">Khulna</option>
															<option value="Rajshahi">Rajshahi</option>
														</select>
													</div>

													<div>
														<label htmlFor="area" className="text-sm text-gray-600 block mb-1">Area*</label>
														<input
															id="area"
															name="area"
															type="text"
															value={addressForm.area}
															onChange={handleAddressFormChange}
															placeholder="Area/District"
															className="w-full p-2 border border-gray-200 rounded"
															required
														/>
													</div>
												</div>

												<div>
													<label htmlFor="addressPhone" className="text-sm text-gray-600 block mb-1">Contact Phone*</label>
													<input
														id="addressPhone"
														name="phoneNumber"
														type="text"
														value={addressForm.phoneNumber}
														onChange={handleAddressFormChange}
														placeholder="+8801XXXXXXXXX"
														className="w-full p-2 border border-gray-200 rounded"
														required
													/>
												</div>

												<div className="flex gap-3 pt-2">
													<button
														type="submit"
														className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded"
													>
														{isEditingAddress ? 'Update Address' : 'Save Address'}
													</button>

													<button
														type="button"
														onClick={() => {
															setIsAddingAddress(false);
															setIsEditingAddress(null);
														}}
														className="flex-1 border border-gray-300 py-2 rounded hover:bg-gray-100"
													>
														Cancel
													</button>
												</div>
											</div>
										</form>
									</div>
								)}

								{/* Display Existing Addresses */}
								<div className="space-y-4 mt-4">
									{userProfile?.addresses && userProfile.addresses.length > 0 ? (
										userProfile.addresses.map((address) => (
											<div key={address.id} className={`border rounded-lg p-4 ${address.isDefault ? 'bg-green-50 border-green-200' : 'bg-white'}`}>
												<div className="flex items-start justify-between">
													<div className="flex items-start gap-2">
														<div className="mt-1.5">
															<div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-200">
																{getAddressIcon(address.type)}
															</div>
														</div>

														<div>
															<div className="flex items-center gap-2">
																<p className="font-medium text-sm">{address.type}</p>
																{address.isDefault && (
																	<span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded">
																		Default
																	</span>
																)}
															</div>
															<p className="text-sm mt-1">{address.fullAddress}, {address.area}, {address.city}</p>
															<p className="text-sm text-gray-600 mt-1">{address.phoneNumber}</p>
														</div>
													</div>

													<div className="flex flex-col gap-2">
														<div className="flex gap-2 text-sm">
															<button
																onClick={() => handleEditAddress(address)}
																className="text-blue-500 hover:text-blue-700"
															>
																<Edit2 size={16} />
															</button>
															<button
																onClick={() => handleDeleteAddress(address.id)}
																className="text-red-500 hover:text-red-700"
															>
																<Trash2 size={16} />
															</button>
														</div>
														{!address.isDefault && (
															<button
																onClick={() => setDefaultAddress(address.id)}
																className="text-xs text-gray-500 hover:text-gray-700 mt-1 flex items-center gap-1"
															>
																<CheckCircle size={14} />
																Set Default
															</button>
														)}
													</div>
												</div>
											</div>
										))
									) : (
										<p className="text-center text-gray-500 py-4">No saved addresses found</p>
									)}
								</div>
							</div>
						</div>
					</div>
				) : (
					<div className="flex justify-center py-8">
						<div className="animate-pulse flex space-x-4">
							<div className="rounded-full bg-gray-200 h-10 w-10"></div>
							<div className="flex-1 space-y-6 py-1">
								<div className="h-2 bg-gray-200 rounded"></div>
								<div className="space-y-3">
									<div className="grid grid-cols-3 gap-4">
										<div className="h-2 bg-gray-200 rounded col-span-2"></div>
										<div className="h-2 bg-gray-200 rounded col-span-1"></div>
									</div>
									<div className="h-2 bg-gray-200 rounded"></div>
								</div>
							</div>
						</div>
					</div>
				)}
			</div>
		</main>
	);
}