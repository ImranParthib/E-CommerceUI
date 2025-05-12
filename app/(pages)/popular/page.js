"use client";
import React from 'react'
import { useSidebar } from '../../context/SidebarContext';
import PopularItem from '@/app/components/Popular/Popular';


const PopularProduct = () => {
    const { isSidebarOpen } = useSidebar();
    return (
        <main className={`transition-all bg-white duration-300 ${isSidebarOpen ? 'ml-0 sm:ml-60' : 'ml-0'} pt-16`}>
            <div className="container mx-auto">

                <PopularItem />

            </div>
        </main>
    )
}

export default PopularProduct;

