"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../providers/auth-provider';
import Link from 'next/link';

// Mock data for demo purposes - will be replaced with real data from API
const mockPharmacies = [
  {
    id: "1",
    name: "Main Street Pharmacy",
    address: "123 Main Street, London, SW1A 1AA",
    role: "PHARMACY_MANAGER",
    nhsContractNumber: "FW123",
    lastAccessed: "2025-04-28T10:30:00Z"
  },
  {
    id: "2",
    name: "High Street Pharmacy",
    address: "456 High Street, Manchester, M1 1AA",
    role: "PHARMACIST",
    nhsContractNumber: "FW456",
    lastAccessed: "2025-04-25T14:15:00Z"
  },
  {
    id: "3",
    name: "Village Pharmacy",
    address: "789 Village Road, Birmingham, B1 1AA",
    role: "PHARMACY_STAFF",
    nhsContractNumber: "FW789",
    lastAccessed: null
  }
];

export default function SelectPharmacyPage() {
  const { userPharmacies, selectPharmacy } = useAuth();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use mock data if userPharmacies is empty (for demo purposes)
  const pharmacies = userPharmacies.length > 0 ? userPharmacies : mockPharmacies;

  // Filter pharmacies based on search term
  const filteredPharmacies = pharmacies.filter(pharmacy =>
    pharmacy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pharmacy.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (pharmacy.address && pharmacy.address.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSelectPharmacy = async (pharmacyId: string) => {
    try {
      setLoading(true);
      setError(null);
      await selectPharmacy(pharmacyId);
      router.push('/');
    } catch (error) {
      console.error('Error selecting pharmacy:', error);
      setError('Failed to select pharmacy. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="text-center text-3xl font-extrabold text-nhs-blue">
            Select a Pharmacy
          </h1>
          <p className="mt-2 text-center text-sm text-gray-600">
            Choose a pharmacy to access its prescriptions, inventory, and services
          </p>
        </div>

        <div className="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="search" className="sr-only">
              Search pharmacies
            </label>
            <div className="relative rounded-md shadow-sm">
              <input
                type="text"
                name="search"
                id="search"
                className="block w-full pr-10 sm:text-sm border-gray-300 rounded-md focus:ring-nhs-blue focus:border-nhs-blue"
                placeholder="Search pharmacies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredPharmacies.length > 0 ? (
              filteredPharmacies.map((pharmacy) => (
                <button
                  key={pharmacy.id}
                  className="w-full flex items-center p-4 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-nhs-blue"
                  onClick={() => handleSelectPharmacy(pharmacy.id)}
                  disabled={loading}
                >
                  <div className="flex-1 text-left">
                    <h3 className="text-lg font-medium text-gray-900">{pharmacy.name}</h3>
                    <div className="mt-1">
                      <p className="text-sm text-gray-500">Role: {pharmacy.role}</p>
                      {pharmacy.address && (
                        <p className="text-sm text-gray-500 mt-1">{pharmacy.address}</p>
                      )}
                      {pharmacy.nhsContractNumber && (
                        <p className="text-sm text-gray-500 mt-1">NHS Contract: {pharmacy.nhsContractNumber}</p>
                      )}
                      {pharmacy.lastAccessed && (
                        <p className="text-sm text-gray-500 mt-1">
                          Last accessed: {new Date(pharmacy.lastAccessed).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  {loading ? (
                    <svg className="animate-spin h-5 w-5 text-nhs-blue" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg
                      className="h-5 w-5 text-gray-400"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              ))
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500">No pharmacies found matching your search.</p>
              </div>
            )}
          </div>

          <div className="mt-6 text-center text-sm text-gray-500">
            <p>
              If you need access to additional pharmacies, please contact your organization administrator.
            </p>
            <div className="mt-4">
              <Link href="/auth/login" className="font-medium text-nhs-blue hover:text-nhs-dark-blue">
                Return to login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
