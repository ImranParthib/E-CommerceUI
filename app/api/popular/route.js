import { promises as fs } from 'fs';
import path from 'path';

// Remove 'export const revalidate' since we're handling caching differently

let cachedData = null;
let lastFetchTime = 0;

export async function GET(request) {
    // Get cache-control header from request
    const cacheControl = request.headers.get('Cache-Control');

    // If no-cache is requested or cache is older than 5 minutes, fetch fresh data
    const now = Date.now();
    const cacheExpired = now - lastFetchTime > 5 * 60 * 1000;

    if (cachedData && !cacheExpired && !cacheControl?.includes('no-cache')) {
        // Return cached data with cache headers
        return new Response(JSON.stringify(cachedData), {
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'public, max-age=300', // 5 minutes
                'X-Cache': 'HIT'
            },
        });
    }

    try {
        const filePath = path.join(process.cwd(), 'app/data/popular.json');
        const fileContents = await fs.readFile(filePath, 'utf8');
        const data = JSON.parse(fileContents);

        // Update cache
        cachedData = data;
        lastFetchTime = now;

        return new Response(JSON.stringify(data), {
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'public, max-age=300', // 5 minutes
                'X-Cache': 'MISS'
            },
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed to load popular items' }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            },
        });
    }
}