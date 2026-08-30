import imageCompression from 'browser-image-compression';

export interface CompressionProgressCallback {
  (progress: number): void;
}

/**
 * Compresses an image file client-side before network upload
 * Resizes down to ~1080p WebP/JPEG, targeting ~300-600 KB
 */
export async function compressImage(
  file: File,
  onProgress?: CompressionProgressCallback
): Promise<File> {
  // If file is already smaller than 350KB, return as is
  if (file.size <= 350 * 1024) {
    if (onProgress) onProgress(100);
    return file;
  }

  const options = {
    maxSizeMB: 0.6,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    fileType: 'image/jpeg',
    initialQuality: 0.85,
    onProgress: onProgress,
  };

  try {
    return await imageCompression(file, options);
  } catch (error) {
    console.warn('Image compression fallback:', error);
    // Return original file if compression fails
    return file;
  }
}
