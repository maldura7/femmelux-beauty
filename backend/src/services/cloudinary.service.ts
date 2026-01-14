import { v2 as cloudinary } from 'cloudinary';
import axios from 'axios';

// ============================================
// CLOUDINARY CONFIGURATION
// ============================================

// Initialize Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// ============================================
// TYPES
// ============================================

export interface UploadResult {
  success: boolean;
  url?: string;
  publicId?: string;
  error?: string;
}

export interface ImageTransformOptions {
  width?: number;
  height?: number;
  crop?: 'fill' | 'fit' | 'scale' | 'thumb' | 'pad';
  quality?: number | 'auto';
  format?: 'auto' | 'webp' | 'jpg' | 'png';
}

// ============================================
// HELPER FUNCTIONS
// ============================================

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
];

function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

/**
 * Check if Cloudinary is properly configured
 */
export function isCloudinaryConfigured(): boolean {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

// ============================================
// UPLOAD FUNCTIONS
// ============================================

/**
 * Upload an image from a URL to Cloudinary
 */
export async function uploadFromUrl(
  imageUrl: string,
  options: {
    folder?: string;
    publicId?: string;
    tags?: string[];
  } = {}
): Promise<UploadResult> {
  if (!isCloudinaryConfigured()) {
    return {
      success: false,
      error: 'Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.',
    };
  }

  try {
    // For data URLs, upload directly
    if (imageUrl.startsWith('data:')) {
      const result = await cloudinary.uploader.upload(imageUrl, {
        folder: options.folder || 'femmelux/products',
        public_id: options.publicId,
        tags: options.tags,
        resource_type: 'image',
        overwrite: true,
        transformation: [
          { quality: 'auto:good', fetch_format: 'auto' }
        ],
      });

      return {
        success: true,
        url: result.secure_url,
        publicId: result.public_id,
      };
    }

    // For regular URLs, first download then upload
    // This bypasses hotlink protection issues
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
      },
      timeout: 30000,
      maxContentLength: 10 * 1024 * 1024,
    });

    // Convert to base64 for upload
    const base64 = Buffer.from(response.data).toString('base64');
    const contentType = response.headers['content-type'] || 'image/jpeg';
    const dataUrl = `data:${contentType};base64,${base64}`;

    const result = await cloudinary.uploader.upload(dataUrl, {
      folder: options.folder || 'femmelux/products',
      public_id: options.publicId,
      tags: options.tags,
      resource_type: 'image',
      overwrite: true,
      transformation: [
        { quality: 'auto:good', fetch_format: 'auto' }
      ],
    });

    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error: any) {
    console.error('Cloudinary upload error:', error.message);
    return {
      success: false,
      error: error.message || 'Failed to upload image to Cloudinary',
    };
  }
}

/**
 * Upload an image from a buffer to Cloudinary
 */
export async function uploadFromBuffer(
  buffer: Buffer,
  options: {
    folder?: string;
    publicId?: string;
    tags?: string[];
    mimeType?: string;
  } = {}
): Promise<UploadResult> {
  if (!isCloudinaryConfigured()) {
    return {
      success: false,
      error: 'Cloudinary is not configured.',
    };
  }

  try {
    const base64 = buffer.toString('base64');
    const mimeType = options.mimeType || 'image/jpeg';
    const dataUrl = `data:${mimeType};base64,${base64}`;

    const result = await cloudinary.uploader.upload(dataUrl, {
      folder: options.folder || 'femmelux/products',
      public_id: options.publicId,
      tags: options.tags,
      resource_type: 'image',
      overwrite: true,
      transformation: [
        { quality: 'auto:good', fetch_format: 'auto' }
      ],
    });

    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error: any) {
    console.error('Cloudinary upload error:', error.message);
    return {
      success: false,
      error: error.message || 'Failed to upload image to Cloudinary',
    };
  }
}

/**
 * Upload multiple images from URLs
 */
