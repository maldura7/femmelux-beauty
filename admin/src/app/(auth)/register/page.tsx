'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Button, Input } from '@/components/ui';
import { register as registerApi } from '@/lib/api';
import { getPath } from '@/lib/navigation';

interface RegisterFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  businessName?: string;
  agreeToTerms: boolean;
}

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    defaultValues: {
      agreeToTerms: false,
    },
  });

  const password = watch('password');

  const onSubmit = async (data: RegisterFormData) => {
    if (!data.agreeToTerms) {
      toast.error('Please agree to the terms and conditions');
      return;
    }

    setIsLoading(true);
    try {
      await registerApi({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        businessName: data.businessName,
        role: 'VENDOR',
      });

      toast.success('Account created successfully! Please sign in.');
      window.location.href = getPath('/login');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:max-w-md">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-8">
            <div className="h-10 w-10 rounded-lg bg-primary-500 flex items-center justify-center">
              <span className="text-white font-bold text-xl">F</span>
            </div>
            <span className="text-2xl font-display font-semibold text-secondary-800">FemmeLux</span>
          </div>

          <h2 className="text-3xl font-bold text-secondary-800">Create an account</h2>
          <p className="mt-2 text-gray-600">Join our wholesale beauty platform</p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First name"
                type="text"
                autoComplete="given-name"
                placeholder="John"
                error={errors.firstName?.message}
                {...register('firstName', {
                  required: 'First name is required',
                  minLength: {
                    value: 2,
                    message: 'At least 2 characters',
                  },
                })}
              />

              <Input
                label="Last name"
                type="text"
                autoComplete="family-name"
                placeholder="Doe"
                error={errors.lastName?.message}
                {...register('lastName', {
                  required: 'Last name is required',
                  minLength: {
                    value: 2,
                    message: 'At least 2 characters',
                  },
                })}
              />
            </div>

            <Input
              label="Business name (optional)"
              type="text"
              autoComplete="organization"
              placeholder="Your Beauty Shop"
              error={errors.businessName?.message}
              {...register('businessName')}
            />

            <Input
              label="Email address"
              type="email"
              autoComplete="email"
              placeholder="john@example.com"
              error={errors.email?.message}
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address',
                },
              })}
            />

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Create a strong password"
                error={errors.password?.message}
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 8,
                    message: 'Password must be at least 8 characters',
                  },
                  pattern: {
                    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                    message: 'Password must contain uppercase, lowercase, and number',
                  },
                })}
              />
              <button
                type="button"
                className="absolute right-3 top-8 text-sm text-gray-500 hover:text-gray-700"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>

            <Input
              label="Confirm password"
              type="password"
              autoComplete="new-password"
              placeholder="Confirm your password"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword', {
                required: 'Please confirm your password',
                validate: (value) => value === password || 'Passwords do not match',
              })}
            />

            <label className="flex items-start cursor-pointer">
              <input
                type="checkbox"
                className="h-4 w-4 mt-0.5 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                {...register('agreeToTerms', {
                  required: 'You must agree to the terms',
                })}
              />
              <span className="ml-2 text-sm text-gray-600">
                I agree to the{' '}
                <a href={getPath('/terms')} className="text-primary-500 hover:text-primary-600">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href={getPath('/privacy')} className="text-primary-500 hover:text-primary-600">
                  Privacy Policy
                </a>
              </span>
            </label>
            {errors.agreeToTerms && (
              <p className="text-sm text-error-500">{errors.agreeToTerms.message}</p>
            )}

            <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
              Create account
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <a href={getPath('/login')} className="text-primary-500 hover:text-primary-600 font-medium">
              Sign in
            </a>
          </p>
        </div>
      </div>

      {/* Right side - Branding */}
      <div className="hidden lg:block relative flex-1 bg-secondary-800">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="h-24 w-24 rounded-2xl bg-primary-500 mx-auto flex items-center justify-center mb-6">
              <span className="text-white font-bold text-5xl">F</span>
            </div>
            <h3 className="text-3xl font-display font-semibold text-white">Join FemmeLux</h3>
            <p className="mt-2 text-gray-400 max-w-xs mx-auto">
              Start selling premium beauty products wholesale today
            </p>

            {/* Features */}
            <div className="mt-8 space-y-4 text-left max-w-xs mx-auto">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary-500/20 flex items-center justify-center">
                  <svg className="h-4 w-4 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-gray-300 text-sm">Access to premium brands</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary-500/20 flex items-center justify-center">
                  <svg className="h-4 w-4 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-gray-300 text-sm">Wholesale pricing</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary-500/20 flex items-center justify-center">
                  <svg className="h-4 w-4 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-gray-300 text-sm">Fast order processing</span>
              </div>
            </div>
          </div>
        </div>
        {/* Decorative pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/4 left-1/4 h-64 w-64 rounded-full border-2 border-primary-500" />
          <div className="absolute bottom-1/4 right-1/4 h-48 w-48 rounded-full border-2 border-primary-500" />
          <div className="absolute top-1/2 right-1/3 h-32 w-32 rounded-full border-2 border-primary-500" />
        </div>
      </div>
    </div>
  );
}
