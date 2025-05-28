'use client';

import { useState } from 'react';
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
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface BatchProcessingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPrescriptions: Prescription[];
  onBatchDispense: () => Promise<void>;
  onBatchCancel: (reason: string) => Promise<void>;
}

export default function BatchProcessingModal({
  isOpen,
  onClose,
  selectedPrescriptions,
  onBatchDispense,
  onBatchCancel,
}: BatchProcessingModalProps) {
  const [action, setAction] = useState<'dispense' | 'cancel'>('dispense');
  const [cancelReason, setCancelReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleProcess = async () => {
    setProcessing(true);
    setError(null);
    setSuccess(null);

    try {
      if (action === 'dispense') {
        await onBatchDispense();
        setSuccess(`Successfully dispensed ${selectedPrescriptions.length} prescriptions.`);
      } else {
        if (!cancelReason) {
          setError('Please provide a reason for cancellation.');
          setProcessing(false);
          return;
        }
        await onBatchCancel(cancelReason);
        setSuccess(`Successfully cancelled ${selectedPrescriptions.length} prescriptions.`);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during batch processing.');
    } finally {
      setProcessing(false);
    }
  };

  const handleClose = () => {
    if (!processing) {
      setAction('dispense');
      setCancelReason('');
      setError(null);
      setSuccess(null);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Batch Process Prescriptions</DialogTitle>
          <DialogDescription>
            You are about to process {selectedPrescriptions.length} prescriptions. Please select an action.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert variant="success" className="bg-green-50 text-green-800 border-green-200">
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <div className="py-4">
          <RadioGroup value={action} onValueChange={(value) => setAction(value as 'dispense' | 'cancel')}>
            <div className="flex items-center space-x-2 mb-3">
              <RadioGroupItem value="dispense" id="dispense" disabled={processing} />
              <Label htmlFor="dispense">Dispense All</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="cancel" id="cancel" disabled={processing} />
              <Label htmlFor="cancel">Cancel All</Label>
            </div>
          </RadioGroup>

          {action === 'cancel' && (
            <div className="mt-4">
              <Label htmlFor="cancelReason">Cancellation Reason</Label>
              <Textarea
                id="cancelReason"
                placeholder="Please provide a reason for cancellation"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                disabled={processing}
                className="mt-1"
              />
            </div>
          )}

          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2">Selected Prescriptions:</h4>
            <div className="max-h-40 overflow-y-auto border rounded-md p-2">
              <ul className="text-sm">
                {selectedPrescriptions.map((prescription) => (
                  <li key={prescription.id} className="py-1 border-b last:border-0">
                    <span className="font-medium">
                      {prescription.medicationReference?.display || 
                       prescription.medicationCodeableConcept?.coding?.[0]?.display || 
                       'Unnamed Medication'}
                    </span>
                    <span className="text-gray-500 ml-2">
                      (Patient: {prescription.subject.display || prescription.subject.reference.replace('Patient/', '')})
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={processing}>
            {success ? 'Close' : 'Cancel'}
          </Button>
          {!success && (
            <Button onClick={handleProcess} disabled={processing || (action === 'cancel' && !cancelReason)}>
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                `${action === 'dispense' ? 'Dispense' : 'Cancel'} All`
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
