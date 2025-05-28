'use client';

import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import EPSPrescriptionList from '@/components/prescriptions/EPSPrescriptionList';
import { PrescriptionStatus, PrescriptionType } from '@prisma/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Mock data for demonstration
const mockPrescriptions = [
  {
    id: '1',
    prescriptionNumber: 'NHS-12345678',
    prescriptionType: 'NHS' as PrescriptionType,
    issuedDate: new Date('2023-04-15'),
    expiryDate: new Date('2023-07-15'),
    status: 'PENDING' as PrescriptionStatus,
    patientName: 'John Smith',
    items: [
      {
        medicationName: 'Amoxicillin 500mg capsules',
        dosage: '1 capsule three times a day',
        quantity: 21,
        instructions: 'Take with food',
      },
      {
        medicationName: 'Paracetamol 500mg tablets',
        dosage: '2 tablets up to four times a day',
        quantity: 32,
        instructions: 'Take as needed for pain',
      },
    ],
  },
  {
    id: '2',
    prescriptionNumber: 'PVT-87654321',
    prescriptionType: 'PRIVATE' as PrescriptionType,
    issuedDate: new Date('2023-04-18'),
    expiryDate: new Date('2023-05-18'),
    status: 'PROCESSING' as PrescriptionStatus,
    patientName: 'Emma Johnson',
    items: [
      {
        medicationName: 'Viagra 50mg tablets',
        dosage: '1 tablet as needed',
        quantity: 4,
        instructions: 'Take 1 hour before sexual activity',
      },
    ],
  },
  {
    id: '3',
    prescriptionNumber: 'RPT-45678912',
    prescriptionType: 'REPEAT' as PrescriptionType,
    issuedDate: new Date('2023-04-10'),
    expiryDate: new Date('2023-10-10'),
    status: 'DISPENSED' as PrescriptionStatus,
    patientName: 'David Williams',
    items: [
      {
        medicationName: 'Lisinopril 10mg tablets',
        dosage: '1 tablet once daily',
        quantity: 28,
        instructions: 'Take in the morning',
      },
      {
        medicationName: 'Atorvastatin 20mg tablets',
        dosage: '1 tablet once daily',
        quantity: 28,
        instructions: 'Take in the evening',
      },
    ],
  },
];

