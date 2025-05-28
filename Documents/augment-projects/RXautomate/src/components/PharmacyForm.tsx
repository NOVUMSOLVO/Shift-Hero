"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../providers/auth-provider';

interface Organization {
  id: string;
  name: string;
}

interface PharmacyFormProps {
  mode: 'create' | 'edit';
  pharmacyId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const PharmacyForm: React.FC<PharmacyFormProps> = ({
  mode,
  pharmacyId,
  onSuccess,
  onCancel,
}) => {
  const { session } = useAuth();
  const router = useRouter();
  const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN';
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    address: '',
    postcode: '',
    phoneNumber: '',
    email: '',
    nhsContractNumber: '',
    organizationId: '',
    isActive: true,
  });

  // Fetch organizations for super admin
  useEffect(() => {
    if (isSuperAdmin) {
      const fetchOrganizations = async () => {
        try {
          const response = await fetch('/api/admin/organizations');
          const data = await response.json();
          setOrganizations(data.organizations);
        } catch (error) {
          console.error('Error fetching organizations:', error);
          setError('Failed to load organizations. Please try again.');
        }
      };
      
      fetchOrganizations();
    } else if (session?.user?.organizationId) {
      // Set organization ID for non-super admins
      setFormData(prev => ({
        ...prev,
        organizationId: session.user.organizationId as string,
      }));
    }
  }, [isSuperAdmin, session]);

  // Fetch pharmacy data if in edit mode
  useEffect(() => {
    if (mode === 'edit' && pharmacyId) {
      const fetchPharmacy = async () => {
        try {
          setLoading(true);
          const response = await fetch(`/api/admin/pharmacies/${pharmacyId}`);
          const data = await response.json();
          
          if (response.ok) {
            setFormData({
              name: data.name,
              slug: data.slug,
              address: data.address,
              postcode: data.postcode,
              phoneNumber: data.phoneNumber,
              email: data.email,
              nhsContractNumber: data.nhsContractNumber || '',
              organizationId: data.organizationId,
              isActive: data.isActive,
            });
          } else {
            setError(data.error || 'Failed to load pharmacy data');
          }
        } catch (error) {
          console.error('Error fetching pharmacy:', error);
          setError('Failed to load pharmacy data. Please try again.');
        } finally {
          setLoading(false);
        }
      };
      
      fetchPharmacy();
    }
  }, [mode, pharmacyId]);

  // Generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    // Handle checkbox inputs
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
      return;
    }
    
    // Auto-generate slug when name changes
    if (name === 'name') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        slug: generateSlug(value),
      }));
      return;
    }
    
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      // Validate form data
      if (!formData.name) {
        setError('Pharmacy name is required');
        return;
      }
      
      if (!formData.organizationId) {
        setError('Organization is required');
        return;
      }
      
      // Prepare API endpoint and method
      const url = mode === 'create'
        ? '/api/admin/pharmacies'
        : `/api/admin/pharmacies/${pharmacyId}`;
      
      const method = mode === 'create' ? 'POST' : 'PUT';
      
      // Submit form data
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSuccess(mode === 'create'
          ? 'Pharmacy created successfully!'
          : 'Pharmacy updated successfully!'
        );
        
        // Call success callback or redirect
        if (onSuccess) {
          onSuccess();
        } else {
          setTimeout(() => {
            router.push('/admin/pharmacies');
          }, 1500);
        }
      } else {
        setError(data.error || 'Failed to save pharmacy');
      }
    } catch (error) {
      console.error('Error saving pharmacy:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">
        {mode === 'create' ? 'Add New Pharmacy' : 'Edit Pharmacy'}
      </h2>
      
      {error && (
        <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {success && (
        <div className="mb-4 bg-green-50 border-l-4 border-green-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Organization Selection (Super Admin only) */}
        {isSuperAdmin && (
          <div>
            <label htmlFor="organizationId" className="block text-sm font-medium text-gray-700 mb-1">
              Organization <span className="text-red-500">*</span>
            </label>
            <select
              id="organizationId"
              name="organizationId"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-nhs-blue focus:border-nhs-blue"
              value={formData.organizationId}
              onChange={handleChange}
              required
            >
              <option value="">Select an organization</option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>
        )}
        
        {/* Pharmacy Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Pharmacy Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-nhs-blue focus:border-nhs-blue"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        
        {/* Pharmacy Slug */}
        <div>
          <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1">
            Slug <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="slug"
            name="slug"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-nhs-blue focus:border-nhs-blue"
            value={formData.slug}
            onChange={handleChange}
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Used in URLs. Auto-generated from name, but can be edited.
          </p>
        </div>
        
        {/* Address */}
        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
            Address <span className="text-red-500">*</span>
          </label>
          <textarea
            id="address"
            name="address"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-nhs-blue focus:border-nhs-blue"
            value={formData.address}
            onChange={handleChange}
            required
          />
        </div>
        
        {/* Postcode */}
        <div>
          <label htmlFor="postcode" className="block text-sm font-medium text-gray-700 mb-1">
            Postcode <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="postcode"
            name="postcode"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-nhs-blue focus:border-nhs-blue"
            value={formData.postcode}
            onChange={handleChange}
            required
          />
        </div>
        
        {/* Phone Number */}
        <div>
          <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            id="phoneNumber"
            name="phoneNumber"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-nhs-blue focus:border-nhs-blue"
            value={formData.phoneNumber}
            onChange={handleChange}
            required
          />
        </div>
        
        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            id="email"
            name="email"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-nhs-blue focus:border-nhs-blue"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        
        {/* NHS Contract Number */}
        <div>
          <label htmlFor="nhsContractNumber" className="block text-sm font-medium text-gray-700 mb-1">
            NHS Contract Number
          </label>
          <input
            type="text"
            id="nhsContractNumber"
            name="nhsContractNumber"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-nhs-blue focus:border-nhs-blue"
            value={formData.nhsContractNumber}
            onChange={handleChange}
          />
        </div>
        
        {/* Active Status */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="isActive"
            name="isActive"
            className="h-4 w-4 text-nhs-blue focus:ring-nhs-blue border-gray-300 rounded"
            checked={formData.isActive}
            onChange={handleChange}
          />
          <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
            Active
          </label>
        </div>
        
        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-nhs-blue text-white rounded-md hover:bg-nhs-dark-blue focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-nhs-blue"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {mode === 'create' ? 'Creating...' : 'Updating...'}
              </span>
            ) : (
              <span>{mode === 'create' ? 'Create Pharmacy' : 'Update Pharmacy'}</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PharmacyForm;
