import { NextResponse } from 'next/server';
import productsData from '@/app/data/products.json';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
        return NextResponse.json({ products: [] });
    }

    const filteredProducts = productsData.products.filter(product =>
        product.name.toLowerCase().includes(query.toLowerCase())
    );

    return NextResponse.json({ products: filteredProducts });
}