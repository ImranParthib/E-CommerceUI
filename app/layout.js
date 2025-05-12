import { Geist } from "next/font/google";
import "./globals.css";
import { SidebarProvider } from "./context/SidebarContext";
import NavBar from "./components/NavBar/NavBar";
import SideNavigation from "./components/SideNavigation/SideNavigation";
import StickyCart from "./components/StickyCart/StickyCart";
import { CartProvider } from "./context/CartContext";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { OrderProvider } from './context/OrderContext';
import { OrdersProvider } from './context/OrdersContext';
import { FavoritesProvider } from './context/FavoritesContext';
import { UserProfileProvider } from './context/UserProfileContext';
import { CategoryProvider } from './context/CategoryContext';
import { SWRConfig } from 'swr';

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

export const metadata = {
  title: {
    default: "Chaldal - Online Grocery Shopping & Delivery",
    template: "%s | Chaldal",
  },
  description: "Bangladesh's largest online grocery store with over 15000 products",
  keywords: ["grocery", "online shopping", "bangladesh", "delivery", "supermarket"],
  authors: [{ name: "Chaldal" }],
  creator: "Chaldal Limited",
  metadataBase: new URL("https://chaldal.com"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://chaldal.com",
    title: "Chaldal - Online Grocery Shopping & Delivery",
    description: "Bangladesh's largest online grocery store",
    siteName: "Chaldal",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${geist.variable} bg-white `}>
      <body className="antialiased bg-white">
        <SWRConfig value={{
          revalidateOnFocus: false,
          errorRetryCount: 3,
        }}>
          <CartProvider>
            <OrderProvider>
              <SidebarProvider>
                <OrdersProvider>
                  <FavoritesProvider>
                    <UserProfileProvider>
                      <CategoryProvider>
                        <div className="relative">
                          <div id="page-wrapper" className="transition-[margin] duration-300">
                            <NavBar />
                            <div className="flex min-h-screen">
                              <SideNavigation />
                              <main className="flex-1">
                                {children}
                              </main>
                            </div>
                          </div>
                          <StickyCart />
                        </div>
                      </CategoryProvider>
                    </UserProfileProvider>
                  </FavoritesProvider>
                </OrdersProvider>
              </SidebarProvider>
            </OrderProvider>
          </CartProvider>
        </SWRConfig>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </body>
    </html>
  );
}
