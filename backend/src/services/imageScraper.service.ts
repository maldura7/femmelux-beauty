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

// ============================================
// SMART SEARCH HELPERS
// ============================================

/**
 * Normalize product name for better search matching
 * Removes sizes, special characters, and standardizes spacing
 */
function normalizeProductName(name: string): string {
  return name
    // Remove size indicators like "100ml", "3.4 oz", "50g", "1.7 fl oz"
    .replace(/\b\d+(\.\d+)?\s*(ml|oz|fl\.?\s*oz|g|gram|kg|l|liter|litre)\b/gi, '')
    // Remove pack sizes like "2-pack", "set of 3"
    .replace(/\b\d+[-\s]*(pack|piece|count|ct|pc)\b/gi, '')
    .replace(/\bset\s+of\s+\d+\b/gi, '')
    // Remove special characters but keep spaces
    .replace(/[^\w\s-]/g, ' ')
    // Normalize multiple spaces to single space
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Generate multiple search variations for a product
 * Returns array of queries to try, from most specific to most general
 */
function generateSearchVariations(name: string, brand?: string): string[] {
  const variations: string[] = [];
  const normalizedName = normalizeProductName(name);

  // Original query with brand
  if (brand) {
    variations.push(`${brand} ${name}`);
    variations.push(`${brand} ${normalizedName}`);
  }

  // Just the product name
  variations.push(name);
  variations.push(normalizedName);

  // Extract key product words (removing common filler words)
  const fillerWords = ['the', 'a', 'an', 'for', 'with', 'and', 'or', 'in', 'on', 'by', 'to', 'of'];
  const keyWords = normalizedName
    .toLowerCase()
    .split(' ')
    .filter(word => word.length > 2 && !fillerWords.includes(word));

  if (keyWords.length > 2) {
    // Use first 3 key words
    variations.push(keyWords.slice(0, 3).join(' '));
  }

  // Brand only as last resort
  if (brand) {
    variations.push(brand);
  }

  // Remove duplicates while preserving order
  return [...new Set(variations)];
}

/**
 * Check if URL contains watermark indicators
 */
function urlContainsWatermarkIndicators(url: string): boolean {
  const watermarkPatterns = [
    'watermark', 'sample', 'preview', 'demo', 'stock',
    'shutterstock', 'istockphoto', 'gettyimages', 'dreamstime',
    'depositphotos', '123rf', 'alamy', 'adobe-stock'
  ];
  const lowerUrl = url.toLowerCase();
  return watermarkPatterns.some(pattern => lowerUrl.includes(pattern));
}

/**
 * Check if URL indicates a professional product shot
 */
function urlIndicatesProductShot(url: string): boolean {
  const productShotPatterns = [
    'product', 'hero', 'main', 'primary', 'pdp',
    'packshot', 'pack-shot', 'beauty-shot',
    '/p/', '/products/', '/item/', '/sku/'
  ];
  const lowerUrl = url.toLowerCase();
  return productShotPatterns.some(pattern => lowerUrl.includes(pattern));
}

// ============================================
// NEW RETAILER SCRAPERS
// ============================================

/**
 * Search Amazon for product images
 */
async function searchAmazon(params: ProductSearchParams): Promise<ImageResult[]> {
  const results: ImageResult[] = [];
  const searchQuery = encodeURIComponent(`${params.brand || ''} ${params.name}`.trim());

  try {
    const response = await axios.get(
      `https://www.amazon.com/s?k=${searchQuery}&i=beauty`,
      {
        headers: {
          'User-Agent': getRandomUserAgent(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        timeout: 15000,
      }
    );

    const $ = cheerio.load(response.data);

    // Find product images in search results
    $('img.s-image').each((_, elem) => {
      const src = $(elem).attr('src');
      if (src && src.includes('images-amazon') && !src.includes('sprite')) {
        // Convert to larger image by modifying URL
        const highResSrc = src
          .replace(/\._[A-Z]+\d+_/, '._AC_SL1500_')
          .replace(/\._SS\d+_/, '._AC_SL1500_');
        results.push({
          url: highResSrc,
          source: 'amazon',
          quality: 82,
        });
      }
    });

    // Also check data-src for lazy-loaded images
    $('img[data-src*="images-amazon"]').each((_, elem) => {
      const src = $(elem).attr('data-src');
      if (src) {
        results.push({
          url: src,
          source: 'amazon',
          quality: 80,
        });
      }
    });
  } catch (error) {
    console.log(`Amazon search failed for "${params.name}":`, (error as Error).message);
  }

  return results.slice(0, 5);
}

/**
 * Search Walmart Beauty for product images
 */
async function searchWalmart(params: ProductSearchParams): Promise<ImageResult[]> {
  const results: ImageResult[] = [];
  const searchQuery = encodeURIComponent(`${params.brand || ''} ${params.name}`.trim());

  try {
    const response = await axios.get(
      `https://www.walmart.com/search?q=${searchQuery}&cat_id=1085666`,
      {
        headers: {
          'User-Agent': getRandomUserAgent(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        timeout: 15000,
      }
    );

    const $ = cheerio.load(response.data);

    // Find product images
    $('img[data-testid="productTileImage"], img[class*="product"]').each((_, elem) => {
      const src = $(elem).attr('src') || $(elem).attr('data-src');
      if (src && (src.includes('walmartimages') || src.includes('i5.walmartimages'))) {
        // Get larger version
        const highResSrc = src.replace(/\/\d+x\d+\//, '/1000x1000/');
        results.push({
          url: highResSrc,
          source: 'walmart',
          quality: 78,
        });
      }
    });
  } catch (error) {
    console.log(`Walmart search failed for "${params.name}":`, (error as Error).message);
  }

  return results.slice(0, 5);
}

/**
 * Search Target Beauty for product images
 */
async function searchTarget(params: ProductSearchParams): Promise<ImageResult[]> {
  const results: ImageResult[] = [];
  const searchQuery = encodeURIComponent(`${params.brand || ''} ${params.name}`.trim());

  try {
    const response = await axios.get(
      `https://www.target.com/s?searchTerm=${searchQuery}&category=5xu2f`,
      {
        headers: {
          'User-Agent': getRandomUserAgent(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        timeout: 15000,
      }
    );

    const $ = cheerio.load(response.data);

    // Find product images
    $('img[data-test="product-image"], img[class*="ProductCard"]').each((_, elem) => {
      const src = $(elem).attr('src') || $(elem).attr('data-src');
      if (src && src.includes('target.scene7')) {
        // Get larger version
        const highResSrc = src.replace(/\?.*$/, '?wid=1000&hei=1000&fmt=webp');
        results.push({
          url: highResSrc,
          source: 'target',
          quality: 80,
        });
      }
    });
  } catch (error) {
    console.log(`Target search failed for "${params.name}":`, (error as Error).message);
  }

  return results.slice(0, 5);
}

/**
 * Search Nordstrom for product images (high-end beauty)
 */
async function searchNordstrom(params: ProductSearchParams): Promise<ImageResult[]> {
  const results: ImageResult[] = [];
  const searchQuery = encodeURIComponent(`${params.brand || ''} ${params.name}`.trim());

  try {
    const response = await axios.get(
      `https://www.nordstrom.com/sr?keyword=${searchQuery}&filterByDepartment=Beauty`,
      {
        headers: {
          'User-Agent': getRandomUserAgent(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        timeout: 15000,
      }
    );

    const $ = cheerio.load(response.data);

    // Find product images
    $('img[class*="product"], img[data-testid*="product"]').each((_, elem) => {
      const src = $(elem).attr('src') || $(elem).attr('data-src');
      if (src && (src.includes('nordstrom') || src.includes('n.nordstrommedia'))) {
        // Get larger version
        const highResSrc = src.replace(/\/\d+\//, '/1000/');
        results.push({
          url: highResSrc,
          source: 'nordstrom',
          quality: 85,
        });
      }
    });
  } catch (error) {
    console.log(`Nordstrom search failed for "${params.name}":`, (error as Error).message);
  }

  return results.slice(0, 5);
}

/**
 * Search Dermstore for product images (skincare focused)
 */
async function searchDermstore(params: ProductSearchParams): Promise<ImageResult[]> {
  const results: ImageResult[] = [];
  const searchQuery = encodeURIComponent(`${params.brand || ''} ${params.name}`.trim());

  try {
    const response = await axios.get(
      `https://www.dermstore.com/search?q=${searchQuery}`,
      {
        headers: {
          'User-Agent': getRandomUserAgent(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        timeout: 15000,
      }
    );

    const $ = cheerio.load(response.data);

    // Find product images
    $('img.productBlock_image, img[class*="product-image"]').each((_, elem) => {
      const src = $(elem).attr('src') || $(elem).attr('data-src');
      if (src && !src.includes('placeholder')) {
        const fullUrl = src.startsWith('//') ? `https:${src}` : src;
        results.push({
          url: fullUrl,
          source: 'dermstore',
          quality: 80,
        });
      }
    });
  } catch (error) {
    console.log(`Dermstore search failed for "${params.name}":`, (error as Error).message);
  }

  return results.slice(0, 5);
}

// ============================================
// EXISTING RETAILER SCRAPERS
// ============================================

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
    // Premium Makeup Brands
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
    'bobbi brown': 'https://www.bobbibrowncosmetics.com/search?q=',
    'laura mercier': 'https://www.lauramercier.com/search?q=',
    'hourglass': 'https://www.hourglasscosmetics.com/search?q=',
    'pat mcgrath': 'https://www.patmcgrath.com/search?q=',
    'natasha denona': 'https://www.natashadenona.com/search?q=',
    'ilia': 'https://iliabeauty.com/search?q=',
    'merit': 'https://meritbeauty.com/search?q=',
    'kosas': 'https://kosas.com/search?q=',

    // Drugstore/Mass Market Makeup
    'loreal': 'https://www.lorealparisusa.com/search?q=',
    "l'oreal": 'https://www.lorealparisusa.com/search?q=',
    'maybelline': 'https://www.maybelline.com/search?q=',
    'nyx': 'https://www.nyxcosmetics.com/search?q=',
    'revlon': 'https://www.revlon.com/search?q=',
    'covergirl': 'https://www.covergirl.com/search?q=',
    'milani': 'https://www.milanicosmetics.com/search?q=',
    'elf': 'https://www.elfcosmetics.com/search?q=',
    'e.l.f.': 'https://www.elfcosmetics.com/search?q=',
    'colourpop': 'https://colourpop.com/search?q=',
    'wet n wild': 'https://www.wetnwildbeauty.com/search?q=',

    // Skincare Brands
    'the ordinary': 'https://theordinary.com/search?q=',
    'drunk elephant': 'https://www.drunkelephant.com/search?q=',
    'tatcha': 'https://www.tatcha.com/search?q=',
    'sunday riley': 'https://sundayriley.com/search?q=',
    'skinceuticals': 'https://www.skinceuticals.com/search?q=',
    'paula\'s choice': 'https://www.paulaschoice.com/search?q=',
    'paulas choice': 'https://www.paulaschoice.com/search?q=',
    'cerave': 'https://www.cerave.com/search?q=',
    'la roche-posay': 'https://www.laroche-posay.us/search?q=',
    'la roche posay': 'https://www.laroche-posay.us/search?q=',
    'neutrogena': 'https://www.neutrogena.com/search?q=',
    'olay': 'https://www.olay.com/search?q=',
    'first aid beauty': 'https://www.firstaidbeauty.com/search?q=',
    'glow recipe': 'https://www.glowrecipe.com/search?q=',
    'youth to the people': 'https://www.youthtothepeople.com/search?q=',
    'supergoop': 'https://supergoop.com/search?q=',
    'summer fridays': 'https://summerfridays.com/search?q=',

    // Asian Beauty/J-Beauty/K-Beauty
    'shiseido': 'https://www.shiseido.com/us/en/search?q=',
    'sk-ii': 'https://www.sk-ii.com/search?q=',
    'sk ii': 'https://www.sk-ii.com/search?q=',
    'la mer': 'https://www.lamer.com/search?q=',
    'sulwhasoo': 'https://us.sulwhasoo.com/search?q=',
    'laneige': 'https://us.laneige.com/search?q=',
    'innisfree': 'https://us.innisfree.com/search?q=',
    'cosrx': 'https://www.cosrx.com/search?q=',

    // Haircare Brands
    'olaplex': 'https://olaplex.com/search?q=',
    'kerastase': 'https://www.kerastase-usa.com/search?q=',
    'moroccanoil': 'https://www.moroccanoil.com/search?q=',
    'paul mitchell': 'https://www.paulmitchell.com/search?q=',
    'redken': 'https://www.redken.com/search?q=',
    'matrix': 'https://www.matrix.com/search?q=',
    'aveda': 'https://www.aveda.com/search?q=',
    'bumble and bumble': 'https://www.bumbleandbumble.com/search?q=',
    'living proof': 'https://www.livingproof.com/search?q=',
    'briogeo': 'https://briogeohair.com/search?q=',
    'amika': 'https://loveamika.com/search?q=',
    'verb': 'https://www.verbproducts.com/search?q=',
    'ouai': 'https://theouai.com/search?q=',
    'drybar': 'https://www.drybar.com/search?q=',

    // Nail Care Brands
    'opi': 'https://www.opi.com/search?q=',
    'essie': 'https://www.essie.com/search?q=',
    'sally hansen': 'https://www.sallyhansen.com/search?q=',
    'zoya': 'https://www.zoya.com/search?q=',
    'orly': 'https://orlybeauty.com/search?q=',

    // Fragrance Brands
    'jo malone': 'https://www.jomalone.com/search?q=',
    'diptyque': 'https://www.diptyqueparis.com/search?q=',
    'byredo': 'https://www.byredo.com/search?q=',
    'le labo': 'https://www.lelabofragrances.com/search?q=',
    'maison margiela': 'https://www.maisonmargiela-fragrances.us/search?q=',
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
 * Enhanced with watermark detection, product shot detection, and minimum resolution filtering
 */
function scoreImage(image: ImageResult, params: ProductSearchParams): number {
  let score = image.quality;
  const url = image.url.toLowerCase();

  // === SOURCE-BASED SCORING ===

  // Boost score for brand official images (highest trust)
  if (image.source.startsWith('brand:')) {
    score += 20;
  }

  // Boost for reputable beauty retailers (tiered)
  if (['sephora', 'ulta', 'nordstrom'].includes(image.source)) {
    score += 15;
  } else if (['amazon', 'target', 'dermstore'].includes(image.source)) {
    score += 10;
  } else if (['walmart', 'lookfantastic', 'cultbeauty'].includes(image.source)) {
    score += 5;
  }

  // === SIZE-BASED SCORING ===

  // Filter out tiny images (likely thumbnails or icons)
  if (image.width && image.width < 150) {
    return 0; // Skip completely
  }

  // Penalize small images
  if (image.width && image.width < 200) {
    score -= 25;
  }

  // Boost larger images
  if (image.width && image.width >= 500) {
    score += 15;
  } else if (image.width && image.width >= 300) {
    score += 5;
  }

  // === ASPECT RATIO SCORING ===
  // Prefer square/product-style images (typical for e-commerce)
  if (image.width && image.height) {
    const ratio = image.width / image.height;
    if (ratio > 0.8 && ratio < 1.2) {
      score += 10; // Square-ish images are usually product shots
    } else if (ratio < 0.5 || ratio > 2) {
      score -= 10; // Very tall or wide images are usually lifestyle/banner
    }
  }

  // === CONTENT-BASED SCORING ===

  // Check if URL contains brand name
  if (params.brand && url.includes(params.brand.toLowerCase().replace(/\s+/g, ''))) {
    score += 8;
  }

  // Check for product name words in URL
  const productWords = params.name.toLowerCase().split(' ').filter(w => w.length > 3);
  const matchingWords = productWords.filter(word => url.includes(word));
  score += matchingWords.length * 3;

  // === QUALITY INDICATORS ===

  // Boost professional product shot indicators
  if (urlIndicatesProductShot(image.url)) {
    score += 15;
  }

  // Penalize watermarked images
  if (urlContainsWatermarkIndicators(image.url)) {
    score -= 40;
  }

  // Penalize placeholder or generic images
  if (url.includes('placeholder') || url.includes('noimage') || url.includes('default')) {
    score -= 50;
  }

  // Penalize lifestyle/model images (less useful for product catalog)
  if (url.includes('lifestyle') || url.includes('model') || url.includes('swatch')) {
    score -= 15;
  }

  // Boost white background indicators
  if (url.includes('white') || url.includes('clean') || url.includes('pure')) {
    score += 5;
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
 * Now includes 11 data sources for comprehensive coverage
 */
export async function searchProductImage(params: ProductSearchParams): Promise<ImageResult[]> {
  const allResults: ImageResult[] = [];

  // Search multiple sources in parallel with staggered delays to avoid rate limiting
  // Sources ordered by quality/reliability: Brand first, then major retailers, then general
  const searchPromises = [
    // Tier 1: Brand official site (highest quality)
    searchBrandWebsite(params),

    // Tier 2: Major beauty retailers (high quality)
    delay(300).then(() => searchSephora(params)),
    delay(600).then(() => searchUlta(params)),
    delay(900).then(() => searchNordstrom(params)),

    // Tier 3: Large general retailers (good quality)
    delay(1200).then(() => searchAmazon(params)),
    delay(1500).then(() => searchTarget(params)),
    delay(1800).then(() => searchWalmart(params)),

    // Tier 4: Specialty beauty retailers
    delay(2100).then(() => searchDermstore(params)),
    delay(2400).then(() => searchLookfantastic(params)),
    delay(2700).then(() => searchCultBeauty(params)),

    // Tier 5: Fallback to Google Images
    delay(3000).then(() => searchGoogleImages(params)),
  ];

  const results = await Promise.allSettled(searchPromises);

  results.forEach(result => {
    if (result.status === 'fulfilled') {
      allResults.push(...result.value);
    }
  });

  // Remove duplicates based on URL (normalize to avoid CDN variations)
  const uniqueResults = removeDuplicateImages(allResults);

  return uniqueResults;
}

/**
 * Remove duplicate images based on URL similarity
 * Handles CDN variations and keeps the highest quality version
 */
function removeDuplicateImages(images: ImageResult[]): ImageResult[] {
  const seen = new Map<string, ImageResult>();

  for (const img of images) {
    // Normalize URL for comparison (remove size params, CDN prefixes)
    const normalizedUrl = img.url
      .replace(/\?.*$/, '') // Remove query params
      .replace(/\/\d+x\d+\//, '/') // Remove size indicators
      .replace(/\._[A-Z]+\d+_/, '.') // Remove Amazon size codes
      .replace(/https?:\/\/[^\/]+/, '') // Remove domain for path comparison
      .toLowerCase();

    const existing = seen.get(normalizedUrl);
    if (!existing || img.quality > existing.quality) {
      seen.set(normalizedUrl, img);
    }
  }

  return Array.from(seen.values());
}

/**
 * Smart search with auto-retry using search variations
 * Tries progressively simpler search queries if initial searches fail
 */
export async function smartSearchProductImage(params: ProductSearchParams): Promise<{
  images: ImageResult[];
  searchVariationUsed: string;
}> {
  const variations = generateSearchVariations(params.name, params.brand);
  console.log(`[SmartSearch] Trying ${variations.length} search variations for "${params.name}"`);

  for (let i = 0; i < variations.length; i++) {
    const variation = variations[i];
    console.log(`[SmartSearch] Attempt ${i + 1}/${variations.length}: "${variation}"`);

    // Create modified params with the current search variation
    const modifiedParams: ProductSearchParams = {
      ...params,
      name: variation,
    };

    const images = await searchProductImage(modifiedParams);

    // Filter to only include images with a minimum quality score
    const qualityImages = images.filter(img => scoreImage(img, params) >= 30);

    if (qualityImages.length > 0) {
      console.log(`[SmartSearch] Found ${qualityImages.length} quality images with variation: "${variation}"`);
      return {
        images: qualityImages,
        searchVariationUsed: variation,
      };
    }

    // Add a small delay before trying next variation
    if (i < variations.length - 1) {
      await delay(1000);
    }
  }

  console.log(`[SmartSearch] No images found after trying all ${variations.length} variations`);
  return {
    images: [],
    searchVariationUsed: 'none',
  };
}

/**
 * Find and assign image to a single product
 * Enhanced with smart search and auto-retry
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

    // Search for images using smart search with auto-retry
    const searchParams: ProductSearchParams = {
      name: product.name,
      brand: product.brand?.name,
      sku: product.sku || undefined,
      category: product.category || undefined,
    };

    // Use smart search which tries multiple variations
    const { images, searchVariationUsed } = await smartSearchProductImage(searchParams);
    console.log(`[ImageScraper] Search for "${product.name}" used variation: "${searchVariationUsed}", found ${images.length} images`);

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

/**
 * Download image and convert to base64 data URL
 * This ensures images work on all devices (including mobile Safari)
 * by avoiding hotlink protection and CORS issues
 */
async function downloadImageAsBase64(imageUrl: string, retries = 3): Promise<string | null> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // Add referer header to bypass some hotlink protection
      const urlObj = new URL(imageUrl);
      const referer = `${urlObj.protocol}//${urlObj.hostname}/`;

      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        headers: {
          'User-Agent': getRandomUserAgent(),
          'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Referer': referer,
          'Origin': referer.slice(0, -1),
        },
        timeout: 60000, // Increased timeout to 60 seconds
        maxContentLength: 10 * 1024 * 1024, // 10MB max
        maxRedirects: 5,
        validateStatus: (status) => status < 400,
      });

      // Check if we got actual image data
      if (!response.data || response.data.length < 100) {
        console.log(`Attempt ${attempt}: Empty or too small response from ${imageUrl}`);
        if (attempt < retries) {
          await delay(1000 * attempt);
          continue;
        }
        return null;
      }

      // Determine MIME type from content-type or URL
      const contentType = response.headers['content-type'] || '';
      let mimeType = 'image/jpeg';

      if (contentType.includes('png')) {
        mimeType = 'image/png';
      } else if (contentType.includes('webp')) {
        mimeType = 'image/webp';
      } else if (contentType.includes('gif')) {
        mimeType = 'image/gif';
      } else if (imageUrl.match(/\.png(\?|$)/i)) {
        mimeType = 'image/png';
      } else if (imageUrl.match(/\.webp(\?|$)/i)) {
        mimeType = 'image/webp';
      } else if (imageUrl.match(/\.gif(\?|$)/i)) {
        mimeType = 'image/gif';
      }

      // Convert to base64
      const base64 = Buffer.from(response.data).toString('base64');
      const dataUrl = `data:${mimeType};base64,${base64}`;

      // Verify the base64 is valid and not too small (likely an error image)
      if (base64.length < 500) {
        console.log(`Attempt ${attempt}: Base64 too small (${base64.length} chars), likely an error image`);
        if (attempt < retries) {
          await delay(1000 * attempt);
          continue;
        }
        return null;
      }

      console.log(`Successfully downloaded image (${Math.round(base64.length / 1024)}KB) from ${imageUrl.substring(0, 80)}...`);
      return dataUrl;
    } catch (error: any) {
      const errorMsg = error?.message || 'Unknown error';
      console.log(`Attempt ${attempt}/${retries} failed for ${imageUrl.substring(0, 60)}...: ${errorMsg}`);

      if (attempt < retries) {
        // Wait before retrying, with exponential backoff
        await delay(1000 * attempt);
      }
    }
  }

  console.error(`All ${retries} attempts failed to download image from ${imageUrl}`);
  return null;
}

/**
 * Save a specific image URL to a product
 *
 * STORAGE STRATEGY:
 * - If Cloudinary is configured: Upload to Cloudinary CDN (recommended for production)
 * - If Cloudinary not configured: Fall back to base64 storage (development only)
 *
 * Accepts either a single imageUrl or an array of fallback URLs to try
 */
export async function saveProductImage(
  productId: string,
  imageUrl: string | string[],
  options?: {
    source?: string;
    replacedBy?: string;
  }
): Promise<ScrapeResult> {
  // Lazy import to avoid circular dependencies
  const cloudinaryService = await import('./cloudinary.service');
  const useCloudinary = cloudinaryService.isCloudinaryConfigured();

  try {
    // Get product details including current images for history tracking
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, name: true, images: true },
    });

    if (!product) {
      return {
        productId,
        productName: 'Unknown',
        success: false,
        error: 'Product not found',
      };
    }

    // Support both single URL and array of fallback URLs
    const imageUrls = Array.isArray(imageUrl) ? imageUrl : [imageUrl];

    let finalImageUrl: string | null = null;
    let successfulUrl: string | null = null;

    for (const url of imageUrls) {
      console.log(`Attempting to process image for ${product.name} from: ${url.substring(0, 60)}...`);

      if (useCloudinary) {
        // PRODUCTION: Upload to Cloudinary CDN
        const result = await cloudinaryService.uploadFromUrl(url, {
          folder: 'femmelux/products',
          publicId: `product-${productId}`,
          tags: [product.name.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 50)],
        });

        if (result.success && result.url) {
          finalImageUrl = result.url;
          successfulUrl = url;
          console.log(`Successfully uploaded to Cloudinary for ${product.name}`);
          break;
        } else {
          console.log(`Cloudinary upload failed: ${result.error}, trying next URL if available`);
        }
      } else {
        // DEVELOPMENT FALLBACK: Download and store as base64
        // Note: This is not recommended for production due to database bloat
        if (url.startsWith('data:')) {
          finalImageUrl = url;
          successfulUrl = 'data-url';
          break;
        }

        const base64Url = await downloadImageAsBase64(url);
        if (base64Url) {
          finalImageUrl = base64Url;
          successfulUrl = url;
          console.log(`Successfully downloaded image for ${product.name} (base64 fallback)`);
          break;
        } else {
          console.log(`Failed to download from ${url.substring(0, 60)}..., trying next URL if available`);
        }
      }
    }

    if (!finalImageUrl) {
      return {
        productId,
        productName: product.name,
        success: false,
        error: `Failed to process image from ${imageUrls.length} URL(s)`,
      };
    }

    // Track image history before replacing (if product has existing images)
    const existingImages = product.images as string[];
    if (existingImages && existingImages.length > 0 && existingImages[0]) {
      const previousImageUrl = existingImages[0];
      // Only track if it's a real image URL (not placeholder)
      if (!previousImageUrl.includes('placeholder') && !previousImageUrl.includes('noimage')) {
        try {
          await prisma.productImageHistory.create({
            data: {
              productId,
              imageUrl: previousImageUrl,
              source: options?.source || 'previous',
              replacedBy: options?.replacedBy,
            },
          });
          console.log(`[ImageHistory] Saved previous image to history for product ${productId}`);
        } catch (historyError) {
          // Don't fail the main operation if history tracking fails
          console.error(`[ImageHistory] Failed to save history:`, historyError);
        }
      }
    }

    // Store the image URL (Cloudinary URL or base64)
    await prisma.product.update({
      where: { id: productId },
      data: {
        images: [finalImageUrl],
      },
    });

    return {
      productId,
      productName: product.name,
      success: true,
      imageUrl: useCloudinary ? finalImageUrl : (successfulUrl === 'data-url' ? 'data-url' : (successfulUrl?.substring(0, 80) + '...')),
      source: useCloudinary ? 'cloudinary' : 'base64',
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
 * Fix products with broken local image paths by clearing them
 * This allows them to be re-searched and saved with proper external URLs
 */
export async function fixBrokenImagePaths(): Promise<{
  total: number;
  fixed: number;
  products: { id: string; name: string; oldImages: string[] }[];
}> {
  // Find products with local upload paths
  const products = await prisma.product.findMany({
    where: {
      images: {
        isEmpty: false,
      },
    },
    select: {
      id: true,
      name: true,
      images: true,
    },
  });

  // Filter products with local paths (starting with /uploads/)
  const productsWithLocalPaths = products.filter(p => {
    const images = p.images as string[];
    return images && images.length > 0 && images.some(img =>
      img && (img.startsWith('/uploads/') || img.startsWith('uploads/'))
    );
  });

  const fixed: { id: string; name: string; oldImages: string[] }[] = [];

  // Clear images for products with local paths
  for (const product of productsWithLocalPaths) {
    await prisma.product.update({
      where: { id: product.id },
      data: { images: [] },
    });
    fixed.push({
      id: product.id,
      name: product.name,
      oldImages: product.images as string[],
    });
  }

  return {
    total: productsWithLocalPaths.length,
    fixed: fixed.length,
    products: fixed,
  };
}

// ============================================
// IMAGE HISTORY FUNCTIONS
// ============================================

/**
 * Get image history for a product
 */
export async function getProductImageHistory(productId: string): Promise<{
  productId: string;
  productName: string;
  currentImage: string | null;
  history: {
    id: string;
    imageUrl: string;
    source: string | null;
    replacedAt: Date;
    replacedBy: string | null;
  }[];
}> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      name: true,
      images: true,
      imageHistory: {
        orderBy: { replacedAt: 'desc' },
        take: 20,
      },
    },
  });

  if (!product) {
    return {
      productId,
      productName: 'Unknown',
      currentImage: null,
      history: [],
    };
  }

  const images = product.images as string[];

  return {
    productId: product.id,
    productName: product.name,
    currentImage: images && images.length > 0 ? images[0] : null,
    history: product.imageHistory,
  };
}

/**
 * Restore a previous image from history
 */
export async function restoreImageFromHistory(
  productId: string,
  historyId: string,
  replacedBy?: string
): Promise<{ success: boolean; error?: string; restoredImageUrl?: string }> {
  try {
    // Get the history entry
    const historyEntry = await prisma.productImageHistory.findUnique({
      where: { id: historyId },
    });

    if (!historyEntry) {
      return { success: false, error: 'History entry not found' };
    }

    if (historyEntry.productId !== productId) {
      return { success: false, error: 'History entry does not belong to this product' };
    }

    // Get current image to save to history before replacing
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { images: true },
    });

    if (product) {
      const currentImages = product.images as string[];
      if (currentImages && currentImages.length > 0 && currentImages[0]) {
        // Save current image to history
        await prisma.productImageHistory.create({
          data: {
            productId,
            imageUrl: currentImages[0],
            source: 'replaced_by_restore',
            replacedBy,
          },
        });
      }
    }

    // Restore the old image
    await prisma.product.update({
      where: { id: productId },
      data: {
        images: [historyEntry.imageUrl],
      },
    });

    // Optionally delete the history entry that was restored
    await prisma.productImageHistory.delete({
      where: { id: historyId },
    });

    return {
      success: true,
      restoredImageUrl: historyEntry.imageUrl,
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

export default {
  searchProductImage,
  smartSearchProductImage,
  findAndAssignProductImage,
  bulkFindProductImages,
  getProductsWithoutImagesCount,
  saveProductImage,
  fixBrokenImagePaths,
  getProductImageHistory,
  restoreImageFromHistory,
};
