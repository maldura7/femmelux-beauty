'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { Button, Input, Card, CardBody, CardHeader, CardTitle } from '@/components/ui';
import { ImageUpload, ImageItem } from './ImageUpload';
import { getAllBrands } from '@/lib/api/brands.api';
import type { Brand } from '@/types';

// Extended Product type that handles both API response fields and form fields
interface ProductData {
  id?: string;
  brandId: string;
  name: string;
  slug?: string;
  description?: string;
  // Pricing fields
  costPrice?: number;
  wholesalePrice: number;
  price?: number;
  retailPrice?: number;
  // Inventory fields
  quantity?: number;
  stockQuantity?: number;
  lowStockThreshold?: number;
  sku: string;
  images: string[];
  status: boolean;
  category?: string;
}

export interface ProductFormData {
  name: string;
  description?: string;
  brandId: string;
  category?: string;
  sku: string;
  costPrice: number;
  wholesalePrice: number;
  retailPrice: number;
  stockQuantity: number;
  lowStockThreshold: number;
  status: boolean;
  images: string[];
}

interface ProductFormProps {
  product?: ProductData;
  onSubmit: (data: ProductFormData, imageFiles: File[]) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function ProductForm({
  product,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: ProductFormProps) {
  const [images, setImages] = useState<ImageItem[]>([]);

  // Fetch brands
  const { data: brandsData } = useQuery({
    queryKey: ['brands'],
    queryFn: () => getAllBrands(),
  });

  const brands: Brand[] = Array.isArray(brandsData?.brands) ? brandsData.brands : [];

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProductFormData>({
    defaultValues: {
      name: product?.name || '',
      description: product?.description || '',
      brandId: product?.brandId || '',
      category: product?.category || '',
      sku: product?.sku || '',
      // Pricing fields
      costPrice: product?.costPrice ?? 0,
      wholesalePrice: product?.wholesalePrice ?? 0,
      retailPrice: product?.price ?? product?.retailPrice ?? 0,
      // Inventory fields
      stockQuantity: product?.quantity ?? product?.stockQuantity ?? 0,
      lowStockThreshold: product?.lowStockThreshold ?? 10,
      status: product?.status ?? true,
      images: product?.images || [],
    },
  });

  // Initialize images from product data
  useEffect(() => {
    if (product?.images && product.images.length > 0) {
      const existingImages: ImageItem[] = product.images.map((url, index) => ({
        id: `existing-${index}`,
        url,
        isPrimary: index === 0,
      }));
      setImages(existingImages);
    }
  }, [product]);

  const status = watch('status');
  const costPrice = watch('costPrice');
  const wholesalePrice = watch('wholesalePrice');
  const retailPrice = watch('retailPrice');

  // Calculate profit margins
  const wholesaleMargin =
    wholesalePrice && costPrice
      ? (((wholesalePrice - costPrice) / wholesalePrice) * 100).toFixed(1)
      : '0';

  const retailMargin =
    retailPrice && costPrice
      ? (((retailPrice - costPrice) / retailPrice) * 100).toFixed(1)
      : '0';

  const handleImagesChange = (newImages: ImageItem[]) => {
    setImages(newImages);
    // Update form value with URLs (for existing images) or temporary markers
    const imageUrls = newImages.map((img) => (img.file ? `pending:${img.id}` : img.url));
    setValue('images', imageUrls);
  };

  const handleFormSubmit = async (data: ProductFormData) => {
    // Get new files to upload
    const newFiles = images.filter((img) => img.file).map((img) => img.file as File);

    // Get existing image URLs
    const existingUrls = images.filter((img) => !img.file).map((img) => img.url);

    // Combine data with proper image handling
    const formData: ProductFormData = {
      ...data,
      images: existingUrls, // Only include existing URLs, new files handled separately
    };

    await onSubmit(formData, newFiles);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Section 1: Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          {/* Brand */}
          <div className="w-full">
            <label className="label">
              Brand <span className="text-error-500">*</span>
            </label>
            <select
              className={`input ${errors.brandId ? 'border-error-500 focus:border-error-500 focus:ring-error-500' : ''}`}
              {...register('brandId', { required: 'Brand is required' })}
            >
              <option value="">Select a brand</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
            {errors.brandId && (
              <p className="mt-1 text-sm text-error-500">{errors.brandId.message}</p>
            )}
          </div>

          {/* Product Name */}
          <Input
            label="Product Name"
            placeholder="Enter product name"
            error={errors.name?.message}
            required
            {...register('name', {
              required: 'Product name is required',
              minLength: {
                value: 2,
                message: 'Product name must be at least 2 characters',
              },
            })}
          />

          {/* Description */}
          <div className="w-full">
            <label className="label">
              Description <span className="text-error-500">*</span>
            </label>
            <textarea
              className={`input min-h-[120px] resize-y ${errors.description ? 'border-error-500' : ''}`}
              placeholder="Enter product description (minimum 10 characters)"
              {...register('description', {
                required: 'Description is required',
                minLength: {
                  value: 10,
                  message: 'Description must be at least 10 characters',
                },
              })}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-error-500">{errors.description.message}</p>
            )}
          </div>

          {/* Category */}
          <Input
            label="Category"
            placeholder="e.g., Skincare, Makeup, Haircare"
            {...register('category')}
          />
        </CardBody>
      </Card>

      {/* Section 2: Pricing */}
      <Card>
        <CardHeader>
          <CardTitle>Pricing</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Cost Price (Admin Only) */}
            <div className="w-full">
              <label className="label">
                Cost Price <span className="text-gray-400">(Your cost)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  className={`input pl-8 ${errors.costPrice ? 'border-error-500' : ''}`}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  {...register('costPrice', {
                    min: { value: 0, message: 'Cost must be positive' },
                    valueAsNumber: true,
                  })}
                />
              </div>
              {errors.costPrice && (
                <p className="mt-1 text-sm text-error-500">{errors.costPrice.message}</p>
              )}
              <p className="mt-1 text-xs text-gray-400">Only visible to admins</p>
            </div>

