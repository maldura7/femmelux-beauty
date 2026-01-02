'use client';

import { UseFormRegister, FieldErrors, UseFormWatch } from 'react-hook-form';
import {
  ApplicationFormData,
  MONTHLY_PURCHASE_OPTIONS,
  PRODUCT_CATEGORIES,
} from '@/lib/api/applications.api';

// ============================================
// TYPES
// ============================================

interface PurchaseInfoStepProps {
  register: UseFormRegister<ApplicationFormData>;
  errors: FieldErrors<ApplicationFormData>;
  watch: UseFormWatch<ApplicationFormData>;
}

// ============================================
// PURCHASE INFO STEP COMPONENT
// ============================================

export default function PurchaseInfoStep({ register, errors, watch }: PurchaseInfoStepProps) {
  const selectedCategories = watch('productCategories') || [];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-secondary-900">Purchase Information</h2>
        <p className="mt-2 text-gray-600">
          Help us understand your purchasing needs to serve you better.
        </p>
      </div>

      <div className="space-y-6 mt-8">
        {/* Estimated Monthly Purchase */}
        <div>
          <label
            htmlFor="estimatedMonthlyPurchase"
            className="block text-sm font-medium text-secondary-900"
          >
            Estimated Monthly Purchase Amount <span className="text-red-500">*</span>
          </label>
          <select
            id="estimatedMonthlyPurchase"
            {...register('estimatedMonthlyPurchase', {
              required: 'Please select an estimated purchase amount',
            })}
            className={`mt-1 block w-full rounded-lg border ${
              errors.estimatedMonthlyPurchase ? 'border-red-500' : 'border-gray-300'
            } px-4 py-3 text-secondary-900 focus:border-primary-500 focus:ring-primary-500`}
          >
            <option value="">Select estimated monthly purchase</option>
            {MONTHLY_PURCHASE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.estimatedMonthlyPurchase && (
            <p className="mt-1 text-sm text-red-600">{errors.estimatedMonthlyPurchase.message}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            This helps us provide better pricing and support for your business.
          </p>
        </div>

        {/* Product Categories */}
        <div>
          <label className="block text-sm font-medium text-secondary-900 mb-3">
            Product Categories Interested In <span className="text-red-500">*</span>
          </label>
          <p className="text-sm text-gray-500 mb-4">
            Select all categories that apply to your business.
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
                    {...register('productCategories', {
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

          {errors.productCategories && (
            <p className="mt-2 text-sm text-red-600">{errors.productCategories.message}</p>
          )}
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <svg
                className="w-5 h-5 text-blue-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h4 className="text-sm font-medium text-blue-800">Why do we ask this?</h4>
              <p className="mt-1 text-sm text-blue-700">
                Understanding your purchase volume and product interests helps us provide better
                pricing, recommendations, and priority access to new products in your preferred
                categories.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
