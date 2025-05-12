'use client';  // Add this line at the top

import React from 'react';
import { AlertCircle } from 'lucide-react';
import { useSidebar } from '@/app/context/SidebarContext';

export default function DairyProduct() {
    const { isSidebarOpen } = useSidebar();
    return (
        <div className={`${isSidebarOpen ? 'ml-60' : 'ml-0'} transition-all duration-300 bg-yellow-50 text-slate-900 min-h-screen flex flex-col items-center justify-center`}>
            <AlertCircle className='w-16 h-16 mb-4' />
            <h1 className='text-4xl font-bold mb-2'>Dairy Products</h1>
            <p className='text-xl'>Coming Soon!</p>
        </div>
    );
}