            {/* Wholesale Price */}
            <div className="w-full">
              <label className="label">
                Wholesale Price <span className="text-error-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  className={`input pl-8 ${errors.wholesalePrice ? 'border-error-500' : ''}`}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  {...register('wholesalePrice', {
                    required: 'Wholesale price is required',
                    min: { value: 0, message: 'Price must be positive' },
                    valueAsNumber: true,
                  })}
                />
              </div>
              {errors.wholesalePrice && (
                <p className="mt-1 text-sm text-error-500">{errors.wholesalePrice.message}</p>
              )}
              <p className="mt-1 text-xs text-gray-400">Price for approved customers</p>
            </div>

            {/* Retail Price */}
            <div className="w-full">
              <label className="label">
                Retail Price <span className="text-error-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  className={`input pl-8 ${errors.retailPrice ? 'border-error-500' : ''}`}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  {...register('retailPrice', {
                    required: 'Retail price is required',
                    min: { value: 0, message: 'Price must be positive' },
                    valueAsNumber: true,
                  })}
                />
              </div>
              {errors.retailPrice && (
                <p className="mt-1 text-sm text-error-500">{errors.retailPrice.message}</p>
              )}
              <p className="mt-1 text-xs text-gray-400">MSRP / Reference price</p>
            </div>
          </div>

          {/* Profit Margins Display */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Wholesale Margin */}
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Wholesale Margin</span>
                  <span
                    className={`text-lg font-semibold ${
                      Number(wholesaleMargin) > 0 ? 'text-success-600' : 'text-error-600'
                    }`}
                  >
                    {wholesaleMargin}%
                  </span>
                </div>
                <div className="mt-1 text-sm text-gray-500">
                  Profit: $
                  {wholesalePrice && costPrice
                    ? (wholesalePrice - costPrice).toFixed(2)
                    : '0.00'}
                </div>
              </div>

              {/* Retail Margin */}
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Retail Margin</span>
                  <span
                    className={`text-lg font-semibold ${
                      Number(retailMargin) > 0 ? 'text-success-600' : 'text-error-600'
                    }`}
                  >
                    {retailMargin}%
                  </span>
                </div>
                <div className="mt-1 text-sm text-gray-500">
                  Profit: $
                  {retailPrice && costPrice
                    ? (retailPrice - costPrice).toFixed(2)
                    : '0.00'}
                </div>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Section 3: Inventory */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* SKU */}
            <Input
              label="SKU"
              placeholder="e.g., PRD-001"
              error={errors.sku?.message}
              required
              {...register('sku', {
                required: 'SKU is required',
                pattern: {
                  value: /^[A-Za-z0-9-_]+$/,
                  message: 'SKU can only contain letters, numbers, hyphens, and underscores',
                },
              })}
            />

            {/* Stock Quantity */}
            <div className="w-full">
              <label className="label">
                Stock Quantity <span className="text-error-500">*</span>
              </label>
              <input
                type="number"
                className={`input ${errors.stockQuantity ? 'border-error-500' : ''}`}
                placeholder="0"
                min="0"
                {...register('stockQuantity', {
                  required: 'Stock quantity is required',
                  min: { value: 0, message: 'Quantity must be 0 or greater' },
                  valueAsNumber: true,
                })}
              />
              {errors.stockQuantity && (
                <p className="mt-1 text-sm text-error-500">{errors.stockQuantity.message}</p>
              )}
            </div>

            {/* Low Stock Threshold */}
            <div className="w-full">
              <label className="label">
                Low Stock Alert
              </label>
              <input
                type="number"
                className={`input ${errors.lowStockThreshold ? 'border-error-500' : ''}`}
                placeholder="10"
                min="0"
                {...register('lowStockThreshold', {
                  min: { value: 0, message: 'Threshold must be 0 or greater' },
                  valueAsNumber: true,
                })}
              />
              {errors.lowStockThreshold && (
                <p className="mt-1 text-sm text-error-500">{errors.lowStockThreshold.message}</p>
              )}
              <p className="mt-1 text-xs text-gray-400">Alert when stock falls below this</p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Section 4: Images */}
      <Card>
        <CardHeader>
          <CardTitle>Product Images</CardTitle>
        </CardHeader>
        <CardBody>
          <ImageUpload
            images={images}
            onChange={handleImagesChange}
            maxImages={10}
            disabled={isSubmitting}
          />
        </CardBody>
      </Card>

      {/* Section 5: Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
        </CardHeader>
        <CardBody>
          {/* Status Toggle */}
          <div className="w-full">
            <label className="label">Product Status</label>
            <div className="flex items-center gap-3 mt-2">
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <button
                    type="button"
                    onClick={() => field.onChange(!field.value)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      field.value ? 'bg-primary-500' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        field.value ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                )}
              />
              <span className="text-sm text-gray-700">{status ? 'Active' : 'Inactive'}</span>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Inactive products will not be visible to customers.
            </p>
          </div>
        </CardBody>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end gap-3 sticky bottom-0 bg-gray-50 py-4 px-6 -mx-6 -mb-6 border-t border-gray-200">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          {product ? 'Update Product' : 'Create Product'}
        </Button>
      </div>
    </form>
  );
}

export default ProductForm;
