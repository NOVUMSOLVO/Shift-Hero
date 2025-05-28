import axios from 'axios';
import { prisma } from '@/lib/db/prisma';

// Pharmacy System Integration Service
export class PharmacySystemService {
  private apiKey: string;
  private baseUrl: string;
  private headers: Record<string, string>;
  private systemType: string;

  constructor(pharmacyId: string, systemType: string) {
    this.systemType = systemType;
    this.apiKey = '';
    this.baseUrl = '';
    this.headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    
    // Initialize based on system type
    this.initializeSystem(pharmacyId, systemType);
  }

  /**
   * Initialize the pharmacy system integration
   * @param pharmacyId - The pharmacy ID
   * @param systemType - The pharmacy system type
   */
  private async initializeSystem(pharmacyId: string, systemType: string) {
    try {
      // Get integration details from database
      const integration = await prisma.pharmacyIntegration.findFirst({
        where: {
          pharmacyId: pharmacyId,
          integrationType: 'PHARMACY_SYSTEM',
          isActive: true,
        },
      });

      if (!integration) {
        throw new Error('No active pharmacy system integration found');
      }

      this.apiKey = integration.apiKey || '';
      
      // Set base URL based on system type
      switch (systemType.toLowerCase()) {
        case 'rxweb':
          this.baseUrl = 'https://api.rxweb.co.uk/';
          break;
        case 'pharmoutcomes':
          this.baseUrl = 'https://api.pharmoutcomes.org/';
          break;
        case 'proscript':
          this.baseUrl = 'https://api.proscript.co.uk/';
          break;
        default:
          throw new Error(`Unsupported pharmacy system: ${systemType}`);
      }

      this.headers['Authorization'] = `Bearer ${this.apiKey}`;
    } catch (error) {
      console.error('Error initializing pharmacy system:', error);
      throw error;
    }
  }

  /**
   * Get patient records from pharmacy system
   * @param searchParams - Search parameters
   * @returns Patient records
   */
  async getPatients(searchParams: Record<string, string>) {
    try {
      const response = await axios.get(
        `${this.baseUrl}patients`,
        { 
          headers: this.headers,
          params: searchParams
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching patients from pharmacy system:', error);
      throw error;
    }
  }

  /**
   * Get prescription records from pharmacy system
   * @param searchParams - Search parameters
   * @returns Prescription records
   */
  async getPrescriptions(searchParams: Record<string, string>) {
    try {
      const response = await axios.get(
        `${this.baseUrl}prescriptions`,
        { 
          headers: this.headers,
          params: searchParams
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching prescriptions from pharmacy system:', error);
      throw error;
    }
  }

  /**
   * Get inventory data from pharmacy system
   * @returns Inventory data
   */
  async getInventory() {
    try {
      const response = await axios.get(
        `${this.baseUrl}inventory`,
        { headers: this.headers }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching inventory from pharmacy system:', error);
      throw error;
    }
  }

  /**
   * Update prescription status in pharmacy system
   * @param prescriptionId - The prescription ID
   * @param status - The new status
   * @returns Updated prescription
   */
  async updatePrescriptionStatus(prescriptionId: string, status: string) {
    try {
      const response = await axios.put(
        `${this.baseUrl}prescriptions/${prescriptionId}`,
        { status: status },
        { headers: this.headers }
      );
      return response.data;
    } catch (error) {
      console.error('Error updating prescription status in pharmacy system:', error);
      throw error;
    }
  }

  /**
   * Create a new appointment in pharmacy system
   * @param appointmentData - The appointment data
   * @returns Created appointment
   */
  async createAppointment(appointmentData: any) {
    try {
      const response = await axios.post(
        `${this.baseUrl}appointments`,
        appointmentData,
        { headers: this.headers }
      );
      return response.data;
    } catch (error) {
      console.error('Error creating appointment in pharmacy system:', error);
      throw error;
    }
  }
}

// Factory function to create pharmacy system service
export function createPharmacySystemService(pharmacyId: string, systemType: string) {
  return new PharmacySystemService(pharmacyId, systemType);
}
