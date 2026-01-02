'use client';

import { UseFormRegister, FieldErrors, UseFormWatch } from 'react-hook-form';
import { ApplicationFormData, PRODUCT_CATEGORIES } from '@/lib/api/applications.api';

// ============================================
// TYPES
// ============================================

interface VendorInfoStepProps {
  register: UseFormRegister<ApplicationFormData>;
  errors: FieldErrors<ApplicationFormData>;
  watch: UseFormWatch<ApplicationFormData>;
}

// ============================================
// VENDOR INFO STEP COMPONENT
// ============================================

export default function VendorInfoStep({ register, errors, watch }: VendorInfoStepProps) {
  const selectedCategories = watch('vendorProductCategories') || [];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-secondary-900">Vendor Information</h2>
        <p className="mt-2 text-gray-600">
          Tell us about your brand and products you want to sell.
        </p>
      </div>

      <div className="space-y-6 mt-8">
        {/* Brand Name */}
        <div>
          <label htmlFor="brandName" className="block text-sm font-medium text-secondary-900">
            Brand Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="brandName"
            {...register('brandName', {
              required: 'Brand name is required',
              minLength: { value: 2, message: 'Brand name must be at least 2 characters' },
              maxLength: { value: 100, message: 'Brand name must be less than 100 characters' },
            })}
            className={`mt-1 block w-full rounded-lg border ${
              errors.brandName ? 'border-red-500' : 'border-gray-300'
            } px-4 py-3 text-secondary-900 placeholder-gray-400 focus:border-primary-500 focus:ring-primary-500`}
            placeholder="Enter your brand name"
          />
          {errors.brandName && (
            <p className="mt-1 text-sm text-red-600">{errors.brandName.message}</p>
          )}
        </div>

        {/* Brand Description */}
        <div>
          <label htmlFor="brandDescription" className="block text-sm font-medium text-secondary-900">
            Brand Description <span className="text-red-500">*</span>
          </label>
          <textarea
            id="brandDescription"
            rows={4}
            {...register('brandDescription', {
              required: 'Brand description is required',
              minLength: { value: 50, message: 'Please provide at least 50 characters' },
              maxLength: { value: 1000, message: 'Description must be less than 1000 characters' },
            })}
            className={`mt-1 block w-full rounded-lg border ${
              errors.brandDescription ? 'border-red-500' : 'border-gray-300'
            } px-4 py-3 text-secondary-900 placeholder-gray-400 focus:border-primary-500 focus:ring-primary-500`}
            placeholder="Tell us about your brand, its story, values, and what makes it unique..."
          />
          {errors.brandDescription && (
            <p className="mt-1 text-sm text-red-600">{errors.brandDescription.message}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Minimum 50 characters. This description may be used on your brand page.
          </p>
        </div>

        {/* Product Categories */}
        <div>
          <label className="block text-sm font-medium text-secondary-900 mb-3">
            Product Categories You Offer <span className="text-red-500">*</span>
          </label>
          <p className="text-sm text-gray-500 mb-4">
            Select all categories that your brand offers.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {PRODUCT_CATEGORIES.map((category) => {
              const isSelected = selectedCategories.includes(category.value);

              return (
                <label
                  key={category.value}
                  className={`
                    relative flex items-center p-4 rounded-lg border cursor-pointer transition-all
                    ${
                      isSelected
                        ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }
                  `}
                >
                  <input
                    type="checkbox"
                    value={category.value}
                    {...register('vendorProductCategories', {
                      validate: (value) =>
                        (value && value.length > 0) || 'Please select at least one category',
                    })}
                    className="sr-only"
                  />
                  <div className="flex items-center gap-3 w-full">
                    <div
                      className={`
                        w-5 h-5 rounded border-2 flex items-center justify-center
                        ${
                          isSelected
                            ? 'bg-primary-500 border-primary-500'
                            : 'border-gray-300 bg-white'
                        }
                      `}
                    >
                      {isSelected && (
                        <svg
                          className="w-3 h-3 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                    <span
                      className={`text-sm font-medium ${
                        isSelected ? 'text-primary-700' : 'text-secondary-900'
                      }`}
                    >
                      {category.label}
                    </span>
                  </div>
                </label>
              );
            })}
          </div>

          {errors.vendorProductCategories && (
            <p className="mt-2 text-sm text-red-600">{errors.vendorProductCategories.message}</p>
          )}
        </div>

        {/* Minimum Order Amount and Product Line Size */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Minimum Order Amount */}
          <div>
            <label
              htmlFor="minimumOrderAmount"
              className="block text-sm font-medium text-secondary-900"
            >
              Minimum Order Amount ($) <span className="text-gray-400">(Optional)</span>
            </label>
            <input
              type="number"
              id="minimumOrderAmount"
              min="0"
              step="0.01"
              {...register('minimumOrderAmount', {
                min: { value: 0, message: 'Must be 0 or more' },
                valueAsNumber: true,
              })}
              className={`mt-1 block w-full rounded-lg border ${
                errors.minimumOrderAmount ? 'border-red-500' : 'border-gray-300'
              } px-4 py-3 text-secondary-900 placeholder-gray-400 focus:border-primary-500 focus:ring-primary-500`}
              placeholder="e.g., 100"
            />
            {errors.minimumOrderAmount && (
              <p className="mt-1 text-sm text-red-600">{errors.minimumOrderAmount.message}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Leave blank if no minimum order requirement.
            </p>
          </div>

          {/* Product Line Size */}
          <div>
            <label
              htmlFor="productLineSize"
              className="block text-sm font-medium text-secondary-900"
            >
              Product Line Size <span className="text-gray-400">(Optional)</span>
            </label>
            <input
              type="number"
              id="productLineSize"
              min="1"
              {...register('productLineSize', {
                min: { value: 1, message: 'Must be at least 1' },
                valueAsNumber: true,
              })}
              className={`mt-1 block w-full rounded-lg border ${
                errors.productLineSize ? 'border-red-500' : 'border-gray-300'
              } px-4 py-3 text-secondary-900 placeholder-gray-400 focus:border-primary-500 focus:ring-primary-500`}
              placeholder="e.g., 25"
            />
            {errors.productLineSize && (
              <p className="mt-1 text-sm text-red-600">{errors.productLineSize.message}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Approximate number of products in your line.
            </p>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <svg
                className="w-5 h-5 text-primary-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <div>
              <h4 className="text-sm font-medium text-primary-800">Vendor Benefits</h4>
              <ul className="mt-1 text-sm text-primary-700 space-y-1">
                <li>- Access to thousands of verified business customers</li>
                <li>- Dedicated vendor support team</li>
                <li>- Marketing and promotional opportunities</li>
                <li>- Competitive commission rates</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
