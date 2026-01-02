'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Button, Input, Card, CardBody } from '@/components/ui';
import { resolveImageUrl } from '@/lib/utils';
import type { Brand } from '@/types';

export interface BrandFormData {
  name: string;
  description?: string;
  logo?: string;
  minimumOrder: number;
  status: boolean;
}

interface BrandFormProps {
  brand?: Brand;
  onSubmit: (data: BrandFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function BrandForm({ brand, onSubmit, onCancel, isSubmitting = false }: BrandFormProps) {
  const [logoPreview, setLogoPreview] = useState<string | null>(resolveImageUrl(brand?.logo));
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<BrandFormData>({
    defaultValues: {
      name: brand?.name || '',
      description: brand?.description || '',
      logo: brand?.logo || '',
      minimumOrder: brand?.minimumOrder || 0,
      status: brand?.status ?? true,
    },
  });

  const status = watch('status');

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
        setValue('logo', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setLogoPreview(null);
    setLogoFile(null);
    setValue('logo', '');
  };

  const handleFormSubmit = async (data: BrandFormData) => {
    await onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <Card>
        <CardBody className="space-y-6">
          {/* Brand Name */}
          <Input
            label="Brand Name"
            placeholder="Enter brand name"
            error={errors.name?.message}
            {...register('name', {
              required: 'Brand name is required',
              minLength: {
                value: 2,
                message: 'Brand name must be at least 2 characters',
              },
            })}
          />

          {/* Description */}
          <div className="w-full">
            <label className="label">Description</label>
            <textarea
              className="input min-h-[100px] resize-y"
              placeholder="Enter brand description (optional)"
              {...register('description')}
            />
          </div>

          {/* Logo Upload */}
          <div className="w-full">
            <label className="label">Brand Logo</label>
            <div className="mt-2">
              {logoPreview ? (
                <div className="relative inline-block">
                  <div className="relative h-32 w-32 rounded-lg border border-gray-200 overflow-hidden bg-gray-50">
                    <Image
                      src={logoPreview}
                      alt="Logo preview"
                      fill
                      className="object-contain p-2"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={removeLogo}
                    className="absolute -top-2 -right-2 p-1 rounded-full bg-error-500 text-white hover:bg-error-600"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-32 w-32 rounded-lg border-2 border-dashed border-gray-300 cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-colors">
                  <PhotoIcon className="h-8 w-8 text-gray-400" />
                  <span className="mt-2 text-xs text-gray-500">Upload logo</span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleLogoChange}
                  />
                </label>
              )}
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Recommended: Square image, at least 200x200px. PNG or JPG format.
            </p>
          </div>

          {/* Minimum Order */}
          <div className="w-full">
            <label className="label">Minimum Order Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                className="input pl-8"
                placeholder="0.00"
                step="0.01"
                min="0"
                {...register('minimumOrder', {
                  required: 'Minimum order is required',
                  min: {
                    value: 0,
                    message: 'Minimum order must be at least 0',
                  },
                  valueAsNumber: true,
                })}
              />
            </div>
            {errors.minimumOrder && (
              <p className="mt-1 text-sm text-error-500">{errors.minimumOrder.message}</p>
            )}
          </div>

          {/* Status Toggle */}
          <div className="w-full">
            <label className="label">Status</label>
            <div className="flex items-center gap-3 mt-2">
              <button
                type="button"
                onClick={() => setValue('status', !status)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  status ? 'bg-primary-500' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    status ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className="text-sm text-gray-700">
                {status ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Inactive brands will not be visible to customers.
            </p>
          </div>
        </CardBody>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          {brand ? 'Update Brand' : 'Create Brand'}
        </Button>
      </div>
    </form>
  );
}

export default BrandForm;
