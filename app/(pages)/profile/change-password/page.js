'use client';
import React from 'react';
import { useSidebar } from '@/app/context/SidebarContext';

export default function ChangePassword() {
    const { isSidebarOpen } = useSidebar();
    return (
        <main className={`transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-0'} pt-16`}>
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-2xl font-bold mb-4">
                    Change Password
                </h1>
                <div className="bg-white shadow-md rounded p-6">
                    <div className="mb-6 text-center text-gray-600">
                        <p>Password changes are not necessary as we are using Google authentication.</p>
                    </div>
                </div>
            </div>
        </main>
    );
}
