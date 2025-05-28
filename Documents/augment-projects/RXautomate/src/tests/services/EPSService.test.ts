import axios from 'axios';
import { EPSService, Prescription, PrescriptionBundle } from '../../services/EPSService';
import AuditService from '../../services/AuditService';

// Mock dependencies
jest.mock('axios');
jest.mock('../../services/AuditService');
jest.mock('node-cache', () => {
  return jest.fn().mockImplementation(() => {
    let cache = {};
    return {
      get: jest.fn((key) => cache[key] || null),
      set: jest.fn((key, value) => { cache[key] = value; return true; }),
      del: jest.fn((key) => { delete cache[key]; return true; }),
    };
  });
});

// Mock environment variables
process.env.NHS_CLIENT_ID = 'test-client-id';
process.env.NHS_CLIENT_SECRET = 'test-client-secret';
process.env.NHS_API_KEY = 'test-api-key';

describe('EPSService', () => {
  let epsService: EPSService;
  const mockedAxios = axios as jest.Mocked<typeof axios>;
  const mockedAuditService = AuditService as jest.Mocked<typeof AuditService>;

  beforeEach(() => {
    jest.clearAllMocks();
    epsService = new EPSService();

    // Mock successful token response
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        access_token: 'test-access-token',
        expires_in: 3600,
        token_type: 'Bearer',
        scope: 'urn:nhsd:fhir:rest:read:medication urn:nhsd:fhir:rest:write:medication'
      }
    });
  });

  describe('getPrescription', () => {
    it('should fetch a prescription by ID', async () => {
      // Mock prescription data
      const mockPrescription: Prescription = {
        resourceType: 'MedicationRequest',
        id: 'test-prescription-id',
        status: 'active',
        intent: 'order',
        subject: {
          reference: 'Patient/9000000009'
        },
        authoredOn: '2023-01-01',
        requester: {
          reference: 'Practitioner/123456'
        }
      };

      // Mock successful API response
      mockedAxios.get.mockResolvedValueOnce({
        data: mockPrescription
      });

      // Call the method
      const result = await epsService.getPrescription('test-prescription-id');

      // Verify axios was called correctly
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(URLSearchParams),
        expect.any(Object)
      );
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('MedicationRequest/test-prescription-id'),
        expect.any(Object)
      );

      // Verify result
      expect(result).toEqual(mockPrescription);

      // Verify audit logging
      expect(mockedAuditService.logPrescriptionAction).toHaveBeenCalledWith(
        'GET_PRESCRIPTION',
        'test-prescription-id',
        expect.any(String),
        expect.any(Object)
      );
    });

    it('should handle API errors', async () => {
      // Mock API error
      const apiError = {
        response: {
          status: 404,
          data: {
            message: 'Prescription not found'
          }
        }
      };
      mockedAxios.get.mockRejectedValueOnce(apiError);

      // Call the method and expect it to throw
      await expect(epsService.getPrescription('non-existent-id')).rejects.toThrow();

      // Verify error logging
      expect(mockedAuditService.logNhsApiAction).toHaveBeenCalledWith(
        'API_ERROR',
        'SYSTEM',
        expect.any(Object),
        undefined
      );
    });
  });

  describe('getPharmacyPrescriptions', () => {
    it('should fetch prescriptions for a pharmacy', async () => {
      // Mock prescription bundle
      const mockBundle: PrescriptionBundle = {
        resourceType: 'Bundle',
        type: 'searchset',
        total: 2,
        link: [
          {
            relation: 'self',
            url: 'https://api.service.nhs.uk/electronic-prescriptions/FHIR/R4/MedicationRequest?performer=F1234'
          }
        ],
        entry: [
          {
            resource: {
              resourceType: 'MedicationRequest',
              id: 'prescription-1',
              status: 'active',
              intent: 'order',
              subject: {
                reference: 'Patient/9000000009'
              },
              authoredOn: '2023-01-01',
              requester: {
                reference: 'Practitioner/123456'
              }
            }
          },
          {
            resource: {
              resourceType: 'MedicationRequest',
              id: 'prescription-2',
              status: 'active',
              intent: 'order',
              subject: {
                reference: 'Patient/9000000010'
              },
              authoredOn: '2023-01-02',
              requester: {
                reference: 'Practitioner/123456'
              }
            }
          }
        ]
      };

      // Mock successful API response
      mockedAxios.get.mockResolvedValueOnce({
        data: mockBundle
      });

      // Call the method
      const result = await epsService.getPharmacyPrescriptions('F1234', { status: 'active' });

      // Verify axios was called correctly
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('MedicationRequest'),
        expect.objectContaining({
          params: expect.objectContaining({
            performer: 'F1234',
            status: 'active'
          })
        })
      );

      // Verify result
      expect(result).toEqual(mockBundle);
    });
  });

  describe('updatePrescriptionStatus', () => {
    it('should update a prescription status', async () => {
      // Mock current prescription
      const currentPrescription: Prescription = {
        resourceType: 'MedicationRequest',
        id: 'test-prescription-id',
        status: 'active',
        intent: 'order',
        subject: {
          reference: 'Patient/9000000009'
        },
        authoredOn: '2023-01-01',
        requester: {
          reference: 'Practitioner/123456'
        }
      };

      // Mock updated prescription
      const updatedPrescription: Prescription = {
        ...currentPrescription,
        status: 'completed'
      };

      // Mock API responses
      mockedAxios.get.mockResolvedValueOnce({
        data: currentPrescription
      });
      mockedAxios.put.mockResolvedValueOnce({
        data: updatedPrescription
      });

      // Call the method
      const result = await epsService.updatePrescriptionStatus(
        'test-prescription-id',
        'completed',
        { code: 'dispensed', display: 'Medication has been dispensed' }
      );

      // Verify axios was called correctly
      expect(mockedAxios.put).toHaveBeenCalledWith(
        expect.stringContaining('MedicationRequest/test-prescription-id'),
        expect.objectContaining({
          status: 'completed',
          statusReason: expect.any(Object)
        }),
        expect.any(Object)
      );

      // Verify result
      expect(result).toEqual(updatedPrescription);

      // Verify audit logging
      expect(mockedAuditService.logPrescriptionAction).toHaveBeenCalledWith(
        'UPDATE_PRESCRIPTION',
        'test-prescription-id',
        expect.any(String),
        expect.objectContaining({
          oldStatus: 'active',
          newStatus: 'completed'
        })
      );
    });
  });

  describe('convenience methods', () => {
    it('should cancel a prescription', async () => {
      // Setup spy on updatePrescriptionStatus
      const updateSpy = jest.spyOn(epsService, 'updatePrescriptionStatus').mockResolvedValueOnce({} as Prescription);

      // Call the method
      await epsService.cancelPrescription('test-prescription-id', {
        code: 'patient-requested',
        display: 'Cancelled at patient request'
      });

      // Verify updatePrescriptionStatus was called correctly
      expect(updateSpy).toHaveBeenCalledWith(
        'test-prescription-id',
        'cancelled',
        {
          code: 'patient-requested',
          display: 'Cancelled at patient request'
        }
      );
    });

    it('should complete a prescription', async () => {
      // Setup spy on updatePrescriptionStatus
      const updateSpy = jest.spyOn(epsService, 'updatePrescriptionStatus').mockResolvedValueOnce({} as Prescription);

      // Call the method
      await epsService.completePrescription('test-prescription-id');

      // Verify updatePrescriptionStatus was called correctly
      expect(updateSpy).toHaveBeenCalledWith(
        'test-prescription-id',
        'completed',
        {
          code: 'dispensed',
          display: 'Medication has been dispensed'
        }
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle errors when fetching a prescription', async () => {
      // Mock API error
      const apiError = {
        response: {
          status: 500,
          data: { message: 'Internal Server Error' },
        },
      };
      mockedAxios.get.mockRejectedValueOnce(apiError);

      // Call the method and expect it to throw
      await expect(epsService.getPrescription('test-prescription-id')).rejects.toThrow('Internal Server Error');

      // Verify audit logging
      expect(mockedAuditService.logPrescriptionAction).not.toHaveBeenCalled();
    });

    it('should handle errors when updating a prescription status', async () => {
      // Mock API error
      const apiError = {
        response: {
          status: 400,
          data: { message: 'Bad Request' },
        },
      };
      mockedAxios.put.mockRejectedValueOnce(apiError);

      // Call the method and expect it to throw
      await expect(
        epsService.updatePrescriptionStatus('test-prescription-id', 'completed', {
          code: 'dispensed',
          display: 'Medication has been dispensed',
        })
      ).rejects.toThrow('Bad Request');

      // Verify audit logging
      expect(mockedAuditService.logPrescriptionAction).not.toHaveBeenCalled();
    });
  });
});
