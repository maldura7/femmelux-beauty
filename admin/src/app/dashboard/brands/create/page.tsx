'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui';
import { BrandForm, BrandFormData } from '@/components/brands/BrandForm';
import { createBrand } from '@/lib/api/brands.api';
import { getPath } from '@/lib/navigation';
import toast from 'react-hot-toast';

export default function CreateBrandPage() {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: BrandFormData) => createBrand(data),
    onSuccess: () => {
      toast.success('Brand created successfully');
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      window.location.href = getPath('/dashboard/brands');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create brand');
    },
  });

  const handleSubmit = async (data: BrandFormData) => {
    await createMutation.mutateAsync(data);
  };

  const handleCancel = () => {
    window.location.href = getPath('/dashboard/brands');
  };

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
          <h1 className="text-2xl font-bold text-secondary-800">Create Brand</h1>
          <p className="text-gray-600">Add a new brand partner to your store</p>
        </div>
      </div>

      {/* Brand Form */}
      <div className="max-w-2xl">
        <BrandForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={createMutation.isPending}
        />
      </div>
    </div>
  );
}
