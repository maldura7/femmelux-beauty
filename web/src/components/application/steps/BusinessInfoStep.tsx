'use client';

import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { ApplicationFormData, BUSINESS_TYPES } from '@/lib/api/applications.api';

// ============================================
// TYPES
// ============================================

interface BusinessInfoStepProps {
  register: UseFormRegister<ApplicationFormData>;
  errors: FieldErrors<ApplicationFormData>;
}

// ============================================
// BUSINESS INFO STEP COMPONENT
// ============================================

export default function BusinessInfoStep({ register, errors }: BusinessInfoStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-secondary-900">Business Information</h2>
        <p className="mt-2 text-gray-600">
          Tell us about your business so we can serve you better.
        </p>
      </div>

      <div className="space-y-6 mt-8">
        {/* Business Name */}
        <div>
          <label htmlFor="businessName" className="block text-sm font-medium text-secondary-900">
            Business Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="businessName"
            {...register('businessName', {
              required: 'Business name is required',
              minLength: { value: 2, message: 'Business name must be at least 2 characters' },
              maxLength: { value: 100, message: 'Business name must be less than 100 characters' },
            })}
            className={`mt-1 block w-full rounded-lg border ${
              errors.businessName ? 'border-red-500' : 'border-gray-300'
            } px-4 py-3 text-secondary-900 placeholder-gray-400 focus:border-primary-500 focus:ring-primary-500`}
            placeholder="Enter your business name"
          />
          {errors.businessName && (
            <p className="mt-1 text-sm text-red-600">{errors.businessName.message}</p>
          )}
        </div>

        {/* Business Type */}
        <div>
          <label htmlFor="businessType" className="block text-sm font-medium text-secondary-900">
            Business Type <span className="text-red-500">*</span>
          </label>
          <select
            id="businessType"
            {...register('businessType', { required: 'Business type is required' })}
            className={`mt-1 block w-full rounded-lg border ${
              errors.businessType ? 'border-red-500' : 'border-gray-300'
            } px-4 py-3 text-secondary-900 focus:border-primary-500 focus:ring-primary-500`}
          >
            <option value="">Select a business type</option>
            {BUSINESS_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          {errors.businessType && (
            <p className="mt-1 text-sm text-red-600">{errors.businessType.message}</p>
          )}
        </div>

        {/* Tax ID */}
        <div>
          <label htmlFor="taxId" className="block text-sm font-medium text-secondary-900">
            Tax ID / EIN <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="taxId"
            {...register('taxId', {
              required: 'Tax ID is required',
              pattern: {
                value: /^[0-9-]+$/,
                message: 'Invalid Tax ID format (numbers and dashes only)',
              },
            })}
            className={`mt-1 block w-full rounded-lg border ${
              errors.taxId ? 'border-red-500' : 'border-gray-300'
            } px-4 py-3 text-secondary-900 placeholder-gray-400 focus:border-primary-500 focus:ring-primary-500`}
            placeholder="XX-XXXXXXX"
          />
          {errors.taxId && <p className="mt-1 text-sm text-red-600">{errors.taxId.message}</p>}
          <p className="mt-1 text-xs text-gray-500">
            Your Tax ID is kept secure and used for verification purposes only.
          </p>
        </div>

        {/* Business License (Optional) */}
        <div>
          <label htmlFor="businessLicense" className="block text-sm font-medium text-secondary-900">
            Business License Number <span className="text-gray-400">(Optional)</span>
          </label>
          <input
            type="text"
            id="businessLicense"
            {...register('businessLicense')}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 text-secondary-900 placeholder-gray-400 focus:border-primary-500 focus:ring-primary-500"
            placeholder="Enter your business license number"
          />
        </div>

        {/* Resale Certificate (Optional) */}
        <div>
          <label
            htmlFor="resaleCertificate"
            className="block text-sm font-medium text-secondary-900"
          >
            Resale Certificate Number <span className="text-gray-400">(Optional)</span>
          </label>
          <input
            type="text"
            id="resaleCertificate"
            {...register('resaleCertificate')}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 text-secondary-900 placeholder-gray-400 focus:border-primary-500 focus:ring-primary-500"
            placeholder="Enter your resale certificate number"
          />
        </div>

        {/* Years in Business */}
        <div>
          <label htmlFor="businessYears" className="block text-sm font-medium text-secondary-900">
            Years in Business <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            id="businessYears"
            min="0"
            max="200"
            {...register('businessYears', {
              required: 'Years in business is required',
              min: { value: 0, message: 'Must be 0 or more' },
              max: { value: 200, message: 'Must be 200 or less' },
              valueAsNumber: true,
            })}
            className={`mt-1 block w-full rounded-lg border ${
              errors.businessYears ? 'border-red-500' : 'border-gray-300'
            } px-4 py-3 text-secondary-900 placeholder-gray-400 focus:border-primary-500 focus:ring-primary-500`}
            placeholder="0"
          />
          {errors.businessYears && (
            <p className="mt-1 text-sm text-red-600">{errors.businessYears.message}</p>
          )}
        </div>
      </div>
    </div>
  );
}
