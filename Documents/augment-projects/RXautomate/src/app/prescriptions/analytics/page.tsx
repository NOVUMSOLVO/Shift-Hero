import { Metadata } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Layout from '@/components/Layout';
import PrescriptionAnalytics from '@/components/prescriptions/PrescriptionAnalytics';

export const metadata: Metadata = {
  title: 'Prescription Analytics | RXautomate',
  description: 'Analytics and insights for prescription management',
};

export default async function PrescriptionAnalyticsPage() {
  // Check authentication
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/auth/signin?callbackUrl=/prescriptions/analytics');
  }

  return (
    <div className="container mx-auto py-8">
      <PrescriptionAnalytics />
    </div>
  );
}
