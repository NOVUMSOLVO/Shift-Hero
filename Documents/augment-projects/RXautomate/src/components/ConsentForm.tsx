import React, { useState } from 'react';
import { ConsentType } from '@prisma/client';

interface ConsentFormProps {
  patientId: string;
  patientName: string;
  existingConsents: {
    type: ConsentType;
    given: boolean;
    date: Date | null;
    expiry: Date | null;
  }[];
  onSaveConsent: (patientId: string, consentType: ConsentType, given: boolean, expiryDate: Date | null) => void;
}

const ConsentForm: React.FC<ConsentFormProps> = ({
  patientId,
  patientName,
  existingConsents,
  onSaveConsent,
}) => {
  const [consents, setConsents] = useState<Record<ConsentType, boolean>>({
    MARKETING: existingConsents.find(c => c.type === 'MARKETING')?.given || false,
    REMINDER: existingConsents.find(c => c.type === 'REMINDER')?.given || false,
    DATA_SHARING: existingConsents.find(c => c.type === 'DATA_SHARING')?.given || false,
    VACCINATION: existingConsents.find(c => c.type === 'VACCINATION')?.given || false,
  });
  
  const [expiryDates, setExpiryDates] = useState<Record<ConsentType, string>>({
    MARKETING: existingConsents.find(c => c.type === 'MARKETING')?.expiry 
      ? new Date(existingConsents.find(c => c.type === 'MARKETING')?.expiry as Date).toISOString().split('T')[0]
      : getDefaultExpiryDate(),
    REMINDER: existingConsents.find(c => c.type === 'REMINDER')?.expiry
      ? new Date(existingConsents.find(c => c.type === 'REMINDER')?.expiry as Date).toISOString().split('T')[0]
      : getDefaultExpiryDate(),
    DATA_SHARING: existingConsents.find(c => c.type === 'DATA_SHARING')?.expiry
      ? new Date(existingConsents.find(c => c.type === 'DATA_SHARING')?.expiry as Date).toISOString().split('T')[0]
      : getDefaultExpiryDate(),
    VACCINATION: existingConsents.find(c => c.type === 'VACCINATION')?.expiry
      ? new Date(existingConsents.find(c => c.type === 'VACCINATION')?.expiry as Date).toISOString().split('T')[0]
      : getDefaultExpiryDate(),
  });

  // Get default expiry date (2 years from now)
  function getDefaultExpiryDate(): string {
    const date = new Date();
    date.setFullYear(date.getFullYear() + 2);
    return date.toISOString().split('T')[0];
  }

  // Handle consent toggle
  const handleConsentToggle = (type: ConsentType) => {
    setConsents(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  // Handle expiry date change
  const handleExpiryDateChange = (type: ConsentType, date: string) => {
    setExpiryDates(prev => ({
      ...prev,
      [type]: date
    }));
  };

  // Handle save button click
  const handleSave = (type: ConsentType) => {
    const expiryDate = expiryDates[type] ? new Date(expiryDates[type]) : null;
    onSaveConsent(patientId, type, consents[type], expiryDate);
  };

  // Get consent type label
  const getConsentTypeLabel = (type: ConsentType) => {
    switch (type) {
      case 'MARKETING':
        return 'Marketing Communications';
      case 'REMINDER':
        return 'Prescription & Appointment Reminders';
      case 'DATA_SHARING':
        return 'Data Sharing with NHS & Healthcare Providers';
      case 'VACCINATION':
        return 'Vaccination Campaigns';
      default:
        return type;
    }
  };

  // Get consent description
  const getConsentDescription = (type: ConsentType) => {
    switch (type) {
      case 'MARKETING':
        return 'I consent to receive marketing communications about products, services, and health information from the pharmacy.';
      case 'REMINDER':
        return 'I consent to receive SMS and email reminders about my prescriptions and appointments.';
      case 'DATA_SHARING':
        return 'I consent to my data being shared with NHS services and other healthcare providers for the purpose of my care.';
      case 'VACCINATION':
        return 'I consent to being contacted about vaccination campaigns that I may be eligible for.';
      default:
        return '';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold">GDPR Consent Form</h2>
        <p className="text-gray-600">Patient: {patientName}</p>
      </div>
      
      <div className="space-y-6">
        {(Object.keys(consents) as ConsentType[]).map((type) => (
          <div key={type} className="border-b pb-4">
            <div className="flex items-start mb-2">
              <div className="flex items-center h-5">
                <input
                  id={`consent-${type}`}
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-nhs-blue focus:ring-nhs-blue"
                  checked={consents[type]}
                  onChange={() => handleConsentToggle(type)}
                />
              </div>
              <div className="ml-3">
                <label htmlFor={`consent-${type}`} className="font-medium">
                  {getConsentTypeLabel(type)}
                </label>
                <p className="text-sm text-gray-600">{getConsentDescription(type)}</p>
              </div>
            </div>
            
            <div className="ml-7 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Consent Valid Until
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border rounded-md"
                  value={expiryDates[type]}
                  onChange={(e) => handleExpiryDateChange(type, e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              
              <div className="flex items-end">
                <button
                  className="px-4 py-2 bg-nhs-blue text-white rounded-md hover:bg-nhs-dark-blue"
                  onClick={() => handleSave(type)}
                >
                  Save {getConsentTypeLabel(type)}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 pt-4 border-t">
        <p className="text-sm text-gray-600">
          Under the General Data Protection Regulation (GDPR), we need your explicit consent to process your personal data for specific purposes. You can withdraw your consent at any time by contacting us.
        </p>
      </div>
    </div>
  );
};

export default ConsentForm;
