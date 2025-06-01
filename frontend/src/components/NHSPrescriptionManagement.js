/**
 * NHS Prescription Management Component
 * Provides comprehensive prescription management including viewing patient prescriptions,
 * updating prescription status, and managing prescription workflows
 */

import React, { useState, useEffect } from 'react';
import nhsApiService from '../services/nhsApiService';

const NHSPrescriptionManagement = ({ patientNhsNumber, className = '' }) => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  // Load prescriptions when component mounts or patient changes
  useEffect(() => {
    if (patientNhsNumber) {
      loadPrescriptions();
    }
  }, [patientNhsNumber, statusFilter, sortBy, sortOrder]);

  const loadPrescriptions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const options = {
        status: statusFilter !== 'all' ? statusFilter : undefined,
        sort: sortBy,
        order: sortOrder,
      };
      
      const data = await nhsApiService.getPatientPrescriptions(patientNhsNumber, options);
      setPrescriptions(data.prescriptions || []);
    } catch (err) {
      setError(err.message || 'Failed to load prescriptions');
    } finally {
      setLoading(false);
    }
  };

  const updatePrescriptionStatus = async (prescriptionId, newStatus, notes = '') => {
    try {
      setLoading(true);
      await nhsApiService.updatePrescriptionStatus(prescriptionId, newStatus, notes);
      
      // Refresh prescriptions list
      await loadPrescriptions();
      
      // Close details if this prescription was selected
      if (selectedPrescription?.id === prescriptionId) {
        setSelectedPrescription(null);
      }
      
      // Show success message
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to update prescription status');
    } finally {
      setLoading(false);
    }
  };

  const filteredPrescriptions = prescriptions.filter(prescription => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      prescription.medication?.display?.toLowerCase().includes(searchLower) ||
      prescription.id?.toLowerCase().includes(searchLower) ||
      prescription.requester?.display?.toLowerCase().includes(searchLower)
    );
  });

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      'active': 'bg-blue-100 text-blue-800',
      'completed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800',
      'on-hold': 'bg-yellow-100 text-yellow-800',
      'draft': 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'urgent': 'bg-red-500',
      'high': 'bg-orange-500',
      'normal': 'bg-blue-500',
      'low': 'bg-gray-500',
    };
    return colors[priority] || 'bg-blue-500';
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">NHS Prescription Management</h2>
        <button
          onClick={loadPrescriptions}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {/* Filters and Search */}
      <div className="mb-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search medications, IDs, prescribers..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status Filter
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="on-hold">On Hold</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="date">Date</option>
              <option value="medication">Medication</option>
              <option value="status">Status</option>
              <option value="prescriber">Prescriber</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Order
            </label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-800 rounded-md">
          <p className="font-medium">Error</p>
          <p>{error}</p>
        </div>
      )}

      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading prescriptions...</span>
        </div>
      )}

      {!loading && filteredPrescriptions.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          {patientNhsNumber ? 'No prescriptions found' : 'Please select a patient to view prescriptions'}
        </div>
      )}

      {/* Prescriptions List */}
      {!loading && filteredPrescriptions.length > 0 && (
        <div className="space-y-4">
          {filteredPrescriptions.map((prescription) => (
            <div key={prescription.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="font-medium text-gray-900">
                      {prescription.medication?.display || 'Unknown Medication'}
                    </h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(prescription.status)}`}>
                      {prescription.status}
                    </span>
                    {prescription.priority && prescription.priority !== 'normal' && (
                      <span className={`w-3 h-3 rounded-full ${getPriorityColor(prescription.priority)}`} 
                            title={`Priority: ${prescription.priority}`}></span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Prescription ID:</span>
                      <p className="font-mono">{prescription.id}</p>
                    </div>
                    <div>
                      <span className="font-medium">Prescribed:</span>
                      <p>{formatDate(prescription.authoredOn)}</p>
                    </div>
                    <div>
                      <span className="font-medium">Prescriber:</span>
                      <p>{prescription.requester?.display || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="font-medium">Quantity:</span>
                      <p>{prescription.dispenseRequest?.quantity?.value || 'N/A'} {prescription.dispenseRequest?.quantity?.unit || ''}</p>
                    </div>
                  </div>
                  
                  {prescription.dosageInstruction && prescription.dosageInstruction[0]?.text && (
                    <div className="mt-2">
                      <span className="text-sm font-medium text-gray-700">Dosage: </span>
                      <span className="text-sm text-gray-600">{prescription.dosageInstruction[0].text}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => setSelectedPrescription(prescription)}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
                  >
                    Details
                  </button>
                  
                  {prescription.status === 'active' && (
                    <div className="flex space-x-1">
                      <button
                        onClick={() => updatePrescriptionStatus(prescription.id, 'completed', 'Dispensed')}
                        className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200"
                        disabled={loading}
                      >
                        Complete
                      </button>
                      <button
                        onClick={() => updatePrescriptionStatus(prescription.id, 'on-hold', 'On hold')}
                        className="px-3 py-1 text-sm bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200"
                        disabled={loading}
                      >
                        Hold
                      </button>
                    </div>
                  )}
                  
                  {prescription.status === 'on-hold' && (
                    <button
                      onClick={() => updatePrescriptionStatus(prescription.id, 'active', 'Resumed')}
                      className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
                      disabled={loading}
                    >
                      Resume
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Prescription Details Modal */}
      {selectedPrescription && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Prescription Details</h3>
                <button
                  onClick={() => setSelectedPrescription(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Prescription ID:</span>
                    <p className="font-mono mt-1">{selectedPrescription.id}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Status:</span>
                    <p className="mt-1">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedPrescription.status)}`}>
                        {selectedPrescription.status}
                      </span>
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Medication:</span>
                    <p className="mt-1">{selectedPrescription.medication?.display || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Prescribed Date:</span>
                    <p className="mt-1">{formatDate(selectedPrescription.authoredOn)}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Prescriber:</span>
                    <p className="mt-1">{selectedPrescription.requester?.display || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Quantity:</span>
                    <p className="mt-1">
                      {selectedPrescription.dispenseRequest?.quantity?.value || 'N/A'} {selectedPrescription.dispenseRequest?.quantity?.unit || ''}
                    </p>
                  </div>
                </div>
                
                {selectedPrescription.dosageInstruction && (
                  <div>
                    <span className="font-medium text-gray-700">Dosage Instructions:</span>
                    <div className="mt-1 space-y-1">
                      {selectedPrescription.dosageInstruction.map((dosage, index) => (
                        <p key={index} className="text-sm bg-gray-50 p-2 rounded">
                          {dosage.text || 'N/A'}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
                
                {selectedPrescription.dispenseRequest?.validityPeriod && (
                  <div>
                    <span className="font-medium text-gray-700">Validity Period:</span>
                    <p className="mt-1 text-sm">
                      From: {formatDate(selectedPrescription.dispenseRequest.validityPeriod.start)} <br />
                      To: {formatDate(selectedPrescription.dispenseRequest.validityPeriod.end)}
                    </p>
                  </div>
                )}
                
                {/* Status Update Actions */}
                <div className="border-t pt-4">
                  <span className="font-medium text-gray-700">Actions:</span>
                  <div className="mt-2 flex space-x-2">
                    {selectedPrescription.status === 'active' && (
                      <>
                        <button
                          onClick={() => updatePrescriptionStatus(selectedPrescription.id, 'completed', 'Dispensed')}
                          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                          disabled={loading}
                        >
                          Mark as Dispensed
                        </button>
                        <button
                          onClick={() => updatePrescriptionStatus(selectedPrescription.id, 'on-hold', 'Put on hold')}
                          className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
                          disabled={loading}
                        >
                          Put on Hold
                        </button>
                        <button
                          onClick={() => updatePrescriptionStatus(selectedPrescription.id, 'cancelled', 'Cancelled')}
                          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                          disabled={loading}
                        >
                          Cancel
                        </button>
                      </>
                    )}
                    
                    {selectedPrescription.status === 'on-hold' && (
                      <button
                        onClick={() => updatePrescriptionStatus(selectedPrescription.id, 'active', 'Resumed from hold')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        disabled={loading}
                      >
                        Resume Prescription
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Statistics */}
      {!loading && prescriptions.length > 0 && (
        <div className="mt-6 pt-6 border-t">
          <h4 className="font-medium text-gray-700 mb-3">Summary</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="bg-blue-50 p-3 rounded-md">
              <p className="font-medium text-blue-800">Total Prescriptions</p>
              <p className="text-2xl font-bold text-blue-900">{prescriptions.length}</p>
            </div>
            <div className="bg-green-50 p-3 rounded-md">
              <p className="font-medium text-green-800">Completed</p>
              <p className="text-2xl font-bold text-green-900">
                {prescriptions.filter(p => p.status === 'completed').length}
              </p>
            </div>
            <div className="bg-yellow-50 p-3 rounded-md">
              <p className="font-medium text-yellow-800">Active</p>
              <p className="text-2xl font-bold text-yellow-900">
                {prescriptions.filter(p => p.status === 'active').length}
              </p>
            </div>
            <div className="bg-red-50 p-3 rounded-md">
              <p className="font-medium text-red-800">On Hold</p>
              <p className="text-2xl font-bold text-red-900">
                {prescriptions.filter(p => p.status === 'on-hold').length}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NHSPrescriptionManagement;
