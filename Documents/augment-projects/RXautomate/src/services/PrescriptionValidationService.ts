import { PrismaClient } from '@prisma/client';
import { EPSService } from './EPSService';
import { NotificationService } from './NotificationService';

/**
 * Service for validating prescriptions using AI-based analysis
 * Checks for drug interactions, dose verification, and potential contraindications
 */
export class PrescriptionValidationService {
  private prisma: PrismaClient;
  private epsService: EPSService;
  private notificationService: NotificationService;

  constructor(
    prisma: PrismaClient, 
    epsService: EPSService, 
    notificationService: NotificationService
  ) {
    this.prisma = prisma;
    this.epsService = epsService;
    this.notificationService = notificationService;
  }

  /**
   * Validate a prescription using AI analysis
   * @param prescriptionId The ID of the prescription to validate
   */
  async validatePrescription(prescriptionId: string): Promise<ValidationResult> {
    try {
      // Get the prescription details
      const prescription = await this.prisma.prescription.findUnique({
        where: { id: prescriptionId },
        include: {
          medications: true,
          patient: {
            include: {
              allergies: true,
              medications: true, // Current medications
              conditions: true,  // Medical conditions
            }
          }
        }
      });

      if (!prescription) {
        throw new Error(`Prescription with ID ${prescriptionId} not found`);
      }

      // Analyze for potential issues
      const validationResults: ValidationIssue[] = [];
      
      // Check for various validation issues
      await Promise.all([
        this.checkDrugInteractions(prescription, validationResults),
        this.checkDosage(prescription, validationResults),
        this.checkAllergies(prescription, validationResults),
        this.checkContraindications(prescription, validationResults)
      ]);

      // Create an audit log for the validation
      await this.prisma.auditLog.create({
        data: {
          action: 'PRESCRIPTION_VALIDATION',
          entityType: 'Prescription',
          entityId: prescriptionId,
          userId: 'SYSTEM', // Or pass in the actual user ID
          details: JSON.stringify({
            validationResults,
            timestamp: new Date().toISOString()
          })
        }
      });

      // If critical issues were found, send notification to pharmacist
      if (validationResults.some(r => r.severity === 'CRITICAL')) {
        await this.notificationService.sendNotification({
          type: 'PRESCRIPTION_VALIDATION',
          title: 'Critical Validation Issues',
          message: `Prescription ${prescription.prescriptionNumber} has critical validation issues that require review.`,
          recipientRole: 'PHARMACIST',
          data: { prescriptionId, validationResults }
        });
      }

      return {
        prescriptionId,
        patientId: prescription.patientId,
        isValid: validationResults.length === 0,
        severity: this.determineSeverity(validationResults),
        issues: validationResults,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error validating prescription:', error);
      throw error;
    }
  }

  /**
   * Check for potential drug interactions
   */
  private async checkDrugInteractions(
    prescription: any, 
    validationResults: ValidationIssue[]
  ): Promise<void> {
    const { patient, medications } = prescription;
    
    // Get all medications the patient is currently taking
    const currentMedications = patient.medications.map(m => m.name);
    
    // For each medication in the prescription
    for (const medication of medications) {
      // This would call an external drug interaction API in production
      // Using a simplified example here
      const interactionResult = await this.simulateDrugInteractionCheck(
        medication.name,
        currentMedications
      );
      
      if (interactionResult.hasInteractions) {
        validationResults.push({
          type: 'DRUG_INTERACTION',
          severity: interactionResult.severity,
          description: interactionResult.description,
          medications: [
            medication.name,
            ...interactionResult.interactingWith
          ]
        });
      }
    }
  }

  /**
   * Check if the dosage is appropriate
   */
  private async checkDosage(
    prescription: any, 
    validationResults: ValidationIssue[]
  ): Promise<void> {
    const { patient, medications } = prescription;
    
    // For each medication in the prescription
    for (const medication of medications) {
      // In production this would check against a medication database
      // Simplified example here
      const dosageResult = await this.simulateDosageCheck(
        medication.name,
        medication.dosage,
        patient.age,
        patient.weight,
        patient.conditions.map(c => c.name)
      );
      
      if (!dosageResult.isAppropriate) {
        validationResults.push({
          type: 'INAPPROPRIATE_DOSAGE',
          severity: dosageResult.severity,
          description: dosageResult.description,
          medications: [medication.name]
        });
      }
    }
  }

  /**
   * Check for allergies
   */
  private async checkAllergies(
    prescription: any, 
    validationResults: ValidationIssue[]
  ): Promise<void> {
    const { patient, medications } = prescription;
    const patientAllergies = patient.allergies.map(a => a.substance.toLowerCase());
    
    // For each medication in the prescription
    for (const medication of medications) {
      // In production this would check against a comprehensive allergen database
      // Simplified example here
      const allergyResult = await this.simulateAllergyCheck(
        medication.name,
        patientAllergies
      );
      
      if (allergyResult.hasAllergy) {
        validationResults.push({
          type: 'ALLERGY',
          severity: 'CRITICAL',
          description: `Patient is allergic to ${allergyResult.allergen} which is found in ${medication.name}`,
          medications: [medication.name]
        });
      }
    }
  }

  /**
   * Check for contraindications
   */
  private async checkContraindications(
    prescription: any, 
    validationResults: ValidationIssue[]
  ): Promise<void> {
    const { patient, medications } = prescription;
    const patientConditions = patient.conditions.map(c => c.name.toLowerCase());
    
    // For each medication in the prescription
    for (const medication of medications) {
      // In production this would check against a medical database
      // Simplified example
      const contraindicationResult = await this.simulateContraindicationCheck(
        medication.name,
        patientConditions
      );
      
      if (contraindicationResult.hasContraindication) {
        validationResults.push({
          type: 'CONTRAINDICATION',
          severity: contraindicationResult.severity,
          description: `${medication.name} is contraindicated for patients with ${contraindicationResult.condition}`,
          medications: [medication.name]
        });
      }
    }
  }

  /**
   * Determine the overall severity of validation issues
   */
  private determineSeverity(issues: ValidationIssue[]): ValidationSeverity {
    if (issues.some(i => i.severity === 'CRITICAL')) return 'CRITICAL';
    if (issues.some(i => i.severity === 'HIGH')) return 'HIGH';
    if (issues.some(i => i.severity === 'MEDIUM')) return 'MEDIUM';
    if (issues.some(i => i.severity === 'LOW')) return 'LOW';
    return 'NONE';
  }

  // Simulation methods for testing/development purposes
  // In production, these would be replaced with actual API calls to medication databases
  
  private async simulateDrugInteractionCheck(
    medicationName: string, 
    currentMedications: string[]
  ): Promise<any> {
    // Simplified simulation of drug interaction check
    const knownInteractions: Record<string, { with: string, severity: ValidationSeverity, description: string }[]> = {
      'warfarin': [
        { 
          with: 'aspirin', 
          severity: 'HIGH',
          description: 'Increased risk of bleeding when warfarin is combined with aspirin'
        }
      ],
      'fluoxetine': [
        {
          with: 'tramadol',
          severity: 'CRITICAL',
          description: 'Risk of serotonin syndrome when fluoxetine is combined with tramadol'
        }
      ]
    };
    
    const interactions = knownInteractions[medicationName.toLowerCase()] || [];
    const interactingWith = interactions
      .filter(i => currentMedications.some(med => med.toLowerCase() === i.with))
      .map(i => ({ medication: i.with, severity: i.severity, description: i.description }));
    
    return {
      hasInteractions: interactingWith.length > 0,
      severity: interactingWith.length > 0 ? 
        interactingWith.reduce((max, i) => 
          this.compareSeverity(max, i.severity) === max ? max : i.severity, 'LOW' as ValidationSeverity) : 'NONE',
      description: interactingWith.map(i => i.description).join('; '),
      interactingWith: interactingWith.map(i => i.medication)
    };
  }

  private async simulateDosageCheck(
    medicationName: string,
    dosage: string,
    patientAge: number,
    patientWeight: number,
    conditions: string[]
  ): Promise<any> {
    // Simplified example - in production this would be a complex calculation
    // based on medication databases, patient parameters, and clinical guidelines
    
    // For demonstration purposes, let's assume we found an issue with certain medications
    const dosageIssues: Record<string, { isAppropriate: boolean, severity: ValidationSeverity, description: string }> = {
      'metformin 1000mg': { 
        isAppropriate: false, 
        severity: 'MEDIUM', 
        description: 'Dosage of metformin may be too high for patient weight'
      }
    };
    
    const dosageKey = `${medicationName.toLowerCase()} ${dosage.toLowerCase()}`;
    const issue = dosageIssues[dosageKey];
    
    return issue || { isAppropriate: true, severity: 'NONE', description: '' };
  }

  private async simulateAllergyCheck(
    medicationName: string,
    patientAllergies: string[]
  ): Promise<any> {
    // Map of medications to their components that may cause allergies
    const medicationComponents: Record<string, string[]> = {
      'amoxicillin': ['penicillin'],
      'augmentin': ['penicillin', 'clavulanic acid'],
      'aspirin': ['salicylates'],
      'ibuprofen': ['nsaids']
    };
    
    const components = medicationComponents[medicationName.toLowerCase()] || [];
    const matchingAllergy = components.find(c => 
      patientAllergies.some(allergy => allergy.includes(c)));
    
    return {
      hasAllergy: Boolean(matchingAllergy),
      allergen: matchingAllergy
    };
  }

  private async simulateContraindicationCheck(
    medicationName: string,
    patientConditions: string[]
  ): Promise<any> {
    // Map of medications to conditions they are contraindicated for
    const contraindications: Record<string, { condition: string, severity: ValidationSeverity }[]> = {
      'ibuprofen': [
        { condition: 'peptic ulcer', severity: 'HIGH' },
        { condition: 'kidney disease', severity: 'MEDIUM' }
      ],
      'metformin': [
        { condition: 'kidney failure', severity: 'CRITICAL' }
      ],
      'propranolol': [
        { condition: 'asthma', severity: 'CRITICAL' },
        { condition: 'heart block', severity: 'HIGH' }
      ]
    };
    
    const medicationContraindications = contraindications[medicationName.toLowerCase()] || [];
    const matchingContraindication = medicationContraindications.find(c => 
      patientConditions.some(condition => condition.includes(c.condition)));
    
    return {
      hasContraindication: Boolean(matchingContraindication),
      condition: matchingContraindication?.condition,
      severity: matchingContraindication?.severity || 'NONE'
    };
  }
  
  private compareSeverity(a: ValidationSeverity, b: ValidationSeverity): ValidationSeverity {
    const severityRank = {
      'CRITICAL': 4,
      'HIGH': 3,
      'MEDIUM': 2,
      'LOW': 1,
      'NONE': 0
    };
    
    return severityRank[a] >= severityRank[b] ? a : b;
  }
}

// Types used by the service
export type ValidationSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';

export interface ValidationIssue {
  type: 'DRUG_INTERACTION' | 'INAPPROPRIATE_DOSAGE' | 'ALLERGY' | 'CONTRAINDICATION';
  severity: ValidationSeverity;
  description: string;
  medications: string[];
}

export interface ValidationResult {
  prescriptionId: string;
  patientId: string;
  isValid: boolean;
  severity: ValidationSeverity;
  issues: ValidationIssue[];
  timestamp: Date;
}
