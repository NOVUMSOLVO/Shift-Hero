"use client";

import React from 'react';
import Link from 'next/link';
import { useAuth } from '../../providers/auth-provider';

export default function AdminDashboardPage() {
  const { session } = useAuth();
  const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN';

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Welcome to the Admin Dashboard</h2>
        <p className="text-gray-600 mt-1">
          Manage your {isSuperAdmin ? 'organizations, ' : ''}pharmacies, users, and settings
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isSuperAdmin && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-5 bg-nhs-blue text-white">
              <h3 className="text-lg font-medium">Organizations</h3>
              <p className="text-sm mt-1 text-nhs-pale-blue">
                Manage pharmacy organizations
              </p>
            </div>
            <div className="p-5">
              <div className="flex justify-between items-center mb-4">
                <div className="text-2xl font-bold">12</div>
                <div className="text-sm text-green-600">+2 this month</div>
              </div>
              <Link
                href="/admin/organizations"
                className="block w-full text-center py-2 px-4 bg-nhs-blue text-white rounded-md hover:bg-nhs-dark-blue"
              >
                Manage Organizations
              </Link>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-5 bg-nhs-green text-white">
            <h3 className="text-lg font-medium">Pharmacies</h3>
            <p className="text-sm mt-1 text-green-100">
              Manage pharmacy locations
            </p>
          </div>
          <div className="p-5">
            <div className="flex justify-between items-center mb-4">
              <div className="text-2xl font-bold">48</div>
              <div className="text-sm text-green-600">+5 this month</div>
            </div>
            <Link
              href="/admin/pharmacies"
              className="block w-full text-center py-2 px-4 bg-nhs-green text-white rounded-md hover:bg-nhs-light-green"
            >
              Manage Pharmacies
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-5 bg-nhs-purple text-white">
            <h3 className="text-lg font-medium">Users</h3>
            <p className="text-sm mt-1 text-purple-200">
              Manage user accounts and permissions
            </p>
          </div>
          <div className="p-5">
            <div className="flex justify-between items-center mb-4">
              <div className="text-2xl font-bold">156</div>
              <div className="text-sm text-green-600">+12 this month</div>
            </div>
            <Link
              href="/admin/users"
              className="block w-full text-center py-2 px-4 bg-nhs-purple text-white rounded-md hover:bg-purple-800"
            >
              Manage Users
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-5 bg-nhs-orange text-white">
            <h3 className="text-lg font-medium">Billing</h3>
            <p className="text-sm mt-1 text-yellow-100">
              Manage subscriptions and payments
            </p>
          </div>
          <div className="p-5">
            <div className="flex justify-between items-center mb-4">
              <div className="text-2xl font-bold">£4,850</div>
              <div className="text-sm text-green-600">+£750 this month</div>
            </div>
            <Link
              href="/admin/billing"
              className="block w-full text-center py-2 px-4 bg-nhs-orange text-white rounded-md hover:bg-yellow-600"
            >
              Manage Billing
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-5 bg-nhs-dark-blue text-white">
            <h3 className="text-lg font-medium">Settings</h3>
            <p className="text-sm mt-1 text-blue-200">
              Configure system settings
            </p>
          </div>
          <div className="p-5">
            <div className="text-sm text-gray-600 mb-4">
              Configure global settings, integrations, and more
            </div>
            <Link
              href="/admin/settings"
              className="block w-full text-center py-2 px-4 bg-nhs-dark-blue text-white rounded-md hover:bg-blue-900"
            >
              Manage Settings
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-5 bg-nhs-blue text-white">
            <h3 className="text-lg font-medium">NHS API Monitor</h3>
            <p className="text-sm mt-1 text-blue-100">
              Monitor NHS API usage and compliance
            </p>
          </div>
          <div className="p-5">
            <div className="flex justify-between items-center mb-4">
              <div className="text-2xl font-bold">1,248</div>
              <div className="text-sm text-blue-600">API calls this month</div>
            </div>
            <Link
              href="/admin/nhs-api-monitor"
              className="block w-full text-center py-2 px-4 bg-nhs-blue text-white rounded-md hover:bg-nhs-dark-blue"
            >
              View API Monitor
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-medium text-gray-800 mb-4">Recent Activity</h3>
        <div className="space-y-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-nhs-blue flex items-center justify-center text-white">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-900">New pharmacy added</p>
              <p className="text-sm text-gray-500">Healthwise Pharmacy was added to Central Healthcare Group</p>
              <p className="text-xs text-gray-400 mt-1">2 hours ago</p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-nhs-green flex items-center justify-center text-white">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-900">New user registered</p>
              <p className="text-sm text-gray-500">Sarah Johnson joined as a pharmacist at Healthwise Pharmacy</p>
              <p className="text-xs text-gray-400 mt-1">5 hours ago</p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-nhs-orange flex items-center justify-center text-white">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-900">Subscription upgraded</p>
              <p className="text-sm text-gray-500">Central Healthcare Group upgraded to Premium plan</p>
              <p className="text-xs text-gray-400 mt-1">1 day ago</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
