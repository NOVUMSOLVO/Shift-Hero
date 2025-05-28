'use client';

import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { IntegrationType } from '@prisma/client';

// Mock data for demonstration
const mockIntegrations = [
  {
    id: '1',
    type: 'NHS_SPINE' as IntegrationType,
    name: 'NHS Spine',
    description: 'Connect to NHS Spine for patient demographics and exemption checking',
    isActive: true,
    apiKey: '********',
    lastSynced: new Date('2023-04-28'),
  },
  {
    id: '2',
    type: 'EPS' as IntegrationType,
    name: 'Electronic Prescription Service',
    description: 'Access EPS for prescription handling and processing',
    isActive: true,
    apiKey: '********',
    lastSynced: new Date('2023-04-28'),
  },
  {
    id: '3',
    type: 'PHARMACY_SYSTEM' as IntegrationType,
    name: 'PharmOutcomes',
    description: 'Integrate with PharmOutcomes for service recording and claims',
    isActive: true,
    apiKey: '********',
    lastSynced: new Date('2023-04-27'),
  },
  {
    id: '4',
    type: 'WHOLESALER' as IntegrationType,
    name: 'AAH Pharmaceuticals',
    description: 'Connect to AAH for automated ordering and stock management',
    isActive: false,
    apiKey: '',
    lastSynced: null,
  },
  {
    id: '5',
    type: 'PAYMENT_PROVIDER' as IntegrationType,
    name: 'Stripe',
    description: 'Process payments for private services and prescriptions',
    isActive: true,
    apiKey: '********',
    lastSynced: new Date('2023-04-25'),
  },
  {
    id: '6',
    type: 'SMS_PROVIDER' as IntegrationType,
    name: 'NHS Notify',
    description: 'Send SMS reminders and notifications to patients',
    isActive: true,
    apiKey: '********',
    lastSynced: new Date('2023-04-28'),
  },
];

// Mock pharmacy data
const mockPharmacy = {
  id: '1',
  name: 'Central Pharmacy',
  address: '123 High Street',
  postcode: 'AB12 3CD',
  phoneNumber: '01234 567890',
  email: 'info@centralpharmacy.co.uk',
  nhsContractNumber: 'FW123',
};

