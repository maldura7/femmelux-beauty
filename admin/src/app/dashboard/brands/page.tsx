'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  CubeIcon,
} from '@heroicons/react/24/outline';
import { Card, CardBody, Button, Badge, Spinner } from '@/components/ui';
import { DeleteBrandDialog } from '@/components/brands/DeleteBrandDialog';
import { getAllBrands, deleteBrand } from '@/lib/api/brands.api';
import { resolveImageUrl } from '@/lib/utils';
import type { Brand } from '@/types';
import toast from 'react-hot-toast';

export default function BrandsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);

  // Fetch brands
  const { data: brandsData, isLoading, error } = useQuery({
    queryKey: ['brands'],
    queryFn: () => getAllBrands(),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteBrand(id),
    onSuccess: () => {
      toast.success('Brand deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      setDeleteDialogOpen(false);
      setSelectedBrand(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete brand');
    },
  });

  const brands: Brand[] = Array.isArray(brandsData?.brands) ? brandsData.brands : [];

  const filteredBrands = brands.filter(
    (brand: Brand) =>
      brand.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      brand.slug?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteClick = (brand: Brand) => {
    setSelectedBrand(brand);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedBrand) {
      deleteMutation.mutate(selectedBrand.id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <p className="text-error-500">Failed to load brands</p>
        <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['brands'] })}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-800">Brands</h1>
          <p className="text-gray-600">Manage your brand partners</p>
        </div>
        <Link href="/dashboard/brands/create">
          <Button>
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Brand
          </Button>
        </Link>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardBody className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-primary-100">
              <CubeIcon className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Brands</p>
              <p className="text-2xl font-bold text-secondary-800">{brands.length}</p>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-success-100">
              <CubeIcon className="h-6 w-6 text-success-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Active Brands</p>
              <p className="text-2xl font-bold text-secondary-800">
                {brands.filter((b: Brand) => b.status).length}
              </p>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-warning-100">
              <CubeIcon className="h-6 w-6 text-warning-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Inactive Brands</p>
              <p className="text-2xl font-bold text-secondary-800">
                {brands.filter((b: Brand) => !b.status).length}
              </p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Search and filters */}
      <Card>
        <CardBody>
          <div className="flex gap-4">
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search brands..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input pl-10"
              />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Brands table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Brand</th>
                <th>Slug</th>
                <th>Min. Order</th>
                <th>Products</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredBrands.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-500">
                    {searchQuery ? 'No brands found matching your search.' : 'No brands yet. Create your first brand!'}
                  </td>
                </tr>
              ) : (
                filteredBrands.map((brand: Brand) => (
                  <tr key={brand.id} className="hover:bg-gray-50">
                    <td>
                      <div className="flex items-center gap-3">
                        {brand.logo ? (
                          <div className="relative h-10 w-10 rounded-lg overflow-hidden bg-gray-100">
                            <Image
                              src={resolveImageUrl(brand.logo) || ''}
                              alt={brand.name}
                              fill
                              className="object-contain p-1"
                            />
                          </div>
                        ) : (
                          <div className="h-10 w-10 rounded-lg bg-primary-100 flex items-center justify-center">
                            <span className="text-primary-600 font-medium">
                              {brand.name.charAt(0)}
                            </span>
                          </div>
                        )}
                        <span className="font-medium text-secondary-800">{brand.name}</span>
                      </div>
                    </td>
                    <td className="text-gray-500">{brand.slug}</td>
                    <td>${Number(brand.minimumOrder || 0).toFixed(2)}</td>
                    <td>
                      <Link
                        href={`/dashboard/brands/${brand.id}/products`}
                        className="text-primary-600 hover:text-primary-700 hover:underline"
                      >
                        {brand._count?.products || 0} products
                      </Link>
                    </td>
                    <td>
                      <Badge variant={brand.status ? 'success' : 'error'}>
                        {brand.status ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/dashboard/brands/${brand.id}/products`)}
                          title="View Products"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/dashboard/brands/${brand.id}/edit`)}
                          title="Edit Brand"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(brand)}
                          className="text-error-500 hover:text-error-600 hover:bg-error-50"
                          title="Delete Brand"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Delete Confirmation Dialog */}
      <DeleteBrandDialog
        isOpen={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setSelectedBrand(null);
        }}
        onConfirm={handleConfirmDelete}
        brandName={selectedBrand?.name || ''}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  );
}
