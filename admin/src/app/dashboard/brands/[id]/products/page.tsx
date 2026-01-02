'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeftIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  EyeIcon,
  CubeIcon,
} from '@heroicons/react/24/outline';
import { Card, CardBody, Button, Badge, Spinner } from '@/components/ui';
import { getBrand, getBrandProducts } from '@/lib/api/brands.api';
import { resolveImageUrl } from '@/lib/utils';
import type { Product } from '@/types';

export default function BrandProductsPage() {
  const router = useRouter();
  const params = useParams();
  const brandId = params.id as string;
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch brand data
  const { data: brandData, isLoading: brandLoading } = useQuery({
    queryKey: ['brand', brandId],
    queryFn: () => getBrand(brandId),
    enabled: !!brandId,
  });

  // Fetch brand products
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['brand-products', brandId],
    queryFn: () => getBrandProducts(brandId),
    enabled: !!brandId,
  });

  const brand = brandData;
  const products = productsData?.products || [];

  const filteredProducts = products.filter(
    (product: Product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isLoading = brandLoading || productsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <p className="text-error-500">Brand not found</p>
        <Link href="/dashboard/brands">
          <Button>Back to Brands</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/brands">
            <Button variant="ghost" size="sm">
              <ArrowLeftIcon className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-4">
            {brand.logo ? (
              <div className="relative h-12 w-12 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                <Image
                  src={resolveImageUrl(brand.logo) || ''}
                  alt={brand.name}
                  fill
                  className="object-contain p-1"
                />
              </div>
            ) : (
              <div className="h-12 w-12 rounded-lg bg-primary-100 flex items-center justify-center border border-primary-200">
                <span className="text-primary-600 font-bold text-lg">
                  {brand.name.charAt(0)}
                </span>
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-secondary-800">{brand.name} Products</h1>
              <p className="text-gray-600">
                {products.length} product{products.length !== 1 ? 's' : ''} in this brand
              </p>
            </div>
          </div>
        </div>
        <Link href={`/dashboard/products/create?brandId=${brandId}`}>
          <Button>
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Product
          </Button>
        </Link>
      </div>

      {/* Brand info card */}
      <Card>
        <CardBody>
          <div className="flex flex-wrap gap-6">
            <div>
              <p className="text-sm text-gray-500">Minimum Order</p>
              <p className="text-lg font-semibold text-secondary-800">
                ${Number(brand.minimumOrder || 0).toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <Badge variant={brand.status ? 'success' : 'error'} className="mt-1">
                {brand.status ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            {brand.description && (
              <div className="flex-1 min-w-[200px]">
                <p className="text-sm text-gray-500">Description</p>
                <p className="text-sm text-secondary-700">{brand.description}</p>
              </div>
            )}
            <div className="ml-auto">
              <Link href={`/dashboard/brands/${brandId}/edit`}>
                <Button variant="outline" size="sm">
                  <PencilIcon className="h-4 w-4 mr-2" />
                  Edit Brand
                </Button>
              </Link>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Search */}
      <Card>
        <CardBody>
          <div className="flex gap-4">
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input pl-10"
              />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Products grid */}
      {filteredProducts.length === 0 ? (
        <Card>
          <CardBody className="flex flex-col items-center justify-center py-12 text-center">
            <div className="p-4 rounded-full bg-gray-100 mb-4">
              <CubeIcon className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-secondary-800 mb-2">
              {searchQuery ? 'No products found' : 'No products yet'}
            </h3>
            <p className="text-gray-500 mb-4">
              {searchQuery
                ? 'Try adjusting your search terms.'
                : 'Add your first product to this brand.'}
            </p>
            {!searchQuery && (
              <Link href={`/dashboard/products/create?brandId=${brandId}`}>
                <Button>
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Add Product
                </Button>
              </Link>
            )}
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((product: Product) => (
            <Card key={product.id} className="hover:shadow-md transition-shadow">
              <div className="relative h-48 bg-gray-100">
                {product.images && product.images.length > 0 ? (
                  <Image
                    src={resolveImageUrl(product.images[0]) || ''}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <CubeIcon className="h-12 w-12 text-gray-300" />
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <Badge variant={product.status ? 'success' : 'error'}>
                    {product.status ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
              <CardBody className="space-y-3">
                <div>
                  <h3 className="font-medium text-secondary-800 truncate">{product.name}</h3>
                  <p className="text-sm text-gray-500">SKU: {product.sku || 'N/A'}</p>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-bold text-primary-600">
                      ${Number(product.wholesalePrice || 0).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">
                      Retail: ${Number(product.retailPrice || 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-secondary-800">
                      {product.stockQuantity || 0}
                    </p>
                    <p className="text-xs text-gray-500">in stock</p>
                  </div>
                </div>
                <div className="flex gap-2 pt-2 border-t border-gray-100">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => router.push(`/dashboard/products/${product.id}`)}
                  >
                    <EyeIcon className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => router.push(`/dashboard/products/${product.id}/edit`)}
                  >
                    <PencilIcon className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
