'use client';

import { useState, useEffect } from 'react';
import { Prescription, PrescriptionBundle, PrescriptionSearchParams } from '@/services/EPSService';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, CheckSquare } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import EPSPrescriptionSearch, { SearchParams } from './EPSPrescriptionSearch';
import BatchProcessingModal from './BatchProcessingModal';
import PrescriptionDetailModal from './PrescriptionDetailModal';
import PrescriptionItem from './PrescriptionItem';
import { StockCheckResult } from '@/services/InventoryPrescriptionService';

interface EPSPrescriptionListProps {
  pharmacyOdsCode: string;
}

export default function EPSPrescriptionList({ pharmacyOdsCode }: EPSPrescriptionListProps) {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedPrescriptions, setSelectedPrescriptions] = useState<Prescription[]>([]);
  const [showBatchModal, setShowBatchModal] = useState<boolean>(false);
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);
  const [selectedPrescriptionId, setSelectedPrescriptionId] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useState<SearchParams>({});
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // Fetch prescriptions on component mount or when search params change
  useEffect(() => {
    fetchPrescriptions();
  }, [pharmacyOdsCode]);

  const fetchPrescriptions = async (params: SearchParams = {}) => {
    try {
      setLoading(true);
      setError(null);

      let url = `/api/prescriptions/pharmacy/${pharmacyOdsCode}`;
      let method = 'GET';
      let body = null;

      // If we have search params, use the search endpoint
      if (Object.keys(params).length > 0) {
        url = '/api/prescriptions/search';
        method = 'POST';

        // Convert dates to strings if they are Date objects
        const processedParams: PrescriptionSearchParams = { ...params };
        if (params.dateWrittenFrom instanceof Date) {
          processedParams.dateWrittenFrom = params.dateWrittenFrom.toISOString().split('T')[0];
        }
        if (params.dateWrittenTo instanceof Date) {
          processedParams.dateWrittenTo = params.dateWrittenTo.toISOString().split('T')[0];
        }

        // Add pharmacy ODS code to search params
        processedParams.performer = pharmacyOdsCode;

        body = JSON.stringify(processedParams);
      }

      const response = await fetch(url, {
        method,
        headers: method === 'POST' ? { 'Content-Type': 'application/json' } : undefined,
        body
      });

      if (!response.ok) {
        throw new Error(`Error fetching prescriptions: ${response.statusText}`);
      }

      const data: PrescriptionBundle = await response.json();

      // Check if data has entries
      if (data.entry && Array.isArray(data.entry)) {
        setPrescriptions(data.entry.map(entry => entry.resource));
      } else {
        setPrescriptions([]);
      }

      // Clear selected prescriptions when fetching new data
      setSelectedPrescriptions([]);
    } catch (err: any) {
      console.error('Failed to fetch prescriptions:', err);
      setError(err.message || 'Failed to load prescriptions. Please try again later.');
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  };

  // Handle prescription actions
  const handleDispense = async (prescriptionId: string) => {
    try {
      setProcessingId(prescriptionId);

      // First, check stock
      const stockResponse = await fetch(`/api/prescriptions/${prescriptionId}/stock`);

      if (!stockResponse.ok) {
        throw new Error(`Error checking stock: ${stockResponse.statusText}`);
      }

      const stockData: StockCheckResult = await stockResponse.json();

      // If any items are out of stock, show error and abort
      if (stockData.anyOutOfStock) {
        setError('Cannot dispense prescription: Some items are out of stock.');
        return;
      }

      // If stock is available, proceed with dispensing
      const response = await fetch(`/api/prescriptions/${prescriptionId}/complete`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`Error completing prescription: ${response.statusText}`);
      }

      // Update the local state to reflect the change
      setPrescriptions(prevPrescriptions =>
        prevPrescriptions.map(prescription =>
          prescription.id === prescriptionId
            ? { ...prescription, status: 'completed' }
            : prescription
        )
      );

      // Remove from selected prescriptions if it was selected
      setSelectedPrescriptions(prev => prev.filter(p => p.id !== prescriptionId));

      // Show success message
      setError(null);
    } catch (err: any) {
      console.error('Failed to complete prescription:', err);
      setError(err.message || 'Failed to complete prescription. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancel = async (prescriptionId: string, reason: { code: string; display: string }) => {
    try {
      setProcessingId(prescriptionId);
      const response = await fetch(`/api/prescriptions/${prescriptionId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error cancelling prescription: ${response.statusText}`);
      }

      // Update the local state to reflect the change
      setPrescriptions(prevPrescriptions =>
        prevPrescriptions.map(prescription =>
          prescription.id === prescriptionId
            ? { ...prescription, status: 'cancelled' }
            : prescription
        )
      );

      // Remove from selected prescriptions if it was selected
      setSelectedPrescriptions(prev => prev.filter(p => p.id !== prescriptionId));
    } catch (err: any) {
      console.error('Failed to cancel prescription:', err);
      setError(err.message || 'Failed to cancel prescription. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  // Batch processing handlers
  const handleBatchDispense = async () => {
    try {
      const prescriptionIds = selectedPrescriptions.map(p => p.id);

      // Check stock for all prescriptions in the batch
      const stockCheckResults: { [id: string]: StockCheckResult } = {};
      const outOfStockPrescriptions: string[] = [];

      // Check stock for each prescription
      for (const prescriptionId of prescriptionIds) {
        const stockResponse = await fetch(`/api/prescriptions/${prescriptionId}/stock`);

        if (!stockResponse.ok) {
          throw new Error(`Error checking stock for prescription ${prescriptionId}`);
        }

        const stockData: StockCheckResult = await stockResponse.json();
        stockCheckResults[prescriptionId] = stockData;

        if (stockData.anyOutOfStock) {
          outOfStockPrescriptions.push(prescriptionId);
        }
      }

      // If any prescriptions are out of stock, abort
      if (outOfStockPrescriptions.length > 0) {
        throw new Error(`Cannot dispense batch: ${outOfStockPrescriptions.length} prescription(s) have items out of stock`);
      }

      // If all stock is available, proceed with batch dispensing
      const response = await fetch('/api/prescriptions/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'dispense',
          prescriptionIds,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error processing batch: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(`Batch processing completed with ${result.errorCount} errors`);
      }

      // Update the local state to reflect the changes
      setPrescriptions(prevPrescriptions =>
        prevPrescriptions.map(prescription =>
          prescriptionIds.includes(prescription.id)
            ? { ...prescription, status: 'completed' }
            : prescription
        )
      );

      // Clear selected prescriptions
      setSelectedPrescriptions([]);
    } catch (err: any) {
      console.error('Failed to process batch:', err);
      throw new Error(err.message || 'Failed to process batch. Please try again.');
    }
  };

  const handleBatchCancel = async (reason: string) => {
    try {
      const prescriptionIds = selectedPrescriptions.map(p => p.id);

      const response = await fetch('/api/prescriptions/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'cancel',
          prescriptionIds,
          reason: {
            code: 'pharmacy-requested',
            display: 'Cancelled by pharmacy',
            text: reason,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Error processing batch: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(`Batch processing completed with ${result.errorCount} errors`);
      }

      // Update the local state to reflect the changes
      setPrescriptions(prevPrescriptions =>
        prevPrescriptions.map(prescription =>
          prescriptionIds.includes(prescription.id)
            ? { ...prescription, status: 'cancelled' }
            : prescription
        )
      );

      // Clear selected prescriptions
      setSelectedPrescriptions([]);
    } catch (err: any) {
      console.error('Failed to process batch:', err);
      throw new Error(err.message || 'Failed to process batch. Please try again.');
    }
  };

  // Selection handlers
  const handleSelectPrescription = (prescription: Prescription, isSelected: boolean) => {
    if (isSelected) {
      setSelectedPrescriptions(prev => [...prev, prescription]);
    } else {
      setSelectedPrescriptions(prev => prev.filter(p => p.id !== prescription.id));
    }
  };

  const handleSelectAll = (isSelected: boolean) => {
    if (isSelected) {
      // Only select active prescriptions
      const activePrescriptions = prescriptions.filter(p => p.status === 'active');
      setSelectedPrescriptions(activePrescriptions);
    } else {
      setSelectedPrescriptions([]);
    }
  };

  // View prescription details
  const handleViewDetails = (prescriptionId: string) => {
    setSelectedPrescriptionId(prescriptionId);
    setShowDetailModal(true);
  };

  // Search handlers
  const handleSearch = (params: SearchParams) => {
    setSearchParams(params);
    setIsSearching(true);
    fetchPrescriptions(params);
  };

  // No longer needed - moved to utils.ts

  // Count active prescriptions
  const activeCount = prescriptions.filter(p => p.status === 'active').length;

  // Check if all active prescriptions are selected
  const allActiveSelected = activeCount > 0 &&
    selectedPrescriptions.length === activeCount;

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <EPSPrescriptionSearch onSearch={handleSearch} isLoading={isSearching} />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading prescriptions...</span>
        </div>
      ) : prescriptions.length === 0 ? (
        <div className="text-center p-8 border border-dashed rounded-lg">
          <p className="text-gray-500">No prescriptions found matching your criteria.</p>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="select-all"
                checked={allActiveSelected}
                onCheckedChange={handleSelectAll}
                disabled={activeCount === 0}
              />
              <label htmlFor="select-all" className="text-sm font-medium">
                Select All Active ({activeCount})
              </label>
            </div>

            {selectedPrescriptions.length > 0 && (
              <Button onClick={() => setShowBatchModal(true)}>
                <CheckSquare className="mr-2 h-4 w-4" />
                Process {selectedPrescriptions.length} Selected
              </Button>
            )}
          </div>

          <div className="space-y-4">
            {prescriptions.map((prescription) => (
              <div key={prescription.id} className="flex items-start">
                {prescription.status === 'active' && (
                  <Checkbox
                    className="mt-4 mr-3"
                    checked={selectedPrescriptions.some(p => p.id === prescription.id)}
                    onCheckedChange={(checked) => handleSelectPrescription(prescription, !!checked)}
                  />
                )}
                <div className="flex-1">
                  <PrescriptionItem
                    prescription={prescription}
                    onView={() => handleViewDetails(prescription.id)}
                    onComplete={prescription.status === 'active' ? () => handleDispense(prescription.id) : undefined}
                    onCancel={prescription.status === 'active' ?
                      () => handleCancel(prescription.id, {
                        code: 'pharmacy-requested',
                        display: 'Cancelled by pharmacy'
                      }) : undefined}
                    showActions={true}
                  />
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Batch Processing Modal */}
      <BatchProcessingModal
        isOpen={showBatchModal}
        onClose={() => setShowBatchModal(false)}
        selectedPrescriptions={selectedPrescriptions}
        onBatchDispense={handleBatchDispense}
        onBatchCancel={handleBatchCancel}
      />

      {/* Prescription Detail Modal */}
      <PrescriptionDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        prescriptionId={selectedPrescriptionId}
        onDispense={handleDispense}
        onCancel={(id, reason) => handleCancel(id, reason)}
      />
    </div>
  );
}
