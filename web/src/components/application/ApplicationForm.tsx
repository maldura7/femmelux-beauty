'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  ApplicationFormData,
  ApplicationType,
  submitApplication,
  resubmitApplication,
  saveApplicationDraft,
  loadApplicationDraft,
  clearApplicationDraft,
} from '@/lib/api/applications.api';
import ProgressBar from './ProgressBar';
import { UploadedFile } from './FileUpload';
import {
  ApplicationTypeStep,
  BusinessInfoStep,
  ContactInfoStep,
  PurchaseInfoStep,
  VendorInfoStep,
  ReferencesStep,
  AdditionalInfoStep,
  ReviewStep,
} from './steps';
import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

// ============================================
// TYPES
// ============================================

interface ApplicationFormProps {
  isResubmit?: boolean;
}

interface Step {
  id: number;
  name: string;
  shortName: string;
}

// ============================================
// CONSTANTS
// ============================================

const CUSTOMER_STEPS: Step[] = [
  { id: 1, name: 'Application Type', shortName: 'Type' },
  { id: 2, name: 'Business Information', shortName: 'Business' },
  { id: 3, name: 'Contact Information', shortName: 'Contact' },
  { id: 4, name: 'Purchase Information', shortName: 'Purchase' },
  { id: 5, name: 'References & Documents', shortName: 'Documents' },
  { id: 6, name: 'Additional Information', shortName: 'Additional' },
  { id: 7, name: 'Review & Submit', shortName: 'Review' },
];

const VENDOR_STEPS: Step[] = [
  { id: 1, name: 'Application Type', shortName: 'Type' },
  { id: 2, name: 'Business Information', shortName: 'Business' },
  { id: 3, name: 'Contact Information', shortName: 'Contact' },
  { id: 4, name: 'Vendor Information', shortName: 'Vendor' },
  { id: 5, name: 'References & Documents', shortName: 'Documents' },
  { id: 6, name: 'Additional Information', shortName: 'Additional' },
  { id: 7, name: 'Review & Submit', shortName: 'Review' },
];

const DEFAULT_VALUES: Partial<ApplicationFormData> = {
  applicationType: undefined,
  businessName: '',
  businessType: '',
  taxId: '',
  businessLicense: '',
  resaleCertificate: '',
  businessYears: 0,
  phone: '',
  businessWebsite: '',
  businessAddress: {
    street: '',
    city: '',
    state: '',
    zip: '',
    country: 'USA',
  },
  estimatedMonthlyPurchase: '',
  productCategories: [],
  brandName: '',
  brandDescription: '',
  vendorProductCategories: [],
  minimumOrderAmount: undefined,
  productLineSize: undefined,
  businessReferences: '',
  documents: [],
  hearAboutUs: '',
  additionalNotes: '',
  certifyAccurate: false,
  agreeTerms: false,
};

// ============================================
// APPLICATION FORM COMPONENT
// ============================================

