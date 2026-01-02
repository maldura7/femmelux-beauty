'use client';

import Link from 'next/link';
import { Card, CardBody, CardHeader, CardTitle, FallbackImage } from '@/components/ui';
import { formatCurrency, resolveImageUrl } from '@/lib/utils';

interface TopProduct {
  id: string;
  name: string;
  sku: string;
  image?: string | null;
  brand?: {
    id: string;
    name: string;
  };
  totalSold: number;
  revenue: number;
}

interface TopProductsTableProps {
  products: TopProduct[];
  isLoading?: boolean;
  maxItems?: number;
}

export function TopProductsTable({
  products,
  isLoading = false,
  maxItems = 5,
}: TopProductsTableProps) {
  const displayProducts = products.slice(0, maxItems);

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Top Selling Products</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            {[...Array(maxItems)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-2">
                <div className="h-12 w-12 bg-gray-200 animate-pulse rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-gray-200 animate-pulse rounded" />
                  <div className="h-3 w-24 bg-gray-200 animate-pulse rounded" />
                </div>
                <div className="h-4 w-16 bg-gray-200 animate-pulse rounded" />
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    );
  }

  if (products.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Top Selling Products</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="flex items-center justify-center h-[200px] text-gray-500">
            No product data available
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Top Selling Products</CardTitle>
        <Link
          href="/products"
          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          View all →
        </Link>
      </CardHeader>
      <CardBody>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="text-left py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Brand
                </th>
                <th className="text-right py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Units Sold
                </th>
                <th className="text-right py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {displayProducts.map((product, index) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-xs font-medium text-gray-600">
                        {index + 1}
                      </div>
                      <div className="relative h-10 w-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        <FallbackImage
                          src={resolveImageUrl(product.image) || '/images/placeholder-product.svg'}
                          alt={product.name}
                          fill
                          type="product"
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <Link
                          href={`/products/${product.id}`}
                          className="text-sm font-medium text-gray-900 hover:text-primary-600 truncate block"
                        >
                          {product.name}
                        </Link>
                        <p className="text-xs text-gray-500">{product.sku}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    {product.brand ? (
                      <Link
                        href={`/brands/${product.brand.id}`}
                        className="text-sm text-gray-600 hover:text-primary-600"
                      >
                        {product.brand.name}
                      </Link>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                  <td className="py-3 px-2 text-right">
                    <span className="text-sm font-medium text-gray-900">
                      {product.totalSold.toLocaleString()}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-right">
                    <span className="text-sm font-semibold text-primary-600">
                      {formatCurrency(product.revenue)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardBody>
    </Card>
  );
}

export default TopProductsTable;
