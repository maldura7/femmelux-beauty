'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Button, Input } from '@/components/ui';
import { login as loginApi } from '@/lib/api';
import { saveAuthData } from '@/lib/auth';
import { getPath } from '@/lib/navigation';

interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    defaultValues: {
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const response = await loginApi({
        email: data.email,
        password: data.password,
      });

      // Save auth data
      saveAuthData({
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        user: response.user,
      });

      toast.success('Welcome back!');
      window.location.href = getPath('/dashboard');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Login failed');
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

          <h2 className="text-3xl font-bold text-secondary-800">Welcome back</h2>
          <p className="mt-2 text-gray-600">Sign in to your admin account</p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
            <Input
              label="Email address"
              type="email"
              autoComplete="email"
              placeholder="admin@femmelux.com"
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
                autoComplete="current-password"
                placeholder="Enter your password"
                error={errors.password?.message}
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters',
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

            <div className="flex items-center justify-between">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                  {...register('rememberMe')}
                />
                <span className="ml-2 text-sm text-gray-600">Remember me</span>
              </label>
              <a
                href={getPath('/forgot-password')}
                className="text-sm text-primary-500 hover:text-primary-600 font-medium"
              >
                Forgot password?
              </a>
            </div>

            <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
              Sign in
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            Don&apos;t have an account?{' '}
            <a href={getPath('/register')} className="text-primary-500 hover:text-primary-600 font-medium">
              Sign up
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
            <h3 className="text-3xl font-display font-semibold text-white">FemmeLux Admin</h3>
            <p className="mt-2 text-gray-400 max-w-xs mx-auto">
              Manage your beauty wholesale platform with ease
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
