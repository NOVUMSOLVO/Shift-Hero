'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import Layout from '@/components/Layout';
import PatientStatusChecker from '@/components/PatientStatusChecker';

export default function CheckPatientStatusPage() {
  const { data: session, status } = useSession();
  
  // Redirect to login if not authenticated
  if (status === 'unauthenticated') {
    redirect('/auth/signin');
  }
  
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">NHS Patient Status Checker</h1>
        
        <div className="mb-6">
          <p className="text-gray-700">
            Use this tool to check a patient's NHS status, including their eligibility for prescription services,
            exemption status, and personal details. This information is retrieved directly from NHS Spine
            and other NHS Digital services.
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <PatientStatusChecker 
              onStatusChecked={(data) => {
                console.log('Patient status checked:', data);
                // You could implement additional actions here
              }}
            />
          </div>
          
          <div className="bg-nhs-pale-blue p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-4">About NHS Status Checking</h2>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start">
                <span className="text-nhs-blue mr-2">•</span>
                <span>Patient details are verified against the NHS Personal Demographics Service (PDS)</span>
              </li>
              <li className="flex items-start">
                <span className="text-nhs-blue mr-2">•</span>
                <span>Exemption status is checked using the Prescription Exemption Checking Service (PECS)</span>
              </li>
              <li className="flex items-start">
                <span className="text-nhs-blue mr-2">•</span>
                <span>Eligibility for prescription services is verified against NHS BSA database</span>
              </li>
              <li className="flex items-start">
                <span className="text-nhs-blue mr-2">•</span>
                <span>All checks are logged for audit purposes in compliance with NHS IG requirements</span>
              </li>
              <li className="flex items-start">
                <span className="text-nhs-blue mr-2">•</span>
                <span>Patient records are automatically updated with the latest information</span>
              </li>
            </ul>
            
            <div className="mt-6 pt-4 border-t border-nhs-blue">
              <h3 className="font-medium mb-2">Need Help?</h3>
              <p className="text-sm">
                If you encounter any issues with the NHS status checking, please contact the RXautomate support team
                or refer to the <a href="/help/nhs-integration" className="text-nhs-blue hover:underline">NHS Integration Guide</a>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
