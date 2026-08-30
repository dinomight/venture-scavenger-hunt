import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        return {
          allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
          tokenPayload: JSON.stringify({
            uploadedAt: new Date().toISOString(),
          }),
        };
      },
      onUploadCompleted: async ({ blob }) => {
        // Blob upload completed on Vercel Blob
        console.log('Blob uploaded:', blob.url);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    const err = error as Error;
    // Provide informative message
    return NextResponse.json(
      { error: err.message || 'Upload token generation failed' },
      { status: 400 }
    );
  }
}
