'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Button, Input } from '@/components/ui';
import { forgotPassword } from '@/lib/api';

interface ForgotPasswordFormData {
  email: string;
}

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<ForgotPasswordFormData>();

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    try {
      await forgotPassword(data.email);
      setIsEmailSent(true);
      toast.success('Password reset email sent!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send reset email');
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

          {!isEmailSent ? (
            <>
              <h2 className="text-3xl font-bold text-secondary-800">Forgot password?</h2>
              <p className="mt-2 text-gray-600">
                No worries, we&apos;ll send you reset instructions.
              </p>

              <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
                <Input
                  label="Email address"
                  type="email"
                  autoComplete="email"
                  placeholder="Enter your email"
                  error={errors.email?.message}
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address',
                    },
                  })}
                />

                <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
                  Send reset link
                </Button>
              </form>
            </>
          ) : (
            <>
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
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-secondary-800">Check your email</h2>
                <p className="mt-2 text-gray-600">
                  We sent a password reset link to
                  <br />
                  <span className="font-medium text-secondary-800">{getValues('email')}</span>
                </p>
              </div>

              <div className="mt-8 space-y-4">
                <Button
                  type="button"
                  className="w-full"
                  size="lg"
                  variant="outline"
                  onClick={() => setIsEmailSent(false)}
                >
                  Try a different email
                </Button>

                <p className="text-center text-sm text-gray-500">
                  Didn&apos;t receive the email?{' '}
                  <button
                    type="button"
                    className="text-primary-500 hover:text-primary-600 font-medium"
                    onClick={() => {
                      setIsLoading(true);
                      forgotPassword(getValues('email'))
                        .then(() => toast.success('Email resent!'))
                        .catch(() => toast.error('Failed to resend'))
                        .finally(() => setIsLoading(false));
                    }}
                    disabled={isLoading}
                  >
                    Click to resend
                  </button>
                </p>
              </div>
            </>
          )}

          <p className="mt-8 text-center">
            <Link
              href="/login"
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
            </Link>
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
                  d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                />
              </svg>
            </div>
            <h3 className="text-3xl font-display font-semibold text-white">Password Recovery</h3>
            <p className="mt-2 text-gray-400 max-w-xs mx-auto">
              We&apos;ll help you get back into your account securely
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
