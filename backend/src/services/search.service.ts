import { PrismaClient, Product, Brand, Prisma } from '@prisma/client';
import Fuse from 'fuse.js';
import { findBestMatch } from 'string-similarity';

const prisma = new PrismaClient();

// ============================================
// TYPES
// ============================================

export interface SearchFilters {
  brandId?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'relevance' | 'price_asc' | 'price_desc' | 'popularity' | 'newest';
}

export interface SearchResult {
  products: ProductWithBrand[];
  total: number;
  page: number;
  pages: number;
  query: string;
  suggestion?: string | null;
}

export interface SearchSuggestions {
  products: ProductSuggestion[];
  brands: BrandSuggestion[];
  categories: CategorySuggestion[];
}

export interface ProductSuggestion {
  id: string;
  name: string;
  slug: string;
  images: string[];
  wholesalePrice: number;
  brand?: { name: string };
}

export interface BrandSuggestion {
  id: string;
  name: string;
  slug: string;
}

export interface CategorySuggestion {
  id: string;
  name: string;
  slug: string;
}

export interface PopularSearch {
  query: string;
  count: number;
}

type ProductWithBrand = Product & { brand: Brand };

// ============================================
// SEARCH SERVICE CLASS
// ============================================

class SearchService {
  private productNamesCache: string[] | null = null;
  private productNamesCacheExpiry: number = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Search products with filters and relevance ranking
   */
  async searchProducts(query: string, filters: SearchFilters = {}): Promise<SearchResult> {
    const {
      brandId,
      categoryId,
      minPrice,
      maxPrice,
      inStock,
      page = 1,
      limit = 20,
      sortBy = 'relevance',
    } = filters;

    // Clean and process query
    const cleanQuery = this.cleanQuery(query);
    const searchTerms = cleanQuery.split(' ').filter((term) => term.length > 1);

    if (searchTerms.length === 0) {
      return {
        products: [],
        total: 0,
        page,
        pages: 0,
        query,
      };
    }

    // Build where clause for database query
    const whereConditions: Prisma.ProductWhereInput[] = [
      { status: true },
    ];

    // Add search conditions - match any term in name, description, or sku
    const searchOrConditions: Prisma.ProductWhereInput[] = [
      // Exact phrase match (highest priority - handled by Fuse.js later)
      { name: { contains: cleanQuery, mode: 'insensitive' } },
      { description: { contains: cleanQuery, mode: 'insensitive' } },
      { sku: { contains: cleanQuery, mode: 'insensitive' } },
    ];

    // Add individual term matches
    searchTerms.forEach((term) => {
      searchOrConditions.push(
        { name: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
        { sku: { contains: term, mode: 'insensitive' } }
      );
    });

    whereConditions.push({ OR: searchOrConditions });

    // Apply filters
    if (brandId) {
      whereConditions.push({ brandId });
    }
    if (categoryId) {
      whereConditions.push({ category: categoryId });
    }
    if (minPrice !== undefined) {
      whereConditions.push({ wholesalePrice: { gte: minPrice } });
    }
    if (maxPrice !== undefined) {
      whereConditions.push({ wholesalePrice: { lte: maxPrice } });
    }
    if (inStock) {
      whereConditions.push({ quantity: { gt: 0 } });
    }

    // Get products from database (get more for ranking)
    const products = await prisma.product.findMany({
      where: { AND: whereConditions },
      include: { brand: true },
      take: 200, // Get more for better ranking
    });

    // Rank results using Fuse.js for fuzzy matching
    let rankedProducts: ProductWithBrand[];

    if (sortBy === 'relevance') {
      rankedProducts = this.rankByRelevance(products, cleanQuery);
    } else {
      rankedProducts = products;
    }

    // Apply sorting
    rankedProducts = this.applySorting(rankedProducts, sortBy);

    // Paginate results
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedProducts = rankedProducts.slice(startIndex, endIndex);

    // Get "did you mean" suggestion if no or few results
    let suggestion: string | null = null;
    if (rankedProducts.length < 3) {
      suggestion = await this.getDidYouMean(query);
    }

    return {
      products: paginatedProducts,
      total: rankedProducts.length,
      page,
      pages: Math.ceil(rankedProducts.length / limit),
      query,
      suggestion,
    };
  }

  /**
   * Get search suggestions for autocomplete
   */
  async getSearchSuggestions(query: string, limit = 10): Promise<SearchSuggestions> {
    if (query.length < 2) {
      return { products: [], brands: [], categories: [] };
    }

    const cleanQuery = this.cleanQuery(query);

    // Get product suggestions
    const productSuggestions = await prisma.product.findMany({
      where: {
        OR: [
          { name: { startsWith: cleanQuery, mode: 'insensitive' } },
          { name: { contains: cleanQuery, mode: 'insensitive' } },
        ],
        status: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        images: true,
        wholesalePrice: true,
        brand: { select: { name: true } },
      },
      orderBy: { popularity: 'desc' },
      take: limit,
    });

    // Get brand suggestions
    const brandSuggestions = await prisma.brand.findMany({
      where: {
        name: { contains: cleanQuery, mode: 'insensitive' },
        status: true,
      },
      select: { id: true, name: true, slug: true },
      take: 3,
    });

    // Get category suggestions
    const categorySuggestions = await prisma.category.findMany({
      where: {
        name: { contains: cleanQuery, mode: 'insensitive' },
        status: true,
      },
      select: { id: true, name: true, slug: true },
      take: 3,
    });

    return {
      products: productSuggestions.map((p) => ({
        ...p,
        wholesalePrice: Number(p.wholesalePrice),
      })),
      brands: brandSuggestions,
      categories: categorySuggestions,
    };
  }

  /**
   * Get "Did you mean" suggestion for typos
   */
  async getDidYouMean(query: string): Promise<string | null> {
    const productNames = await this.getProductNamesCache();

    if (productNames.length === 0) {
      return null;
    }

    const cleanQuery = this.cleanQuery(query);
    const matches = findBestMatch(cleanQuery, productNames);

    // If similarity is between 0.4 and 0.85, suggest correction
    // Below 0.4: too different, above 0.85: probably correct
    if (matches.bestMatch.rating > 0.4 && matches.bestMatch.rating < 0.85) {
      return matches.bestMatch.target;
    }

    return null;
  }

  /**
   * Log a search query
   */
  async logSearch(
    query: string,
    resultsCount: number,
    userId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<string> {
    const searchLog = await prisma.searchLog.create({
      data: {
        query: query.toLowerCase().trim(),
        resultsCount,
        userId,
        ipAddress,
        userAgent,
      },
    });

    return searchLog.id;
  }

  /**
   * Log when a user clicks on a product from search results
   */
  async logProductClick(searchLogId: string, productId: string): Promise<void> {
    // Update search log with clicked product
    await prisma.searchLog.update({
      where: { id: searchLogId },
      data: { clickedProductId: productId },
    });

    // Increment product popularity
    await prisma.product.update({
      where: { id: productId },
      data: { popularity: { increment: 1 } },
    });
  }

  /**
   * Get popular search queries
   */
  async getPopularSearches(limit = 10): Promise<PopularSearch[]> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const searches = await prisma.searchLog.groupBy({
      by: ['query'],
      _count: { query: true },
      orderBy: { _count: { query: 'desc' } },
      take: limit,
      where: {
        resultsCount: { gt: 0 },
        createdAt: { gte: thirtyDaysAgo },
      },
    });

    return searches.map((s) => ({
      query: s.query,
      count: s._count.query,
    }));
  }

  /**
   * Get user's search history
   */
  async getUserSearchHistory(
    userId: string,
    limit = 10
  ): Promise<{ query: string; createdAt: Date }[]> {
    const history = await prisma.searchLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit * 2, // Get more to filter duplicates
      select: { query: true, createdAt: true },
    });

