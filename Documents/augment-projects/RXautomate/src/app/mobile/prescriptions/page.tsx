"use client";

import React, { useState, useEffect } from 'react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { Prescription } from '@/services/EPSService';
import { MobilePrescriptionCard } from '@/components/prescriptions/MobilePrescriptionCard';
import PrescriptionDetailModal from '@/components/prescriptions/PrescriptionDetailModal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Filter, Loader2 } from 'lucide-react';

export default function MobilePrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('active');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPrescription, setSelectedPrescription] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  // Load prescriptions
  useEffect(() => {
    const fetchPrescriptions = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/prescriptions?status=${activeTab}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch prescriptions: ${response.statusText}`);
        }
        
        const data = await response.json();
        setPrescriptions(data);
      } catch (err) {
        console.error('Error loading prescriptions:', err);
        setError(err instanceof Error ? err.message : 'Failed to load prescriptions');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPrescriptions();
  }, [activeTab]);
  
  // Filter prescriptions based on search query
  const filteredPrescriptions = prescriptions.filter(prescription => {
    const medicationName = prescription.medicationCodeableConcept?.coding?.[0]?.display || 
                          prescription.medicationReference?.display || '';
    const patientName = prescription.subject.display || '';
    
    const searchLower = searchQuery.toLowerCase();
    
    return medicationName.toLowerCase().includes(searchLower) || 
           patientName.toLowerCase().includes(searchLower);
  });
  
  // Handle dispensing a prescription
  const handleDispense = async (id: string) => {
    setProcessingId(id);
    
    try {
      const response = await fetch(`/api/prescriptions/${id}/dispense`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to dispense: ${response.statusText}`);
      }
      
      // Update the prescription list
      setPrescriptions(prev => 
        prev.filter(p => p.id !== id)
      );
      
    } catch (err) {
      console.error('Error dispensing prescription:', err);
      // In a real app, show an error toast or notification
    } finally {
      setProcessingId(null);
    }
  };
  
  // Handle viewing prescription details
  const handleViewPrescription = (id: string) => {
    setSelectedPrescription(id);
  };
  
  // Handle closing the detail modal
  const handleCloseModal = () => {
    setSelectedPrescription(null);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Prescriptions</h1>
      
      {/* Search and filter */}
      <div className="mb-4 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="Search prescriptions..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Tabs */}
      <Tabs defaultValue="active" className="mb-6" onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4">
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="on-hold">On Hold</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab}>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Loading prescriptions...</span>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 text-red-700 rounded-md">
              {error}
            </div>
          ) : filteredPrescriptions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No prescriptions found.
            </div>
          ) : (
            <div>
              {filteredPrescriptions.map(prescription => (
                <MobilePrescriptionCard
                  key={prescription.id}
                  prescription={prescription}
                  onView={handleViewPrescription}
                  onDispense={activeTab === 'active' ? handleDispense : undefined}
                  isLoading={processingId === prescription.id}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {selectedPrescription && (
        <PrescriptionDetailModal
          isOpen={true}
          onClose={handleCloseModal}
          prescriptionId={selectedPrescription}
          onDispense={handleDispense}
          onCancel={() => {
            // Handle cancellation in a real app
          }}
        />
      )}
    </div>
  );
}
