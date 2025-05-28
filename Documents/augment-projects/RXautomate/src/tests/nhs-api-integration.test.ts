import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals';
import NHSSpineService from '../services/NHSSpineService';
import AuditService from '../services/AuditService';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock AuditService
jest.mock('../services/AuditService', () => ({
  logNhsApiAction: jest.fn().mockResolvedValue(null),
  __esModule: true,
  default: {
    logNhsApiAction: jest.fn().mockResolvedValue(null),
  },
}));

describe('NHSSpineService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getPatientByNhsNumber', () => {
    it('should fetch patient details successfully', async () => {
      // Mock successful response
      const mockPatientData = {
        resourceType: 'Patient',
        id: '9000000009',
        identifier: [
          {
            system: 'https://fhir.nhs.uk/Id/nhs-number',
            value: '9000000009',
          },
        ],
        name: [
          {
            use: 'official',
            family: 'SMITH',
            given: ['John'],
          },
        ],
        gender: 'male',
        birthDate: '1970-01-01',
        address: [
          {
            use: 'home',
            line: ['1 High Street', 'Townville'],
            postalCode: 'LS1 1AA',
          },
        ],
        telecom: [
          {
            system: 'phone',
            value: '01234567890',
            use: 'home',
          },
        ],
      };

      // Mock axios get to return the mock data
      mockedAxios.get.mockResolvedValueOnce({ data: mockPatientData });
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          access_token: 'mock-token',
          expires_in: 3600,
          token_type: 'Bearer',
          scope: 'patient/*.read',
        },
      });

      // Call the service method
      const result = await NHSSpineService.getPatientByNhsNumber('9000000009');

      // Assertions
      expect(result).toEqual(mockPatientData);
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
      expect(AuditService.default.logNhsApiAction).toHaveBeenCalledWith(
        'GET_PATIENT',
        '9000000009',
        expect.any(Object),
        undefined
      );
    });

    it('should handle API errors correctly', async () => {
      // Mock error response
      const errorResponse = {
        response: {
          status: 404,
          data: {
            resourceType: 'OperationOutcome',
            issue: [
              {
                severity: 'error',
                code: 'not-found',
                details: {
                  coding: [
                    {
                      system: 'https://fhir.nhs.uk/CodeSystem/Spine-ErrorOrWarningCode',
                      code: 'PATIENT_NOT_FOUND',
                      display: 'Patient not found',
                    },
                  ],
                },
                diagnostics: 'Patient with NHS number 9000000001 not found',
              },
            ],
          },
        },
      };

      // Mock axios get to throw the error
      mockedAxios.get.mockRejectedValueOnce(errorResponse);
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          access_token: 'mock-token',
          expires_in: 3600,
          token_type: 'Bearer',
          scope: 'patient/*.read',
        },
      });

      // Call the service method and expect it to throw
      await expect(NHSSpineService.getPatientByNhsNumber('9000000001')).rejects.toThrow();

      // Assertions
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
      expect(AuditService.default.logNhsApiAction).toHaveBeenCalledWith(
        'API_ERROR',
        '9000000001',
        expect.any(Object),
        undefined
      );
    });
  });

  describe('checkExemptionStatus', () => {
    it('should fetch exemption status successfully', async () => {
      // Mock successful response
      const mockExemptionData = {
        exemptionStatus: true,
        exemptionType: 'MATERNITY',
        expiryDate: '2023-12-31',
        certificateNumber: 'M12345678',
      };

      // Mock axios get to return the mock data
      mockedAxios.get.mockResolvedValueOnce({ data: mockExemptionData });
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          access_token: 'mock-token',
          expires_in: 3600,
          token_type: 'Bearer',
          scope: 'patient/*.read',
        },
      });

      // Call the service method
      const result = await NHSSpineService.checkExemptionStatus('9000000009');

      // Assertions
      expect(result).toEqual(mockExemptionData);
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
      expect(AuditService.default.logNhsApiAction).toHaveBeenCalledWith(
        'CHECK_EXEMPTION',
        '9000000009',
        expect.any(Object),
        undefined
      );
    });
  });

  describe('verifyEligibility', () => {
    it('should verify eligibility successfully', async () => {
      // Mock successful response
      const mockEligibilityData = {
        eligibilityStatus: true,
        eligibilityReason: 'AGE_EXEMPT',
        validFrom: '2020-01-01',
        validTo: null,
      };

      // Mock axios post to return the mock data
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          access_token: 'mock-token',
          expires_in: 3600,
          token_type: 'Bearer',
          scope: 'patient/*.read',
        },
      }).mockResolvedValueOnce({ data: mockEligibilityData });

      // Call the service method
      const result = await NHSSpineService.verifyEligibility('9000000009', 'prescription');

      // Assertions
      expect(result).toEqual(mockEligibilityData);
      expect(mockedAxios.post).toHaveBeenCalledTimes(2); // Once for token, once for eligibility
      expect(AuditService.default.logNhsApiAction).toHaveBeenCalledWith(
        'VERIFY_ELIGIBILITY',
        '9000000009',
        expect.any(Object),
        undefined
      );
    });
  });

  describe('validateNHSNumber', () => {
    it('should validate a correct NHS number', () => {
      // Valid NHS number (using the modulus 11 algorithm)
      expect(NHSSpineService.validateNHSNumber('9434765870')).toBe(true);
    });

    it('should reject an invalid NHS number', () => {
      // Invalid NHS number
      expect(NHSSpineService.validateNHSNumber('1234567890')).toBe(false);
    });

    it('should handle NHS numbers with spaces', () => {
      // Valid NHS number with spaces
      expect(NHSSpineService.validateNHSNumber('943 476 5870')).toBe(true);
    });

    it('should reject NHS numbers with incorrect length', () => {
      // Too short
      expect(NHSSpineService.validateNHSNumber('12345')).toBe(false);
      // Too long
      expect(NHSSpineService.validateNHSNumber('12345678901')).toBe(false);
    });

    it('should reject NHS numbers with non-numeric characters', () => {
      expect(NHSSpineService.validateNHSNumber('123456789A')).toBe(false);
    });
  });
});
