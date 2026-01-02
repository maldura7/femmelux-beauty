'use client';

import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { ApplicationFormData, HEAR_ABOUT_US_OPTIONS } from '@/lib/api/applications.api';

// ============================================
// TYPES
// ============================================

interface AdditionalInfoStepProps {
  register: UseFormRegister<ApplicationFormData>;
  errors: FieldErrors<ApplicationFormData>;
}

// ============================================
// ADDITIONAL INFO STEP COMPONENT
// ============================================

export default function AdditionalInfoStep({ register, errors }: AdditionalInfoStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-secondary-900">Additional Information</h2>
        <p className="mt-2 text-gray-600">
          A few more questions to help us serve you better.
        </p>
      </div>

      <div className="space-y-6 mt-8">
        {/* How Did You Hear About Us */}
        <div>
          <label htmlFor="hearAboutUs" className="block text-sm font-medium text-secondary-900">
            How Did You Hear About Us? <span className="text-gray-400">(Optional)</span>
          </label>
          <select
            id="hearAboutUs"
            {...register('hearAboutUs')}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 text-secondary-900 focus:border-primary-500 focus:ring-primary-500"
          >
            <option value="">Select an option</option>
            {HEAR_ABOUT_US_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">
            This helps us improve our marketing efforts.
          </p>
        </div>

        {/* Additional Notes */}
        <div>
          <label htmlFor="additionalNotes" className="block text-sm font-medium text-secondary-900">
            Additional Notes <span className="text-gray-400">(Optional)</span>
          </label>
          <p className="text-sm text-gray-500 mb-2">
            Is there anything else you'd like us to know about your business or needs?
          </p>
          <textarea
            id="additionalNotes"
            rows={5}
            {...register('additionalNotes', {
              maxLength: { value: 1000, message: 'Notes must be less than 1000 characters' },
            })}
            className={`mt-1 block w-full rounded-lg border ${
              errors.additionalNotes ? 'border-red-500' : 'border-gray-300'
            } px-4 py-3 text-secondary-900 placeholder-gray-400 focus:border-primary-500 focus:ring-primary-500`}
            placeholder="Tell us about any specific needs, questions, or additional information that might help us serve you better..."
          />
          {errors.additionalNotes && (
            <p className="mt-1 text-sm text-red-600">{errors.additionalNotes.message}</p>
          )}
        </div>

        {/* What Happens Next */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-secondary-900 mb-4">What Happens Next?</h3>
          <ol className="space-y-4">
            <li className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center font-semibold">
                1
              </div>
              <div>
                <h4 className="font-medium text-secondary-900">Review Your Application</h4>
                <p className="text-sm text-gray-600">
                  On the next screen, you'll review all the information you've provided before
                  submitting.
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center font-semibold">
                2
              </div>
              <div>
                <h4 className="font-medium text-secondary-900">Application Review</h4>
                <p className="text-sm text-gray-600">
                  Our team will review your application within 1-2 business days.
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center font-semibold">
                3
              </div>
              <div>
                <h4 className="font-medium text-secondary-900">Notification</h4>
                <p className="text-sm text-gray-600">
                  You'll receive an email with our decision and next steps.
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center font-semibold">
                4
              </div>
              <div>
                <h4 className="font-medium text-secondary-900">Start Shopping</h4>
                <p className="text-sm text-gray-600">
                  Once approved, you'll have full access to wholesale pricing and can start placing
                  orders!
                </p>
              </div>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
