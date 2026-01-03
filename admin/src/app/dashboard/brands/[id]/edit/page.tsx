'use client';

import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Button, Spinner } from '@/components/ui';
import { BrandForm, BrandFormData } from '@/components/brands/BrandForm';
import { getBrand, updateBrand } from '@/lib/api/brands.api';
import { getPath } from '@/lib/navigation';
import toast from 'react-hot-toast';

export default function EditBrandPage() {
  const params = useParams();
  const queryClient = useQueryClient();
  const brandId = params.id as string;

  // Fetch brand data
  const { data: brand, isLoading, error } = useQuery({
    queryKey: ['brand', brandId],
    queryFn: () => getBrand(brandId),
    enabled: !!brandId,
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: BrandFormData) => updateBrand(brandId, data),
    onSuccess: () => {
      toast.success('Brand updated successfully');
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      queryClient.invalidateQueries({ queryKey: ['brand', brandId] });
      window.location.href = getPath('/dashboard/brands');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update brand');
    },
  });

  const handleSubmit = async (data: BrandFormData) => {
    await updateMutation.mutateAsync(data);
  };

  const handleCancel = () => {
    window.location.href = getPath('/dashboard/brands');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !brand) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <p className="text-error-500">Failed to load brand</p>
        <a href={getPath('/dashboard/brands')}>
          <Button>Back to Brands</Button>
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-4">
        <a href={getPath('/dashboard/brands')}>
          <Button variant="ghost" size="sm">
            <ArrowLeftIcon className="h-5 w-5" />
          </Button>
        </a>
        <div>
          <h1 className="text-2xl font-bold text-secondary-800">Edit Brand</h1>
          <p className="text-gray-600">Update brand information for {brand.name}</p>
        </div>
      </div>

      {/* Brand Form */}
      <div className="max-w-2xl">
        <BrandForm
          brand={brand}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={updateMutation.isPending}
        />
      </div>
    </div>
  );
}
