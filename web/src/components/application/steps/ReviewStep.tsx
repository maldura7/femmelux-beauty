'use client';

import { UseFormRegister, FieldErrors, UseFormWatch } from 'react-hook-form';
import {
  ApplicationFormData,
  BUSINESS_TYPES,
  US_STATES,
  MONTHLY_PURCHASE_OPTIONS,
  PRODUCT_CATEGORIES,
  HEAR_ABOUT_US_OPTIONS,
} from '@/lib/api/applications.api';
import { UploadedFile } from '../FileUpload';

// ============================================
// TYPES
// ============================================

interface ReviewStepProps {
  register: UseFormRegister<ApplicationFormData>;
  errors: FieldErrors<ApplicationFormData>;
  watch: UseFormWatch<ApplicationFormData>;
  files: UploadedFile[];
  onEditStep: (step: number) => void;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function getLabel(value: string | undefined, options: { value: string; label: string }[]): string {
  if (!value) return '-';
  const option = options.find((o) => o.value === value);
  return option?.label || value;
}

function getCategoryLabels(values: string[] | undefined): string {
  if (!values || values.length === 0) return '-';
  return values
    .map((v) => PRODUCT_CATEGORIES.find((c) => c.value === v)?.label || v)
    .join(', ');
}

// ============================================
// REVIEW SECTION COMPONENT
// ============================================

interface ReviewSectionProps {
  title: string;
  step: number;
  onEdit: () => void;
  children: React.ReactNode;
}

function ReviewSection({ title, step, onEdit, children }: ReviewSectionProps) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-b border-gray-200">
        <h3 className="font-medium text-secondary-900">{title}</h3>
        <button
          type="button"
          onClick={onEdit}
          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          Edit
        </button>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

// ============================================
// REVIEW ITEM COMPONENT
// ============================================

interface ReviewItemProps {
  label: string;
  value: React.ReactNode;
}

function ReviewItem({ label, value }: ReviewItemProps) {
  return (
    <div className="py-2 border-b border-gray-100 last:border-0">
      <dt className="text-sm text-gray-500">{label}</dt>
      <dd className="mt-1 text-sm text-secondary-900 font-medium">{value || '-'}</dd>
    </div>
  );
}

// ============================================
// REVIEW STEP COMPONENT
// ============================================

export default function ReviewStep({
  register,
  errors,
  watch,
  files,
  onEditStep,
}: ReviewStepProps) {
  const formData = watch();
  const isVendor = formData.applicationType === 'VENDOR';

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-secondary-900">Review Your Application</h2>
        <p className="mt-2 text-gray-600">
          Please review all information before submitting. Click "Edit" to make changes.
        </p>
      </div>

      <div className="space-y-4 mt-8">
        {/* Application Type */}
        <ReviewSection title="Application Type" step={1} onEdit={() => onEditStep(1)}>
          <ReviewItem
            label="Type"
            value={formData.applicationType === 'CUSTOMER' ? 'Business Customer' : 'Vendor'}
          />
        </ReviewSection>

        {/* Business Information */}
        <ReviewSection title="Business Information" step={2} onEdit={() => onEditStep(2)}>
          <dl className="space-y-0">
            <ReviewItem label="Business Name" value={formData.businessName} />
            <ReviewItem
              label="Business Type"
              value={getLabel(formData.businessType, BUSINESS_TYPES)}
            />
            <ReviewItem label="Tax ID / EIN" value={formData.taxId} />
            <ReviewItem label="Business License" value={formData.businessLicense} />
            <ReviewItem label="Resale Certificate" value={formData.resaleCertificate} />
            <ReviewItem
              label="Years in Business"
              value={formData.businessYears ? `${formData.businessYears} years` : undefined}
            />
          </dl>
        </ReviewSection>

        {/* Contact Information */}
        <ReviewSection title="Contact Information" step={3} onEdit={() => onEditStep(3)}>
          <dl className="space-y-0">
            <ReviewItem label="Phone Number" value={formData.phone} />
            <ReviewItem label="Website" value={formData.businessWebsite} />
            <ReviewItem
              label="Address"
              value={
                formData.businessAddress?.street ? (
                  <div>
                    <div>{formData.businessAddress.street}</div>
                    <div>
                      {formData.businessAddress.city},{' '}
                      {getLabel(formData.businessAddress.state, US_STATES)}{' '}
                      {formData.businessAddress.zip}
                    </div>
                    <div>{formData.businessAddress.country}</div>
                  </div>
                ) : undefined
              }
            />
          </dl>
        </ReviewSection>

        {/* Purchase Information (Customer only) */}
        {!isVendor && (
          <ReviewSection title="Purchase Information" step={4} onEdit={() => onEditStep(4)}>
            <dl className="space-y-0">
              <ReviewItem
                label="Estimated Monthly Purchase"
                value={getLabel(formData.estimatedMonthlyPurchase, MONTHLY_PURCHASE_OPTIONS)}
              />
              <ReviewItem
                label="Product Categories"
                value={getCategoryLabels(formData.productCategories)}
              />
            </dl>
          </ReviewSection>
        )}

        {/* Vendor Information (Vendor only) */}
        {isVendor && (
          <ReviewSection title="Vendor Information" step={4} onEdit={() => onEditStep(4)}>
            <dl className="space-y-0">
              <ReviewItem label="Brand Name" value={formData.brandName} />
              <ReviewItem label="Brand Description" value={formData.brandDescription} />
              <ReviewItem
                label="Product Categories"
                value={getCategoryLabels(formData.vendorProductCategories)}
              />
              <ReviewItem
                label="Minimum Order Amount"
                value={
                  formData.minimumOrderAmount
                    ? `$${formData.minimumOrderAmount.toFixed(2)}`
                    : 'No minimum'
                }
              />
              <ReviewItem
                label="Product Line Size"
                value={
                  formData.productLineSize
                    ? `${formData.productLineSize} products`
                    : undefined
                }
              />
            </dl>
          </ReviewSection>
        )}

        {/* References & Documents */}
        <ReviewSection title="References & Documents" step={5} onEdit={() => onEditStep(5)}>
          <dl className="space-y-0">
            <ReviewItem
              label="Business References"
              value={
                formData.businessReferences ? (
                  <pre className="whitespace-pre-wrap font-sans">
                    {formData.businessReferences}
                  </pre>
                ) : undefined
              }
            />
            <ReviewItem
              label="Uploaded Documents"
              value={
                files.length > 0 ? (
                  <ul className="list-disc list-inside">
                    {files.map((file) => (
                      <li key={file.id}>{file.name}</li>
                    ))}
                  </ul>
                ) : (
                  'No documents uploaded'
                )
              }
            />
          </dl>
        </ReviewSection>

        {/* Additional Information */}
        <ReviewSection title="Additional Information" step={6} onEdit={() => onEditStep(6)}>
          <dl className="space-y-0">
            <ReviewItem
              label="How Did You Hear About Us"
              value={getLabel(formData.hearAboutUs, HEAR_ABOUT_US_OPTIONS)}
            />
            <ReviewItem label="Additional Notes" value={formData.additionalNotes} />
          </dl>
        </ReviewSection>
      </div>

      {/* Agreement Checkboxes */}
      <div className="mt-8 p-6 bg-gray-50 border border-gray-200 rounded-lg">
        <h3 className="text-lg font-medium text-secondary-900 mb-4">Terms & Certification</h3>

        <div className="space-y-4">
          {/* Certify Accurate */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              {...register('certifyAccurate', {
                required: 'You must certify that all information is accurate',
              })}
              className="mt-1 h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-secondary-900">
              I certify that all information provided in this application is accurate and complete
              to the best of my knowledge. I understand that providing false information may result
              in rejection or termination of my account.
            </span>
          </label>
          {errors.certifyAccurate && (
            <p className="text-sm text-red-600 ml-8">{errors.certifyAccurate.message}</p>
          )}

          {/* Agree Terms */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              {...register('agreeTerms', {
                required: 'You must agree to the Terms & Conditions',
              })}
              className="mt-1 h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-secondary-900">
              I have read and agree to FemmeLux Beauty's{' '}
              <a
                href="/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:text-primary-700 underline"
              >
                Terms & Conditions
              </a>{' '}
              and{' '}
              <a
                href="/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:text-primary-700 underline"
              >
                Privacy Policy
              </a>
              .
            </span>
          </label>
          {errors.agreeTerms && (
            <p className="text-sm text-red-600 ml-8">{errors.agreeTerms.message}</p>
          )}
        </div>
      </div>
    </div>
  );
}
