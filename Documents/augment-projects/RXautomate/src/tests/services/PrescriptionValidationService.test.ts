import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { PrescriptionValidationService, ValidationResult } from '../../services/PrescriptionValidationService';

// Mock dependencies
const mockPrisma = {
  prescription: {
    findUnique: jest.fn(),
  },
  auditLog: {
    create: jest.fn(),
  },
};

const mockEPSService = {
  // Add mock methods as needed
};

const mockNotificationService = {
  sendNotification: jest.fn(),
};

describe('PrescriptionValidationService', () => {
  let validationService: PrescriptionValidationService;
  
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Initialize the service with mocked dependencies
    validationService = new PrescriptionValidationService(
      mockPrisma as any,
      mockEPSService as any,
      mockNotificationService as any
    );
    
    // Mock the private methods for testing
    (validationService as any).simulateDrugInteractionCheck = jest.fn();
    (validationService as any).simulateDosageCheck = jest.fn();
    (validationService as any).simulateAllergyCheck = jest.fn();
    (validationService as any).simulateContraindicationCheck = jest.fn();
  });
  
  describe('validatePrescription', () => {
    it('should return a valid result when no issues are found', async () => {
      // Mock prescription data
      const mockPrescription = {
        id: 'test-prescription-id',
        prescriptionNumber: 'RX12345',
        patientId: 'test-patient-id',
        medications: [
          { id: 'med1', name: 'Amoxicillin', dosage: '500mg' }
        ],
        patient: {
          id: 'test-patient-id',
          age: 35,
          weight: 70,
          allergies: [],
          medications: [],
          conditions: []
        }
      };
      
      // Set up the mock returns
      mockPrisma.prescription.findUnique.mockResolvedValue(mockPrescription);
      (validationService as any).simulateDrugInteractionCheck.mockResolvedValue({
        hasInteractions: false,
        severity: 'NONE',
        description: '',
        interactingWith: []
      });
      (validationService as any).simulateDosageCheck.mockResolvedValue({
        isAppropriate: true,
        severity: 'NONE',
        description: ''
      });
      (validationService as any).simulateAllergyCheck.mockResolvedValue({
        hasAllergy: false,
        allergen: null
      });
      (validationService as any).simulateContraindicationCheck.mockResolvedValue({
        hasContraindication: false,
        condition: null,
        severity: 'NONE'
      });
      
      // Call the method
      const result = await validationService.validatePrescription('test-prescription-id');
      
      // Assertions
      expect(result).toBeDefined();
      expect(result.isValid).toBe(true);
      expect(result.severity).toBe('NONE');
      expect(result.issues).toHaveLength(0);
      expect(mockPrisma.auditLog.create).toHaveBeenCalled();
    });
    
    it('should detect drug interactions and return invalid result', async () => {
      // Mock prescription data
      const mockPrescription = {
        id: 'test-prescription-id',
        prescriptionNumber: 'RX12345',
        patientId: 'test-patient-id',
        medications: [
          { id: 'med1', name: 'Warfarin', dosage: '5mg' }
        ],
        patient: {
          id: 'test-patient-id',
          age: 65,
          weight: 75,
          allergies: [],
          medications: [{ name: 'Aspirin' }],
          conditions: []
        }
      };
      
      // Set up the mock returns
      mockPrisma.prescription.findUnique.mockResolvedValue(mockPrescription);
      (validationService as any).simulateDrugInteractionCheck.mockResolvedValue({
        hasInteractions: true,
        severity: 'HIGH',
        description: 'Increased risk of bleeding when warfarin is combined with aspirin',
        interactingWith: ['Aspirin']
      });
      (validationService as any).simulateDosageCheck.mockResolvedValue({
        isAppropriate: true,
        severity: 'NONE',
        description: ''
      });
      (validationService as any).simulateAllergyCheck.mockResolvedValue({
        hasAllergy: false,
        allergen: null
      });
      (validationService as any).simulateContraindicationCheck.mockResolvedValue({
        hasContraindication: false,
        condition: null,
        severity: 'NONE'
      });
      
      // Call the method
      const result = await validationService.validatePrescription('test-prescription-id');
      
      // Assertions
      expect(result).toBeDefined();
      expect(result.isValid).toBe(false);
      expect(result.severity).toBe('HIGH');
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].type).toBe('DRUG_INTERACTION');
      expect(mockPrisma.auditLog.create).toHaveBeenCalled();
    });
    
    it('should send a notification when critical issues are found', async () => {
      // Mock prescription data
      const mockPrescription = {
        id: 'test-prescription-id',
        prescriptionNumber: 'RX12345',
        patientId: 'test-patient-id',
        medications: [
          { id: 'med1', name: 'Amoxicillin', dosage: '500mg' }
        ],
        patient: {
          id: 'test-patient-id',
          age: 35,
          weight: 70,
          allergies: [{ substance: 'Penicillin' }],
          medications: [],
          conditions: []
        }
      };
      
      // Set up the mock returns
      mockPrisma.prescription.findUnique.mockResolvedValue(mockPrescription);
      (validationService as any).simulateDrugInteractionCheck.mockResolvedValue({
        hasInteractions: false,
        severity: 'NONE',
        description: '',
        interactingWith: []
      });
      (validationService as any).simulateDosageCheck.mockResolvedValue({
        isAppropriate: true,
        severity: 'NONE',
        description: ''
      });
      (validationService as any).simulateAllergyCheck.mockResolvedValue({
        hasAllergy: true,
        allergen: 'Penicillin'
      });
      (validationService as any).simulateContraindicationCheck.mockResolvedValue({
        hasContraindication: false,
        condition: null,
        severity: 'NONE'
      });
      
      // Call the method
      const result = await validationService.validatePrescription('test-prescription-id');
      
      // Assertions
      expect(result).toBeDefined();
      expect(result.isValid).toBe(false);
      expect(result.severity).toBe('CRITICAL');
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].type).toBe('ALLERGY');
      expect(mockNotificationService.sendNotification).toHaveBeenCalled();
      expect(mockPrisma.auditLog.create).toHaveBeenCalled();
    });
  });
});
