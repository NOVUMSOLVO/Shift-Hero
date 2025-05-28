import { PrismaClient } from '@prisma/client';
import { ValidationResult, ValidationIssue, ValidationSeverity, PrescriptionValidationService } from './PrescriptionValidationService';
import { EPSService } from './EPSService';
import { NotificationService } from './NotificationService';
import axios from 'axios';

/**
 * Enhanced AI-powered prescription validation service
 * Uses machine learning models to validate prescriptions with higher accuracy
 */
export class AIPrescriptionValidationService extends PrescriptionValidationService {
  private aiApiUrl: string;
  private apiKey: string;
  private enableLearning: boolean;

  constructor(
    prisma: PrismaClient,
    epsService: EPSService,
    notificationService: NotificationService,
    config: { 
      aiApiUrl?: string, 
      apiKey?: string, 
      enableLearning?: boolean
    } = {}
  ) {
    super(prisma, epsService, notificationService);
    
    this.aiApiUrl = config.aiApiUrl || process.env.AI_API_URL || 'https://api.rxautomate.ai/validate';
    this.apiKey = config.apiKey || process.env.AI_API_KEY || '';
    this.enableLearning = config.enableLearning ?? true;
  }

  /**
   * Override the base validatePrescription method with AI-enhanced validation
   */
  async validatePrescription(prescriptionId: string): Promise<ValidationResult> {
    try {
      // First, get basic validation result from parent class
      const baseResult = await super.validatePrescription(prescriptionId);
      
      // Get the prescription details
      const prescription = await this.prisma.prescription.findUnique({
        where: { id: prescriptionId },
        include: {
          medications: true,
          patient: {
            include: {
              allergies: true,
              medications: true,
              conditions: true,
            }
          }
        }
      });

      if (!prescription) {
        throw new Error(`Prescription with ID ${prescriptionId} not found`);
      }

      // Perform AI-based validation if API key is available
      if (this.apiKey) {
        try {
          // Prepare data for AI validation
          const validationData = {
            prescription: {
              id: prescription.id,
              medications: prescription.medications.map(med => ({
                name: med.name,
                dosage: med.dosage,
                frequency: med.frequency,
                route: med.route,
              })),
            },
            patient: {
              age: prescription.patient.age,
              weight: prescription.patient.weight,
              height: prescription.patient.height,
              gender: prescription.patient.gender,
              allergies: prescription.patient.allergies.map(a => a.substance),
              currentMedications: prescription.patient.medications.map(m => m.name),
              conditions: prescription.patient.conditions.map(c => c.name),
            }
          };

          // Call AI validation API
          const response = await axios.post(
            this.aiApiUrl,
            validationData,
            {
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
              }
            }
          );

          // Process AI validation results
          if (response.data && response.data.issues) {
            // Merge AI validation issues with base validation issues
            const aiIssues: ValidationIssue[] = response.data.issues.map((issue: any) => ({
              type: issue.type,
              severity: issue.severity as ValidationSeverity,
              description: issue.description,
              medications: issue.medications || [],
              confidence: issue.confidence || 1.0,
              aiGenerated: true
            }));

            // Filter out low confidence AI issues (below 0.7 threshold)
            const highConfidenceAiIssues = aiIssues.filter(issue => 
              !('confidence' in issue) || issue.confidence >= 0.7
            );

            // Combine issues and recalculate severity
            const combinedIssues = [...baseResult.issues, ...highConfidenceAiIssues];
            const overallSeverity = this.determineOverallSeverity(combinedIssues);
            
            // Create enhanced result
            const enhancedResult: ValidationResult = {
              ...baseResult,
              issues: combinedIssues,
              severity: overallSeverity,
              isValid: combinedIssues.length === 0,
              aiEnhanced: true
            };

            // If learning is enabled and there were pharmacist overrides,
            // send feedback to the AI model for continuous learning
            if (this.enableLearning && baseResult.pharmacistOverrides) {
              this.sendFeedbackToAiModel(prescriptionId, baseResult, enhancedResult);
            }

            return enhancedResult;
          }
        } catch (aiError) {
          console.error('AI validation error:', aiError);
          // Log the error but continue with base validation
          await this.prisma.auditLog.create({
            data: {
              action: 'AI_VALIDATION_ERROR',
              entityType: 'Prescription',
              entityId: prescriptionId,
              userId: 'SYSTEM',
              details: JSON.stringify({
                error: aiError.message,
                timestamp: new Date().toISOString()
              })
            }
          });
        }
      }

      // Return base validation result if AI validation fails or is not available
      return baseResult;
    } catch (error) {
      console.error('Error in AI-enhanced prescription validation:', error);
      throw error;
    }
  }

  /**
   * Determine the overall severity based on all validation issues
   */
  private determineOverallSeverity(issues: ValidationIssue[]): ValidationSeverity {
    if (issues.some(i => i.severity === 'CRITICAL')) return 'CRITICAL';
    if (issues.some(i => i.severity === 'HIGH')) return 'HIGH';
    if (issues.some(i => i.severity === 'MEDIUM')) return 'MEDIUM';
    if (issues.some(i => i.severity === 'LOW')) return 'LOW';
    return 'NONE';
  }

  /**
   * Send feedback to AI model for continuous learning
   */
  private async sendFeedbackToAiModel(
    prescriptionId: string, 
    originalResult: ValidationResult, 
    enhancedResult: ValidationResult
  ): Promise<void> {
    try {
      // Prepare feedback data
      const feedbackData = {
        prescriptionId,
        timestamp: new Date().toISOString(),
        originalIssues: originalResult.issues,
        enhancedIssues: enhancedResult.issues,
        pharmacistOverrides: originalResult.pharmacistOverrides,
        pharmacistNotes: originalResult.pharmacistNotes
      };

      // Send feedback to AI model
      await axios.post(
        `${this.aiApiUrl}/feedback`,
        feedbackData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );

      // Log feedback sent
      await this.prisma.auditLog.create({
        data: {
          action: 'AI_FEEDBACK_SENT',
          entityType: 'Prescription',
          entityId: prescriptionId,
          userId: 'SYSTEM',
          details: JSON.stringify({
            timestamp: new Date().toISOString()
          })
        }
      });
    } catch (error) {
      console.error('Error sending feedback to AI model:', error);
      // Log the error but continue
      await this.prisma.auditLog.create({
        data: {
          action: 'AI_FEEDBACK_ERROR',
          entityType: 'Prescription',
          entityId: prescriptionId,
          userId: 'SYSTEM',
          details: JSON.stringify({
            error: error.message,
            timestamp: new Date().toISOString()
          })
        }
      });
    }
  }
}
