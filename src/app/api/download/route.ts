
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
        return new NextResponse('Missing URL', { status: 400 });
    }

    // Security check: only allow downloads from our Vercel Blob storage
    try {
        const urlObj = new URL(url);
        if (!urlObj.hostname.endsWith('.public.blob.vercel-storage.com')) {
            return new NextResponse('Invalid URL domain', { status: 403 });
        }
    } catch {
        return new NextResponse('Invalid URL', { status: 400 });
    }

    try {
        const response = await fetch(url);
        if (!response.ok) {
            return new NextResponse('Failed to fetch file', { status: response.status });
        }

        const contentType = response.headers.get('content-type') || 'application/octet-stream';
        const filename = url.split('/').pop() || 'download';

        // Create a new response with the stream directly
        // We cast response.body to any because TypeScript definition mismatch for ReadableStream in some envs
        const newResponse = new NextResponse(response.body as any, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Content-Disposition': `attachment; filename="${filename}"`,
            },
        });

        return newResponse;
    } catch (error) {
        console.error('Download proxy error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
