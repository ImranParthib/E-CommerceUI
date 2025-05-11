import { NextResponse } from 'next/server';

// This is a mock data - replace with actual database query
const mockOffers = [
    {
        id: 1,
        title: "Summer Special",
        description: "Get amazing deals on summer collection",
        image: "/images/offers/summer-special.jpg",
        originalPrice: 99.99,
        discountedPrice: 69.99,
        discount: 30
    },
    {
        id: 2,
        title: "Flash Sale",
        description: "Limited time offer on selected items",
        image: "/images/offers/flash-sale.jpg",
        originalPrice: 149.99,
        discountedPrice: 99.99,
        discount: 33
    },
    // Add more mock offers as needed
];

export async function GET() {
    try {
        // TODO: Replace with actual database query
        return NextResponse.json(mockOffers);
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to fetch offers' },
            { status: 500 }
        );
    }
} 