'use client';

import { useState, useEffect } from 'react';
import {
  PhotoIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '@/lib/api';

interface Brand {
  id: string;
  name: string;
}

interface PlaceholderCategory {
  category: string;
  sampleImage: string;
  imageCount: number;
}

interface ProductPreview {
  id: string;
  name: string;
  category: string | null;
  brandName: string;
  suggestedImage: string;
}

interface BulkAssignResult {
  totalProcessed: number;
  updated: number;
  skipped: number;
  categoryStats: Record<string, number>;
}

export default function BulkImagesPage() {
  // State
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<PlaceholderCategory[]>([]);
  const [noImageCount, setNoImageCount] = useState<number | null>(null);
  const [products, setProducts] = useState<ProductPreview[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);

  // Filters
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isDryRun, setIsDryRun] = useState(false);
  const [assignResult, setAssignResult] = useState<BulkAssignResult | null>(null);

  // Fetch initial data
  useEffect(() => {
    fetchBrands();
    fetchCategories();
  }, []);

  // Fetch count when filters change
  useEffect(() => {
    fetchNoImageCount();
    fetchProducts();
  }, [selectedBrand, selectedCategory]);

  const fetchBrands = async () => {
    try {
      const response = await api.get('/brands?limit=100');
      const brandsData = response.data.data?.brands || response.data.data || [];
      setBrands(brandsData);
    } catch (err) {
      console.error('Failed to fetch brands:', err);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/products/images/categories');
      const categoriesData = response.data.data?.categories || [];
      setCategories(categoriesData);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const fetchNoImageCount = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedBrand) params.append('brandId', selectedBrand);
      if (selectedCategory) params.append('category', selectedCategory);

      const response = await api.get(`/products/images/no-image-count?${params.toString()}`);
      setNoImageCount(response.data.data?.count || 0);
    } catch (err) {
      console.error('Failed to fetch no-image count:', err);
      setNoImageCount(0);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const params = new URLSearchParams();
      params.append('limit', '20');
      if (selectedBrand) params.append('brandId', selectedBrand);
      if (selectedCategory) params.append('category', selectedCategory);

      const response = await api.get(`/products/images/no-image?${params.toString()}`);
      setProducts(response.data.data?.products || []);
      setTotalProducts(response.data.data?.total || 0);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    }
  };

  const handleDryRun = async () => {
    setIsDryRun(true);
    setAssignResult(null);

    try {
      const response = await api.post('/products/images/bulk-assign', {
        brandId: selectedBrand || undefined,
        category: selectedCategory || undefined,
        dryRun: true,
      });

      setAssignResult(response.data.data);
      toast.success('Dry run completed - no changes made');
    } catch (err: any) {
      console.error('Dry run failed:', err);
      toast.error(err?.response?.data?.message || 'Dry run failed');
    } finally {
      setIsDryRun(false);
    }
  };

  const handleBulkAssign = async () => {
    if (noImageCount === 0) {
      toast.error('No products without images to process');
      return;
    }

    const confirmed = window.confirm(
      `This will assign placeholder images to ${noImageCount?.toLocaleString()} products.\n\n` +
      'Images will be assigned based on product category/name detection.\n\n' +
      'This action cannot be easily undone. Continue?'
    );

    if (!confirmed) return;

    setIsAssigning(true);
    setAssignResult(null);

    try {
      const response = await api.post('/products/images/bulk-assign', {
        brandId: selectedBrand || undefined,
        category: selectedCategory || undefined,
        dryRun: false,
      });

      setAssignResult(response.data.data);

      if (response.data.success) {
        toast.success(`Successfully assigned images to ${response.data.data.updated.toLocaleString()} products!`);
      } else {
        toast.error(response.data.message || 'Some errors occurred during assignment');
      }

      // Refresh the counts and preview
      fetchNoImageCount();
      fetchProducts();
    } catch (err: any) {
      console.error('Bulk assign failed:', err);
      toast.error(err?.response?.data?.message || 'Bulk assign failed');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleAssignInBatches = async () => {
    if (noImageCount === 0) {
      toast.error('No products without images to process');
      return;
    }

    const batchSize = 1000;
    const totalBatches = Math.ceil(noImageCount! / batchSize);

    const confirmed = window.confirm(
      `This will assign placeholder images to ${noImageCount?.toLocaleString()} products in ${totalBatches} batches of ${batchSize}.\n\n` +
      'This is recommended for large numbers of products.\n\n' +
      'Continue?'
    );

    if (!confirmed) return;

    setIsAssigning(true);
    setAssignResult(null);

    let totalUpdated = 0;
    let totalSkipped = 0;
    const allCategoryStats: Record<string, number> = {};

    try {
      for (let batch = 0; batch < totalBatches; batch++) {
        toast.loading(`Processing batch ${batch + 1} of ${totalBatches}...`, { id: 'batch-progress' });

        const response = await api.post('/products/images/bulk-assign', {
          brandId: selectedBrand || undefined,
          category: selectedCategory || undefined,
          limit: batchSize,
          dryRun: false,
        });

        const data = response.data.data;
        totalUpdated += data.updated;
        totalSkipped += data.skipped;

        // Merge category stats
        Object.entries(data.categoryStats).forEach(([cat, count]) => {
          allCategoryStats[cat] = (allCategoryStats[cat] || 0) + (count as number);
        });

        // Short delay between batches
        if (batch < totalBatches - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      toast.dismiss('batch-progress');

      setAssignResult({
        totalProcessed: totalUpdated + totalSkipped,
        updated: totalUpdated,
        skipped: totalSkipped,
        categoryStats: allCategoryStats,
      });

      toast.success(`Successfully assigned images to ${totalUpdated.toLocaleString()} products!`);

      // Refresh the counts and preview
      fetchNoImageCount();
      fetchProducts();
    } catch (err: any) {
      toast.dismiss('batch-progress');
      console.error('Batch assign failed:', err);
      toast.error(err?.response?.data?.message || 'Batch assign failed');
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <SparklesIcon className="h-8 w-8 text-pink-600" />
          Bulk Image Assignment
        </h1>
        <p className="mt-2 text-gray-600">
          Quickly assign placeholder images to all products without images. This is much faster than
          scraping individual products and ensures all products have visual representation.
        </p>
      </div>

      {/* Stats Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Products Without Images</h2>
            <p className="text-sm text-gray-500 mt-1">
              Based on current filters
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
          <h3 className="font-semibold text-gray-800">Filters (Optional)</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Brand
            </label>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-pink-500 focus:border-pink-500"
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
              Product Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-pink-500 focus:border-pink-500"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.category} value={cat.category}>
                  {cat.category.charAt(0).toUpperCase() + cat.category.slice(1)} ({cat.imageCount} images)
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Available Image Categories */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h3 className="font-semibold text-gray-800 mb-4">Available Placeholder Categories</h3>
        <p className="text-sm text-gray-500 mb-4">
          Products will be automatically categorized based on their name and category, then assigned
          a relevant placeholder image from Unsplash.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {categories.map((cat) => (
            <div
              key={cat.category}
              className="text-center p-3 rounded-lg border border-gray-200 hover:border-pink-300 transition-colors"
            >
              <div className="w-16 h-16 mx-auto rounded-lg overflow-hidden mb-2">
                <img
                  src={cat.sampleImage}
                  alt={cat.category}
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-sm font-medium text-gray-700 capitalize">{cat.category}</p>
              <p className="text-xs text-gray-500">{cat.imageCount} variations</p>
            </div>
          ))}
        </div>
      </div>

      {/* Preview */}
      {products.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h3 className="font-semibold text-gray-800 mb-4">
            Preview (showing first {products.length} of {totalProducts.toLocaleString()})
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Product</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Brand</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Category</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Suggested Image</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {products.map((product) => (
                  <tr key={product.id}>
                    <td className="px-4 py-3 text-gray-800 max-w-xs truncate" title={product.name}>
                      {product.name}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{product.brandName}</td>
                    <td className="px-4 py-3 text-gray-600">{product.category || '-'}</td>
                    <td className="px-4 py-3">
                      <div className="w-12 h-12 rounded overflow-hidden">
                        <img
                          src={product.suggestedImage}
                          alt="Suggested"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Results */}
      {assignResult && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
          <div className="flex items-start gap-3">
            <CheckCircleIcon className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-green-800">
                {isDryRun ? 'Dry Run Results' : 'Assignment Complete'}
              </h3>
              <div className="mt-2 space-y-1 text-sm text-green-700">
                <p>Total processed: <span className="font-medium">{assignResult.totalProcessed.toLocaleString()}</span></p>
                <p>Images assigned: <span className="font-medium">{assignResult.updated.toLocaleString()}</span></p>
                <p>Skipped: <span className="font-medium">{assignResult.skipped.toLocaleString()}</span></p>
              </div>

              {Object.keys(assignResult.categoryStats).length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-medium text-green-800 mb-1">By Category:</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(assignResult.categoryStats).map(([cat, count]) => (
                      <span
                        key={cat}
                        className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs capitalize"
                      >
                        {cat}: {(count as number).toLocaleString()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Actions</h3>

        <div className="flex flex-wrap gap-4">
          <button
            onClick={handleDryRun}
            disabled={isDryRun || isAssigning || noImageCount === 0}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2"
          >
            {isDryRun ? (
              <>
                <ArrowPathIcon className="h-5 w-5 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <PhotoIcon className="h-5 w-5" />
                Preview (Dry Run)
              </>
            )}
          </button>

          <button
            onClick={handleBulkAssign}
            disabled={isDryRun || isAssigning || noImageCount === 0}
            className="px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50 flex items-center gap-2"
          >
            {isAssigning ? (
              <>
                <ArrowPathIcon className="h-5 w-5 animate-spin" />
                Assigning...
              </>
            ) : (
              <>
                <SparklesIcon className="h-5 w-5" />
                Assign Images to All ({noImageCount?.toLocaleString()})
              </>
            )}
          </button>

          {noImageCount && noImageCount > 1000 && (
            <button
              onClick={handleAssignInBatches}
              disabled={isDryRun || isAssigning || noImageCount === 0}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
            >
              {isAssigning ? (
                <>
                  <ArrowPathIcon className="h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <SparklesIcon className="h-5 w-5" />
                  Assign in Batches (Recommended for 1000+)
                </>
              )}
            </button>
          )}
        </div>

        {/* Warning */}
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
          <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-700">
            <p className="font-medium">Note:</p>
            <ul className="mt-1 list-disc list-inside space-y-1">
              <li>Images are sourced from Unsplash (free, high-quality stock photos)</li>
              <li>Products are automatically categorized based on their name and category</li>
              <li>Each product gets a unique image from the relevant category</li>
              <li>This is faster than scraping but uses generic beauty product images</li>
              <li>For exact product images, use the Image Scraper tool instead</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