export default function ApplicationForm({ isResubmit = false }: ApplicationFormProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [applicationType, setApplicationType] = useState<ApplicationType | undefined>();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<ApplicationFormData>({
    defaultValues: DEFAULT_VALUES,
    mode: 'onChange',
  });

  // Get steps based on application type
  const steps = applicationType === 'VENDOR' ? VENDOR_STEPS : CUSTOMER_STEPS;
  const totalSteps = steps.length;

  // Load saved draft on mount
  useEffect(() => {
    const draft = loadApplicationDraft();
    if (draft) {
      Object.entries(draft).forEach(([key, value]) => {
        setValue(key as keyof ApplicationFormData, value);
      });
      if (draft.applicationType) {
        setApplicationType(draft.applicationType);
      }
    }
  }, [setValue]);

  // Auto-save form data
  const formData = watch();
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      saveApplicationDraft(formData);
    }, 1000);
    return () => clearTimeout(timeoutId);
  }, [formData]);

  // Handle application type change
  const handleTypeChange = useCallback(
    (type: ApplicationType) => {
      setApplicationType(type);
      setValue('applicationType', type);
    },
    [setValue]
  );

  // Validate current step before proceeding
  const validateStep = async (step: number): Promise<boolean> => {
    const fieldsByStep: Record<number, (keyof ApplicationFormData)[]> = {
      1: ['applicationType'],
      2: ['businessName', 'businessType', 'taxId', 'businessYears'],
      3: [
        'phone',
        'businessAddress.street',
        'businessAddress.city',
        'businessAddress.state',
        'businessAddress.zip',
        'businessAddress.country',
      ] as (keyof ApplicationFormData)[],
      4:
        applicationType === 'VENDOR'
          ? ['brandName', 'brandDescription', 'vendorProductCategories']
          : ['estimatedMonthlyPurchase', 'productCategories'],
      5: [], // Optional step
      6: [], // Optional step
      7: ['certifyAccurate', 'agreeTerms'],
    };

    const fieldsToValidate = fieldsByStep[step] || [];
    if (fieldsToValidate.length === 0) return true;

    const result = await trigger(fieldsToValidate);
    return result;
  };

  // Navigate to next step
  const nextStep = async () => {
    const isValid = await validateStep(currentStep);
    if (isValid && currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Navigate to previous step
  const previousStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Go to specific step
  const goToStep = (step: number) => {
    if (step >= 1 && step <= totalSteps) {
      setCurrentStep(step);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Submit application
  const onSubmit = async (data: ApplicationFormData) => {
    setIsSubmitting(true);
    try {
      // Get files to upload
      const filesToUpload = files
        .filter((f) => f.status !== 'error')
        .map((f) => f.file);

      // Submit or resubmit
      if (isResubmit) {
        await resubmitApplication(data, filesToUpload);
      } else {
        await submitApplication(data, filesToUpload);
      }

      // Clear draft
      clearApplicationDraft();

      // Show success message
      toast.success('Application submitted successfully!');

      // Redirect to success page
      router.push('/account/apply/success');
    } catch (error) {
      console.error('Failed to submit application:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to submit application');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render current step
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <ApplicationTypeStep
            register={register}
            errors={errors}
            selectedType={applicationType}
            onTypeChange={handleTypeChange}
          />
        );
      case 2:
        return <BusinessInfoStep register={register} errors={errors} />;
      case 3:
        return <ContactInfoStep register={register} errors={errors} />;
      case 4:
        return applicationType === 'VENDOR' ? (
          <VendorInfoStep register={register} errors={errors} watch={watch} />
        ) : (
          <PurchaseInfoStep register={register} errors={errors} watch={watch} />
        );
      case 5:
        return (
          <ReferencesStep
            register={register}
            errors={errors}
            files={files}
            onFilesChange={setFiles}
          />
        );
      case 6:
        return <AdditionalInfoStep register={register} errors={errors} />;
      case 7:
        return (
          <ReviewStep
            register={register}
            errors={errors}
            watch={watch}
            files={files}
            onEditStep={goToStep}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <ProgressBar steps={steps} currentStep={currentStep} onStepClick={goToStep} />
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Current Step Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
          {renderStep()}
        </div>

        {/* Navigation Buttons */}
        <div className="mt-6 flex items-center justify-between">
          {/* Previous Button */}
          <button
            type="button"
            onClick={previousStep}
            disabled={currentStep === 1}
            className={`
              flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all
              ${
                currentStep === 1
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-secondary-700 hover:text-secondary-900 hover:bg-gray-100'
              }
            `}
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Previous
          </button>

          {/* Next / Submit Button */}
          {currentStep < totalSteps ? (
            <button
              type="button"
              onClick={nextStep}
              disabled={currentStep === 1 && !applicationType}
              className={`
                flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all
                ${
                  currentStep === 1 && !applicationType
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-secondary-800 text-white hover:bg-secondary-900'
                }
              `}
            >
              Next
              <ArrowRightIcon className="w-5 h-5" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className={`
                flex items-center gap-2 px-8 py-3 rounded-lg font-medium transition-all
                ${
                  isSubmitting
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-primary-500 text-secondary-900 hover:bg-primary-600'
                }
              `}
            >
              {isSubmitting ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Submitting...
                </>
              ) : (
                <>
                  Submit Application
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </>
              )}
            </button>
          )}
        </div>
      </form>

      {/* Auto-save Indicator */}
      <div className="mt-4 text-center">
        <p className="text-xs text-gray-400">
          Your progress is automatically saved
        </p>
      </div>
    </div>
  );
}
