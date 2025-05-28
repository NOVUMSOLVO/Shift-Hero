import { PrismaClient } from '@prisma/client';
import { NotificationService } from './NotificationService';
import { EPSService, Prescription } from './EPSService';

export enum AdherenceStatus {
  OPTIMAL = 'OPTIMAL',
  GOOD = 'GOOD',
  FAIR = 'FAIR',
  POOR = 'POOR',
  UNKNOWN = 'UNKNOWN'
}

export interface PatientAdherenceData {
  patientId: string;
  nhsNumber?: string;
  patientName: string;
  currentAdherenceStatus: AdherenceStatus;
  adherenceScore: number; // 0-100 score
  lastRefillDate?: Date;
  nextRefillDue?: Date;
  daysLate?: number;
  missedDoses?: number;
  medications: {
    name: string;
    adherenceScore: number;
    lastFilled?: Date;
    nextDue?: Date;
    daysSupply?: number;
    status: AdherenceStatus;
  }[];
  trend: 'IMPROVING' | 'STABLE' | 'DECLINING' | 'UNKNOWN';
  interventions: {
    date: Date;
    type: string;
    notes: string;
    performedBy: string;
  }[];
}

export interface AdherenceReminderConfig {
  reminderEnabled: boolean;
  daysBeforeRefill: number;
  reminderMethod: 'SMS' | 'EMAIL' | 'BOTH';
  secondaryReminderEnabled: boolean;
  secondaryReminderDays: number;
}

export class PatientAdherenceService {
  private prisma: PrismaClient;
  private notificationService: NotificationService;
  private epsService: EPSService;
  
  constructor(
    prisma: PrismaClient,
    notificationService: NotificationService,
    epsService: EPSService
  ) {
    this.prisma = prisma;
    this.notificationService = notificationService;
    this.epsService = epsService;
  }
  
