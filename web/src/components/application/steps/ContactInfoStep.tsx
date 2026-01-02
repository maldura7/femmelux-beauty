'use client';

import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { ApplicationFormData, US_STATES } from '@/lib/api/applications.api';

// ============================================
// TYPES
// ============================================

interface ContactInfoStepProps {
  register: UseFormRegister<ApplicationFormData>;
  errors: FieldErrors<ApplicationFormData>;
}

// ============================================
// CONTACT INFO STEP COMPONENT
// ============================================

export default function ContactInfoStep({ register, errors }: ContactInfoStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-secondary-900">Contact Information</h2>
        <p className="mt-2 text-gray-600">
          Provide your business contact details and address.
        </p>
      </div>

      <div className="space-y-6 mt-8">
        {/* Phone Number */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-secondary-900">
            Phone Number <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            id="phone"
            {...register('phone', {
              required: 'Phone number is required',
              pattern: {
                value: /^[\d\s\-+()]+$/,
                message: 'Invalid phone number format',
              },
            })}
            className={`mt-1 block w-full rounded-lg border ${
              errors.phone ? 'border-red-500' : 'border-gray-300'
            } px-4 py-3 text-secondary-900 placeholder-gray-400 focus:border-primary-500 focus:ring-primary-500`}
            placeholder="(555) 123-4567"
          />
          {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>}
        </div>

        {/* Business Website (Optional) */}
        <div>
          <label htmlFor="businessWebsite" className="block text-sm font-medium text-secondary-900">
            Business Website <span className="text-gray-400">(Optional)</span>
          </label>
          <input
            type="url"
            id="businessWebsite"
            {...register('businessWebsite', {
              pattern: {
                value: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
                message: 'Invalid website URL',
              },
            })}
            className={`mt-1 block w-full rounded-lg border ${
              errors.businessWebsite ? 'border-red-500' : 'border-gray-300'
            } px-4 py-3 text-secondary-900 placeholder-gray-400 focus:border-primary-500 focus:ring-primary-500`}
            placeholder="https://www.yourbusiness.com"
          />
          {errors.businessWebsite && (
            <p className="mt-1 text-sm text-red-600">{errors.businessWebsite.message}</p>
          )}
        </div>

        {/* Business Address Section */}
        <div className="pt-4 border-t border-gray-200">
          <h3 className="text-lg font-medium text-secondary-900 mb-4">Business Address</h3>

          {/* Street Address */}
          <div className="mb-4">
            <label
              htmlFor="businessAddress.street"
              className="block text-sm font-medium text-secondary-900"
            >
              Street Address <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="businessAddress.street"
              {...register('businessAddress.street', {
                required: 'Street address is required',
              })}
              className={`mt-1 block w-full rounded-lg border ${
                errors.businessAddress?.street ? 'border-red-500' : 'border-gray-300'
              } px-4 py-3 text-secondary-900 placeholder-gray-400 focus:border-primary-500 focus:ring-primary-500`}
              placeholder="123 Main Street, Suite 100"
            />
            {errors.businessAddress?.street && (
              <p className="mt-1 text-sm text-red-600">{errors.businessAddress.street.message}</p>
            )}
          </div>

          {/* City and State */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* City */}
            <div>
              <label
                htmlFor="businessAddress.city"
                className="block text-sm font-medium text-secondary-900"
              >
                City <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="businessAddress.city"
                {...register('businessAddress.city', {
                  required: 'City is required',
                })}
                className={`mt-1 block w-full rounded-lg border ${
                  errors.businessAddress?.city ? 'border-red-500' : 'border-gray-300'
                } px-4 py-3 text-secondary-900 placeholder-gray-400 focus:border-primary-500 focus:ring-primary-500`}
                placeholder="New York"
              />
              {errors.businessAddress?.city && (
                <p className="mt-1 text-sm text-red-600">{errors.businessAddress.city.message}</p>
              )}
            </div>

            {/* State */}
            <div>
              <label
                htmlFor="businessAddress.state"
                className="block text-sm font-medium text-secondary-900"
              >
                State <span className="text-red-500">*</span>
              </label>
              <select
                id="businessAddress.state"
                {...register('businessAddress.state', {
                  required: 'State is required',
                })}
                className={`mt-1 block w-full rounded-lg border ${
                  errors.businessAddress?.state ? 'border-red-500' : 'border-gray-300'
                } px-4 py-3 text-secondary-900 focus:border-primary-500 focus:ring-primary-500`}
              >
                <option value="">Select a state</option>
                {US_STATES.map((state) => (
                  <option key={state.value} value={state.value}>
                    {state.label}
                  </option>
                ))}
              </select>
              {errors.businessAddress?.state && (
                <p className="mt-1 text-sm text-red-600">{errors.businessAddress.state.message}</p>
              )}
            </div>
          </div>

          {/* ZIP Code and Country */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* ZIP Code */}
            <div>
              <label
                htmlFor="businessAddress.zip"
                className="block text-sm font-medium text-secondary-900"
              >
                ZIP Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="businessAddress.zip"
                {...register('businessAddress.zip', {
                  required: 'ZIP code is required',
                  pattern: {
                    value: /^\d{5}(-\d{4})?$/,
                    message: 'Invalid ZIP code format (e.g., 12345 or 12345-6789)',
                  },
                })}
                className={`mt-1 block w-full rounded-lg border ${
                  errors.businessAddress?.zip ? 'border-red-500' : 'border-gray-300'
                } px-4 py-3 text-secondary-900 placeholder-gray-400 focus:border-primary-500 focus:ring-primary-500`}
                placeholder="10001"
              />
              {errors.businessAddress?.zip && (
                <p className="mt-1 text-sm text-red-600">{errors.businessAddress.zip.message}</p>
              )}
            </div>

            {/* Country */}
            <div>
              <label
                htmlFor="businessAddress.country"
                className="block text-sm font-medium text-secondary-900"
              >
                Country <span className="text-red-500">*</span>
              </label>
              <select
                id="businessAddress.country"
                {...register('businessAddress.country', {
                  required: 'Country is required',
                })}
                className={`mt-1 block w-full rounded-lg border ${
                  errors.businessAddress?.country ? 'border-red-500' : 'border-gray-300'
                } px-4 py-3 text-secondary-900 focus:border-primary-500 focus:ring-primary-500`}
              >
                <option value="USA">United States</option>
              </select>
              {errors.businessAddress?.country && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.businessAddress.country.message}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