export async function uploadMultipleFromUrls(
  imageUrls: string[],
  options: {
    folder?: string;
    tags?: string[];
  } = {}
): Promise<UploadResult[]> {
  const results: UploadResult[] = [];

  for (const url of imageUrls) {
    const result = await uploadFromUrl(url, options);
    results.push(result);

    // Small delay between uploads to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return results;
}

// ============================================
// URL TRANSFORMATION
// ============================================

/**
 * Generate an optimized image URL with transformations
 */
export function getOptimizedUrl(
  publicIdOrUrl: string,
  options: ImageTransformOptions = {}
): string {
  // If it's already a full Cloudinary URL, extract the public ID
  let publicId = publicIdOrUrl;
  if (publicIdOrUrl.includes('cloudinary.com')) {
    // Extract public ID from URL
    const match = publicIdOrUrl.match(/\/v\d+\/(.+?)(?:\.[a-z]+)?$/i);
    if (match) {
      publicId = match[1];
    }
  }

  const transformations: any[] = [];

  if (options.width || options.height) {
    transformations.push({
      width: options.width,
      height: options.height,
      crop: options.crop || 'fill',
    });
  }

  transformations.push({
    quality: options.quality || 'auto:good',
    fetch_format: options.format || 'auto',
  });

  return cloudinary.url(publicId, {
    transformation: transformations,
    secure: true,
  });
}

/**
 * Get responsive image URLs for different screen sizes
 */
export function getResponsiveUrls(publicIdOrUrl: string): {
  thumbnail: string;
  small: string;
  medium: string;
  large: string;
  original: string;
} {
  return {
    thumbnail: getOptimizedUrl(publicIdOrUrl, { width: 150, height: 150, crop: 'thumb' }),
    small: getOptimizedUrl(publicIdOrUrl, { width: 300, height: 300 }),
    medium: getOptimizedUrl(publicIdOrUrl, { width: 600, height: 600 }),
    large: getOptimizedUrl(publicIdOrUrl, { width: 1200, height: 1200 }),
    original: getOptimizedUrl(publicIdOrUrl, {}),
  };
}

// ============================================
// DELETE FUNCTIONS
// ============================================

/**
 * Delete an image from Cloudinary
 */
export async function deleteImage(publicId: string): Promise<{ success: boolean; error?: string }> {
  if (!isCloudinaryConfigured()) {
    return { success: false, error: 'Cloudinary is not configured.' };
  }

  try {
    await cloudinary.uploader.destroy(publicId);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Delete multiple images from Cloudinary
 */
export async function deleteMultipleImages(publicIds: string[]): Promise<{ success: boolean; deleted: number; errors: string[] }> {
  if (!isCloudinaryConfigured()) {
    return { success: false, deleted: 0, errors: ['Cloudinary is not configured.'] };
  }

  const errors: string[] = [];
  let deleted = 0;

  for (const publicId of publicIds) {
    try {
      await cloudinary.uploader.destroy(publicId);
      deleted++;
    } catch (error: any) {
      errors.push(`Failed to delete ${publicId}: ${error.message}`);
    }
  }

  return {
    success: errors.length === 0,
    deleted,
    errors,
  };
}

// ============================================
// MIGRATION HELPERS
// ============================================

/**
 * Migrate a base64 image to Cloudinary
 * Returns the new Cloudinary URL or null if migration fails
 */
export async function migrateBase64ToCloudinary(
  base64Image: string,
  productId: string,
  productName?: string
): Promise<string | null> {
  if (!base64Image.startsWith('data:')) {
    // Not a base64 image, return as-is
    return base64Image;
  }

  const result = await uploadFromUrl(base64Image, {
    folder: 'femmelux/products',
    publicId: `product-${productId}`,
    tags: productName ? [productName.toLowerCase().replace(/[^a-z0-9]/g, '-')] : undefined,
  });

  if (result.success && result.url) {
    return result.url;
  }

  console.error(`Failed to migrate image for product ${productId}:`, result.error);
  return null;
}

export default {
  isCloudinaryConfigured,
  uploadFromUrl,
  uploadFromBuffer,
  uploadMultipleFromUrls,
  getOptimizedUrl,
  getResponsiveUrls,
  deleteImage,
  deleteMultipleImages,
  migrateBase64ToCloudinary,
};
