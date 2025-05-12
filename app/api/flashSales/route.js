import { promises as fs } from 'fs';
import path from 'path';

// Enhanced caching setup
let cachedData = null;
let lastFetchTime = 0;
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

export async function GET(request) {
    // Get cache-control header from request
    const cacheControl = request.headers.get('Cache-Control');
    const now = Date.now();
    const cacheExpired = now - lastFetchTime > CACHE_DURATION;

    // Return cached data if valid and no explicit no-cache requested
    if (cachedData && !cacheExpired && !cacheControl?.includes('no-cache')) {
        return new Response(JSON.stringify(cachedData), {
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'public, max-age=600', // 10 minutes
                'X-Cache': 'HIT'
            },
        });
    }

    try {
        const filePath = path.join(process.cwd(), 'app/data/flashSales.json');
        const fileContents = await fs.readFile(filePath, 'utf8');
        const data = JSON.parse(fileContents);

        // Update cache
        cachedData = data;
        lastFetchTime = now;

        return new Response(JSON.stringify(data), {
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'public, max-age=600', // 10 minutes
                'X-Cache': 'MISS'
            },
        });
    } catch (error) {
        console.error('Error loading flash sale data:', error);
        return new Response(JSON.stringify({
            error: 'Failed to load flash sale items',
            message: error.message
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            },
        });
    }
}