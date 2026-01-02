'use client';

import { PencilIcon, TrashIcon, CubeIcon } from '@heroicons/react/24/outline';
import { Card, CardBody, Badge, Button, FallbackImage } from '@/components/ui';
import { formatCurrency, resolveImageUrl } from '@/lib/utils';
import type { Brand } from '@/types';

interface BrandCardProps {
  brand: Brand & { productsCount?: number };
  onEdit?: () => void;
  onDelete?: () => void;
  onViewProducts?: () => void;
}

export function BrandCard({ brand, onEdit, onDelete, onViewProducts }: BrandCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardBody className="p-0">
        {/* Logo */}
        <div className="relative h-40 bg-gray-100 rounded-t-lg overflow-hidden">
          <FallbackImage
            src={resolveImageUrl(brand.logo) || '/images/placeholder-brand.svg'}
            alt={brand.name}
            fill
            type="brand"
            className="object-contain p-4"
          />
          {/* Status badge */}
          <div className="absolute top-3 right-3">
            <Badge variant={brand.status ? 'success' : 'error'}>
              {brand.status ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 truncate">{brand.name}</h3>
          {brand.description && (
            <p className="mt-1 text-sm text-gray-500 line-clamp-2">{brand.description}</p>
          )}

          {/* Stats */}
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500">Min. Order</p>
              <p className="font-semibold text-gray-900">{formatCurrency(brand.minimumOrder)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Products</p>
              <p className="font-semibold text-gray-900">{brand.productsCount || 0}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-4 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={onViewProducts}
            >
              <CubeIcon className="h-4 w-4 mr-1" />
              Products
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
            >
              <PencilIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="text-error-600 hover:text-error-700 hover:bg-error-50"
            >
              <TrashIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

export default BrandCard;
