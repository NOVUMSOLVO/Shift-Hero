import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

interface PatientStatusCheckerProps {
  onStatusChecked?: (data: any) => void;
}

const PatientStatusChecker: React.FC<PatientStatusCheckerProps> = ({ onStatusChecked }) => {
  const [nhsNumber, setNhsNumber] = useState('');
  const [serviceType, setServiceType] = useState('prescription');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);
  const router = useRouter();

  // Format NHS number as user types (e.g., 123 456 7890)
  const formatNHSNumber = (input: string) => {
    // Remove all non-digits
    const digitsOnly = input.replace(/\D/g, '');
    
    // Apply formatting
    if (digitsOnly.length <= 3) {
      return digitsOnly;
    } else if (digitsOnly.length <= 6) {
      return `${digitsOnly.slice(0, 3)} ${digitsOnly.slice(3)}`;
    } else {
      return `${digitsOnly.slice(0, 3)} ${digitsOnly.slice(3, 6)} ${digitsOnly.slice(6, 10)}`;
    }
  };

  const handleNHSNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatNHSNumber(e.target.value);
    setNhsNumber(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous results and errors
    setError(null);
    setResult(null);
    setIsLoading(true);
    
    try {
      // Remove spaces for API call
      const cleanNhsNumber = nhsNumber.replace(/\s/g, '');
      
      const response = await fetch('/api/eps/check-patient-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nhsNumber: cleanNhsNumber,
          serviceType,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to check patient status');
      }
      
      setResult(data);
      
      // Call the callback if provided
      if (onStatusChecked) {
        onStatusChecked(data);
      }
    } catch (err) {
      setError(err.message || 'An error occurred while checking patient status');
    } finally {
      setIsLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">NHS Patient Status Checker</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="nhsNumber" className="block text-sm font-medium text-gray-700 mb-1">
            NHS Number
          </label>
          <input
            type="text"
            id="nhsNumber"
            value={nhsNumber}
            onChange={handleNHSNumberChange}
            placeholder="123 456 7890"
            maxLength={12} // 10 digits + 2 spaces
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-nhs-blue"
            required
          />
          <p className="text-xs text-gray-500 mt-1">Format: 123 456 7890</p>
        </div>
        
        <div>
          <label htmlFor="serviceType" className="block text-sm font-medium text-gray-700 mb-1">
            Service Type
          </label>
          <select
            id="serviceType"
            value={serviceType}
            onChange={(e) => setServiceType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-nhs-blue"
          >
            <option value="prescription">Prescription</option>
            <option value="vaccination">Vaccination</option>
            <option value="consultation">Consultation</option>
          </select>
        </div>
        
        <button
          type="submit"
          disabled={isLoading || nhsNumber.replace(/\s/g, '').length !== 10}
          className={`w-full py-2 px-4 rounded-md text-white font-medium 
            ${isLoading || nhsNumber.replace(/\s/g, '').length !== 10 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-nhs-blue hover:bg-nhs-dark-blue'}`}
        >
          {isLoading ? 'Checking...' : 'Check Status'}
        </button>
      </form>
      
      {error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-300 text-red-800 rounded-md">
          <p className="font-medium">Error</p>
          <p>{error}</p>
        </div>
      )}
      
      {result && (
        <div className="mt-6 space-y-4">
          <h3 className="text-lg font-semibold">Patient Status Results</h3>
          
          {/* Patient Details */}
          <div className="border rounded-md p-4">
            <h4 className="font-medium mb-2">Patient Details</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <p className="text-gray-600">Name:</p>
              <p>
                {result.patient.details.name?.[0]?.given?.[0] || ''} {result.patient.details.name?.[0]?.family || 'N/A'}
              </p>
              <p className="text-gray-600">Date of Birth:</p>
              <p>{formatDate(result.patient.details.birthDate)}</p>
              <p className="text-gray-600">NHS Number:</p>
              <p>{result.patient.nhsNumber}</p>
            </div>
          </div>
          
          {/* Exemption Status */}
          <div className="border rounded-md p-4">
            <h4 className="font-medium mb-2">Exemption Status</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <p className="text-gray-600">Status:</p>
              <p className={`font-medium ${result.exemption.status ? 'text-green-600' : 'text-red-600'}`}>
                {result.exemption.status ? 'Exempt' : 'Not Exempt'}
              </p>
              <p className="text-gray-600">Type:</p>
              <p>{result.exemption.type || 'N/A'}</p>
              <p className="text-gray-600">Expiry Date:</p>
              <p>{formatDate(result.exemption.expiryDate)}</p>
              <p className="text-gray-600">Certificate Number:</p>
              <p>{result.exemption.certificateNumber || 'N/A'}</p>
            </div>
          </div>
          
          {/* Eligibility Status */}
          <div className="border rounded-md p-4">
            <h4 className="font-medium mb-2">Eligibility Status</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <p className="text-gray-600">Status:</p>
              <p className={`font-medium ${result.eligibility.status ? 'text-green-600' : 'text-red-600'}`}>
                {result.eligibility.status ? 'Eligible' : 'Not Eligible'}
              </p>
              <p className="text-gray-600">Reason:</p>
              <p>{result.eligibility.reason || 'N/A'}</p>
              <p className="text-gray-600">Valid From:</p>
              <p>{formatDate(result.eligibility.validFrom)}</p>
              <p className="text-gray-600">Valid To:</p>
              <p>{formatDate(result.eligibility.validTo)}</p>
            </div>
          </div>
          
          <div className="flex justify-end mt-4">
            <button
              onClick={() => router.push(`/patients/${result.patient.nhsNumber}`)}
              className="px-4 py-2 bg-nhs-green text-white rounded-md hover:bg-nhs-dark-green"
            >
              View Patient Record
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientStatusChecker;
