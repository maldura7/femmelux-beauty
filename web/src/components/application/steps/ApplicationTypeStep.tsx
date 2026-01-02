'use client';

import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { ApplicationFormData, ApplicationType } from '@/lib/api/applications.api';
import { ShoppingBagIcon, BuildingStorefrontIcon } from '@heroicons/react/24/outline';

// ============================================
// TYPES
// ============================================

interface ApplicationTypeStepProps {
  register: UseFormRegister<ApplicationFormData>;
  errors: FieldErrors<ApplicationFormData>;
  selectedType: ApplicationType | undefined;
  onTypeChange: (type: ApplicationType) => void;
}

// ============================================
// APPLICATION TYPE STEP COMPONENT
// ============================================

export default function ApplicationTypeStep({
  register,
  errors,
  selectedType,
  onTypeChange,
}: ApplicationTypeStepProps) {
  const types = [
    {
      id: 'CUSTOMER' as ApplicationType,
      name: 'I Want to Buy',
      description:
        'Apply as a business customer to access wholesale pricing and purchase products for your salon, spa, or retail store.',
      icon: ShoppingBagIcon,
      features: [
        'Access wholesale pricing',
        'No minimum order requirements on many products',
        'Priority customer support',
        'Exclusive deals and promotions',
      ],
    },
    {
      id: 'VENDOR' as ApplicationType,
      name: 'I Want to Sell',
      description:
        'Apply as a vendor to list and sell your beauty products on our platform to thousands of business customers.',
      icon: BuildingStorefrontIcon,
      features: [
        'Reach thousands of business customers',
        'Dedicated vendor dashboard',
        'Marketing and promotion support',
        'Competitive commission rates',
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-secondary-900">Choose Your Application Type</h2>
        <p className="mt-2 text-gray-600">
          Select whether you want to buy products or sell your products on FemmeLux Beauty.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mt-8">
        {types.map((type) => {
          const Icon = type.icon;
          const isSelected = selectedType === type.id;

          return (
            <button
              key={type.id}
              type="button"
              onClick={() => onTypeChange(type.id)}
              className={`
                relative p-6 rounded-xl border-2 text-left transition-all duration-200
                ${
                  isSelected
                    ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-500 ring-offset-2'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }
              `}
            >
              {/* Selected Indicator */}
              {isSelected && (
                <div className="absolute top-4 right-4 w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              )}

              {/* Icon */}
              <div
                className={`
                  w-14 h-14 rounded-xl flex items-center justify-center mb-4
                  ${isSelected ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600'}
                `}
              >
                <Icon className="w-7 h-7" />
              </div>

              {/* Title */}
              <h3 className="text-xl font-semibold text-secondary-900">{type.name}</h3>

              {/* Description */}
              <p className="mt-2 text-sm text-gray-600">{type.description}</p>

              {/* Features */}
              <ul className="mt-4 space-y-2">
                {type.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm text-gray-700">
                    <svg
                      className={`w-4 h-4 ${isSelected ? 'text-primary-500' : 'text-gray-400'}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>

      {/* Hidden input for form */}
      <input type="hidden" {...register('applicationType', { required: true })} />

      {errors.applicationType && (
        <p className="text-center text-sm text-red-600">Please select an application type</p>
      )}
    </div>
  );
}
