import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { GET, POST } from '@/app/api/prescriptions/route';
import EPSService from '@/services/EPSService';
import InventoryPrescriptionService from '@/services/InventoryPrescriptionService';

// Mock dependencies
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@/services/EPSService', () => ({
  getPharmacyPrescriptions: jest.fn(),
  getPatientPrescriptions: jest.fn(),
  searchPrescriptions: jest.fn(),
  getPrescription: jest.fn(),
  completePrescription: jest.fn(),
  cancelPrescription: jest.fn(),
}));

jest.mock('@/services/InventoryPrescriptionService', () => ({
  checkPrescriptionStock: jest.fn(),
  updateInventoryAfterDispensing: jest.fn(),
}));

describe('Prescriptions API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'test-user-id', name: 'Test User' },
    });
  });

  describe('GET /api/prescriptions', () => {
    it('should return prescriptions for a pharmacy', async () => {
      // Mock data
      const mockPrescriptions = {
        resourceType: 'Bundle',
        entry: [
          { resource: { id: 'prescription-1' } },
          { resource: { id: 'prescription-2' } },
        ],
      };

      // Mock EPSService
      (EPSService.getPharmacyPrescriptions as jest.Mock).mockResolvedValue(mockPrescriptions);

      // Create mock request
      const request = {
        url: 'http://localhost:3000/api/prescriptions?pharmacyOdsCode=F1234&status=active',
      } as unknown as NextRequest;

      // Call the handler
      const response = await GET(request);
      const data = await response.json();

      // Assertions
      expect(EPSService.getPharmacyPrescriptions).toHaveBeenCalledWith('F1234', {
        status: 'active',
        _sort: 'dateWritten:desc',
      });
      expect(data).toEqual(mockPrescriptions);
    });

    it('should return prescriptions for a patient', async () => {
      // Mock data
      const mockPrescriptions = {
        resourceType: 'Bundle',
        entry: [
          { resource: { id: 'prescription-1' } },
          { resource: { id: 'prescription-2' } },
        ],
      };

      // Mock EPSService
      (EPSService.getPatientPrescriptions as jest.Mock).mockResolvedValue(mockPrescriptions);

      // Create mock request
      const request = {
        url: 'http://localhost:3000/api/prescriptions?nhsNumber=9000000009&status=active',
      } as unknown as NextRequest;

      // Call the handler
      const response = await GET(request);
      const data = await response.json();

      // Assertions
      expect(EPSService.getPatientPrescriptions).toHaveBeenCalledWith('9000000009', {
        status: 'active',
        _sort: 'dateWritten:desc',
      });
      expect(data).toEqual(mockPrescriptions);
    });

    it('should return 400 if neither pharmacyOdsCode nor nhsNumber is provided', async () => {
      // Create mock request
      const request = {
        url: 'http://localhost:3000/api/prescriptions?status=active',
      } as unknown as NextRequest;

      // Call the handler
      const response = await GET(request);
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(400);
      expect(data.error).toBe('Either pharmacyOdsCode or nhsNumber is required');
    });

    it('should return 401 if not authenticated', async () => {
      // Mock unauthenticated session
      (getServerSession as jest.Mock).mockResolvedValue(null);

      // Create mock request
      const request = {
        url: 'http://localhost:3000/api/prescriptions?pharmacyOdsCode=F1234',
      } as unknown as NextRequest;

      // Call the handler
      const response = await GET(request);
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('POST /api/prescriptions/search', () => {
    it('should search prescriptions with provided parameters', async () => {
      // Mock data
      const mockSearchResults = {
        resourceType: 'Bundle',
        entry: [
          { resource: { id: 'prescription-1' } },
          { resource: { id: 'prescription-2' } },
        ],
      };

      // Mock EPSService
      (EPSService.searchPrescriptions as jest.Mock).mockResolvedValue(mockSearchResults);

      // Mock search parameters
      const searchParams = {
        status: 'active',
        patient: '9000000009',
        _sort: 'dateWritten:desc',
      };

      // Create mock request
      const request = {
        url: 'http://localhost:3000/api/prescriptions/search',
        json: jest.fn().mockResolvedValue(searchParams),
      } as unknown as NextRequest;

      // Call the handler
      const response = await POST(request);
      const data = await response.json();

      // Assertions
      expect(EPSService.searchPrescriptions).toHaveBeenCalledWith(searchParams);
      expect(data).toEqual(mockSearchResults);
    });
  });

  describe('POST /api/prescriptions/batch', () => {
    it('should process a batch of prescriptions', async () => {
      // Mock data
      const mockPrescription = {
        id: 'prescription-1',
        status: 'completed',
      };

      // Mock services
      (EPSService.getPrescription as jest.Mock).mockResolvedValue(mockPrescription);
      (InventoryPrescriptionService.checkPrescriptionStock as jest.Mock).mockResolvedValue({
        anyOutOfStock: false,
        items: [],
      });
      (EPSService.completePrescription as jest.Mock).mockResolvedValue({
        ...mockPrescription,
        status: 'completed',
      });
      (InventoryPrescriptionService.updateInventoryAfterDispensing as jest.Mock).mockResolvedValue({
        success: true,
        updatedItems: [],
      });

      // Mock batch request
      const batchRequest = {
        action: 'dispense',
        prescriptionIds: ['prescription-1', 'prescription-2'],
      };

      // Create mock request
      const request = {
        url: 'http://localhost:3000/api/prescriptions/batch',
        json: jest.fn().mockResolvedValue(batchRequest),
      } as unknown as NextRequest;

      // Call the handler
      const response = await POST(request);
      const data = await response.json();

      // Assertions
      expect(EPSService.getPrescription).toHaveBeenCalledTimes(2);
      expect(EPSService.completePrescription).toHaveBeenCalledTimes(2);
      expect(InventoryPrescriptionService.updateInventoryAfterDispensing).toHaveBeenCalledTimes(2);
      expect(data.action).toBe('dispense');
      expect(data.results.length).toBe(2);
      expect(data.results[0].success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle errors when fetching prescriptions for a pharmacy', async () => {
      // Mock error response
      const mockError = {
        response: {
          status: 500,
          data: { message: 'Internal Server Error' },
        },
      };
      (EPSService.getPharmacyPrescriptions as jest.Mock).mockRejectedValueOnce(mockError);

      // Create mock request
      const request = {
        url: 'http://localhost:3000/api/prescriptions?pharmacyOdsCode=F1234&status=active',
      } as unknown as NextRequest;

      // Call the handler and expect it to throw
      const response = await GET(request);
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal Server Error');
    });

    it('should handle errors when searching prescriptions', async () => {
      // Mock error response
      const mockError = {
        response: {
          status: 400,
          data: { message: 'Bad Request' },
        },
      };
      (EPSService.searchPrescriptions as jest.Mock).mockRejectedValueOnce(mockError);

      // Mock search parameters
      const searchParams = {
        status: 'active',
        patient: '9000000009',
        _sort: 'dateWritten:desc',
      };

      // Create mock request
      const request = {
        url: 'http://localhost:3000/api/prescriptions/search',
        json: jest.fn().mockResolvedValue(searchParams),
      } as unknown as NextRequest;

      // Call the handler and expect it to throw
      const response = await POST(request);
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(400);
      expect(data.error).toBe('Bad Request');
    });
  });
});
