'use client';
import React from 'react';

import { useSidebar } from '@/app/context/SidebarContext';

export default function PaymentHistory() {
    const { isSidebarOpen } = useSidebar();
    return (
        <main className={`transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-0'} pt-16`}>
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-2xl font-bold mb-4">
                    Payment History
                </h1>
                <div className="payment-history-list bg-white shadow-md rounded p-4">
                    <p>No payment history available.</p>
                </div>
            </div>
        </main>
    );
}