export default function SettingsPage() {
  const [integrations, setIntegrations] = useState(mockIntegrations);
  const [pharmacy, setPharmacy] = useState(mockPharmacy);
  const [activeTab, setActiveTab] = useState<'integrations' | 'pharmacy'>('integrations');
  const [editingIntegrationId, setEditingIntegrationId] = useState<string | null>(null);
  const [isEditingPharmacy, setIsEditingPharmacy] = useState(false);

  // Get integration being edited
  const editingIntegration = editingIntegrationId
    ? integrations.find(integration => integration.id === editingIntegrationId)
    : null;

  // Handle integration toggle
  const handleToggleIntegration = (id: string) => {
    setIntegrations(prev =>
      prev.map(integration =>
        integration.id === id ? { ...integration, isActive: !integration.isActive } : integration
      )
    );
  };

  // Handle edit integration
  const handleEditIntegration = (id: string) => {
    setEditingIntegrationId(id);
  };

  // Handle save integration
  const handleSaveIntegration = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would call the API
    setEditingIntegrationId(null);
    alert('Integration settings saved');
  };

  // Handle edit pharmacy
  const handleEditPharmacy = () => {
    setIsEditingPharmacy(true);
  };

  // Handle save pharmacy
  const handleSavePharmacy = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would call the API
    setIsEditingPharmacy(false);
    alert('Pharmacy details saved');
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="flex border-b">
            <button
              className={`px-4 py-3 font-medium ${
                activeTab === 'integrations'
                  ? 'text-nhs-blue border-b-2 border-nhs-blue'
                  : 'text-gray-600 hover:text-nhs-blue'
              }`}
              onClick={() => setActiveTab('integrations')}
            >
              Integrations
            </button>
            <button
              className={`px-4 py-3 font-medium ${
                activeTab === 'pharmacy'
                  ? 'text-nhs-blue border-b-2 border-nhs-blue'
                  : 'text-gray-600 hover:text-nhs-blue'
              }`}
              onClick={() => setActiveTab('pharmacy')}
            >
              Pharmacy Details
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'integrations' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">API Integrations</h2>
                
                {editingIntegration ? (
                  <form onSubmit={handleSaveIntegration} className="bg-gray-50 p-4 rounded-md mb-6">
                    <h3 className="font-medium mb-3">{editingIntegration.name} Settings</h3>
                    
                    <div className="space-y-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          API Key
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border rounded-md"
                          defaultValue={editingIntegration.apiKey}
                          placeholder="Enter API key"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          API Secret (if applicable)
                        </label>
                        <input
                          type="password"
                          className="w-full px-3 py-2 border rounded-md"
                          placeholder="Enter API secret"
                        />
                      </div>
                      
                      <div className="flex items-center">
                        <input
                          id="active-toggle"
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300 text-nhs-blue focus:ring-nhs-blue"
                          defaultChecked={editingIntegration.isActive}
                        />
                        <label htmlFor="active-toggle" className="ml-2 text-sm text-gray-700">
                          Integration Active
                        </label>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        type="submit"
                        className="px-4 py-2 bg-nhs-blue text-white rounded-md hover:bg-nhs-dark-blue"
                      >
                        Save Settings
                      </button>
                      <button
                        type="button"
                        className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                        onClick={() => setEditingIntegrationId(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {integrations.map((integration) => (
                      <div key={integration.id} className="border rounded-md p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium">{integration.name}</h3>
                          <div className="flex items-center">
                            <span className={`inline-block w-3 h-3 rounded-full mr-2 ${
                              integration.isActive ? 'bg-green-500' : 'bg-red-500'
                            }`}></span>
                            <span className="text-sm text-gray-600">
                              {integration.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-3">{integration.description}</p>
                        
                        {integration.lastSynced && (
                          <p className="text-xs text-gray-500 mb-3">
                            Last synced: {integration.lastSynced.toLocaleDateString()}
                          </p>
                        )}
                        
                        <div className="flex space-x-2">
                          <button
                            className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                            onClick={() => handleEditIntegration(integration.id)}
                          >
                            Edit Settings
                          </button>
                          <button
                            className={`px-3 py-1 text-sm rounded-md ${
                              integration.isActive
                                ? 'bg-red-100 text-red-800 hover:bg-red-200'
                                : 'bg-green-100 text-green-800 hover:bg-green-200'
                            }`}
                            onClick={() => handleToggleIntegration(integration.id)}
                          >
                            {integration.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'pharmacy' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Pharmacy Details</h2>
                  {!isEditingPharmacy && (
                    <button
                      className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                      onClick={handleEditPharmacy}
                    >
                      Edit Details
                    </button>
                  )}
                </div>
                
                {isEditingPharmacy ? (
                  <form onSubmit={handleSavePharmacy} className="bg-gray-50 p-4 rounded-md">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Pharmacy Name
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border rounded-md"
                          defaultValue={pharmacy.name}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          NHS Contract Number
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border rounded-md"
                          defaultValue={pharmacy.nhsContractNumber}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Address
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border rounded-md"
                          defaultValue={pharmacy.address}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Postcode
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border rounded-md"
                          defaultValue={pharmacy.postcode}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          className="w-full px-3 py-2 border rounded-md"
                          defaultValue={pharmacy.phoneNumber}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          className="w-full px-3 py-2 border rounded-md"
                          defaultValue={pharmacy.email}
                        />
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        type="submit"
                        className="px-4 py-2 bg-nhs-blue text-white rounded-md hover:bg-nhs-dark-blue"
                      >
                        Save Details
                      </button>
                      <button
                        type="button"
                        className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                        onClick={() => setIsEditingPharmacy(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="bg-gray-50 p-4 rounded-md">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Pharmacy Name</p>
                        <p className="font-medium">{pharmacy.name}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-600">NHS Contract Number</p>
                        <p className="font-medium">{pharmacy.nhsContractNumber}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-600">Address</p>
                        <p className="font-medium">{pharmacy.address}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-600">Postcode</p>
                        <p className="font-medium">{pharmacy.postcode}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-600">Phone Number</p>
                        <p className="font-medium">{pharmacy.phoneNumber}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="font-medium">{pharmacy.email}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