  /**
   * Calculate adherence score for a patient
   * @param patientId The patient's ID
   */
  async calculateAdherence(patientId: string): Promise<PatientAdherenceData | null> {
    try {
      // Get patient details
      const patient = await this.prisma.patient.findUnique({
        where: { id: patientId },
        include: {
          prescriptions: {
            where: {
              status: {
                in: ['active', 'completed']
              },
              issuedDate: {
                gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) // Last 365 days
              }
            },
            orderBy: {
              issuedDate: 'desc'
            },
            take: 50 // Limit to recent prescriptions
          }
        }
      });
      
      if (!patient) {
        return null;
      }
      
      // Get adherence record or create default
      const adherenceRecord = await this.prisma.patientAdherence.findUnique({
        where: { patientId },
        include: {
          medicationAdherence: true,
          interventions: {
            orderBy: { date: 'desc' },
            take: 10
          }
        }
      }) || {
        patientId,
        adherenceScore: 0,
        lastCalculated: new Date(0), // Very old date
        status: AdherenceStatus.UNKNOWN,
        trend: 'UNKNOWN',
        medicationAdherence: [],
        interventions: []
      };
      
      // Get prescription history and calculate adherence
      // This is a simplified calculation - in a real system this would be more sophisticated
      let totalAdherenceScore = 0;
      let medications: any[] = [];
      
      // Group prescriptions by medication
      const medicationMap = new Map<string, Prescription[]>();
      patient.prescriptions.forEach(prescription => {
        const medName = this.getMedicationName(prescription);
        if (!medicationMap.has(medName)) {
          medicationMap.set(medName, []);
        }
        medicationMap.get(medName)?.push(prescription);
      });
      
      // Calculate adherence for each medication
      medicationMap.forEach((prescriptions, medicationName) => {
        // Sort by date
        prescriptions.sort((a, b) => 
          new Date(b.issuedDate).getTime() - new Date(a.issuedDate).getTime()
        );
        
        // Calculate adherence based on refill consistency
        const adherenceScore = this.calculateMedicationAdherence(prescriptions);
        
        // Get last filled date and next due date
        const lastFilled = prescriptions[0].issuedDate;
        let nextDue: Date | undefined = undefined;
        let daysSupply = 0;
        
        if (prescriptions[0]?.dispenseRequest?.quantity?.value) {
          // Estimate days supply based on quantity and dosage
          daysSupply = this.estimateDaysSupply(prescriptions[0]);
          
          if (daysSupply > 0) {
            nextDue = new Date(new Date(lastFilled).getTime() + daysSupply * 24 * 60 * 60 * 1000);
          }
        }
        
        // Map score to status
        let status = AdherenceStatus.UNKNOWN;
        if (adherenceScore >= 90) status = AdherenceStatus.OPTIMAL;
        else if (adherenceScore >= 75) status = AdherenceStatus.GOOD;
        else if (adherenceScore >= 50) status = AdherenceStatus.FAIR;
        else if (adherenceScore >= 0) status = AdherenceStatus.POOR;
        
        medications.push({
          name: medicationName,
          adherenceScore,
          lastFilled: new Date(lastFilled),
          nextDue,
          daysSupply,
          status
        });
        
        // Add to total score (weighted by recency)
        totalAdherenceScore += adherenceScore;
      });
      
      // Calculate overall adherence score
      const overallScore = medications.length > 0 
        ? Math.round(totalAdherenceScore / medications.length) 
        : 0;
      
      // Determine overall status
      let overallStatus = AdherenceStatus.UNKNOWN;
      if (overallScore >= 90) overallStatus = AdherenceStatus.OPTIMAL;
      else if (overallScore >= 75) overallStatus = AdherenceStatus.GOOD;
      else if (overallScore >= 50) overallStatus = AdherenceStatus.FAIR;
      else if (overallScore >= 0) overallStatus = AdherenceStatus.POOR;
      
      // Determine trend by comparing with previous calculations
      const previousScore = adherenceRecord.adherenceScore;
      let trend: 'IMPROVING' | 'STABLE' | 'DECLINING' | 'UNKNOWN' = 'UNKNOWN';
      
      if (previousScore > 0) {
        const scoreDifference = overallScore - previousScore;
        if (scoreDifference >= 5) trend = 'IMPROVING';
        else if (scoreDifference <= -5) trend = 'DECLINING';
        else trend = 'STABLE';
      }
      
      // Find most recent refill and next due refill
      let lastRefillDate: Date | undefined = undefined;
      let nextRefillDue: Date | undefined = undefined;
      let daysLate = 0;
      
      if (patient.prescriptions.length > 0) {
        lastRefillDate = new Date(patient.prescriptions[0].issuedDate);
        
        // Find the soonest due refill
        medications.forEach(med => {
          if (med.nextDue) {
            if (!nextRefillDue || med.nextDue < nextRefillDue) {
              nextRefillDue = med.nextDue;
            }
          }
        });
        
        // Calculate days late if applicable
        if (nextRefillDue && nextRefillDue < new Date()) {
          daysLate = Math.floor((new Date().getTime() - nextRefillDue.getTime()) / (24 * 60 * 60 * 1000));
        }
      }
      
      // Map interventions to the expected format
      const mappedInterventions = adherenceRecord.interventions.map(intervention => ({
        date: intervention.date,
        type: intervention.type,
        notes: intervention.notes,
        performedBy: intervention.userId
      }));
      
      // Build the final adherence data object
      const adherenceData: PatientAdherenceData = {
        patientId,
        nhsNumber: patient.nhsNumber || undefined,
        patientName: `${patient.firstName} ${patient.lastName}`,
        currentAdherenceStatus: overallStatus,
        adherenceScore: overallScore,
        lastRefillDate,
        nextRefillDue,
        daysLate: daysLate > 0 ? daysLate : undefined,
        medications,
        trend,
        interventions: mappedInterventions
      };
      
      // Update the adherence record in the database
      await this.prisma.patientAdherence.upsert({
        where: { patientId },
        create: {
          patientId,
          adherenceScore: overallScore,
          status: overallStatus,
          lastCalculated: new Date(),
          trend: trend
        },
        update: {
          adherenceScore: overallScore,
          status: overallStatus,
          lastCalculated: new Date(),
          trend: trend
        }
      });
      
      // Update or create medication adherence records
      for (const med of medications) {
        await this.prisma.medicationAdherence.upsert({
          where: {
            patientId_medicationName: {
              patientId,
              medicationName: med.name
            }
          },
          create: {
            patientId,
            medicationName: med.name,
            adherenceScore: med.adherenceScore,
            status: med.status,
            lastFilled: med.lastFilled,
            nextDue: med.nextDue,
            daysSupply: med.daysSupply || 0
          },
          update: {
            adherenceScore: med.adherenceScore,
            status: med.status,
            lastFilled: med.lastFilled,
            nextDue: med.nextDue,
            daysSupply: med.daysSupply || 0
          }
        });
      }
      
      return adherenceData;
      
    } catch (error) {
      console.error('Error calculating patient adherence:', error);
      throw error;
    }
  }
  
  /**
   * Check for patients who need adherence reminders and send them
   */
  async processAdherenceReminders(): Promise<number> {
    try {
      // Get pharmacy configuration
      const config = await this.getDefaultAdherenceConfig();
      
      if (!config.reminderEnabled) {
        return 0; // Reminders are disabled
      }
      
      const today = new Date();
      const reminderThreshold = new Date();
      reminderThreshold.setDate(today.getDate() + config.daysBeforeRefill);
      
      // Find medications due for refill within the reminder threshold
      const dueMedications = await this.prisma.medicationAdherence.findMany({
        where: {
          nextDue: {
            gte: today,
            lte: reminderThreshold
          }
        },
        include: {
          patient: true
        }
      });
      
      // Group by patient
      const patientMap = new Map<string, {patient: any, medications: string[]}>();
      
      dueMedications.forEach(med => {
        if (!patientMap.has(med.patientId)) {
          patientMap.set(med.patientId, { 
            patient: med.patient,
            medications: []
          });
        }
        patientMap.get(med.patientId)?.medications.push(med.medicationName);
      });
      
      // Send reminders
      let remindersSent = 0;
      
      for (const [patientId, data] of patientMap.entries()) {
        // Check if we already sent a reminder recently
        const recentReminder = await this.prisma.patientNotification.findFirst({
          where: {
            patientId,
            type: 'REFILL_REMINDER',
            sentAt: {
              gte: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000) // Last 2 days
            }
          }
        });
        
        if (recentReminder) {
          continue; // Skip if we sent a reminder recently
        }
        
        // Send reminder
        const { patient, medications } = data;
        
        if (!patient.phoneNumber && !patient.email) {
          continue; // No contact method available
        }
        
        // Create notification content
        const medicationList = medications.join(", ");
        const message = `Hello ${patient.firstName}, this is a reminder that you're due to refill ${medications.length > 1 ? 'these medications' : 'this medication'}: ${medicationList}. Please contact your pharmacy to arrange a refill.`;
        
        // Send notification based on preferred method
        if (config.reminderMethod === 'SMS' || config.reminderMethod === 'BOTH') {
          if (patient.phoneNumber) {
            await this.notificationService.sendNotification({
              type: 'SMS',
              title: 'Medication Refill Reminder',
              message,
              recipientId: patient.id,
              recipientName: `${patient.firstName} ${patient.lastName}`,
              recipientPhone: patient.phoneNumber
            });
          }
        }
        
        if (config.reminderMethod === 'EMAIL' || config.reminderMethod === 'BOTH') {
          if (patient.email) {
            await this.notificationService.sendNotification({
              type: 'EMAIL',
              title: 'Medication Refill Reminder',
              message,
              recipientId: patient.id,
              recipientName: `${patient.firstName} ${patient.lastName}`,
              recipientEmail: patient.email
            });
          }
        }
        
        // Log the notification
        await this.prisma.patientNotification.create({
          data: {
            patientId,
            type: 'REFILL_REMINDER',
            details: JSON.stringify({ medications }),
            sentAt: new Date()
          }
        });
        
        remindersSent++;
      }
      
      return remindersSent;
      
    } catch (error) {
      console.error('Error processing adherence reminders:', error);
      throw error;
    }
  }
  
  /**
   * Record an adherence intervention for a patient
   */
  async recordIntervention(
    patientId: string, 
    interventionType: string, 
    notes: string,
    userId: string
  ): Promise<any> {
    try {
      const intervention = await this.prisma.adherenceIntervention.create({
        data: {
          patientId,
          type: interventionType,
          notes,
          userId,
          date: new Date()
        }
      });
      
      return intervention;
    } catch (error) {
      console.error('Error recording adherence intervention:', error);
      throw error;
    }
  }
  
  /**
   * Get patients with poor adherence who might need intervention
   */
  async getPatientsNeedingIntervention(pharmacyId: string): Promise<any[]> {
    try {
      const adherenceRecords = await this.prisma.patientAdherence.findMany({
        where: {
          patient: {
            pharmacyId
          },
          OR: [
            { status: 'POOR' },
            { status: 'FAIR', trend: 'DECLINING' }
          ]
        },
        include: {
          patient: true,
          medicationAdherence: true,
          interventions: {
            orderBy: { date: 'desc' },
            take: 1
          }
        }
      });
      
      // Filter out patients who had recent interventions (in the last 14 days)
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      
      return adherenceRecords.filter(record => {
        // If no interventions or last intervention was more than 2 weeks ago
        return record.interventions.length === 0 || 
               record.interventions[0].date < twoWeeksAgo;
      }).map(record => ({
        patientId: record.patientId,
        patientName: `${record.patient.firstName} ${record.patient.lastName}`,
        adherenceScore: record.adherenceScore,
        status: record.status,
        trend: record.trend,
        medications: record.medicationAdherence.map(med => ({
          name: med.medicationName,
          score: med.adherenceScore,
          status: med.status
        })),
        lastIntervention: record.interventions[0]?.date
      }));
      
    } catch (error) {
      console.error('Error getting patients needing intervention:', error);
      throw error;
    }
  }
  
  /**
   * Get default adherence reminder configuration
   */
  private async getDefaultAdherenceConfig(): Promise<AdherenceReminderConfig> {
    // In a real app, this would be fetched from database settings
    return {
      reminderEnabled: true,
      daysBeforeRefill: 7,
      reminderMethod: 'SMS',
      secondaryReminderEnabled: true,
      secondaryReminderDays: 2
    };
  }
  
  /**
   * Calculate adherence score for a specific medication
   * This is a simplified algorithm - real-world adherence calculation would be more complex
   */
  private calculateMedicationAdherence(prescriptions: any[]): number {
    if (prescriptions.length < 2) {
      return 100; // Not enough data, assume perfect adherence
    }
    
    let onTimeRefills = 0;
    let lateRefills = 0;
    let veryLateRefills = 0;
    
    for (let i = 0; i < prescriptions.length - 1; i++) {
      const current = prescriptions[i];
      const previous = prescriptions[i + 1];
      
      // Calculate expected refill date based on previous prescription
      const daysSupply = this.estimateDaysSupply(previous);
      
      if (daysSupply <= 0) continue; // Skip if we can't determine days supply
      
      const previousDate = new Date(previous.issuedDate);
      const expectedRefill = new Date(previousDate.getTime() + daysSupply * 24 * 60 * 60 * 1000);
      const actualRefill = new Date(current.issuedDate);
      
      // Calculate days early/late
      const daysDifference = Math.floor((actualRefill.getTime() - expectedRefill.getTime()) / (24 * 60 * 60 * 1000));
      
      // Categorize refill
      if (daysDifference <= 3) {
        onTimeRefills++; // On time or up to 3 days late
      } else if (daysDifference <= 14) {
        lateRefills++; // 4-14 days late
      } else {
        veryLateRefills++; // More than 14 days late
      }
    }
    
    // Calculate score based on refill patterns
    const totalRefills = onTimeRefills + lateRefills + veryLateRefills;
    if (totalRefills === 0) return 100;
    
    // Scoring: on-time = 100%, late = 50%, very late = 0%
    return Math.round((onTimeRefills * 100 + lateRefills * 50) / totalRefills);
  }
  
  /**
   * Estimate the days supply for a prescription
   */
  private estimateDaysSupply(prescription: any): number {
    try {
      const quantity = prescription.dispenseRequest?.quantity?.value || 0;
      
      if (quantity <= 0 || !prescription.dosageInstruction?.[0]) {
        return 0;
      }
      
      // Try to parse dosage instructions
      const dosageInstr = prescription.dosageInstruction[0];
      let dosePerDay = 0;
      
      if (dosageInstr.timing?.repeat) {
        const repeat = dosageInstr.timing.repeat;
        
        if (repeat.frequency && repeat.period && repeat.periodUnit) {
          // Calculate doses per day
          if (repeat.periodUnit === 'day') {
            dosePerDay = repeat.frequency / repeat.period;
          } else if (repeat.periodUnit === 'week') {
            dosePerDay = (repeat.frequency / repeat.period) / 7;
          } else if (repeat.periodUnit === 'hour') {
            dosePerDay = (repeat.frequency / repeat.period) * 24;
          }
        }
      }
      
      // If we couldn't parse specific dosing, fall back to common patterns in the text
      if (dosePerDay <= 0 && dosageInstr.text) {
        const text = dosageInstr.text.toLowerCase();
        
        if (text.includes('once daily') || text.includes('once a day')) {
          dosePerDay = 1;
        } else if (text.includes('twice daily') || text.includes('twice a day') || text.includes('bid')) {
          dosePerDay = 2;
        } else if (text.includes('three times') || text.includes('thrice') || text.includes('tid')) {
          dosePerDay = 3;
        } else if (text.includes('four times') || text.includes('qid')) {
          dosePerDay = 4;
        } else if (text.includes('every 12 hours')) {
          dosePerDay = 2;
        } else if (text.includes('every 8 hours')) {
          dosePerDay = 3;
        } else if (text.includes('every 6 hours')) {
          dosePerDay = 4;
        }
      }
      
      // Default to once daily if we still can't determine
      if (dosePerDay <= 0) {
        dosePerDay = 1;
      }
      
      // Calculate days supply
      const dosesPerUnit = 1; // Default assumption: 1 tablet/capsule per dose
      const totalDoses = quantity * dosesPerUnit;
      return Math.round(totalDoses / dosePerDay);
      
    } catch (error) {
      console.error('Error estimating days supply:', error);
      return 0;
    }
  }
  
  /**
   * Extract medication name from prescription
   */
  private getMedicationName(prescription: any): string {
    if (prescription.medicationReference?.display) {
      return prescription.medicationReference.display;
    }
    if (prescription.medicationCodeableConcept?.coding?.[0]?.display) {
      return prescription.medicationCodeableConcept.coding[0].display;
    }
    return 'Unknown Medication';
  }
}