export default function PrescriptionsPage() {
  const { data: session, status } = useSession();
  const [prescriptions, setPrescriptions] = useState(mockPrescriptions);
  const [filterStatus, setFilterStatus] = useState<PrescriptionStatus | 'ALL'>('ALL');
  const [filterType, setFilterType] = useState<PrescriptionType | 'ALL'>('ALL');
  const [pharmacyOdsCode, setPharmacyOdsCode] = useState<string>('F1234'); // Default for testing

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/auth/signin?callbackUrl=/prescriptions');
    }
  }, [status]);

  // Fetch pharmacy ODS code
  useEffect(() => {
    if (session?.user?.id) {
      // In a real app, this would fetch the user's pharmacy ODS code from the API
      // For now, we'll use a default value
      setPharmacyOdsCode('F1234');
    }
  }, [session]);

  // Handle status change
  const handleStatusChange = (id: string, status: PrescriptionStatus) => {
    setPrescriptions(prev =>
      prev.map(prescription =>
        prescription.id === id ? { ...prescription, status } : prescription
      )
    );
  };

  // Handle send reminder
  const handleSendReminder = async (id: string) => {
    const prescription = prescriptions.find(p => p.id === id);
    if (!prescription) return;

    try {
      // In a real app, this would call the API
      console.log(`Sending reminder for prescription ${id}`);
      alert(`Reminder sent for ${prescription.patientName}'s prescription`);
    } catch (error) {
      console.error('Error sending reminder:', error);
      alert('Failed to send reminder');
    }
  };

  // Filter prescriptions
  const filteredPrescriptions = prescriptions.filter(prescription => {
    const statusMatch = filterStatus === 'ALL' || prescription.status === filterStatus;
    const typeMatch = filterType === 'ALL' || prescription.prescriptionType === filterType;
    return statusMatch && typeMatch;
  });

  // Handle checking for new EPS prescriptions
  const handleCheckForNewPrescriptions = () => {
    alert('Checking for new EPS prescriptions...');
    // In a real app, this would refresh the EPS prescription list
    window.location.reload();
  };

  if (status === 'loading') {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-nhs-blue"></div>
          <span className="ml-3">Loading...</span>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Prescriptions</h1>
          <div className="flex space-x-3">
            <a
              href="/prescriptions/check-status"
              className="px-4 py-2 bg-nhs-green text-white rounded-md hover:bg-nhs-dark-green"
            >
              Check Patient Status
            </a>
            <button
              className="px-4 py-2 bg-nhs-blue text-white rounded-md hover:bg-nhs-dark-blue"
              onClick={handleCheckForNewPrescriptions}
            >
              Check for New Prescriptions
            </button>
          </div>
        </div>

        <Tabs defaultValue="local" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="local">Local Prescriptions</TabsTrigger>
            <TabsTrigger value="eps">EPS Prescriptions</TabsTrigger>
          </TabsList>

          <TabsContent value="local">
            <div className="bg-white p-4 rounded-lg shadow-md mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Filter by Status
                  </label>
                  <select
                    className="w-full px-3 py-2 border rounded-md"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as PrescriptionStatus | 'ALL')}
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="PENDING">Pending</option>
                    <option value="PROCESSING">Processing</option>
                    <option value="DISPENSED">Dispensed</option>
                    <option value="COLLECTED">Collected</option>
                    <option value="CANCELLED">Cancelled</option>
                    <option value="EXPIRED">Expired</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Filter by Type
                  </label>
                  <select
                    className="w-full px-3 py-2 border rounded-md"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as PrescriptionType | 'ALL')}
                  >
                    <option value="ALL">All Types</option>
                    <option value="NHS">NHS</option>
                    <option value="PRIVATE">Private</option>
                    <option value="REPEAT">Repeat</option>
                    <option value="EMERGENCY">Emergency</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {filteredPrescriptions.length > 0 ? (
                filteredPrescriptions.map((prescription) => (
                  <Card key={prescription.id} className="mb-4">
                    <CardContent className="p-6">
                      <div className="flex flex-wrap justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold">{prescription.patientName}</h3>
                          <p className="text-sm text-gray-600">
                            Prescription: {prescription.prescriptionNumber || 'No reference'}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Badge variant="outline" className="bg-blue-100 text-blue-800">
                            {prescription.prescriptionType}
                          </Badge>
                          <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                            {prescription.status}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                        <div>
                          <p className="text-gray-600">Issued Date:</p>
                          <p>{prescription.issuedDate.toLocaleDateString('en-GB')}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Expiry Date:</p>
                          <p>{prescription.expiryDate ? prescription.expiryDate.toLocaleDateString('en-GB') : 'N/A'}</p>
                        </div>
                      </div>

                      <div className="mb-4">
                        <h4 className="font-medium mb-2">Medications</h4>
                        <ul className="space-y-2">
                          {prescription.items.map((item, index) => (
                            <li key={index} className="border-b pb-2">
                              <p className="font-medium">{item.medicationName}</p>
                              <p className="text-sm text-gray-600">
                                {item.dosage} - Qty: {item.quantity}
                              </p>
                              <p className="text-sm italic">{item.instructions}</p>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="flex flex-wrap gap-2 mt-4">
                        <select
                          className="px-3 py-2 border rounded-md text-sm"
                          value={prescription.status}
                          onChange={(e) => handleStatusChange(prescription.id, e.target.value as PrescriptionStatus)}
                        >
                          <option value="PENDING">Pending</option>
                          <option value="PROCESSING">Processing</option>
                          <option value="DISPENSED">Dispensed</option>
                          <option value="COLLECTED">Collected</option>
                          <option value="CANCELLED">Cancelled</option>
                        </select>

                        <button
                          className="px-3 py-2 bg-nhs-blue text-white rounded-md text-sm hover:bg-nhs-dark-blue"
                          onClick={() => handleSendReminder(prescription.id)}
                        >
                          Send Reminder
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="bg-white p-6 rounded-lg shadow-md text-center">
                  <p className="text-gray-500">No prescriptions match your filters</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="eps">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <EPSPrescriptionList pharmacyOdsCode={pharmacyOdsCode} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