    // Filter to unique queries
    const seen = new Set<string>();
    const uniqueHistory: { query: string; createdAt: Date }[] = [];

    for (const entry of history) {
      if (!seen.has(entry.query) && uniqueHistory.length < limit) {
        seen.add(entry.query);
        uniqueHistory.push(entry);
      }
    }

    return uniqueHistory;
  }

  /**
   * Increment product view count
   */
  async incrementProductView(productId: string): Promise<void> {
    await prisma.product.update({
      where: { id: productId },
      data: { viewCount: { increment: 1 } },
    });
  }

  /**
   * Update product search vector (call when product is created/updated)
   */
  async updateSearchVector(productId: string): Promise<void> {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { brand: true },
    });

    if (!product) return;

    // Combine searchable text
    const searchVector = [
      product.name,
      product.description,
      product.sku,
      product.brand?.name || '',
      product.category || '',
    ]
      .join(' ')
      .toLowerCase();

    await prisma.product.update({
      where: { id: productId },
      data: { searchVector },
    });
  }

  /**
   * Rebuild search vectors for all products
   */
  async rebuildAllSearchVectors(): Promise<number> {
    const products = await prisma.product.findMany({
      include: { brand: true },
    });

    let updated = 0;

    for (const product of products) {
      const searchVector = [
        product.name,
        product.description,
        product.sku,
        product.brand?.name || '',
        product.category || '',
      ]
        .join(' ')
        .toLowerCase();

      await prisma.product.update({
        where: { id: product.id },
        data: { searchVector },
      });

      updated++;
    }

    return updated;
  }

  // ============================================
  // PRIVATE HELPER METHODS
  // ============================================

  /**
   * Clean and normalize search query
   */
  private cleanQuery(query: string): string {
    return query
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, ' '); // Normalize whitespace
  }

  /**
   * Rank products by relevance using Fuse.js
   */
  private rankByRelevance(
    products: ProductWithBrand[],
    query: string
  ): ProductWithBrand[] {
    if (products.length === 0) return [];

    const fuse = new Fuse(products, {
      keys: [
        { name: 'name', weight: 0.5 },
        { name: 'description', weight: 0.2 },
        { name: 'sku', weight: 0.2 },
        { name: 'brand.name', weight: 0.1 },
      ],
      threshold: 0.6,
      includeScore: true,
      ignoreLocation: true,
      minMatchCharLength: 2,
    });

    const results = fuse.search(query);

    // If Fuse.js found matches, use those; otherwise return original list
    // sorted by popularity
    if (results.length > 0) {
      return results.map((r) => r.item);
    }

    // Fallback: sort by popularity if no fuzzy matches
    return [...products].sort((a, b) => b.popularity - a.popularity);
  }

  /**
   * Apply sorting to products
   */
  private applySorting(
    products: ProductWithBrand[],
    sortBy: string
  ): ProductWithBrand[] {
    const sorted = [...products];

    switch (sortBy) {
      case 'price_asc':
        sorted.sort(
          (a, b) => Number(a.wholesalePrice) - Number(b.wholesalePrice)
        );
        break;
      case 'price_desc':
        sorted.sort(
          (a, b) => Number(b.wholesalePrice) - Number(a.wholesalePrice)
        );
        break;
      case 'popularity':
        sorted.sort((a, b) => b.popularity - a.popularity);
        break;
      case 'newest':
        sorted.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
      // 'relevance' is already handled by rankByRelevance
    }

    return sorted;
  }

  /**
   * Get cached product names for typo detection
   */
  private async getProductNamesCache(): Promise<string[]> {
    const now = Date.now();

    if (this.productNamesCache && now < this.productNamesCacheExpiry) {
      return this.productNamesCache;
    }

    const products = await prisma.product.findMany({
      where: { status: true },
      select: { name: true },
    });

    this.productNamesCache = products.map((p) => p.name.toLowerCase());
    this.productNamesCacheExpiry = now + this.CACHE_TTL;

    return this.productNamesCache;
  }

  /**
   * Clear product names cache (call when products are updated)
   */
  clearProductNamesCache(): void {
    this.productNamesCache = null;
    this.productNamesCacheExpiry = 0;
  }
}

// Export singleton instance
export const searchService = new SearchService();
export default searchService;
