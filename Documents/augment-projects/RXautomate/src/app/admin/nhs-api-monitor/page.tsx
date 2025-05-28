'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import Layout from '@/components/Layout';

interface AuditLogEntry {
  id: string;
  action: string;
  category: string;
  userId?: string;
  nhsNumber?: string;
  details?: string;
  timestamp: string;
}

export default function NHSApiMonitorPage() {
  const { data: session, status } = useSession();
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('NHS_API');
  const [dateRange, setDateRange] = useState('today');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Redirect to login if not authenticated
  if (status === 'unauthenticated') {
    redirect('/auth/signin');
  }

  // Redirect if not an admin
  if (session?.user && !['SUPER_ADMIN', 'ORG_ADMIN'].includes(session.user.role as string)) {
    redirect('/dashboard');
  }

  useEffect(() => {
    fetchAuditLogs();
  }, [filter, dateRange, page]);

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/audit-logs?category=${filter}&dateRange=${dateRange}&page=${page}&limit=20`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch audit logs');
      }
      
      const data = await response.json();
      setAuditLogs(data.logs);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError(err.message || 'An error occurred while fetching audit logs');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  };

  const getActionColor = (action: string) => {
    if (action.startsWith('GET_')) return 'bg-blue-100 text-blue-800';
    if (action.includes('ERROR')) return 'bg-red-100 text-red-800';
    if (action.includes('VERIFY')) return 'bg-green-100 text-green-800';
    if (action.includes('CHECK')) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">NHS API Monitor</h1>
        
        <div className="mb-6 flex flex-wrap gap-4 items-center">
          <div>
            <label htmlFor="filter" className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              id="filter"
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-nhs-blue"
            >
              <option value="NHS_API">NHS API</option>
              <option value="PRESCRIPTION">Prescription</option>
              <option value="PATIENT">Patient</option>
              <option value="AUTHENTICATION">Authentication</option>
              <option value="SYSTEM">System</option>
              <option value="">All Categories</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="dateRange" className="block text-sm font-medium text-gray-700 mb-1">
              Date Range
            </label>
            <select
              id="dateRange"
              value={dateRange}
              onChange={(e) => {
                setDateRange(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-nhs-blue"
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="all">All Time</option>
            </select>
          </div>
          
          <button
            onClick={fetchAuditLogs}
            className="px-4 py-2 bg-nhs-blue text-white rounded-md hover:bg-nhs-dark-blue mt-6"
          >
            Refresh
          </button>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-800 rounded-md">
            <p className="font-medium">Error</p>
            <p>{error}</p>
          </div>
        )}
        
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    NHS Number
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-nhs-blue"></div>
                      </div>
                      <p className="mt-2 text-sm text-gray-500">Loading audit logs...</p>
                    </td>
                  </tr>
                ) : auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                      No audit logs found for the selected filters.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(log.timestamp)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getActionColor(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.nhsNumber || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.userId || 'System'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {log.details ? (
                          <details>
                            <summary className="cursor-pointer text-nhs-blue hover:underline">
                              View Details
                            </summary>
                            <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                              {JSON.stringify(JSON.parse(log.details), null, 2)}
                            </pre>
                          </details>
                        ) : (
                          'No details'
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200">
              <div className="flex-1 flex justify-between items-center">
                <button
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  disabled={page === 1}
                  className={`px-4 py-2 border rounded-md text-sm font-medium 
                    ${page === 1 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                >
                  Previous
                </button>
                <span className="text-sm text-gray-700">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={page === totalPages}
                  className={`px-4 py-2 border rounded-md text-sm font-medium 
                    ${page === totalPages 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-8 bg-nhs-pale-blue p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">About NHS API Monitoring</h2>
          <p className="mb-4">
            This page provides monitoring and audit capabilities for all NHS API interactions within the RXautomate system.
            It helps ensure compliance with NHS Information Governance requirements and provides visibility into API usage.
          </p>
          
          <h3 className="font-medium mt-4 mb-2">Common Actions:</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center">
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 mr-2">GET_PATIENT</span>
              <span>Patient demographic information retrieved from NHS PDS</span>
            </li>
            <li className="flex items-center">
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 mr-2">CHECK_EXEMPTION</span>
              <span>Patient exemption status checked via PECS</span>
            </li>
            <li className="flex items-center">
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 mr-2">VERIFY_ELIGIBILITY</span>
              <span>Patient eligibility verified against NHS BSA</span>
            </li>
            <li className="flex items-center">
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 mr-2">API_ERROR</span>
              <span>Error occurred during NHS API interaction</span>
            </li>
          </ul>
        </div>
      </div>
    </Layout>
  );
}
