import axios from 'axios';
import * as cheerio from 'cheerio';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// ============================================
// TYPES
// ============================================

interface ImageResult {
  url: string;
  source: string;
  quality: number; // 0-100 score
  width?: number;
  height?: number;
}

interface ProductSearchParams {
  name: string;
  brand?: string;
  sku?: string;
  size?: string;
  category?: string;
}

interface ScrapeResult {
  productId: string;
  productName: string;
  success: boolean;
  imageUrl?: string;
  localPath?: string;
  source?: string;
  error?: string;
}

// ============================================
// BEAUTY RETAILER SCRAPERS
// ============================================

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
];

function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Search Sephora for product images
 */
async function searchSephora(params: ProductSearchParams): Promise<ImageResult[]> {
  const results: ImageResult[] = [];
  const searchQuery = encodeURIComponent(`${params.brand || ''} ${params.name}`.trim());
  
  try {
    const response = await axios.get(
      `https://www.sephora.com/search?keyword=${searchQuery}`,
      {
        headers: {
          'User-Agent': getRandomUserAgent(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        timeout: 10000,
      }
    );

    const $ = cheerio.load(response.data);
    
    // Find product images in search results
    $('img[data-comp="ProductImage"]').each((_, elem) => {
      const src = $(elem).attr('src') || $(elem).attr('data-src');
      if (src && src.includes('sephora')) {
        // Get higher resolution version
        const highResSrc = src.replace(/\/\d+x\d+\//, '/500x500/');
        results.push({
          url: highResSrc,
          source: 'sephora',
          quality: 85,
        });
      }
    });

    // Also check for lazy-loaded images
    $('img[loading="lazy"]').each((_, elem) => {
      const src = $(elem).attr('src') || $(elem).attr('data-src');
      if (src && (src.includes('sephora') || src.includes('scene7'))) {
        results.push({
          url: src,
          source: 'sephora',
          quality: 80,
        });
      }
    });
  } catch (error) {
    console.log(`Sephora search failed for "${params.name}":`, (error as Error).message);
  }

  return results;
}

/**
 * Search Ulta Beauty for product images
 */
async function searchUlta(params: ProductSearchParams): Promise<ImageResult[]> {
  const results: ImageResult[] = [];
  const searchQuery = encodeURIComponent(`${params.brand || ''} ${params.name}`.trim());
  
  try {
    const response = await axios.get(
      `https://www.ulta.com/search?search=${searchQuery}`,
      {
        headers: {
          'User-Agent': getRandomUserAgent(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        },
        timeout: 10000,
      }
    );

    const $ = cheerio.load(response.data);
    
    // Find product images
    $('img.ProductCard__image, img[class*="product-image"]').each((_, elem) => {
      const src = $(elem).attr('src') || $(elem).attr('data-src');
      if (src) {
        results.push({
          url: src.startsWith('//') ? `https:${src}` : src,
          source: 'ulta',
          quality: 80,
        });
      }
    });
  } catch (error) {
    console.log(`Ulta search failed for "${params.name}":`, (error as Error).message);
  }

  return results;
}

/**
 * Search Lookfantastic for product images
 */
async function searchLookfantastic(params: ProductSearchParams): Promise<ImageResult[]> {
  const results: ImageResult[] = [];
  const searchQuery = encodeURIComponent(`${params.brand || ''} ${params.name}`.trim());
  
  try {
    const response = await axios.get(
      `https://www.lookfantastic.com/search?q=${searchQuery}`,
      {
        headers: {
          'User-Agent': getRandomUserAgent(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        },
        timeout: 10000,
      }
    );

    const $ = cheerio.load(response.data);
    
    $('img.productBlock_image, img[class*="product"]').each((_, elem) => {
      const src = $(elem).attr('src') || $(elem).attr('data-src');
      if (src && !src.includes('placeholder')) {
        results.push({
          url: src.startsWith('//') ? `https:${src}` : src,
          source: 'lookfantastic',
          quality: 75,
        });
      }
    });
  } catch (error) {
    console.log(`Lookfantastic search failed for "${params.name}":`, (error as Error).message);
  }

  return results;
}

/**
 * Search CultBeauty for product images
 */
async function searchCultBeauty(params: ProductSearchParams): Promise<ImageResult[]> {
  const results: ImageResult[] = [];
  const searchQuery = encodeURIComponent(`${params.brand || ''} ${params.name}`.trim());
  
  try {
    const response = await axios.get(
      `https://www.cultbeauty.co.uk/search?q=${searchQuery}`,
      {
        headers: {
          'User-Agent': getRandomUserAgent(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        },
        timeout: 10000,
      }
    );

    const $ = cheerio.load(response.data);
    
    $('img[class*="product"], img[data-testid*="product"]').each((_, elem) => {
      const src = $(elem).attr('src') || $(elem).attr('data-src');
      if (src && !src.includes('placeholder')) {
        results.push({
          url: src.startsWith('//') ? `https:${src}` : src,
          source: 'cultbeauty',
          quality: 78,
        });
      }
    });
  } catch (error) {
    console.log(`CultBeauty search failed for "${params.name}":`, (error as Error).message);
  }

  return results;
}

/**
 * Search brand's official website
 */
async function searchBrandWebsite(params: ProductSearchParams): Promise<ImageResult[]> {
  const results: ImageResult[] = [];
  
  if (!params.brand) return results;

  // Map of brand names to their website search URLs
  const brandSites: Record<string, string> = {
    'mac': 'https://www.maccosmetics.com/search?q=',
    'nars': 'https://www.narscosmetics.com/search?q=',
    'clinique': 'https://www.clinique.com/search?q=',
    'estee lauder': 'https://www.esteelauder.com/search?q=',
    'lancome': 'https://www.lancome-usa.com/search?q=',
    'urban decay': 'https://www.urbandecay.com/search?q=',
    'too faced': 'https://www.toofaced.com/search?q=',
    'benefit': 'https://www.benefitcosmetics.com/search?q=',
    'charlotte tilbury': 'https://www.charlottetilbury.com/search?q=',
    'fenty beauty': 'https://fentybeauty.com/search?q=',
    'rare beauty': 'https://www.rarebeauty.com/search?q=',
    'glossier': 'https://www.glossier.com/search?q=',
    'the ordinary': 'https://theordinary.com/search?q=',
    'drunk elephant': 'https://www.drunkelephant.com/search?q=',
    'tatcha': 'https://www.tatcha.com/search?q=',
    'sunday riley': 'https://sundayriley.com/search?q=',
    'olaplex': 'https://olaplex.com/search?q=',
    'kerastase': 'https://www.kerastase-usa.com/search?q=',
    'moroccanoil': 'https://www.moroccanoil.com/search?q=',
  };

  const brandKey = params.brand.toLowerCase();
  const siteUrl = Object.entries(brandSites).find(([key]) => 
    brandKey.includes(key) || key.includes(brandKey)
  )?.[1];

  if (!siteUrl) return results;

  try {
    const searchQuery = encodeURIComponent(params.name);
    const response = await axios.get(
      `${siteUrl}${searchQuery}`,
      {
        headers: {
          'User-Agent': getRandomUserAgent(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        },
        timeout: 10000,
      }
    );

    const $ = cheerio.load(response.data);
    
    // Generic product image selectors
    $('img[class*="product"], img[data-testid*="product"], img[alt*="product"]').each((_, elem) => {
      const src = $(elem).attr('src') || $(elem).attr('data-src');
      if (src && !src.includes('placeholder') && !src.includes('logo')) {
        results.push({
          url: src.startsWith('//') ? `https:${src}` : src,
          source: `brand:${params.brand}`,
          quality: 90, // Brand official images are highest quality
        });
      }
    });
  } catch (error) {
    console.log(`Brand website search failed for "${params.brand}":`, (error as Error).message);
  }

  return results;
}

/**
 * Search Google Images (without API - basic scraping)
 */
async function searchGoogleImages(params: ProductSearchParams): Promise<ImageResult[]> {
  const results: ImageResult[] = [];
  const searchQuery = encodeURIComponent(
    `${params.brand || ''} ${params.name} ${params.size || ''} beauty product`.trim()
  );
  
  try {
    const response = await axios.get(
      `https://www.google.com/search?q=${searchQuery}&tbm=isch&safe=active`,
      {
        headers: {
          'User-Agent': getRandomUserAgent(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        },
        timeout: 10000,
      }
    );

    // Extract image URLs from Google's response
    const imgRegex = /\["(https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)",\d+,\d+\]/gi;
    let match;
    while ((match = imgRegex.exec(response.data)) !== null) {
      const url = match[1];
      if (!url.includes('google') && !url.includes('gstatic')) {
        results.push({
          url: url,
          source: 'google',
          quality: 70,
        });
      }
    }
  } catch (error) {
    console.log(`Google search failed for "${params.name}":`, (error as Error).message);
  }

  return results.slice(0, 5); // Limit to top 5
}

// ============================================
// IMAGE QUALITY SCORING
// ============================================

/**
 * Score an image based on various quality factors
 */
function scoreImage(image: ImageResult, params: ProductSearchParams): number {
  let score = image.quality;

  // Boost score for brand official images
  if (image.source.startsWith('brand:')) {
    score += 15;
  }

  // Boost for reputable beauty retailers
  if (['sephora', 'ulta'].includes(image.source)) {
    score += 10;
  }

  // Penalize very small images
  if (image.width && image.width < 200) {
    score -= 20;
  }

  // Boost larger images
  if (image.width && image.width >= 500) {
    score += 10;
  }

  // Check if URL contains relevant keywords
  const url = image.url.toLowerCase();
  if (params.brand && url.includes(params.brand.toLowerCase().replace(/\s+/g, ''))) {
    score += 5;
  }

  // Penalize placeholder or generic images
  if (url.includes('placeholder') || url.includes('noimage') || url.includes('default')) {
    score -= 50;
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Select the best image from results
 */
function selectBestImage(images: ImageResult[], params: ProductSearchParams): ImageResult | null {
  if (images.length === 0) return null;

  // Score all images
  const scoredImages = images.map(img => ({
    ...img,
    finalScore: scoreImage(img, params),
  }));

  // Sort by score descending
  scoredImages.sort((a, b) => b.finalScore - a.finalScore);

  return scoredImages[0];
}

// ============================================
// IMAGE DOWNLOAD & STORAGE
// ============================================

/**
 * Download image from URL and save locally
 */
async function downloadImage(imageUrl: string, productId: string): Promise<string | null> {
  try {
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': getRandomUserAgent(),
      },
      timeout: 15000,
    });

    // Determine file extension from content-type or URL
    const contentType = response.headers['content-type'] || '';
    let extension = 'jpg';
    if (contentType.includes('png')) extension = 'png';
    else if (contentType.includes('webp')) extension = 'webp';
    else if (imageUrl.match(/\.(png|jpg|jpeg|webp)/i)) {
      extension = imageUrl.match(/\.(png|jpg|jpeg|webp)/i)![1].toLowerCase();
      if (extension === 'jpeg') extension = 'jpg';
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(__dirname, '..', '..', 'uploads', 'products');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const filename = `${productId}-${uuidv4().slice(0, 8)}.${extension}`;
    const filepath = path.join(uploadsDir, filename);

    // Save the image
    fs.writeFileSync(filepath, response.data);

    // Return the relative path for database storage
    return `/uploads/products/${filename}`;
  } catch (error) {
    console.error(`Failed to download image from ${imageUrl}:`, (error as Error).message);
    return null;
  }
}

// ============================================
// MAIN SERVICE FUNCTIONS
// ============================================

/**
 * Search for product image across multiple sources
 */
export async function searchProductImage(params: ProductSearchParams): Promise<ImageResult[]> {
  const allResults: ImageResult[] = [];

  // Search multiple sources in parallel with delays to avoid rate limiting
  const searchPromises = [
    searchBrandWebsite(params),
    delay(500).then(() => searchSephora(params)),
    delay(1000).then(() => searchUlta(params)),
    delay(1500).then(() => searchLookfantastic(params)),
    delay(2000).then(() => searchCultBeauty(params)),
    delay(2500).then(() => searchGoogleImages(params)),
  ];

  const results = await Promise.allSettled(searchPromises);

  results.forEach(result => {
    if (result.status === 'fulfilled') {
      allResults.push(...result.value);
    }
  });

  // Remove duplicates based on URL
  const uniqueResults = allResults.filter((img, index, self) =>
    index === self.findIndex(i => i.url === img.url)
  );

  return uniqueResults;
}

/**
 * Find and assign image to a single product
 */
export async function findAndAssignProductImage(productId: string): Promise<ScrapeResult> {
  try {
    // Get product details
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { brand: true },
    });

    if (!product) {
      return {
        productId,
        productName: 'Unknown',
        success: false,
        error: 'Product not found',
      };
    }

    // Skip if product already has images
    if (product.images && (product.images as string[]).length > 0) {
      const existingImages = product.images as string[];
      if (existingImages.some(img => img && !img.includes('placeholder'))) {
        return {
          productId,
          productName: product.name,
          success: true,
          imageUrl: existingImages[0],
          source: 'existing',
        };
      }
    }

    // Search for images
    const searchParams: ProductSearchParams = {
      name: product.name,
      brand: product.brand?.name,
      sku: product.sku || undefined,
      category: product.category || undefined,
    };

    const images = await searchProductImage(searchParams);

    if (images.length === 0) {
      return {
        productId,
        productName: product.name,
        success: false,
        error: 'No images found',
      };
    }

    // Select the best image
    const bestImage = selectBestImage(images, searchParams);

    if (!bestImage) {
      return {
        productId,
        productName: product.name,
        success: false,
        error: 'No suitable image found',
      };
    }

    // Download and save the image
    const localPath = await downloadImage(bestImage.url, productId);

    if (!localPath) {
      return {
        productId,
        productName: product.name,
        success: false,
        error: 'Failed to download image',
      };
    }

    // Update product with new image
    await prisma.product.update({
      where: { id: productId },
      data: {
        images: [localPath],
      },
    });

    return {
      productId,
      productName: product.name,
      success: true,
      imageUrl: bestImage.url,
      localPath,
      source: bestImage.source,
    };
  } catch (error) {
    return {
      productId,
      productName: 'Unknown',
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Bulk find and assign images to products without images
 */
export async function bulkFindProductImages(options: {
  limit?: number;
  brandId?: string;
  categoryId?: string;
  onProgress?: (progress: { current: number; total: number; result: ScrapeResult }) => void;
}): Promise<{
  total: number;
  success: number;
  failed: number;
  results: ScrapeResult[];
}> {
  const { limit = 50, brandId, categoryId, onProgress } = options;

  // Find products without images
  const whereClause: Record<string, unknown> = {
    OR: [
      { images: { equals: [] } },
      { images: { equals: null } },
    ],
  };

  if (brandId) {
    whereClause.brandId = brandId;
  }

  if (categoryId) {
    whereClause.categoryId = categoryId;
  }

  const products = await prisma.product.findMany({
    where: whereClause,
    take: limit,
    select: { id: true },
  });

  const results: ScrapeResult[] = [];
  let successCount = 0;
  let failedCount = 0;

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    
    // Add delay between requests to avoid rate limiting
    if (i > 0) {
      await delay(3000); // 3 second delay between products
    }

    const result = await findAndAssignProductImage(product.id);
    results.push(result);

    if (result.success) {
      successCount++;
    } else {
      failedCount++;
    }

    if (onProgress) {
      onProgress({
        current: i + 1,
        total: products.length,
        result,
      });
    }

    console.log(`[${i + 1}/${products.length}] ${result.success ? '✓' : '✗'} ${result.productName}: ${result.source || result.error}`);
  }

  return {
    total: products.length,
    success: successCount,
    failed: failedCount,
    results,
  };
}

/**
 * Get products without images count
 */
export async function getProductsWithoutImagesCount(brandId?: string): Promise<number> {
  const whereClause: Record<string, unknown> = {
    OR: [
      { images: { equals: [] } },
      { images: { equals: null } },
    ],
  };

  if (brandId) {
    whereClause.brandId = brandId;
  }

  return prisma.product.count({ where: whereClause });
}

export default {
  searchProductImage,
  findAndAssignProductImage,
  bulkFindProductImages,
  getProductsWithoutImagesCount,
};
