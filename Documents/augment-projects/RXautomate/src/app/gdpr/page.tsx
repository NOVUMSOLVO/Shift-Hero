'use client';

import React, { useState } from 'react';
import Layout from '@/components/Layout';
import ConsentForm from '@/components/ConsentForm';
import { ConsentType } from '@prisma/client';

// Mock data for demonstration
const mockPatients = [
  {
    id: '1',
    name: 'John Smith',
    nhsNumber: '1234567890',
    dateOfBirth: new Date('1980-05-15'),
    consents: [
      {
        type: 'MARKETING' as ConsentType,
        given: true,
        date: new Date('2023-01-10'),
        expiry: new Date('2025-01-10'),
      },
      {
        type: 'REMINDER' as ConsentType,
        given: true,
        date: new Date('2023-01-10'),
        expiry: new Date('2025-01-10'),
      },
      {
        type: 'DATA_SHARING' as ConsentType,
        given: false,
        date: null,
        expiry: null,
      },
      {
        type: 'VACCINATION' as ConsentType,
        given: true,
        date: new Date('2023-01-10'),
        expiry: new Date('2025-01-10'),
      },
    ],
  },
  {
    id: '2',
    name: 'Emma Johnson',
    nhsNumber: '0987654321',
    dateOfBirth: new Date('1975-08-22'),
    consents: [
      {
        type: 'MARKETING' as ConsentType,
        given: false,
        date: null,
        expiry: null,
      },
      {
        type: 'REMINDER' as ConsentType,
        given: true,
        date: new Date('2022-11-05'),
        expiry: new Date('2024-11-05'),
      },
      {
        type: 'DATA_SHARING' as ConsentType,
        given: true,
        date: new Date('2022-11-05'),
        expiry: new Date('2024-11-05'),
      },
      {
        type: 'VACCINATION' as ConsentType,
        given: false,
        date: null,
        expiry: null,
      },
    ],
  },
  {
    id: '3',
    name: 'David Williams',
    nhsNumber: '5678901234',
    dateOfBirth: new Date('1990-03-10'),
    consents: [
      {
        type: 'MARKETING' as ConsentType,
        given: true,
        date: new Date('2023-02-15'),
        expiry: new Date('2025-02-15'),
      },
      {
        type: 'REMINDER' as ConsentType,
        given: true,
        date: new Date('2023-02-15'),
        expiry: new Date('2025-02-15'),
      },
      {
        type: 'DATA_SHARING' as ConsentType,
        given: true,
        date: new Date('2023-02-15'),
        expiry: new Date('2025-02-15'),
      },
      {
        type: 'VACCINATION' as ConsentType,
        given: true,
        date: new Date('2023-02-15'),
        expiry: new Date('2025-02-15'),
      },
    ],
  },
];

export default function GDPRPage() {
  const [patients, setPatients] = useState(mockPatients);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Get selected patient
  const selectedPatient = selectedPatientId
    ? patients.find(patient => patient.id === selectedPatientId)
    : null;

  // Handle patient selection
  const handlePatientSelect = (id: string) => {
    setSelectedPatientId(id);
  };

  // Handle consent update
  const handleSaveConsent = (patientId: string, consentType: ConsentType, given: boolean, expiryDate: Date | null) => {
    setPatients(prev =>
      prev.map(patient => {
        if (patient.id === patientId) {
          const updatedConsents = patient.consents.map(consent => {
            if (consent.type === consentType) {
              return {
                ...consent,
                given,
                date: given ? new Date() : null,
                expiry: expiryDate,
              };
            }
            return consent;
          });
          
          return {
            ...patient,
            consents: updatedConsents,
          };
        }
        return patient;
      })
    );
    
    alert(`Consent updated for ${selectedPatient?.name}`);
  };

  // Filter patients by search term
  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.nhsNumber.includes(searchTerm)
  );

  // Get consent status label
  const getConsentStatusLabel = (given: boolean) => {
    return given ? 'Consented' : 'Not Consented';
  };

  // Get consent type label
  const getConsentTypeLabel = (type: ConsentType) => {
    switch (type) {
      case 'MARKETING':
        return 'Marketing';
      case 'REMINDER':
        return 'Reminders';
      case 'DATA_SHARING':
        return 'Data Sharing';
      case 'VACCINATION':
        return 'Vaccinations';
      default:
        return type;
    }
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">GDPR Compliance</h1>
          <button className="px-4 py-2 bg-nhs-blue text-white rounded-md hover:bg-nhs-dark-blue">
            Export Consent Report
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-4 mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search Patients
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-md"
                placeholder="Name or NHS number"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <h2 className="bg-gray-50 px-4 py-2 font-medium">Patient List</h2>
              {filteredPatients.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {filteredPatients.map((patient) => (
                    <li
                      key={patient.id}
                      className={`p-4 cursor-pointer hover:bg-gray-50 ${
                        selectedPatientId === patient.id ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => handlePatientSelect(patient.id)}
                    >
                      <h3 className="font-medium">{patient.name}</h3>
                      <p className="text-sm text-gray-600">NHS: {patient.nhsNumber}</p>
                      <p className="text-sm text-gray-600">
                        DOB: {patient.dateOfBirth.toLocaleDateString()}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {patient.consents.map((consent, index) => (
                          <span
                            key={index}
                            className={`px-2 py-0.5 rounded-full text-xs ${
                              consent.given
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {getConsentTypeLabel(consent.type)}: {getConsentStatusLabel(consent.given)}
                          </span>
                        ))}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-6 text-center">
                  <p className="text-gray-500">No patients match your search</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="lg:col-span-2">
            {selectedPatient ? (
              <ConsentForm
                patientId={selectedPatient.id}
                patientName={selectedPatient.name}
                existingConsents={selectedPatient.consents}
                onSaveConsent={handleSaveConsent}
              />
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <p className="text-gray-500">Select a patient to manage their consent preferences</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
