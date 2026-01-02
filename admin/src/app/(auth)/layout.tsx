import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Authentication - FemmeLux Admin',
  description: 'Sign in to your FemmeLux Admin account',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
}
