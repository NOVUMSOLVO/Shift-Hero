import axios from 'axios';
import { prisma } from '@/lib/db/prisma';

// Wholesaler Integration Service
export class WholesalerService {
  private apiKey: string;
  private baseUrl: string;
  private headers: Record<string, string>;
  private wholesalerName: string;

  constructor(pharmacyId: string, wholesalerName: string) {
    this.wholesalerName = wholesalerName;
    this.apiKey = '';
    this.baseUrl = '';
    this.headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    
    // Initialize based on wholesaler
    this.initializeWholesaler(pharmacyId, wholesalerName);
  }

  /**
   * Initialize the wholesaler integration
   * @param pharmacyId - The pharmacy ID
   * @param wholesalerName - The wholesaler name
   */
  private async initializeWholesaler(pharmacyId: string, wholesalerName: string) {
    try {
      // Get integration details from database
      const integration = await prisma.pharmacyIntegration.findFirst({
        where: {
          pharmacyId: pharmacyId,
          integrationType: 'WHOLESALER',
          isActive: true,
        },
      });

      if (!integration) {
        throw new Error('No active wholesaler integration found');
      }

      this.apiKey = integration.apiKey || '';
      
      // Set base URL based on wholesaler
      switch (wholesalerName.toLowerCase()) {
        case 'aah':
          this.baseUrl = 'https://api.aah.co.uk/';
          break;
        case 'alliance':
          this.baseUrl = 'https://api.alliance-healthcare.co.uk/';
          break;
        case 'phoenix':
          this.baseUrl = 'https://api.phoenix-healthcare.co.uk/';
          break;
        default:
          throw new Error(`Unsupported wholesaler: ${wholesalerName}`);
      }

      this.headers['Authorization'] = `Bearer ${this.apiKey}`;
    } catch (error) {
      console.error('Error initializing wholesaler:', error);
      throw error;
    }
  }

  /**
   * Get product catalog from wholesaler
   * @param searchParams - Search parameters
   * @returns Product catalog
   */
  async getProductCatalog(searchParams: Record<string, string> = {}) {
    try {
      const response = await axios.get(
        `${this.baseUrl}products`,
        { 
          headers: this.headers,
          params: searchParams
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching product catalog from ${this.wholesalerName}:`, error);
      throw error;
    }
  }

  /**
   * Check product availability
   * @param productCode - The product code
   * @returns Availability information
   */
  async checkProductAvailability(productCode: string) {
    try {
      const response = await axios.get(
        `${this.baseUrl}products/${productCode}/availability`,
        { headers: this.headers }
      );
      return response.data;
    } catch (error) {
      console.error(`Error checking product availability from ${this.wholesalerName}:`, error);
      throw error;
    }
  }

  /**
   * Place an order with the wholesaler
   * @param orderData - The order data
   * @returns Order confirmation
   */
  async placeOrder(orderData: any) {
    try {
      const response = await axios.post(
        `${this.baseUrl}orders`,
        orderData,
        { headers: this.headers }
      );
      return response.data;
    } catch (error) {
      console.error(`Error placing order with ${this.wholesalerName}:`, error);
      throw error;
    }
  }

  /**
   * Get order status
   * @param orderId - The order ID
   * @returns Order status
   */
  async getOrderStatus(orderId: string) {
    try {
      const response = await axios.get(
        `${this.baseUrl}orders/${orderId}`,
        { headers: this.headers }
      );
      return response.data;
    } catch (error) {
      console.error(`Error getting order status from ${this.wholesalerName}:`, error);
      throw error;
    }
  }

  /**
   * Get order history
   * @param startDate - Start date for order history
   * @param endDate - End date for order history
   * @returns Order history
   */
  async getOrderHistory(startDate: string, endDate: string) {
    try {
      const response = await axios.get(
        `${this.baseUrl}orders/history`,
        { 
          headers: this.headers,
          params: {
            startDate,
            endDate
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Error getting order history from ${this.wholesalerName}:`, error);
      throw error;
    }
  }
}

// Factory function to create wholesaler service
export function createWholesalerService(pharmacyId: string, wholesalerName: string) {
  return new WholesalerService(pharmacyId, wholesalerName);
}
