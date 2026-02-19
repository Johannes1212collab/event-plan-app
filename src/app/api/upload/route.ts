
import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
        return NextResponse.json({ success: false, message: 'No file uploaded' }, { status: 400 });
    }

    try {
        const blob = await put(file.name, file, {
            access: 'public',
        });

        return NextResponse.json({
            success: true,
            url: blob.url,
            type: file.type.startsWith('image/') ? 'IMAGE' : 'VIDEO'
        });
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json({ success: false, message: 'Upload failed' }, { status: 500 });
    }
}
