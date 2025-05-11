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
import { OrderSyncProvider } from './context/OrderSyncContext';


const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

export const metadata = {
  title: {
    default: "Kenakata - Easy Online Shopping",
    template: "%s | Kenakata",
  },
  description: "Bangladesh's largest growing online shopping store with fast delivery",
  keywords: ["grocery", "online shopping", "bangladesh", "delivery", "supermarket"],
  authors: [{ name: "Kenakata" }],
  creator: "Kenakata Limited",
  metadataBase: new URL("https://onlinekenakata.vercel.app"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://onlinekenakata.vercel.app",
    title: "Kenakata - Online Grocery Shopping & Delivery",
    description: "Bangladesh's largest online grocery store",
    siteName: "Kenakata",
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
                        <OrderSyncProvider>
                          <div className="relative">
                            <div id="page-wrapper" className="transition-[margin] duration-300">
                              <NavBar />
                              <div className="flex min-h-screen pt-10">
                                <SideNavigation />
                                <main className="flex-1 w-full">
                                  {children}
                                </main>
                              </div>
                            </div>
                            <StickyCart />
                          </div>
                        </OrderSyncProvider>
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
