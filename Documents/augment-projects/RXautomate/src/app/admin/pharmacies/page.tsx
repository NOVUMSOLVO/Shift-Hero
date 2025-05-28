"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../providers/auth-provider';

// Mock data for pharmacies
const mockPharmacies = [
  {
    id: '1',
    name: 'Central Pharmacy',
    slug: 'central',
    address: '123 High Street, London',
    postcode: 'W1A 1AA',
    phoneNumber: '020 1234 5678',
    email: 'central@centralhealthcare.co.uk',
    nhsContractNumber: 'FW123',
    organizationId: '1',
    organizationName: 'Central Healthcare Group',
    isActive: true,
    userCount: 8,
    createdAt: new Date('2022-03-15'),
  },
  {
    id: '2',
    name: 'Northside Pharmacy',
    slug: 'northside',
    address: '45 North Road, Manchester',
    postcode: 'M1 1AA',
    phoneNumber: '0161 987 6543',
    email: 'northside@northsidepharmacy.co.uk',
    nhsContractNumber: 'FW456',
    organizationId: '2',
    organizationName: 'Northside Pharmacy Network',
    isActive: true,
    userCount: 5,
    createdAt: new Date('2022-05-20'),
  },
  {
    id: '3',
    name: 'Southcoast Pharmacy',
    slug: 'southcoast',
    address: '78 Beach Road, Brighton',
    postcode: 'BN1 1AA',
    phoneNumber: '01273 123 456',
    email: 'southcoast@southcoastchemists.co.uk',
    nhsContractNumber: 'FW789',
    organizationId: '3',
    organizationName: 'Southcoast Chemists',
    isActive: true,
    userCount: 4,
    createdAt: new Date('2022-07-10'),
  },
  {
    id: '4',
    name: 'Eastside Health Centre',
    slug: 'eastside',
    address: '12 East Street, Leeds',
    postcode: 'LS1 1AA',
    phoneNumber: '0113 123 4567',
    email: 'eastside@eastsidehealth.co.uk',
    nhsContractNumber: 'FW101',
    organizationId: '4',
    organizationName: 'Eastside Health Solutions',
    isActive: false,
    userCount: 0,
    createdAt: new Date('2022-09-05'),
  },
  {
    id: '5',
    name: 'Westway Pharmacy',
    slug: 'westway',
    address: '34 West Road, Bristol',
    postcode: 'BS1 1AA',
    phoneNumber: '0117 987 6543',
    email: 'westway@westwaygroup.co.uk',
    nhsContractNumber: 'FW202',
    organizationId: '5',
    organizationName: 'Westway Pharmacy Group',
    isActive: true,
    userCount: 6,
    createdAt: new Date('2022-11-15'),
  },
];

// Mock data for organizations
const mockOrganizations = [
  { id: '1', name: 'Central Healthcare Group' },
  { id: '2', name: 'Northside Pharmacy Network' },
  { id: '3', name: 'Southcoast Chemists' },
  { id: '4', name: 'Eastside Health Solutions' },
  { id: '5', name: 'Westway Pharmacy Group' },
];

