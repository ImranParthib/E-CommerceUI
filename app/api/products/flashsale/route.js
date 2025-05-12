import { promises as fs } from 'fs';
import path from 'path';

// Improved cache settings
let cachedData = null;
let lastFetchTime = 0;
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

export async function GET(request) {
    const now = Date.now();

    // Return cached data if it's still fresh
    if (cachedData && (now - lastFetchTime) < CACHE_DURATION) {
        return new Response(JSON.stringify(cachedData), {
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'public, max-age=600', // 10 minutes
                'X-Cache': 'HIT'
            },
        });
    }

    try {
        // Read flash sales data from the JSON file
        const filePath = path.join(process.cwd(), 'app/data/flashSales.json');
        const fileContents = await fs.readFile(filePath, 'utf8');
        const data = JSON.parse(fileContents);

        // Add category marker to each product
        const productsWithCategory = data.products.map(product => ({
            ...product,
            category: 'flash-sales'
        }));

        // Update cache
        cachedData = productsWithCategory;
        lastFetchTime = now;

        return new Response(JSON.stringify(productsWithCategory), {
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'public, max-age=600', // 10 minutes
                'X-Cache': 'MISS'
            },
        });
    } catch (error) {
        console.error('Error loading flash sale products:', error);
        return new Response(JSON.stringify({
            error: 'Failed to load flash sale products',
            message: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
