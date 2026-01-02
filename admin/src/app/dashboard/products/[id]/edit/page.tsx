'use client';

import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Button, Spinner } from '@/components/ui';
import { ProductForm, ProductFormData } from '@/components/products/ProductForm';
import { getProduct, updateProduct } from '@/lib/api/products.api';
import toast from 'react-hot-toast';
import Link from 'next/link';

// Helper function to convert File to base64 data URL
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const productId = params.id as string;

  // Fetch product data
  const { data: productData, isLoading, error } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => getProduct(productId),
    enabled: !!productId,
  });

  const product = productData?.data;

  // Update mutation
  const updateMutation = useMutation({
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

      // Update the product with all images included
      const productResponse = await updateProduct(productId, {
        ...data,
        images: allImages,
      });

      return productResponse;
    },
    onSuccess: () => {
      toast.success('Product updated successfully');
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
      router.push('/dashboard/products');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update product');
    },
  });

  const handleSubmit = async (data: ProductFormData, imageFiles: File[]) => {
    await updateMutation.mutateAsync({ data, imageFiles });
  };

  const handleCancel = () => {
    router.push('/dashboard/products');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <p className="text-error-500">Failed to load product</p>
        <Link href="/dashboard/products">
          <Button>Back to Products</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/products">
          <Button variant="ghost" size="sm">
            <ArrowLeftIcon className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-secondary-800">Edit Product</h1>
          <p className="text-gray-600">Update information for {product.name}</p>
        </div>
      </div>

      {/* Product Form */}
      <div className="max-w-3xl">
        <ProductForm
          product={product}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={updateMutation.isPending}
        />
      </div>
    </div>
  );
}
