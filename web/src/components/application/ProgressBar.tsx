'use client';

import { CheckIcon } from '@heroicons/react/24/solid';

// ============================================
// TYPES
// ============================================

interface Step {
  id: number;
  name: string;
  shortName?: string;
}

interface ProgressBarProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (step: number) => void;
}

// ============================================
// PROGRESS BAR COMPONENT
// ============================================

export default function ProgressBar({ steps, currentStep, onStepClick }: ProgressBarProps) {
  return (
    <nav aria-label="Progress" className="w-full">
      {/* Desktop Progress Bar */}
      <ol className="hidden md:flex items-center w-full">
        {steps.map((step, index) => {
          const isCompleted = currentStep > step.id;
          const isCurrent = currentStep === step.id;
          const isClickable = onStepClick && isCompleted;

          return (
            <li
              key={step.id}
              className={`relative flex-1 ${index !== steps.length - 1 ? 'pr-8' : ''}`}
            >
              {/* Connector Line */}
              {index !== steps.length - 1 && (
                <div
                  className={`absolute top-4 left-0 right-0 h-0.5 ${
                    isCompleted ? 'bg-primary-500' : 'bg-gray-200'
                  }`}
                  style={{ left: '50%', right: '-50%' }}
                />
              )}

              {/* Step Circle and Label */}
              <div className="relative flex flex-col items-center group">
                <button
                  onClick={() => isClickable && onStepClick(step.id)}
                  disabled={!isClickable}
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                    transition-all duration-200 z-10
                    ${
                      isCompleted
                        ? 'bg-primary-500 text-secondary-900 cursor-pointer hover:bg-primary-600'
                        : isCurrent
                        ? 'bg-secondary-800 text-white ring-2 ring-primary-500 ring-offset-2'
                        : 'bg-gray-200 text-gray-500'
                    }
                    ${!isClickable ? 'cursor-default' : ''}
                  `}
                >
                  {isCompleted ? (
                    <CheckIcon className="w-4 h-4" />
                  ) : (
                    step.id
                  )}
                </button>
                <span
                  className={`
                    mt-2 text-xs font-medium text-center
                    ${isCurrent ? 'text-secondary-900' : isCompleted ? 'text-primary-600' : 'text-gray-500'}
                  `}
                >
                  {step.shortName || step.name}
                </span>
              </div>
            </li>
          );
        })}
      </ol>

      {/* Mobile Progress Bar */}
      <div className="md:hidden">
        {/* Progress Bar */}
        <div className="relative">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-secondary-900">
              Step {currentStep} of {steps.length}
            </span>
            <span className="text-sm text-gray-500">
              {steps[currentStep - 1]?.name}
            </span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-500 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Dots */}
        <div className="flex justify-between mt-4">
          {steps.map((step) => {
            const isCompleted = currentStep > step.id;
            const isCurrent = currentStep === step.id;
            const isClickable = onStepClick && isCompleted;

            return (
              <button
                key={step.id}
                onClick={() => isClickable && onStepClick(step.id)}
                disabled={!isClickable}
                className={`
                  w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium
                  transition-all duration-200
                  ${
                    isCompleted
                      ? 'bg-primary-500 text-secondary-900'
                      : isCurrent
                      ? 'bg-secondary-800 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }
                  ${isClickable ? 'cursor-pointer' : 'cursor-default'}
                `}
              >
                {isCompleted ? (
                  <CheckIcon className="w-3 h-3" />
                ) : (
                  step.id
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
