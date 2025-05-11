# E-Commerce App - Kenakata Clone

![Kenakata Clone](https://img.shields.io/badge/Project-Kenakata%20Clone-yellow)
![Status](https://img.shields.io/badge/Status-Development-green)
![Private](https://img.shields.io/badge/Access-Private-red)

## Overview

This is a full-featured e-commerce application built with Next.js 15, resembling Kenakata's online grocery platform. The application features a modern, responsive UI with a comprehensive shopping experience including product browsing, cart management, favorites, user profile management, and a complete ordering system.

## 🔒 Private Repository

**Note**: This is a private project developed for Japan Bangla IT. External contributions are not accepted without explicit invitation.

## Features

### Shopping Experience
- **Product Browsing**: Browse through categorized products
- **Flash Sales**: Special time-limited promotional products
- **Popular Items**: Curated selection of best-selling products
- **Search Functionality**: Find products quickly with search
- **Responsive Design**: Works on mobile, tablet, and desktop devices

### User Features
- **Shopping Cart**: Add, remove, and update quantities of items
- **Favorites List**: Save products for later reference
- **User Authentication**: Secure login and registration
- **User Profile**: Manage personal information and addresses
- **Order History**: Track past orders and their statuses

### Checkout Process
- **Multi-step Checkout**: Streamlined purchase flow
- **Saved Addresses**: Quick selection of delivery addresses
- **Payment Options**: Cash on delivery and online payment integration
- **Order Management**: View and track orders
- **Order Cancellation**: Option to cancel pending orders

## Tech Stack

- **Frontend**: 
  - [Next.js 15](https://nextjs.org/) - React framework with App Router
  - [React 19](https://react.dev/) - UI library
  - [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
  - [Headless UI](https://headlessui.com/) - Unstyled accessible components
  - [Framer Motion](https://www.framer.com/motion/) - Animation library

- **State Management**:
  - Context API for global state
  - SWR for data fetching and caching

- **Authentication**: 
  - Firebase Authentication

- **Icons and UI**:
  - Lucide React
  - React Icons
  - Geist Font

- **Utilities**:
  - React Toastify for notifications
  - Date-fns for date formatting

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository (requires access)
git clone <repository_url>

# Navigate to the project directory
cd e-commerce-app

# Install dependencies
npm install
# or
yarn install

# Start the development server
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Project Structure
```
e-commerce-app/
├── app/                     # Next.js App Router
│   ├── (pages)/             # Route groups for pages
│   │   ├── checkout/        # Checkout process pages
│   │   ├── favourites/      # User favorites
│   │   ├── flash-sales/     # Flash sales page
│   │   ├── food/            # Food category pages
│   │   ├── popular/         # Popular items page
│   │   ├── profile/         # User profile pages
│   │   ├── search/          # Search results
│   ├── api/                 # API routes
│   ├── components/          # Shared components
│   │   ├── DeliveryForm/    # Checkout form component
│   │   ├── Features/        # Features display component
│   │   ├── FlashSales/      # Flash sales component
│   │   ├── Footer/          # Footer component
│   │   ├── HomeProducts/    # Home page products component
│   │   ├── LoginModal/      # Login modal component
│   │   ├── NavBar/          # Navigation bar component
│   │   ├── OrderDetailsModal/ # Order details modal
│   │   ├── Popular/         # Popular items component
│   │   ├── ProductCard/     # Product card component
│   │   ├── SideNavigation/  # Side navigation component
│   │   └── StickyCart/      # Sticky cart component
│   ├── context/             # React context providers
│   │   ├── CartContext.js   # Shopping cart context
│   │   ├── CategoryContext.js # Product categories context
│   │   ├── FavoritesContext.js # User favorites context
│   │   ├── OrderContext.js  # Order management context
│   │   ├── SidebarContext.js # Sidebar state context
│   │   └── UserProfileContext.js # User profile context
│   ├── data/                # Mock data files
│   ├── globals.css          # Global styles
│   └── layout.js            # Root layout
├── lib/                     # Utility functions and libraries
│   └── firebase.js          # Firebase configuration
├── public/                  # Static assets
└── README.md                # Project documentation
```


 
