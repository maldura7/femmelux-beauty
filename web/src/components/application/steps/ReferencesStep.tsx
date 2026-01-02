'use client';

import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { ApplicationFormData } from '@/lib/api/applications.api';
import FileUpload, { UploadedFile } from '../FileUpload';

// ============================================
// TYPES
// ============================================

interface ReferencesStepProps {
  register: UseFormRegister<ApplicationFormData>;
  errors: FieldErrors<ApplicationFormData>;
  files: UploadedFile[];
  onFilesChange: (files: UploadedFile[]) => void;
}

// ============================================
// REFERENCES STEP COMPONENT
// ============================================

export default function ReferencesStep({
  register,
  errors,
  files,
  onFilesChange,
}: ReferencesStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-secondary-900">References & Documents</h2>
        <p className="mt-2 text-gray-600">
          Provide business references and upload supporting documents.
        </p>
      </div>

      <div className="space-y-8 mt-8">
        {/* Business References */}
        <div>
          <label
            htmlFor="businessReferences"
            className="block text-sm font-medium text-secondary-900"
          >
            Business References <span className="text-gray-400">(Optional)</span>
          </label>
          <p className="text-sm text-gray-500 mb-2">
            Please provide 2-3 business references with contact information.
          </p>
          <textarea
            id="businessReferences"
            rows={5}
            {...register('businessReferences')}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 text-secondary-900 placeholder-gray-400 focus:border-primary-500 focus:ring-primary-500"
            placeholder={`Example:
1. ABC Distributors - John Smith (555) 123-4567
2. XYZ Beauty Supply - Jane Doe (555) 987-6543
3. Premier Salon Products - Bob Johnson (555) 456-7890`}
          />
          <p className="mt-1 text-xs text-gray-500">
            References help us verify your business and may speed up the approval process.
          </p>
        </div>

        {/* Document Upload */}
        <div>
          <FileUpload
            files={files}
            onFilesChange={onFilesChange}
            maxFiles={5}
            maxSize={5 * 1024 * 1024} // 5MB
            acceptedTypes={['application/pdf', 'image/jpeg', 'image/png', 'image/webp']}
            label="Upload Documents (Optional)"
            helpText="Upload your resale certificate, business license, or other relevant documents."
          />
        </div>

        {/* Document Types Info */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-secondary-900 mb-3">
            Recommended Documents to Upload:
          </h4>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <svg
                className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span>
                <strong>Resale Certificate</strong> - Required for tax-exempt purchases in most
                states
              </span>
            </li>
            <li className="flex items-start gap-2">
              <svg
                className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span>
                <strong>Business License</strong> - Proof of your registered business
              </span>
            </li>
            <li className="flex items-start gap-2">
              <svg
                className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span>
                <strong>Cosmetology License</strong> - For salons and beauty professionals
              </span>
            </li>
            <li className="flex items-start gap-2">
              <svg
                className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span>
                <strong>Other Documents</strong> - Any additional documents that verify your
                business
              </span>
            </li>
          </ul>
        </div>

        {/* Privacy Note */}
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
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <div>
              <h4 className="text-sm font-medium text-blue-800">Your Documents Are Secure</h4>
              <p className="mt-1 text-sm text-blue-700">
                All uploaded documents are encrypted and stored securely. They are only used for
                verification purposes and will never be shared with third parties.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
