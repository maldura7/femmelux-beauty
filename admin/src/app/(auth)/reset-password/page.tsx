'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Button, Input } from '@/components/ui';
import { resetPassword } from '@/lib/api';
import { getPath } from '@/lib/navigation';

interface ResetPasswordFormData {
  password: string;
  confirmPassword: string;
}

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordFormData>();

  const password = watch('password');

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      toast.error('Invalid reset token');
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword({ token, password: data.password });
      setIsSuccess(true);
      toast.success('Password reset successfully!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="text-center">
        <div className="mx-auto h-16 w-16 rounded-full bg-error-100 flex items-center justify-center mb-6">
          <svg
            className="h-8 w-8 text-error-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-secondary-800">Invalid Reset Link</h2>
        <p className="mt-2 text-gray-600">
          This password reset link is invalid or has expired.
        </p>
        <a href={getPath('/forgot-password')}>
          <Button className="mt-6" variant="primary">
            Request new reset link
          </Button>
        </a>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="text-center">
        <div className="mx-auto h-16 w-16 rounded-full bg-success-100 flex items-center justify-center mb-6">
          <svg
            className="h-8 w-8 text-success-600"
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
        <h2 className="text-2xl font-bold text-secondary-800">Password Reset!</h2>
        <p className="mt-2 text-gray-600">
          Your password has been successfully reset.
        </p>
        <Button className="mt-6" onClick={() => window.location.href = getPath('/login')}>
          Sign in with new password
        </Button>
      </div>
    );
  }

  return (
    <>
      <h2 className="text-3xl font-bold text-secondary-800">Set new password</h2>
      <p className="mt-2 text-gray-600">
        Your new password must be different from previously used passwords.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
        <div className="relative">
          <Input
            label="New password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="Enter new password"
            error={errors.password?.message}
            {...register('password', {
              required: 'Password is required',
              minLength: {
                value: 8,
                message: 'Password must be at least 8 characters',
              },
              pattern: {
                value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                message: 'Must contain uppercase, lowercase, and number',
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
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          placeholder="Confirm your password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword', {
            required: 'Please confirm your password',
            validate: (value) => value === password || 'Passwords do not match',
          })}
        />

        {/* Password requirements */}
        <div className="rounded-lg bg-gray-50 p-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Password must contain:</p>
          <ul className="space-y-1 text-sm text-gray-600">
            <li className="flex items-center gap-2">
              <span className={password?.length >= 8 ? 'text-success-600' : 'text-gray-400'}>
                {password?.length >= 8 ? '✓' : '○'}
              </span>
              At least 8 characters
            </li>
            <li className="flex items-center gap-2">
              <span className={/[A-Z]/.test(password || '') ? 'text-success-600' : 'text-gray-400'}>
                {/[A-Z]/.test(password || '') ? '✓' : '○'}
              </span>
              One uppercase letter
            </li>
            <li className="flex items-center gap-2">
              <span className={/[a-z]/.test(password || '') ? 'text-success-600' : 'text-gray-400'}>
                {/[a-z]/.test(password || '') ? '✓' : '○'}
              </span>
              One lowercase letter
            </li>
            <li className="flex items-center gap-2">
              <span className={/\d/.test(password || '') ? 'text-success-600' : 'text-gray-400'}>
                {/\d/.test(password || '') ? '✓' : '○'}
              </span>
              One number
            </li>
          </ul>
        </div>

        <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
          Reset password
        </Button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
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

          <Suspense fallback={<div className="animate-pulse h-64 bg-gray-100 rounded-lg" />}>
            <ResetPasswordForm />
          </Suspense>

          <p className="mt-8 text-center">
            <a
              href={getPath('/login')}
              className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to sign in
            </a>
          </p>
        </div>
      </div>

      {/* Right side - Branding */}
      <div className="hidden lg:block relative flex-1 bg-secondary-800">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="h-24 w-24 rounded-2xl bg-primary-500 mx-auto flex items-center justify-center mb-6">
              <svg className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h3 className="text-3xl font-display font-semibold text-white">Secure Reset</h3>
            <p className="mt-2 text-gray-400 max-w-xs mx-auto">
              Create a strong password to keep your account safe
            </p>
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
