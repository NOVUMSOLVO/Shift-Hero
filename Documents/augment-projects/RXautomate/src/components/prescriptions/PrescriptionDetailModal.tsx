'use client';

import { useState, useEffect } from 'react';
import { Prescription } from '@/services/EPSService';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PrescriptionTimeline from './PrescriptionTimeline';
import PrescriptionStockCheck from './PrescriptionStockCheck';
import PrescriptionValidation from './PrescriptionValidation';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertCircle, CheckCircle2, Printer, Clock, User, Pill, Calendar, ShieldCheck } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format } from 'date-fns';

interface PrescriptionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  prescriptionId: string | null;
  onDispense: (id: string) => Promise<void>;
  onCancel: (id: string, reason: { code: string; display: string }) => Promise<void>;
}

export default function PrescriptionDetailModal({
  isOpen,
  onClose,
  prescriptionId,
  onDispense,
  onCancel,
}: PrescriptionDetailModalProps) {
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('details');
  const [validationCompleted, setValidationCompleted] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);

  useEffect(() => {
    if (isOpen && prescriptionId) {
      fetchPrescriptionDetails(prescriptionId);
      // Reset validation state when opening a new prescription
      setValidationCompleted(false);
      setValidationResult(null);
    }
  }, [isOpen, prescriptionId]);

  const fetchPrescriptionDetails = async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/prescriptions/${id}?includeHistory=true`);

      if (!response.ok) {
        throw new Error(`Error fetching prescription: ${response.statusText}`);
      }

      const data = await response.json();
      setPrescription(data);
    } catch (err: any) {
      console.error('Failed to fetch prescription details:', err);
      setError(err.message || 'Failed to load prescription details');
    } finally {
      setLoading(false);
    }
  };

  const handleDispense = async () => {
    if (!prescription) return;

    setProcessing(true);
    setError(null);
    setSuccess(null);

    try {
      await onDispense(prescription.id);
      setSuccess('Prescription has been successfully dispensed.');
      // Refresh prescription details
      await fetchPrescriptionDetails(prescription.id);
    } catch (err: any) {
      setError(err.message || 'Failed to dispense prescription');
    } finally {
      setProcessing(false);
    }
  };

  const handleCancel = async () => {
    if (!prescription) return;

    setProcessing(true);
    setError(null);
    setSuccess(null);

    try {
      await onCancel(prescription.id, {
        code: 'pharmacy-requested',
        display: 'Cancelled by pharmacy'
      });
      setSuccess('Prescription has been successfully cancelled.');
      // Refresh prescription details
      await fetchPrescriptionDetails(prescription.id);
    } catch (err: any) {
      setError(err.message || 'Failed to cancel prescription');
    } finally {
      setProcessing(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'on-hold':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'PPP');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            <span>Prescription Details</span>
            {prescription && (
              <Badge className={getStatusColor(prescription.status)}>
                {prescription.status.charAt(0).toUpperCase() + prescription.status.slice(1)}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            View and manage prescription information
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Loading prescription details...</span>
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : prescription ? (
          <>
            {success && (
              <Alert variant="success" className="bg-green-50 text-green-800 border-green-200 mb-4">
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="medication">Medication</TabsTrigger>
                <TabsTrigger value="validation">
                  <ShieldCheck className="h-4 w-4 mr-1" />
                  AI Validation
                </TabsTrigger>
                <TabsTrigger value="inventory">Inventory</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500 flex items-center">
                      <User className="h-4 w-4 mr-1" /> Patient
                    </p>
                    <p className="font-medium">
                      {prescription.subject.display || prescription.subject.reference.replace('Patient/', '')}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm text-gray-500 flex items-center">
                      <Calendar className="h-4 w-4 mr-1" /> Date Written
                    </p>
                    <p className="font-medium">
                      {formatDate(prescription.authoredOn)}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm text-gray-500 flex items-center">
                      <User className="h-4 w-4 mr-1" /> Prescriber
                    </p>
                    <p className="font-medium">
                      {prescription.requester.display || prescription.requester.reference.replace('Practitioner/', '')}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm text-gray-500 flex items-center">
                      <Clock className="h-4 w-4 mr-1" /> Validity Period
                    </p>
                    <p className="font-medium">
                      {prescription.dispenseRequest?.validityPeriod ? (
                        `${formatDate(prescription.dispenseRequest.validityPeriod.start)} to ${formatDate(prescription.dispenseRequest.validityPeriod.end)}`
                      ) : (
                        'Not specified'
                      )}
                    </p>
                  </div>
                </div>

                <div className="border-t pt-4 mt-4">
                  <h4 className="font-medium mb-2">Prescription ID</h4>
                  <p className="text-sm bg-gray-50 p-2 rounded">{prescription.id}</p>
                </div>
              </TabsContent>

              <TabsContent value="medication" className="space-y-4 pt-4">
                <div className="space-y-1">
                  <h4 className="font-medium">Medication</h4>
                  <p className="text-lg">
                    {prescription.medicationReference?.display ||
                     prescription.medicationCodeableConcept?.coding?.[0]?.display ||
                     'Unnamed Medication'}
                  </p>
                </div>

                {prescription.dosageInstruction && prescription.dosageInstruction.length > 0 && (
                  <div className="space-y-1">
                    <h4 className="font-medium">Dosage Instructions</h4>
                    <p className="bg-gray-50 p-2 rounded">
                      {prescription.dosageInstruction[0].text}
                    </p>

                    {prescription.dosageInstruction[0].timing?.repeat && (
                      <div className="mt-2">
                        <p className="text-sm">
                          <span className="font-medium">Frequency:</span> {prescription.dosageInstruction[0].timing.repeat.frequency} times
                          per {prescription.dosageInstruction[0].timing.repeat.period} {prescription.dosageInstruction[0].timing.repeat.periodUnit}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {prescription.dispenseRequest?.quantity && (
                  <div className="space-y-1">
                    <h4 className="font-medium">Quantity</h4>
                    <p>
                      {prescription.dispenseRequest.quantity.value} {prescription.dispenseRequest.quantity.unit}
                    </p>
                  </div>
                )}

                {prescription.substitution && (
                  <div className="space-y-1">
                    <h4 className="font-medium">Substitution</h4>
                    <p>
                      {prescription.substitution.allowedBoolean ? 'Allowed' : 'Not Allowed'}
                      {prescription.substitution.reason && (
                        <span className="ml-2">
                          ({prescription.substitution.reason.coding[0].display})
                        </span>
                      )}
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="inventory" className="space-y-4 pt-4">
                {prescription && (
                  <PrescriptionStockCheck
                    prescription={prescription}
                    onDispense={prescription.status === 'active' ? handleDispense : undefined}
                  />
                )}
              </TabsContent>

              <TabsContent value="validation" className="space-y-4 pt-4">
                {prescription && (
                  <PrescriptionValidation 
                    prescriptionId={prescription.id}
                    onValidationComplete={(result) => {
                      setValidationCompleted(true);
                      setValidationResult(result);
                    }}
                  />
                )}
              </TabsContent>

              <TabsContent value="timeline" className="space-y-4 pt-4">
                {prescription && (
                  <PrescriptionTimeline prescriptionId={prescription.id} />
                )}
              </TabsContent>
            </Tabs>
          </>
        ) : null}

        <DialogFooter className="flex justify-between items-center">
          <div>
            {prescription && (
              <Button variant="outline" onClick={handlePrint} disabled={processing}>
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
            )}
          </div>

          <div className="flex space-x-2">
            <Button variant="outline" onClick={onClose} disabled={processing}>
              Close
            </Button>

            {prescription && prescription.status === 'active' && (
              <>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={processing}
                >
                  {processing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : 'Cancel'}
                </Button>
                
                <div className="relative">
                  {validationResult && validationResult.severity === 'CRITICAL' && (
                    <div className="absolute -top-10 right-0 text-xs text-red-600 bg-red-50 p-1 rounded border border-red-200 whitespace-nowrap">
                      <AlertCircle className="h-3 w-3 inline mr-1" />
                      Critical validation issues detected
                    </div>
                  )}
                  <Button
                    onClick={handleDispense}
                    disabled={processing}
                    variant={validationResult && validationResult.severity === 'CRITICAL' ? "destructive" : "default"}
                    title={validationResult && validationResult.severity === 'CRITICAL' ? 
                      "Warning: Critical validation issues detected" : "Dispense prescription"}
                  >
                    {processing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        {validationResult && validationResult.severity === 'CRITICAL' && (
                          <AlertCircle className="mr-2 h-4 w-4" />
                        )}
                        Dispense
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
