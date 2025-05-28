'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

interface ApiError {
  id: string;
  action: string;
  timestamp: string;
  details: string;
}

export default function NHSApiErrorNotification() {
  const { data: session } = useSession();
  const [errors, setErrors] = useState<ApiError[]>([]);
  const [showNotification, setShowNotification] = useState(false);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  // Check for new errors every 30 seconds
  useEffect(() => {
    // Only poll if user is authenticated and has admin privileges
    if (session?.user && ['SUPER_ADMIN', 'ORG_ADMIN', 'PHARMACY_ADMIN'].includes(session.user.role as string)) {
      const interval = setInterval(fetchLatestErrors, 30000);
      setPollingInterval(interval);
      
      // Initial fetch
      fetchLatestErrors();
      
      return () => {
        if (interval) clearInterval(interval);
      };
    }
  }, [session]);

  const fetchLatestErrors = async () => {
    try {
      const response = await fetch('/api/admin/audit-logs?category=NHS_API&action=API_ERROR&limit=5');
      
      if (!response.ok) {
        console.error('Failed to fetch API errors');
        return;
      }
      
      const data = await response.json();
      
      // Only show notification if there are new errors
      if (data.logs.length > 0 && JSON.stringify(data.logs) !== JSON.stringify(errors)) {
        setErrors(data.logs);
        setShowNotification(true);
      }
    } catch (error) {
      console.error('Error fetching API errors:', error);
    }
  };

  const dismissNotification = () => {
    setShowNotification(false);
  };

  const viewAllErrors = () => {
    window.location.href = '/admin/nhs-api-monitor?category=NHS_API&action=API_ERROR';
    dismissNotification();
  };

  if (!showNotification || errors.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md w-full bg-white rounded-lg shadow-lg border-l-4 border-red-500 overflow-hidden">
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-3 w-0 flex-1">
            <p className="text-sm font-medium text-gray-900">
              NHS API Errors Detected
            </p>
            <div className="mt-2 max-h-40 overflow-y-auto">
              {errors.map((error) => (
                <div key={error.id} className="mt-2 text-sm text-gray-500 border-t pt-2">
                  <p className="font-medium">{error.action} - {new Date(error.timestamp).toLocaleString()}</p>
                  <p className="truncate">{
                    error.details ? JSON.parse(error.details).message || 'Unknown error' : 'Unknown error'
                  }</p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex">
              <button
                type="button"
                onClick={viewAllErrors}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-nhs-blue hover:bg-nhs-dark-blue focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-nhs-blue"
              >
                View All Errors
              </button>
              <button
                type="button"
                onClick={dismissNotification}
                className="ml-3 inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-nhs-blue"
              >
                Dismiss
              </button>
            </div>
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-nhs-blue"
              onClick={dismissNotification}
            >
              <span className="sr-only">Close</span>
              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
