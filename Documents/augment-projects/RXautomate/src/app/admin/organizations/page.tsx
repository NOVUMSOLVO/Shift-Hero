"use client";

import React, { useState } from 'react';
import Link from 'next/link';

// Mock data for organizations
const mockOrganizations = [
  {
    id: '1',
    name: 'Central Healthcare Group',
    slug: 'central-healthcare',
    contactEmail: 'admin@centralhealthcare.co.uk',
    contactPhone: '020 7123 4567',
    pharmacyCount: 12,
    userCount: 45,
    subscriptionTier: 'PREMIUM',
    subscriptionStatus: 'ACTIVE',
    subscriptionExpiry: new Date('2024-12-31'),
    createdAt: new Date('2022-01-15'),
  },
  {
    id: '2',
    name: 'Northside Pharmacy Network',
    slug: 'northside-pharmacy',
    contactEmail: 'info@northsidepharmacy.co.uk',
    contactPhone: '0161 987 6543',
    pharmacyCount: 8,
    userCount: 32,
    subscriptionTier: 'STANDARD',
    subscriptionStatus: 'ACTIVE',
    subscriptionExpiry: new Date('2024-09-15'),
    createdAt: new Date('2022-03-22'),
  },
  {
    id: '3',
    name: 'Southcoast Chemists',
    slug: 'southcoast-chemists',
    contactEmail: 'admin@southcoastchemists.co.uk',
    contactPhone: '01273 456 789',
    pharmacyCount: 5,
    userCount: 18,
    subscriptionTier: 'BASIC',
    subscriptionStatus: 'TRIAL',
    subscriptionExpiry: new Date('2023-08-10'),
    createdAt: new Date('2023-07-10'),
  },
  {
    id: '4',
    name: 'Eastside Health Solutions',
    slug: 'eastside-health',
    contactEmail: 'contact@eastsidehealth.co.uk',
    contactPhone: '0113 987 6543',
    pharmacyCount: 3,
    userCount: 12,
    subscriptionTier: 'STANDARD',
    subscriptionStatus: 'PAST_DUE',
    subscriptionExpiry: new Date('2023-07-31'),
    createdAt: new Date('2022-11-05'),
  },
  {
    id: '5',
    name: 'Westway Pharmacy Group',
    slug: 'westway-pharmacy',
    contactEmail: 'info@westwaygroup.co.uk',
    contactPhone: '0117 345 6789',
    pharmacyCount: 7,
    userCount: 25,
    subscriptionTier: 'ENTERPRISE',
    subscriptionStatus: 'ACTIVE',
    subscriptionExpiry: new Date('2025-01-15'),
    createdAt: new Date('2021-09-18'),
  },
];

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState(mockOrganizations);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newOrg, setNewOrg] = useState({
    name: '',
    slug: '',
    contactEmail: '',
    contactPhone: '',
    subscriptionTier: 'BASIC',
  });

  // Filter organizations based on search term and status
  const filteredOrganizations = organizations.filter((org) => {
    const matchesSearch =
      org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.contactEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.slug.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus =
      filterStatus === 'ALL' || org.subscriptionStatus === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Auto-generate slug from name if slug field is empty
    if (name === 'name' && !newOrg.slug) {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      
      setNewOrg({
        ...newOrg,
        name: value,
        slug,
      });
    } else {
      setNewOrg({
        ...newOrg,
        [name]: value,
      });
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create new organization
    const newOrganization = {
      id: `${organizations.length + 1}`,
      ...newOrg,
      pharmacyCount: 0,
      userCount: 0,
      subscriptionStatus: 'TRIAL',
      subscriptionExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      createdAt: new Date(),
    };
    
    // Add to organizations list
    setOrganizations([...organizations, newOrganization]);
    
    // Reset form and close modal
    setNewOrg({
      name: '',
      slug: '',
      contactEmail: '',
      contactPhone: '',
      subscriptionTier: 'BASIC',
    });
    setShowAddModal(false);
  };

  // Get subscription tier badge color
  const getSubscriptionBadgeColor = (tier: string) => {
    switch (tier) {
      case 'BASIC':
        return 'bg-gray-100 text-gray-800';
      case 'STANDARD':
        return 'bg-blue-100 text-blue-800';
      case 'PREMIUM':
        return 'bg-purple-100 text-purple-800';
      case 'ENTERPRISE':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get subscription status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'TRIAL':
        return 'bg-blue-100 text-blue-800';
      case 'PAST_DUE':
        return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      case 'EXPIRED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Organizations</h2>
          <p className="text-gray-600 mt-1">
            Manage pharmacy organizations and their subscriptions
          </p>
        </div>
        <button
          className="mt-4 sm:mt-0 px-4 py-2 bg-nhs-blue text-white rounded-md hover:bg-nhs-dark-blue"
          onClick={() => setShowAddModal(true)}
        >
          Add Organization
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4 border-b">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-nhs-blue focus:border-nhs-blue sm:text-sm"
                placeholder="Search organizations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex-shrink-0">
              <select
                className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-nhs-blue focus:border-nhs-blue sm:text-sm"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="TRIAL">Trial</option>
                <option value="PAST_DUE">Past Due</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="EXPIRED">Expired</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Organization
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pharmacies
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subscription
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrganizations.map((org) => (
                <tr key={org.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-nhs-blue flex items-center justify-center text-white">
                        {org.name.charAt(0)}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{org.name}</div>
                        <div className="text-sm text-gray-500">{org.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{org.contactEmail}</div>
                    <div className="text-sm text-gray-500">{org.contactPhone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{org.pharmacyCount} pharmacies</div>
                    <div className="text-sm text-gray-500">{org.userCount} users</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getSubscriptionBadgeColor(org.subscriptionTier)}`}>
                      {org.subscriptionTier}
                    </span>
                    <div className="text-sm text-gray-500 mt-1">
                      Expires: {org.subscriptionExpiry.toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(org.subscriptionStatus)}`}>
                      {org.subscriptionStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link href={`/admin/organizations/${org.id}`} className="text-nhs-blue hover:text-nhs-dark-blue mr-4">
                      View
                    </Link>
                    <Link href={`/admin/organizations/${org.id}/edit`} className="text-nhs-blue hover:text-nhs-dark-blue">
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredOrganizations.length === 0 && (
          <div className="px-6 py-4 text-center text-gray-500">
            No organizations found matching your search criteria.
          </div>
        )}
      </div>

      {/* Add Organization Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">Add New Organization</h3>
                      <div className="mt-4 space-y-4">
                        <div>
                          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                            Organization Name
                          </label>
                          <input
                            type="text"
                            name="name"
                            id="name"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-nhs-blue focus:border-nhs-blue sm:text-sm"
                            value={newOrg.name}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                        <div>
                          <label htmlFor="slug" className="block text-sm font-medium text-gray-700">
                            Slug
                          </label>
                          <input
                            type="text"
                            name="slug"
                            id="slug"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-nhs-blue focus:border-nhs-blue sm:text-sm"
                            value={newOrg.slug}
                            onChange={handleInputChange}
                            required
                          />
                          <p className="mt-1 text-xs text-gray-500">
                            Used for URL: rxautomate.co.uk/{newOrg.slug}
                          </p>
                        </div>
                        <div>
                          <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700">
                            Contact Email
                          </label>
                          <input
                            type="email"
                            name="contactEmail"
                            id="contactEmail"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-nhs-blue focus:border-nhs-blue sm:text-sm"
                            value={newOrg.contactEmail}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                        <div>
                          <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700">
                            Contact Phone
                          </label>
                          <input
                            type="text"
                            name="contactPhone"
                            id="contactPhone"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-nhs-blue focus:border-nhs-blue sm:text-sm"
                            value={newOrg.contactPhone}
                            onChange={handleInputChange}
                          />
                        </div>
                        <div>
                          <label htmlFor="subscriptionTier" className="block text-sm font-medium text-gray-700">
                            Subscription Tier
                          </label>
                          <select
                            name="subscriptionTier"
                            id="subscriptionTier"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-nhs-blue focus:border-nhs-blue sm:text-sm"
                            value={newOrg.subscriptionTier}
                            onChange={handleInputChange}
                          >
                            <option value="BASIC">Basic</option>
                            <option value="STANDARD">Standard</option>
                            <option value="PREMIUM">Premium</option>
                            <option value="ENTERPRISE">Enterprise</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-nhs-blue text-base font-medium text-white hover:bg-nhs-dark-blue focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-nhs-blue sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Add Organization
                  </button>
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-nhs-blue sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={() => setShowAddModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
