import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Prescription } from '@/services/EPSService';
import { formatDate } from '@/lib/utils';

interface PrescriptionItemProps {
  prescription: Prescription;
  onView?: (prescription: Prescription) => void;
  onComplete?: (prescription: Prescription) => void;
  onCancel?: (prescription: Prescription) => void;
  onSendReminder?: (prescription: Prescription) => void;
  showActions?: boolean;
  compact?: boolean;
}

/**
 * Reusable Prescription Item component
 * 
 * This component displays a prescription in a card format with optional actions.
 * It can be used in various contexts like prescription lists, details, etc.
 */
export default function PrescriptionItem({
  prescription,
  onView,
  onComplete,
  onCancel,
  onSendReminder,
  showActions = true,
  compact = false,
}: PrescriptionItemProps) {
  // Extract patient name from prescription
  const patientName = prescription.subject?.display || 'Unknown Patient';
  
  // Extract medication information
  const medicationName = 
    prescription.medicationReference?.display || 
    prescription.medicationCodeableConcept?.coding?.[0]?.display || 
    'Unknown Medication';
  
  // Format dates
  const issuedDate = formatDate(prescription.authoredOn);
  const expiryDate = prescription.dispenseRequest?.validityPeriod?.end 
    ? formatDate(prescription.dispenseRequest.validityPeriod.end)
    : 'N/A';

  // Get prescription status
  const status = prescription.status || 'unknown';

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
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

  // Render compact version
  if (compact) {
    return (
      <Card className="mb-2">
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium">{patientName}</p>
              <p className="text-sm text-gray-600">{medicationName}</p>
            </div>
            <Badge variant="outline" className={getStatusColor(status)}>
              {status}
            </Badge>
          </div>
          {onView && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="mt-2" 
              onClick={() => onView(prescription)}
            >
              View
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // Render full version
  return (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{patientName}</CardTitle>
          <Badge variant="outline" className={getStatusColor(status)}>
            {status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-1">Medication</h4>
            <p>{medicationName}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Issued Date</p>
              <p>{issuedDate}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Expiry Date</p>
              <p>{expiryDate}</p>
            </div>
          </div>
          
          {prescription.dosageInstruction && prescription.dosageInstruction.length > 0 && (
            <div>
              <h4 className="font-medium mb-1">Instructions</h4>
              <p className="text-sm">{prescription.dosageInstruction[0].text}</p>
            </div>
          )}
        </div>
      </CardContent>
      
      {showActions && (
        <CardFooter className="flex flex-wrap gap-2">
          {onView && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onView(prescription)}
            >
              View Details
            </Button>
          )}
          
          {onComplete && status === 'active' && (
            <Button 
              variant="default" 
              size="sm" 
              onClick={() => onComplete(prescription)}
            >
              Complete
            </Button>
          )}
          
          {onCancel && status === 'active' && (
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={() => onCancel(prescription)}
            >
              Cancel
            </Button>
          )}
          
          {onSendReminder && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onSendReminder(prescription)}
            >
              Send Reminder
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