export default function PharmaciesPage() {
  const { session } = useAuth();
  const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN';
  const [pharmacies, setPharmacies] = useState(mockPharmacies);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOrg, setFilterOrg] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPharmacy, setNewPharmacy] = useState({
    name: '',
    slug: '',
    address: '',
    postcode: '',
    phoneNumber: '',
    email: '',
    nhsContractNumber: '',
    organizationId: isSuperAdmin ? '' : (session?.user?.organizationId || ''),
    isActive: true,
  });

  // Filter pharmacies based on search term, organization, and status
  const filteredPharmacies = pharmacies.filter((pharmacy) => {
    // If not super admin, only show pharmacies from user's organization
    if (!isSuperAdmin && pharmacy.organizationId !== session?.user?.organizationId) {
      return false;
    }

    const matchesSearch =
      pharmacy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pharmacy.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pharmacy.postcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pharmacy.nhsContractNumber?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesOrg =
      filterOrg === 'ALL' || pharmacy.organizationId === filterOrg;

    const matchesStatus =
      filterStatus === 'ALL' ||
      (filterStatus === 'ACTIVE' && pharmacy.isActive) ||
      (filterStatus === 'INACTIVE' && !pharmacy.isActive);

    return matchesSearch && matchesOrg && matchesStatus;
  });

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    // Auto-generate slug from name if slug field is empty
    if (name === 'name' && !newPharmacy.slug) {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      setNewPharmacy({
        ...newPharmacy,
        name: value,
        slug,
      });
    } else if (name === 'isActive') {
      setNewPharmacy({
        ...newPharmacy,
        isActive: value === 'true',
      });
    } else {
      setNewPharmacy({
        ...newPharmacy,
        [name]: value,
      });
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Find organization name
    const organization = mockOrganizations.find(
      (org) => org.id === newPharmacy.organizationId
    );

    // Create new pharmacy
    const newPharmacyEntry = {
      id: `${pharmacies.length + 1}`,
      ...newPharmacy,
      organizationName: organization?.name || '',
      userCount: 0,
      createdAt: new Date(),
    };

    // Add to pharmacies list
    setPharmacies([...pharmacies, newPharmacyEntry]);

    // Reset form and close modal
    setNewPharmacy({
      name: '',
      slug: '',
      address: '',
      postcode: '',
      phoneNumber: '',
      email: '',
      nhsContractNumber: '',
      organizationId: isSuperAdmin ? '' : (session?.user?.organizationId || ''),
      isActive: true,
    });
    setShowAddModal(false);
  };

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Pharmacies</h2>
          <p className="text-gray-600 mt-1">
            Manage pharmacy locations and settings
          </p>
        </div>
        <button
          className="mt-4 sm:mt-0 px-4 py-2 bg-nhs-blue text-white rounded-md hover:bg-nhs-dark-blue"
          onClick={() => setShowAddModal(true)}
        >
          Add Pharmacy
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
                placeholder="Search pharmacies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {isSuperAdmin && (
              <div className="flex-shrink-0">
                <select
                  className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-nhs-blue focus:border-nhs-blue sm:text-sm"
                  value={filterOrg}
                  onChange={(e) => setFilterOrg(e.target.value)}
                >
                  <option value="ALL">All Organizations</option>
                  {mockOrganizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex-shrink-0">
              <select
                className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-nhs-blue focus:border-nhs-blue sm:text-sm"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pharmacy
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                {isSuperAdmin && (
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Organization
                  </th>
                )}
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  NHS Contract
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
              {filteredPharmacies.map((pharmacy) => (
                <tr key={pharmacy.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-nhs-green flex items-center justify-center text-white">
                        {pharmacy.name.charAt(0)}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{pharmacy.name}</div>
                        <div className="text-sm text-gray-500">{pharmacy.address}</div>
                        <div className="text-sm text-gray-500">{pharmacy.postcode}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{pharmacy.email}</div>
                    <div className="text-sm text-gray-500">{pharmacy.phoneNumber}</div>
                  </td>
                  {isSuperAdmin && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{pharmacy.organizationName}</div>
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{pharmacy.nhsContractNumber || 'N/A'}</div>
                    <div className="text-sm text-gray-500">{pharmacy.userCount} users</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      pharmacy.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {pharmacy.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link href={`/admin/pharmacies/${pharmacy.id}`} className="text-nhs-blue hover:text-nhs-dark-blue mr-4">
                      View
                    </Link>
                    <Link href={`/admin/pharmacies/${pharmacy.id}/edit`} className="text-nhs-blue hover:text-nhs-dark-blue">
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredPharmacies.length === 0 && (
          <div className="px-6 py-4 text-center text-gray-500">
            No pharmacies found matching your search criteria.
          </div>
        )}
      </div>

      {/* Add Pharmacy Modal */}
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
                      <h3 className="text-lg leading-6 font-medium text-gray-900">Add New Pharmacy</h3>
                      <div className="mt-4 space-y-4">
                        <div>
                          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                            Pharmacy Name
                          </label>
                          <input
                            type="text"
                            name="name"
                            id="name"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-nhs-blue focus:border-nhs-blue sm:text-sm"
                            value={newPharmacy.name}
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
                            value={newPharmacy.slug}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                        <div>
                          <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                            Address
                          </label>
                          <input
                            type="text"
                            name="address"
                            id="address"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-nhs-blue focus:border-nhs-blue sm:text-sm"
                            value={newPharmacy.address}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                        <div>
                          <label htmlFor="postcode" className="block text-sm font-medium text-gray-700">
                            Postcode
                          </label>
                          <input
                            type="text"
                            name="postcode"
                            id="postcode"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-nhs-blue focus:border-nhs-blue sm:text-sm"
                            value={newPharmacy.postcode}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                        <div>
                          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                            Email
                          </label>
                          <input
                            type="email"
                            name="email"
                            id="email"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-nhs-blue focus:border-nhs-blue sm:text-sm"
                            value={newPharmacy.email}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                        <div>
                          <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                            Phone Number
                          </label>
                          <input
                            type="text"
                            name="phoneNumber"
                            id="phoneNumber"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-nhs-blue focus:border-nhs-blue sm:text-sm"
                            value={newPharmacy.phoneNumber}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                        <div>
                          <label htmlFor="nhsContractNumber" className="block text-sm font-medium text-gray-700">
                            NHS Contract Number
                          </label>
                          <input
                            type="text"
                            name="nhsContractNumber"
                            id="nhsContractNumber"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-nhs-blue focus:border-nhs-blue sm:text-sm"
                            value={newPharmacy.nhsContractNumber}
                            onChange={handleInputChange}
                          />
                        </div>
                        {isSuperAdmin && (
                          <div>
                            <label htmlFor="organizationId" className="block text-sm font-medium text-gray-700">
                              Organization
                            </label>
                            <select
                              name="organizationId"
                              id="organizationId"
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-nhs-blue focus:border-nhs-blue sm:text-sm"
                              value={newPharmacy.organizationId}
                              onChange={handleInputChange}
                              required
                            >
                              <option value="">Select an organization</option>
                              {mockOrganizations.map((org) => (
                                <option key={org.id} value={org.id}>
                                  {org.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                        <div>
                          <label htmlFor="isActive" className="block text-sm font-medium text-gray-700">
                            Status
                          </label>
                          <select
                            name="isActive"
                            id="isActive"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-nhs-blue focus:border-nhs-blue sm:text-sm"
                            value={newPharmacy.isActive.toString()}
                            onChange={handleInputChange}
                          >
                            <option value="true">Active</option>
                            <option value="false">Inactive</option>
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
                    Add Pharmacy
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
