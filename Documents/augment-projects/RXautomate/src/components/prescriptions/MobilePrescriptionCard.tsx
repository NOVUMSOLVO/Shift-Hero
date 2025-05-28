"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, AlertTriangle, Clock, User, Pill, Calendar, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { Prescription } from '@/services/EPSService';

interface MobilePrescriptionCardProps {
  prescription: Prescription;
  isLoading?: boolean;
  onView: (id: string) => void;
  onDispense?: (id: string) => void;
}

export function MobilePrescriptionCard({ 
  prescription, 
  isLoading = false,
  onView,
  onDispense
}: MobilePrescriptionCardProps) {
  // Format date utility
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'PPP');
  };

  // Get appropriate status color
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

  // Get medication name
  const getMedicationName = () => {
    if (prescription.medicationReference?.display) {
      return prescription.medicationReference.display;
    }
    if (prescription.medicationCodeableConcept?.coding?.[0]?.display) {
      return prescription.medicationCodeableConcept.coding[0].display;
    }
    return 'Unnamed Medication';
  };

  return (
    <Card className="mb-4 overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg font-bold">
              {getMedicationName()}
            </CardTitle>
            <CardDescription>
              Written on {formatDate(prescription.authoredOn)}
            </CardDescription>
          </div>
          <Badge className={getStatusColor(prescription.status)}>
            {prescription.status.charAt(0).toUpperCase() + prescription.status.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="py-2">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center text-gray-600">
            <User className="h-4 w-4 mr-1" />
            <span className="truncate">
              {prescription.subject.display || 'Unknown Patient'}
            </span>
          </div>
          
          <div className="flex items-center text-gray-600">
            <Calendar className="h-4 w-4 mr-1" />
            <span className="truncate">
              {prescription.dispenseRequest?.validityPeriod?.end ? 
                `Expires: ${formatDate(prescription.dispenseRequest.validityPeriod.end)}` : 
                'No expiry'}
            </span>
          </div>
          
          {prescription.dosageInstruction?.[0]?.text && (
            <div className="flex items-center text-gray-600 col-span-2">
              <Pill className="h-4 w-4 mr-1 shrink-0" />
              <span className="truncate">{prescription.dosageInstruction[0].text}</span>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="pt-2 flex justify-between">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => onView(prescription.id)}
        >
          View Details
        </Button>
        
        {prescription.status === 'active' && onDispense && (
          <Button 
            size="sm"
            onClick={() => onDispense(prescription.id)}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Dispense
              </>
            )}
          </Button>
        )}
        
        {prescription.status === 'on-hold' && (
          <Badge variant="outline" className="bg-yellow-50 border-yellow-200 text-yellow-800">
            <AlertTriangle className="mr-1 h-3 w-3" />
            On hold
          </Badge>
        )}
      </CardFooter>
    </Card>
  );
}
