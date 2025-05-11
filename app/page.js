'use client';

import { useCallback } from 'react';
import dynamic from 'next/dynamic';
import NavBar from "./components/NavBar/NavBar";
import Banner from "./components/Banner/Banner";
import Features from "./components/Features/Features";
import BrandShowcase from "./components/BrandShowcase/BrandShowcase";
import { useSidebar } from './context/SidebarContext';


// Dynamically import heavy components
const SideNavigation = dynamic(() => import("./components/SideNavigation/SideNavigation"));
const Footer = dynamic(() => import("./components/Footer/Footer"));

export default function Home() {
  const { isSidebarOpen, toggleSidebar } = useSidebar();

  return (
    <div className="min-h-screen bg-white">
      <NavBar onMenuClick={toggleSidebar} />
      <SideNavigation />
      <div className={`transition-all duration-300 ${isSidebarOpen ? 'sm:ml-60' : 'ml-0'}`}>
        <main>
          <Banner />
          <BrandShowcase />
          <Features />
          <Footer />
        </main>
      </div>
    </div>
  );
}
