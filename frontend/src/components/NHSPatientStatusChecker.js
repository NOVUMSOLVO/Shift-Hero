/**
 * NHS Patient Status Checker Component
 * Provides comprehensive patient status verification including demographics,
 * exemption status, and eligibility checking based on RXautomate patterns
 */

import React, { useState } from 'react';
import nhsApiService from '../services/nhsApiService';

const NHSPatientStatusChecker = ({ onStatusChecked, className = '' }) => {
  const [nhsNumber, setNhsNumber] = useState('');
  const [serviceType, setServiceType] = useState('prescription');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  // Format NHS number as user types (e.g., 123 456 7890)
  const formatNHSNumber = (input) => {
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

  const handleNHSNumberChange = (e) => {
    const formatted = formatNHSNumber(e.target.value);
    setNhsNumber(formatted);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous results and errors
    setError(null);
    setResult(null);
    setIsLoading(true);
    
    try {
      // Remove spaces for API call
      const cleanNhsNumber = nhsNumber.replace(/\s/g, '');
      
      // Validate NHS number format
      if (!nhsApiService.validateNHSNumber(cleanNhsNumber)) {
        throw new Error('Please enter a valid NHS number');
      }
      
      const data = await nhsApiService.getPatientStatus(cleanNhsNumber, serviceType);
      
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
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <h2 className="text-xl font-semibold mb-4 text-gray-800">NHS Patient Status Checker</h2>
      
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              : 'bg-blue-600 hover:bg-blue-700'}`}
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
          <h3 className="text-lg font-semibold text-gray-800">Patient Status Results</h3>
          
          {/* Patient Details */}
          <div className="border rounded-md p-4 bg-gray-50">
            <h4 className="font-medium mb-2 text-gray-800">Patient Details</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <p className="text-gray-600">Name:</p>
              <p className="font-medium">
                {result.patient?.name?.given?.[0] || ''} {result.patient?.name?.family || 'N/A'}
              </p>
              <p className="text-gray-600">Date of Birth:</p>
              <p>{formatDate(result.patient?.birthDate)}</p>
              <p className="text-gray-600">NHS Number:</p>
              <p className="font-mono">{nhsApiService.formatNHSNumber(result.patient?.nhsNumber || '')}</p>
              <p className="text-gray-600">Gender:</p>
              <p className="capitalize">{result.patient?.gender || 'N/A'}</p>
            </div>
          </div>
          
          {/* Exemption Status */}
          <div className="border rounded-md p-4 bg-gray-50">
            <h4 className="font-medium mb-2 text-gray-800">Exemption Status</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <p className="text-gray-600">Status:</p>
              <p className={`font-medium ${result.exemption?.exemptionStatus ? 'text-green-600' : 'text-red-600'}`}>
                {result.exemption?.exemptionStatus ? 'Exempt' : 'Not Exempt'}
              </p>
              <p className="text-gray-600">Type:</p>
              <p>{result.exemption?.exemptionType || 'N/A'}</p>
              <p className="text-gray-600">Expiry Date:</p>
              <p className={result.exemption?.expiryDate && new Date(result.exemption.expiryDate) < new Date() 
                ? 'text-red-600 font-medium' : ''}>
                {formatDate(result.exemption?.expiryDate)}
              </p>
              <p className="text-gray-600">Certificate Number:</p>
              <p className="font-mono">{result.exemption?.certificateNumber || 'N/A'}</p>
            </div>
          </div>
          
          {/* Eligibility Status */}
          <div className="border rounded-md p-4 bg-gray-50">
            <h4 className="font-medium mb-2 text-gray-800">Eligibility Status</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <p className="text-gray-600">Status:</p>
              <p className={`font-medium ${result.eligibility?.eligibilityStatus ? 'text-green-600' : 'text-red-600'}`}>
                {result.eligibility?.eligibilityStatus ? 'Eligible' : 'Not Eligible'}
              </p>
              <p className="text-gray-600">Reason:</p>
              <p>{result.eligibility?.eligibilityReason || 'N/A'}</p>
              <p className="text-gray-600">Valid From:</p>
              <p>{formatDate(result.eligibility?.validFrom)}</p>
              <p className="text-gray-600">Valid To:</p>
              <p>{formatDate(result.eligibility?.validTo)}</p>
            </div>
          </div>

          {/* GP Details */}
          {result.patient?.gpDetails && (
            <div className="border rounded-md p-4 bg-gray-50">
              <h4 className="font-medium mb-2 text-gray-800">GP Practice</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <p className="text-gray-600">Practice Name:</p>
                <p>{result.patient.gpDetails.name || 'N/A'}</p>
                <p className="text-gray-600">ODS Code:</p>
                <p className="font-mono">{result.patient.gpDetails.odsCode || 'N/A'}</p>
              </div>
            </div>
          )}

          {/* Status Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <h4 className="font-medium mb-2 text-blue-800">Status Summary</h4>
            <div className="flex items-center space-x-4 text-sm">
              <div className={`px-3 py-1 rounded-full text-white ${
                result.patient ? 'bg-green-500' : 'bg-red-500'
              }`}>
                {result.patient ? 'Found' : 'Not Found'}
              </div>
              <div className={`px-3 py-1 rounded-full text-white ${
                result.exemption?.exemptionStatus ? 'bg-green-500' : 'bg-yellow-500'
              }`}>
                {result.exemption?.exemptionStatus ? 'Exempt' : 'Charges Apply'}
              </div>
              <div className={`px-3 py-1 rounded-full text-white ${
                result.eligibility?.eligibilityStatus ? 'bg-green-500' : 'bg-red-500'
              }`}>
                {result.eligibility?.eligibilityStatus ? 'Eligible' : 'Not Eligible'}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => {
                setResult(null);
                setNhsNumber('');
                setError(null);
              }}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Clear
            </button>
            <button
              onClick={() => {
                // Trigger a new check
                handleSubmit({ preventDefault: () => {} });
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              disabled={isLoading}
            >
              Refresh
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NHSPatientStatusChecker;
