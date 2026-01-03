'use client';

import { useSearchParams } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui';
import { ProductForm, ProductFormData } from '@/components/products/ProductForm';
import { createProduct } from '@/lib/api/products.api';
import { getPath } from '@/lib/navigation';
import toast from 'react-hot-toast';

// Helper function to convert File to base64 data URL
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export default function CreateProductPage() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  // Get brandId from URL if coming from brand products page
  const brandIdFromUrl = searchParams.get('brandId');

  const createMutation = useMutation({
    mutationFn: async ({
      data,
      imageFiles,
    }: {
      data: ProductFormData;
      imageFiles: File[];
    }) => {
      // Convert new image files to base64 data URLs
      let allImages = [...data.images];

      if (imageFiles.length > 0) {
        const base64Images = await Promise.all(imageFiles.map(fileToBase64));
        allImages = [...allImages, ...base64Images];
      }

      // Create the product with all images included as base64
      const productResponse = await createProduct({
        ...data,
        images: allImages,
        brandId: data.brandId || brandIdFromUrl || undefined,
      });

      return productResponse;
    },
    onSuccess: () => {
      toast.success('Product created successfully');
      queryClient.invalidateQueries({ queryKey: ['products'] });

      // Redirect back to brand products if came from there
      if (brandIdFromUrl) {
        window.location.href = getPath(`/dashboard/brands/${brandIdFromUrl}/products`);
      } else {
        window.location.href = getPath('/dashboard/products');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create product');
    },
  });

  const handleSubmit = async (data: ProductFormData, imageFiles: File[]) => {
    await createMutation.mutateAsync({ data, imageFiles });
  };

  const handleCancel = () => {
    if (brandIdFromUrl) {
      window.location.href = getPath(`/dashboard/brands/${brandIdFromUrl}/products`);
    } else {
      window.location.href = getPath('/dashboard/products');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-4">
        <a href={getPath(brandIdFromUrl ? `/dashboard/brands/${brandIdFromUrl}/products` : '/dashboard/products')}>
          <Button variant="ghost" size="sm">
            <ArrowLeftIcon className="h-5 w-5" />
          </Button>
        </a>
        <div>
          <h1 className="text-2xl font-bold text-secondary-800">Create Product</h1>
          <p className="text-gray-600">Add a new product to your catalog</p>
        </div>
      </div>

      {/* Product Form */}
      <div className="max-w-3xl">
        <ProductForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={createMutation.isPending}
        />
      </div>
    </div>
  );
}
