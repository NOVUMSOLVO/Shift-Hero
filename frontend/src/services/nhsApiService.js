/**
 * NHS API Service - Frontend integration for NHS Digital services
 * Provides client-side interface to NHS APIs including patient lookup,
 * exemption checking, and eligibility verification
 */

class NHSApiService {
  constructor() {
    this.baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    this.apiKey = process.env.REACT_APP_NHS_API_KEY;
    this.cache = new Map();
    this.cacheTimeout = 15 * 60 * 1000; // 15 minutes
  }

  /**
   * Get authorization headers for API requests
   */
  getHeaders() {
    const token = localStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
      'X-API-Key': this.apiKey,
      'X-Request-ID': this.generateRequestId(),
    };
  }

  /**
   * Generate unique request ID for tracking
   */
  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Handle API responses and errors
   */
  async handleResponse(response) {
    const data = await response.json();
    
    if (!response.ok) {
      const error = new Error(data.message || 'API request failed');
      error.status = response.status;
      error.data = data;
      throw error;
    }
    
    return data;
  }

  /**
   * Cache management for API responses
   */
  setCacheItem(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  getCacheItem(key) {
    const cached = this.cache.get(key);
    if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  /**
   * Validate NHS number format (client-side validation)
   */
  validateNHSNumber(nhsNumber) {
    // Remove spaces and validate format
    const cleanNumber = nhsNumber.replace(/\s/g, '');
    
    // Check length and digits only
    if (!/^\d{10}$/.test(cleanNumber)) {
      return false;
    }

    // Validate using modulus 11 checksum
    const digits = cleanNumber.split('').map(Number);
    const checkDigit = digits[9];
    
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += digits[i] * (10 - i);
    }
    
    const remainder = sum % 11;
    const expectedCheckDigit = remainder < 2 ? remainder : 11 - remainder;
    
    return checkDigit === expectedCheckDigit;
  }

  /**
   * Format NHS number for display (123 456 7890)
   */
  formatNHSNumber(nhsNumber) {
    const cleanNumber = nhsNumber.replace(/\s/g, '');
    if (cleanNumber.length === 10) {
      return `${cleanNumber.slice(0, 3)} ${cleanNumber.slice(3, 6)} ${cleanNumber.slice(6)}`;
    }
    return nhsNumber;
  }

  /**
   * Get patient details by NHS number
   */
  async getPatientByNhsNumber(nhsNumber) {
    const cleanNumber = nhsNumber.replace(/\s/g, '');
    
    if (!this.validateNHSNumber(cleanNumber)) {
      throw new Error('Invalid NHS number format');
    }

    const cacheKey = `patient_${cleanNumber}`;
    const cached = this.getCacheItem(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/nhs/patient/${cleanNumber}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      const data = await this.handleResponse(response);
      this.setCacheItem(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Error fetching patient details:', error);
      throw error;
    }
  }

  /**
   * Check patient exemption status
   */
  async checkExemptionStatus(nhsNumber) {
    const cleanNumber = nhsNumber.replace(/\s/g, '');
    
    if (!this.validateNHSNumber(cleanNumber)) {
      throw new Error('Invalid NHS number format');
    }

    const cacheKey = `exemption_${cleanNumber}`;
    const cached = this.getCacheItem(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/nhs/exemption/${cleanNumber}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      const data = await this.handleResponse(response);
      this.setCacheItem(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Error checking exemption status:', error);
      throw error;
    }
  }

  /**
   * Check patient eligibility for services
   */
  async checkEligibility(nhsNumber, serviceType = 'prescription') {
    const cleanNumber = nhsNumber.replace(/\s/g, '');
    
    if (!this.validateNHSNumber(cleanNumber)) {
      throw new Error('Invalid NHS number format');
    }

    const cacheKey = `eligibility_${cleanNumber}_${serviceType}`;
    const cached = this.getCacheItem(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/nhs/eligibility`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          nhsNumber: cleanNumber,
          serviceType,
        }),
      });

      const data = await this.handleResponse(response);
      this.setCacheItem(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Error checking eligibility:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive patient status (demographics, exemption, eligibility)
   */
  async getPatientStatus(nhsNumber, serviceType = 'prescription') {
    const cleanNumber = nhsNumber.replace(/\s/g, '');
    
    if (!this.validateNHSNumber(cleanNumber)) {
      throw new Error('Invalid NHS number format');
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/nhs/patient-status`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          nhsNumber: cleanNumber,
          serviceType,
        }),
      });

      const data = await this.handleResponse(response);
      
      // Cache individual components
      this.setCacheItem(`patient_${cleanNumber}`, data.patient);
      this.setCacheItem(`exemption_${cleanNumber}`, data.exemption);
      this.setCacheItem(`eligibility_${cleanNumber}_${serviceType}`, data.eligibility);
      
      return data;
    } catch (error) {
      console.error('Error getting patient status:', error);
      throw error;
    }
  }

  /**
   * Get patient prescriptions
   */
  async getPatientPrescriptions(nhsNumber, options = {}) {
    const cleanNumber = nhsNumber.replace(/\s/g, '');
    
    if (!this.validateNHSNumber(cleanNumber)) {
      throw new Error('Invalid NHS number format');
    }

    try {
      const queryParams = new URLSearchParams({
        nhsNumber: cleanNumber,
        ...options,
      });

      const response = await fetch(`${this.baseUrl}/api/nhs/prescriptions?${queryParams}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      throw error;
    }
  }

  /**
   * Update prescription status
   */
  async updatePrescriptionStatus(prescriptionId, status, notes = '') {
    try {
      const response = await fetch(`${this.baseUrl}/api/nhs/prescriptions/${prescriptionId}/status`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify({
          status,
          notes,
          timestamp: new Date().toISOString(),
        }),
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error updating prescription status:', error);
      throw error;
    }
  }

  /**
   * Search patients by demographics
   */
  async searchPatients(searchParams) {
    try {
      const response = await fetch(`${this.baseUrl}/api/nhs/patients/search`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(searchParams),
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error searching patients:', error);
      throw error;
    }
  }

  /**
   * Get API usage statistics
   */
  async getApiStats(dateRange = 'today') {
    try {
      const response = await fetch(`${this.baseUrl}/api/nhs/stats?range=${dateRange}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error fetching API stats:', error);
      throw error;
    }
  }

  /**
   * Clear cache for specific patient or all cached data
   */
  clearCache(nhsNumber = null) {
    if (nhsNumber) {
      const cleanNumber = nhsNumber.replace(/\s/g, '');
      const keysToDelete = [];
      
      for (const key of this.cache.keys()) {
        if (key.includes(cleanNumber)) {
          keysToDelete.push(key);
        }
      }
      
      keysToDelete.forEach(key => this.cache.delete(key));
    } else {
      this.cache.clear();
    }
  }

  /**
   * Get cached data summary for debugging
   */
  getCacheStats() {
    const stats = {
      totalItems: this.cache.size,
      items: [],
    };

    for (const [key, value] of this.cache.entries()) {
      stats.items.push({
        key,
        timestamp: value.timestamp,
        age: Date.now() - value.timestamp,
      });
    }

    return stats;
  }
}

// Export singleton instance
const nhsApiService = new NHSApiService();
export default nhsApiService;
