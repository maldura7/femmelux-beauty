'use client';

import { useState, useEffect, useRef } from 'react';
import {
  PhotoIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  StopIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '@/lib/api';

interface Brand {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string | null;
  brand: {
    id: string;
    name: string;
  };
  images: string[];
}

interface SearchResult {
  productId: string;
  productName: string;
  brandName: string;
  sku: string;
  success: boolean;
  imageUrl?: string;
  source?: string;
  error?: string;
}

export default function BulkImagesPage() {
  // State
  const [brands, setBrands] = useState<Brand[]>([]);
  const [noImageCount, setNoImageCount] = useState<number | null>(null);
  const [products, setProducts] = useState<Product[]>([]);

  // Filters
  const [selectedBrand, setSelectedBrand] = useState<string>('');

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [isStopped, setIsStopped] = useState(false);
  const stopRef = useRef(false);

  // Progress tracking
  const [progress, setProgress] = useState({ current: 0, total: 0, found: 0, failed: 0 });
  const [results, setResults] = useState<SearchResult[]>([]);
  const [currentProduct, setCurrentProduct] = useState<string>('');

  // Batch size for processing
  const [batchSize, setBatchSize] = useState(50);

  // Fetch initial data
  useEffect(() => {
    fetchBrands();
  }, []);

  // Fetch count when filters change
  useEffect(() => {
    fetchNoImageCount();
    fetchProducts();
  }, [selectedBrand]);

  const fetchBrands = async () => {
    try {
      const response = await api.get('/brands?limit=500');
      const brandsData = response.data.data?.brands || response.data.data || [];
      setBrands(brandsData);
    } catch (err) {
      console.error('Failed to fetch brands:', err);
    }
  };

  const fetchNoImageCount = async () => {
    setIsLoading(true);
    try {
      // Use image scraper stats endpoint to get count
      const params = new URLSearchParams();
      if (selectedBrand) params.append('brandId', selectedBrand);

      const response = await api.get(`/image-scraper/stats?${params.toString()}`);
      setNoImageCount(response.data.data?.productsWithoutImages || 0);
    } catch (err) {
      console.error('Failed to fetch no-image count:', err);
      // Fallback: fetch products and count
      try {
        const params = new URLSearchParams();
        params.append('limit', '1');
        if (selectedBrand) params.append('brandId', selectedBrand);

        const response = await api.get(`/products?${params.toString()}`);
        // This is a rough estimate
        setNoImageCount(response.data.data?.pagination?.total || 0);
      } catch {
        setNoImageCount(0);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const params = new URLSearchParams();
      params.append('limit', '20');
      if (selectedBrand) params.append('brandId', selectedBrand);

      const response = await api.get(`/products?${params.toString()}`);
      const productsData = response.data.data?.products || response.data.data || [];
      // Filter to only products without images
      const noImageProducts = productsData.filter((p: Product) =>
        !p.images || p.images.length === 0 || p.images.every((img: string) => !img)
      );
      setProducts(noImageProducts);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    }
  };

  // Fetch all products without images for bulk processing
  const fetchAllProductsWithoutImages = async (): Promise<Product[]> => {
    const allProducts: Product[] = [];
    let page = 1;
    const limit = 100;

    toast.loading('Fetching products without images...', { id: 'fetch-products' });

    while (true) {
      const params = new URLSearchParams();
      params.append('limit', String(limit));
      params.append('page', String(page));
      if (selectedBrand) params.append('brandId', selectedBrand);

      try {
        const response = await api.get(`/products?${params.toString()}`);
        const productsData = response.data.data?.products || response.data.data || [];
        const pagination = response.data.data?.pagination;

        // Filter to only products without images
        const noImageProducts = productsData.filter((p: Product) =>
          !p.images || p.images.length === 0 || p.images.every((img: string) => !img || img.includes('placeholder') || img.includes('unsplash'))
        );

        allProducts.push(...noImageProducts);

        if (!pagination || page >= pagination.pages || productsData.length === 0) {
          break;
        }
        page++;
      } catch (err) {
        console.error('Error fetching page', page, err);
        break;
      }
    }

    toast.dismiss('fetch-products');
    return allProducts;
  };

  const handleBulkSearch = async () => {
    if (noImageCount === 0) {
      toast.error('No products without images to process');
      return;
    }

    const confirmed = window.confirm(
      `This will search for real product images based on brand name, product name, and SKU.\n\n` +
      `This searches Sephora, Ulta, Lookfantastic, CultBeauty, brand websites, and Google Images.\n\n` +
      `This process may take a while (about 3-5 seconds per product).\n\n` +
      `Continue?`
    );

    if (!confirmed) return;

    setIsSearching(true);
    setIsStopped(false);
    stopRef.current = false;
    setResults([]);
    setProgress({ current: 0, total: 0, found: 0, failed: 0 });

    try {
      // Fetch all products without images
      const allProducts = await fetchAllProductsWithoutImages();

      if (allProducts.length === 0) {
        toast.error('No products without images found');
        setIsSearching(false);
        return;
      }

      // Limit to batch size
      const productsToProcess = allProducts.slice(0, batchSize);
      setProgress({ current: 0, total: productsToProcess.length, found: 0, failed: 0 });

      let foundCount = 0;
      let failedCount = 0;
      const searchResults: SearchResult[] = [];

      for (let i = 0; i < productsToProcess.length; i++) {
        // Check if stopped
        if (stopRef.current) {
          toast.success('Search stopped by user');
          break;
        }

        const product = productsToProcess[i];
        setCurrentProduct(`${product.brand?.name || ''} - ${product.name}`);

        try {
          // Search for images using the image scraper API
          const searchResponse = await api.post('/image-scraper/search', {
            name: product.name,
            brand: product.brand?.name,
            sku: product.sku,
            category: product.category,
          });

          const images = searchResponse.data.data?.results || [];

          if (images.length > 0) {
            // Found images - save the best one
            const bestImage = images[0];

            try {
              await api.post(`/image-scraper/assign/${product.id}`, {
                imageUrl: bestImage.url,
              });

              foundCount++;
              searchResults.push({
                productId: product.id,
                productName: product.name,
                brandName: product.brand?.name || '',
                sku: product.sku,
                success: true,
                imageUrl: bestImage.url,
                source: bestImage.source,
              });
            } catch (saveErr: any) {
              failedCount++;
              searchResults.push({
                productId: product.id,
                productName: product.name,
                brandName: product.brand?.name || '',
                sku: product.sku,
                success: false,
                error: `Save failed: ${saveErr?.message || 'Unknown error'}`,
              });
            }
          } else {
            failedCount++;
            searchResults.push({
              productId: product.id,
              productName: product.name,
              brandName: product.brand?.name || '',
              sku: product.sku,
              success: false,
              error: 'No images found',
            });
          }
        } catch (searchErr: any) {
          failedCount++;
          searchResults.push({
            productId: product.id,
            productName: product.name,
            brandName: product.brand?.name || '',
            sku: product.sku,
            success: false,
            error: searchErr?.message || 'Search failed',
          });
        }

        // Update progress
        setProgress({
          current: i + 1,
          total: productsToProcess.length,
          found: foundCount,
          failed: failedCount,
        });
        setResults([...searchResults]);

        // Add delay between products to avoid rate limiting
        if (i < productsToProcess.length - 1 && !stopRef.current) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      // Final summary
      toast.success(
        `Completed! Found images for ${foundCount} products. Failed: ${failedCount}`,
        { duration: 5000 }
      );

      // Refresh counts
      fetchNoImageCount();
      fetchProducts();

    } catch (err: any) {
      console.error('Bulk search failed:', err);
      toast.error(err?.response?.data?.message || 'Bulk search failed');
    } finally {
      setIsSearching(false);
      setCurrentProduct('');
    }
  };

  const handleStop = () => {
    stopRef.current = true;
    setIsStopped(true);
    toast.success('Stopping after current product...');
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <MagnifyingGlassIcon className="h-8 w-8 text-pink-600" />
          Bulk Image Search
        </h1>
        <p className="mt-2 text-gray-600">
          Search for real product images based on brand name, product name, and SKU.
          Images are sourced from Sephora, Ulta, Lookfantastic, CultBeauty, brand websites, and Google Images.
        </p>
      </div>

      {/* Stats Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Products Without Images</h2>
            <p className="text-sm text-gray-500 mt-1">
              {selectedBrand ? 'Filtered by brand' : 'All products'}
            </p>
          </div>
          <div className="text-right">
            {isLoading ? (
              <div className="flex items-center gap-2 text-gray-500">
                <ArrowPathIcon className="h-5 w-5 animate-spin" />
                Loading...
              </div>
            ) : (
              <div className="text-4xl font-bold text-pink-600">
                {noImageCount?.toLocaleString() || 0}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <FunnelIcon className="h-5 w-5 text-gray-400" />
          <h3 className="font-semibold text-gray-800">Filters</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Brand (Recommended: select one brand at a time)
            </label>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-pink-500 focus:border-pink-500"
              disabled={isSearching}
            >
              <option value="">All Brands</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Batch Size (products to process)
            </label>
            <select
              value={batchSize}
              onChange={(e) => setBatchSize(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-pink-500 focus:border-pink-500"
              disabled={isSearching}
            >
              <option value="10">10 products</option>
              <option value="25">25 products</option>
              <option value="50">50 products</option>
              <option value="100">100 products</option>
              <option value="250">250 products</option>
              <option value="500">500 products</option>
            </select>
          </div>
        </div>
      </div>

      {/* Progress */}
      {isSearching && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-blue-800">Searching for Images...</h3>
            <button
              onClick={handleStop}
              disabled={isStopped}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
            >
              <StopIcon className="h-4 w-4" />
              Stop
            </button>
          </div>

          <div className="mb-2">
            <div className="flex justify-between text-sm text-blue-700 mb-1">
              <span>Progress: {progress.current} / {progress.total}</span>
              <span>{Math.round((progress.current / progress.total) * 100)}%</span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              />
            </div>
          </div>

          <div className="flex gap-6 text-sm">
            <span className="text-green-700">
              <CheckCircleIcon className="h-4 w-4 inline mr-1" />
              Found: {progress.found}
            </span>
            <span className="text-red-700">
              <XCircleIcon className="h-4 w-4 inline mr-1" />
              Failed: {progress.failed}
            </span>
          </div>

          {currentProduct && (
            <p className="mt-3 text-sm text-blue-600 truncate">
              Currently searching: {currentProduct}
            </p>
          )}
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h3 className="font-semibold text-gray-800 mb-4">
            Results ({results.length} products processed)
          </h3>

          <div className="max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">Status</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">Brand</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">Product</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">SKU</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {results.map((result, idx) => (
                  <tr key={idx} className={result.success ? 'bg-green-50' : 'bg-red-50'}>
                    <td className="px-3 py-2">
                      {result.success ? (
                        <CheckCircleIcon className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircleIcon className="h-5 w-5 text-red-600" />
                      )}
                    </td>
                    <td className="px-3 py-2 text-gray-800">{result.brandName}</td>
                    <td className="px-3 py-2 text-gray-800 max-w-xs truncate" title={result.productName}>
                      {result.productName}
                    </td>
                    <td className="px-3 py-2 text-gray-600 font-mono text-xs">{result.sku}</td>
                    <td className="px-3 py-2 text-gray-600">
                      {result.success ? result.source : (
                        <span className="text-red-600 text-xs">{result.error}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Preview of products without images */}
      {!isSearching && products.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h3 className="font-semibold text-gray-800 mb-4">
            Sample Products Without Images (first 20)
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Brand</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Product</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">SKU</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Category</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {products.map((product) => (
                  <tr key={product.id}>
                    <td className="px-4 py-3 text-gray-800">{product.brand?.name || '-'}</td>
                    <td className="px-4 py-3 text-gray-800 max-w-xs truncate" title={product.name}>
                      {product.name}
                    </td>
                    <td className="px-4 py-3 text-gray-600 font-mono text-xs">{product.sku}</td>
                    <td className="px-4 py-3 text-gray-600">{product.category || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Actions</h3>

        <div className="flex flex-wrap gap-4">
          <button
            onClick={handleBulkSearch}
            disabled={isSearching || (noImageCount === 0 && products.length === 0)}
            className="px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50 flex items-center gap-2"
          >
            {isSearching ? (
              <>
                <ArrowPathIcon className="h-5 w-5 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <MagnifyingGlassIcon className="h-5 w-5" />
                Start Bulk Image Search ({batchSize} products)
              </>
            )}
          </button>
        </div>

        {/* Info */}
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
          <ExclamationTriangleIcon className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700">
            <p className="font-medium">How it works:</p>
            <ul className="mt-1 list-disc list-inside space-y-1">
              <li>Searches for images using: <strong>Brand Name + Product Name + SKU</strong></li>
              <li>Sources: Sephora, Ulta, Lookfantastic, CultBeauty, brand websites, Google Images</li>
              <li>Takes about 3-5 seconds per product due to rate limiting</li>
              <li>Automatically saves the best matching image found</li>
              <li>Select a specific brand to process products faster</li>
              <li>You can stop the search at any time - progress is saved</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
