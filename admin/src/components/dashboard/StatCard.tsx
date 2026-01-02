'use client';

import Link from 'next/link';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';
import { Card, CardBody } from '@/components/ui';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: React.ReactNode;
  iconBgColor?: string;
  linkHref?: string;
  linkLabel?: string;
  isLoading?: boolean;
}

export function StatCard({
  title,
  value,
  change,
  changeLabel = 'vs last month',
  icon,
  iconBgColor = 'bg-primary-100',
  linkHref,
  linkLabel,
  isLoading = false,
}: StatCardProps) {
  const isPositiveChange = change !== undefined && change >= 0;
  const hasChange = change !== undefined;

  const content = (
    <Card className="h-full hover:shadow-md transition-shadow">
      <CardBody>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-500">{title}</p>
            {isLoading ? (
              <div className="mt-2 h-8 w-24 bg-gray-200 animate-pulse rounded" />
            ) : (
              <p className="mt-2 text-3xl font-bold text-secondary-800">{value}</p>
            )}

            {hasChange && !isLoading && (
              <div className="mt-2 flex items-center gap-1">
                <span
                  className={cn(
                    'inline-flex items-center text-sm font-medium',
                    isPositiveChange ? 'text-success-600' : 'text-error-600'
                  )}
                >
                  {isPositiveChange ? (
                    <ArrowUpIcon className="h-4 w-4 mr-0.5" />
                  ) : (
                    <ArrowDownIcon className="h-4 w-4 mr-0.5" />
                  )}
                  {Math.abs(change)}%
                </span>
                <span className="text-sm text-gray-500">{changeLabel}</span>
              </div>
            )}

            {linkHref && linkLabel && (
              <p className="mt-3">
                <span className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                  {linkLabel} →
                </span>
              </p>
            )}
          </div>

          <div className={cn('p-3 rounded-lg', iconBgColor)}>
            {icon}
          </div>
        </div>
      </CardBody>
    </Card>
  );

  if (linkHref) {
    return <Link href={linkHref}>{content}</Link>;
  }

  return content;
}

export default StatCard;
