import { NextRequest } from 'next/server';
import { POST } from '@/app/api/eps/route';
import NHSSpineService from '@/services/NHSSpineService';
import BSAService from '@/services/BSAService';

// Mock dependencies
jest.mock('@/services/NHSSpineService', () => ({
  getPatientByNhsNumber: jest.fn(),
  checkExemptionStatus: jest.fn(),
}));

jest.mock('@/services/BSAService', () => ({
  verifyEligibility: jest.fn(),
}));

describe('EPS API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/eps/check-eligibility', () => {
    it('should check eligibility for a patient', async () => {
      // Mock data
      const mockEligibilityResult = {
        eligibilityStatus: true,
        eligibilityReason: 'AGE_EXEMPT',
        validFrom: '2020-01-01',
      };

      // Mock BSAService
      (BSAService.checkEligibility as jest.Mock).mockResolvedValue(mockEligibilityResult);

      // Mock request data
      const requestData = {
        nhsNumber: '9000000009',
        serviceType: 'prescription',
      };

      // Create mock request
      const request = {
        url: 'http://localhost:3000/api/eps/check-eligibility',
        json: jest.fn().mockResolvedValue(requestData),
      } as unknown as NextRequest;

      // Call the handler
      const response = await POST(request);
      const data = await response.json();

      // Assertions
      expect(BSAService.checkEligibility).toHaveBeenCalledWith({
        nhsNumber: '9000000009',
        serviceType: 'prescription',
        checkDate: expect.any(String),
      });
      expect(data).toEqual(mockEligibilityResult);
    });

    it('should return 400 if NHS number is missing', async () => {
      // Mock request data
      const requestData = {
        serviceType: 'prescription',
      };

      // Create mock request
      const request = {
        url: 'http://localhost:3000/api/eps/check-eligibility',
        json: jest.fn().mockResolvedValue(requestData),
      } as unknown as NextRequest;

      // Call the handler
      const response = await POST(request);
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(400);
      expect(data.error).toBe('NHS number is required');
    });
  });

  describe('POST /api/eps/check-exemption', () => {
    it('should check exemption status for a patient', async () => {
      // Mock data
      const mockExemptionResult = {
        exemptionStatus: true,
        exemptionType: 'MATERNITY',
        expiryDate: '2023-12-31',
        certificateNumber: 'M12345678',
      };

      // Mock NHSSpineService
      (NHSSpineService.checkExemptionStatus as jest.Mock).mockResolvedValue(mockExemptionResult);

      // Mock request data
      const requestData = {
        nhsNumber: '9000000009',
      };

      // Create mock request
      const request = {
        url: 'http://localhost:3000/api/eps/check-exemption',
        json: jest.fn().mockResolvedValue(requestData),
      } as unknown as NextRequest;

      // Call the handler
      const response = await POST(request);
      const data = await response.json();

      // Assertions
      expect(NHSSpineService.checkExemptionStatus).toHaveBeenCalledWith('9000000009');
      expect(data).toEqual(mockExemptionResult);
    });
  });

  describe('POST /api/eps/check-patient-status', () => {
    it('should check comprehensive patient status', async () => {
      // Mock data
      const mockPatientDetails = {
        resourceType: 'Patient',
        id: 'patient-1',
        name: [{ family: 'Smith', given: ['John'] }],
        birthDate: '1970-01-01',
      };

      const mockExemptionResult = {
        exemptionStatus: true,
        exemptionType: 'MATERNITY',
        expiryDate: '2023-12-31',
        certificateNumber: 'M12345678',
      };

      const mockEligibilityResult = {
        eligibilityStatus: true,
        eligibilityReason: 'AGE_EXEMPT',
        validFrom: '2020-01-01',
      };

      // Mock services
      (NHSSpineService.getPatientByNhsNumber as jest.Mock).mockResolvedValue(mockPatientDetails);
      (NHSSpineService.checkExemptionStatus as jest.Mock).mockResolvedValue(mockExemptionResult);
      (BSAService.checkEligibility as jest.Mock).mockResolvedValue(mockEligibilityResult);

      // Mock request data
      const requestData = {
        nhsNumber: '9000000009',
        serviceType: 'prescription',
      };

      // Create mock request
      const request = {
        url: 'http://localhost:3000/api/eps/check-patient-status',
        json: jest.fn().mockResolvedValue(requestData),
      } as unknown as NextRequest;

      // Call the handler
      const response = await POST(request);
      const data = await response.json();

      // Assertions
      expect(NHSSpineService.getPatientByNhsNumber).toHaveBeenCalledWith('9000000009');
      expect(NHSSpineService.checkExemptionStatus).toHaveBeenCalledWith('9000000009');
      expect(BSAService.checkEligibility).toHaveBeenCalledWith({
        nhsNumber: '9000000009',
        serviceType: 'prescription',
        checkDate: expect.any(String),
      });
      
      expect(data.patient).toEqual(mockPatientDetails);
      expect(data.exemption).toEqual(mockExemptionResult);
      expect(data.eligibility).toEqual(mockEligibilityResult);
      expect(data.timestamp).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle errors when checking eligibility', async () => {
      // Mock error response
      const mockError = {
        response: {
          status: 500,
          data: { message: 'Internal Server Error' },
        },
      };
      (BSAService.checkEligibility as jest.Mock).mockRejectedValueOnce(mockError);

      // Mock request data
      const requestData = {
        nhsNumber: '9000000009',
        serviceType: 'prescription',
      };

      // Create mock request
      const request = {
        url: 'http://localhost:3000/api/eps/check-eligibility',
        json: jest.fn().mockResolvedValue(requestData),
      } as unknown as NextRequest;

      // Call the handler and expect it to throw
      const response = await POST(request);
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal Server Error');
    });

    it('should handle errors when checking exemption status', async () => {
      // Mock error response
      const mockError = {
        response: {
          status: 404,
          data: { message: 'Patient not found' },
        },
      };
      (NHSSpineService.checkExemptionStatus as jest.Mock).mockRejectedValueOnce(mockError);

      // Mock request data
      const requestData = {
        nhsNumber: '9000000009',
      };

      // Create mock request
      const request = {
        url: 'http://localhost:3000/api/eps/check-exemption',
        json: jest.fn().mockResolvedValue(requestData),
      } as unknown as NextRequest;

      // Call the handler and expect it to throw
      const response = await POST(request);
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(404);
      expect(data.error).toBe('Patient not found');
    });
  });
});
