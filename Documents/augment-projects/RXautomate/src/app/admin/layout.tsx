"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../providers/auth-provider';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN';

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile sidebar */}
      <div className="lg:hidden">
        <div className="fixed inset-0 z-40 flex">
          {/* Sidebar overlay */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-gray-600 bg-opacity-75"
              onClick={() => setSidebarOpen(false)}
            ></div>
          )}

          {/* Sidebar */}
          <div
            className={`fixed inset-y-0 left-0 flex flex-col w-64 max-w-xs bg-nhs-dark-blue transform transition-transform ease-in-out duration-300 ${
              sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            <div className="flex items-center justify-between h-16 px-4 bg-nhs-blue">
              <div className="text-xl font-bold text-white">RXautomate Admin</div>
              <button
                className="text-white"
                onClick={() => setSidebarOpen(false)}
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <nav className="px-2 py-4 space-y-1">
                <Link
                  href="/admin"
                  className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                    isActive('/admin') && !isActive('/admin/organizations') && !isActive('/admin/pharmacies')
                      ? 'bg-nhs-blue text-white'
                      : 'text-white hover:bg-nhs-blue'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <svg
                    className="w-5 h-5 mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                    />
                  </svg>
                  Dashboard
                </Link>
                {isSuperAdmin && (
                  <Link
                    href="/admin/organizations"
                    className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                      isActive('/admin/organizations')
                        ? 'bg-nhs-blue text-white'
                        : 'text-white hover:bg-nhs-blue'
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <svg
                      className="w-5 h-5 mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                    Organizations
                  </Link>
                )}
                <Link
                  href="/admin/pharmacies"
                  className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                    isActive('/admin/pharmacies')
                      ? 'bg-nhs-blue text-white'
                      : 'text-white hover:bg-nhs-blue'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <svg
                    className="w-5 h-5 mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                  Pharmacies
                </Link>
                <Link
                  href="/admin/users"
                  className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                    isActive('/admin/users')
                      ? 'bg-nhs-blue text-white'
                      : 'text-white hover:bg-nhs-blue'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <svg
                    className="w-5 h-5 mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                  Users
                </Link>
                <Link
                  href="/admin/billing"
                  className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                    isActive('/admin/billing')
                      ? 'bg-nhs-blue text-white'
                      : 'text-white hover:bg-nhs-blue'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <svg
                    className="w-5 h-5 mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                    />
                  </svg>
                  Billing
                </Link>
                <Link
                  href="/admin/settings"
                  className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                    isActive('/admin/settings')
                      ? 'bg-nhs-blue text-white'
                      : 'text-white hover:bg-nhs-blue'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <svg
                    className="w-5 h-5 mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  Settings
                </Link>

                <Link
                  href="/admin/nhs-api-monitor"
                  className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                    isActive('/admin/nhs-api-monitor')
                      ? 'bg-nhs-blue text-white'
                      : 'text-white hover:bg-nhs-blue'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <svg
                    className="w-5 h-5 mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  NHS API Monitor
                </Link>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:border-r lg:border-gray-200 lg:bg-nhs-dark-blue">
        <div className="flex items-center h-16 px-4 bg-nhs-blue">
          <div className="text-xl font-bold text-white">RXautomate Admin</div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <nav className="px-2 py-4 space-y-1">
            <Link
              href="/admin"
              className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                isActive('/admin') && !isActive('/admin/organizations') && !isActive('/admin/pharmacies')
                  ? 'bg-nhs-blue text-white'
                  : 'text-white hover:bg-nhs-blue'
              }`}
            >
              <svg
                className="w-5 h-5 mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              Dashboard
            </Link>
            {isSuperAdmin && (
              <Link
                href="/admin/organizations"
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                  isActive('/admin/organizations')
                    ? 'bg-nhs-blue text-white'
                    : 'text-white hover:bg-nhs-blue'
                }`}
              >
                <svg
                  className="w-5 h-5 mr-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
                Organizations
              </Link>
            )}
            <Link
              href="/admin/pharmacies"
              className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                isActive('/admin/pharmacies')
                  ? 'bg-nhs-blue text-white'
                  : 'text-white hover:bg-nhs-blue'
              }`}
            >
              <svg
                className="w-5 h-5 mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
              Pharmacies
            </Link>
            <Link
              href="/admin/users"
              className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                isActive('/admin/users')
                  ? 'bg-nhs-blue text-white'
                  : 'text-white hover:bg-nhs-blue'
              }`}
            >
              <svg
                className="w-5 h-5 mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
              Users
            </Link>
            <Link
              href="/admin/billing"
              className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                isActive('/admin/billing')
                  ? 'bg-nhs-blue text-white'
                  : 'text-white hover:bg-nhs-blue'
              }`}
            >
              <svg
                className="w-5 h-5 mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
              Billing
            </Link>
            <Link
              href="/admin/settings"
              className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                isActive('/admin/settings')
                  ? 'bg-nhs-blue text-white'
                  : 'text-white hover:bg-nhs-blue'
              }`}
            >
              <svg
                className="w-5 h-5 mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              Settings
            </Link>

            <Link
              href="/admin/nhs-api-monitor"
              className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                isActive('/admin/nhs-api-monitor')
                  ? 'bg-nhs-blue text-white'
                  : 'text-white hover:bg-nhs-blue'
              }`}
            >
              <svg
                className="w-5 h-5 mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              NHS API Monitor
            </Link>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        <div className="sticky top-0 z-10 flex items-center justify-between h-16 px-4 bg-white border-b border-gray-200 lg:px-6">
          {/* Mobile menu button */}
          <button
            className="text-gray-500 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          {/* Page title */}
          <h1 className="text-lg font-medium text-gray-900">
            {pathname === '/admin'
              ? 'Dashboard'
              : pathname.includes('/admin/organizations')
              ? 'Organizations'
              : pathname.includes('/admin/pharmacies')
              ? 'Pharmacies'
              : pathname.includes('/admin/users')
              ? 'Users'
              : pathname.includes('/admin/billing')
              ? 'Billing'
              : pathname.includes('/admin/settings')
              ? 'Settings'
              : pathname.includes('/admin/nhs-api-monitor')
              ? 'NHS API Monitor'
              : 'Admin'}
          </h1>

          {/* User info */}
          <div className="flex items-center">
            <Link href="/" className="text-sm text-nhs-blue hover:underline">
              Exit Admin
            </Link>
          </div>
        </div>

        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
