import { PrismaClient } from '@prisma/client';
import { PatientAdherenceService } from './PatientAdherenceService';

export interface PharmacyMetrics {
  pharmacyId: string;
  pharmacyName: string;
  period: {
    start: Date;
    end: Date;
  };
  prescriptionMetrics: {
    totalPrescriptions: number;
    completedPrescriptions: number;
    pendingPrescriptions: number;
    validationAccuracy: number;
    averageProcessingTime: number; // in minutes
    peakHours: { hour: number; count: number }[];
  };
  adherenceMetrics: {
    averageAdherenceScore: number;
    patientsOptimal: number;
    patientsGood: number;
    patientsFair: number;
    patientsPoor: number;
    interventionsPerformed: number;
    interventionSuccessRate: number;
  };
  financialMetrics: {
    revenue: number;
    dispensingFees: number;
    averageValuePerPrescription: number;
    costSavings: number;
  };
  operationalMetrics: {
    stockTurns: number;
    outOfStockIncidents: number;
    staffProductivity: number;
    errorRate: number;
  };
  aiMetrics: {
    totalAIValidations: number;
    aiAccuracy: number;
    timeSavedByAI: number; // in hours
    flaggedPrescriptions: number;
    falsePositives: number;
  };
}

export interface ROIMetrics {
  pharmacyId: string;
  timeframe: 'monthly' | 'quarterly' | 'yearly';
  costSavings: {
    staffTimeSaved: number; // in hours
    reducedErrors: number;
    improvedCompliance: number;
    operationalEfficiency: number;
  };
  systemCosts: {
    subscriptionFee: number;
    trainingCosts: number;
    maintenanceCosts: number;
  };
  netSavings: number;
  roi: number; // percentage
  paybackPeriod: number; // in months
}

export interface TrendAnalysis {
  metric: string;
  period: string;
  trend: 'increasing' | 'decreasing' | 'stable';
  changePercentage: number;
  forecast: number[];
}

export interface BusinessInsight {
  id: string;
  type: 'recommendation' | 'alert' | 'opportunity';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impact: string;
  actionItems: string[];
  dataPoints: Record<string, any>;
  generatedAt: Date;
}

export class BusinessIntelligenceService {
  private prisma: PrismaClient;
  private adherenceService: PatientAdherenceService;

  constructor(prisma: PrismaClient, adherenceService: PatientAdherenceService) {
    this.prisma = prisma;
    this.adherenceService = adherenceService;
  }

  /**
   * Generate comprehensive pharmacy metrics for a given period
   */
  async generatePharmacyMetrics(
    pharmacyId: string,
    startDate: Date,
    endDate: Date
  ): Promise<PharmacyMetrics> {
    try {
      // Get pharmacy details
      const pharmacy = await this.prisma.pharmacy.findUnique({
        where: { id: pharmacyId }
      });

      if (!pharmacy) {
        throw new Error(`Pharmacy with ID ${pharmacyId} not found`);
      }

      // Get prescription metrics
      const prescriptionMetrics = await this.calculatePrescriptionMetrics(
        pharmacyId,
        startDate,
        endDate
      );

      // Get adherence metrics
      const adherenceMetrics = await this.calculateAdherenceMetrics(
        pharmacyId,
        startDate,
        endDate
      );

      // Get financial metrics
      const financialMetrics = await this.calculateFinancialMetrics(
        pharmacyId,
        startDate,
        endDate
      );

      // Get operational metrics
      const operationalMetrics = await this.calculateOperationalMetrics(
        pharmacyId,
        startDate,
        endDate
      );

      // Get AI metrics
      const aiMetrics = await this.calculateAIMetrics(
        pharmacyId,
        startDate,
        endDate
      );

      return {
        pharmacyId,
        pharmacyName: pharmacy.name,
        period: { start: startDate, end: endDate },
        prescriptionMetrics,
        adherenceMetrics,
        financialMetrics,
        operationalMetrics,
        aiMetrics
      };
    } catch (error) {
      console.error('Error generating pharmacy metrics:', error);
      throw error;
    }
  }

  /**
   * Calculate prescription-related metrics
   */
  private async calculatePrescriptionMetrics(
    pharmacyId: string,
    startDate: Date,
    endDate: Date
  ) {
    const prescriptions = await this.prisma.prescription.findMany({
      where: {
        pharmacyId,
        issuedDate: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        validationResults: true
      }
    });

    const totalPrescriptions = prescriptions.length;
    const completedPrescriptions = prescriptions.filter(p => p.status === 'completed').length;
    const pendingPrescriptions = prescriptions.filter(p => p.status === 'pending').length;

    // Calculate validation accuracy
    const validatedPrescriptions = prescriptions.filter(p => p.validationResults.length > 0);
    const accurateValidations = validatedPrescriptions.filter(p => 
      p.validationResults.some(v => v.isAccurate === true)
    ).length;
    const validationAccuracy = validatedPrescriptions.length > 0 
      ? (accurateValidations / validatedPrescriptions.length) * 100 
      : 0;

    // Calculate average processing time (mock calculation)
    const averageProcessingTime = Math.round(Math.random() * 15 + 5); // 5-20 minutes

    // Calculate peak hours
    const hourCounts = new Array(24).fill(0);
    prescriptions.forEach(p => {
      const hour = new Date(p.issuedDate).getHours();
      hourCounts[hour]++;
    });
    const peakHours = hourCounts
      .map((count, hour) => ({ hour, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalPrescriptions,
      completedPrescriptions,
      pendingPrescriptions,
      validationAccuracy,
      averageProcessingTime,
      peakHours
    };
  }

  /**
   * Calculate adherence-related metrics
   */
  private async calculateAdherenceMetrics(
    pharmacyId: string,
    startDate: Date,
    endDate: Date
  ) {
    // Get all patients for this pharmacy
    const patients = await this.prisma.patient.findMany({
      where: {
        pharmacyId
      },
      include: {
        adherenceRecord: true,
        interventions: {
          where: {
            date: {
              gte: startDate,
              lte: endDate
            }
          }
        }
      }
    });

    const adherenceScores = patients
      .filter(p => p.adherenceRecord)
      .map(p => p.adherenceRecord!.adherenceScore);

    const averageAdherenceScore = adherenceScores.length > 0
      ? adherenceScores.reduce((sum, score) => sum + score, 0) / adherenceScores.length
      : 0;

    // Count patients by adherence status
    const patientsOptimal = patients.filter(p => p.adherenceRecord?.status === 'OPTIMAL').length;
    const patientsGood = patients.filter(p => p.adherenceRecord?.status === 'GOOD').length;
    const patientsFair = patients.filter(p => p.adherenceRecord?.status === 'FAIR').length;
    const patientsPoor = patients.filter(p => p.adherenceRecord?.status === 'POOR').length;

    // Count interventions
    const interventionsPerformed = patients.reduce((total, patient) => 
      total + patient.interventions.length, 0
    );

    // Calculate intervention success rate (mock calculation)
    const interventionSuccessRate = interventionsPerformed > 0 
      ? Math.random() * 30 + 60 // 60-90% success rate
      : 0;

    return {
      averageAdherenceScore,
      patientsOptimal,
      patientsGood,
      patientsFair,
      patientsPoor,
      interventionsPerformed,
      interventionSuccessRate
    };
  }

  /**
   * Calculate financial metrics
   */
  private async calculateFinancialMetrics(
    pharmacyId: string,
    startDate: Date,
    endDate: Date
  ) {
    const prescriptions = await this.prisma.prescription.findMany({
      where: {
        pharmacyId,
        issuedDate: {
          gte: startDate,
          lte: endDate
        },
        status: 'completed'
      }
    });

    // Mock financial calculations (in a real system, these would come from actual financial data)
    const averageValuePerPrescription = 25.50; // £25.50 average
    const dispensingFeePerPrescription = 1.27; // NHS dispensing fee

    const revenue = prescriptions.length * averageValuePerPrescription;
    const dispensingFees = prescriptions.length * dispensingFeePerPrescription;

    // Calculate cost savings from automation
    const costSavings = this.calculateAutomationSavings(prescriptions.length);

    return {
      revenue,
      dispensingFees,
      averageValuePerPrescription,
      costSavings
    };
  }

  /**
   * Calculate operational metrics
   */
  private async calculateOperationalMetrics(
    pharmacyId: string,
    startDate: Date,
    endDate: Date
  ) {
    // Mock operational metrics (in a real system, these would come from inventory and operational data)
    const stockTurns = Math.round(Math.random() * 8 + 4); // 4-12 turns per year
    const outOfStockIncidents = Math.round(Math.random() * 10); // 0-10 incidents
    const staffProductivity = Math.round(Math.random() * 20 + 80); // 80-100% productivity
    const errorRate = Math.random() * 2; // 0-2% error rate

    return {
      stockTurns,
      outOfStockIncidents,
      staffProductivity,
      errorRate
    };
  }

  /**
   * Calculate AI-related metrics
   */
  private async calculateAIMetrics(
    pharmacyId: string,
    startDate: Date,
    endDate: Date
  ) {
    const validations = await this.prisma.validationResult.findMany({
      where: {
        prescription: {
          pharmacyId
        },
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    const totalAIValidations = validations.length;
    const accurateValidations = validations.filter(v => v.isAccurate === true).length;
    const aiAccuracy = totalAIValidations > 0 
      ? (accurateValidations / totalAIValidations) * 100 
      : 0;

    const flaggedPrescriptions = validations.filter(v => 
      v.issues && v.issues.length > 0
    ).length;

    const falsePositives = validations.filter(v => 
      v.isAccurate === false
    ).length;

    // Calculate time saved by AI (mock calculation)
    const averageTimePerValidation = 3; // 3 minutes saved per validation
    const timeSavedByAI = (totalAIValidations * averageTimePerValidation) / 60; // in hours

    return {
      totalAIValidations,
      aiAccuracy,
      timeSavedByAI,
      flaggedPrescriptions,
      falsePositives
    };
  }

  /**
   * Calculate ROI metrics for the pharmacy automation system
   */
  async calculateROI(
    pharmacyId: string,
    timeframe: 'monthly' | 'quarterly' | 'yearly'
  ): Promise<ROIMetrics> {
    const now = new Date();
    let startDate: Date;

    switch (timeframe) {
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarterly':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        break;
      case 'yearly':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);
        break;
    }

    const prescriptions = await this.prisma.prescription.findMany({
      where: {
        pharmacyId,
        issuedDate: {
          gte: startDate,
          lte: now
        }
      }
    });

    // Calculate cost savings
    const staffTimeSaved = this.calculateStaffTimeSaved(prescriptions.length);
    const reducedErrors = this.calculateErrorReductionSavings(prescriptions.length);
    const improvedCompliance = this.calculateComplianceSavings(pharmacyId);
    const operationalEfficiency = this.calculateEfficiencySavings(prescriptions.length);

    const totalCostSavings = staffTimeSaved + reducedErrors + improvedCompliance + operationalEfficiency;

    // Calculate system costs
    const subscriptionFee = this.getSubscriptionFee(timeframe);
    const trainingCosts = timeframe === 'yearly' ? 500 : 0; // One-time training cost per year
    const maintenanceCosts = subscriptionFee * 0.1; // 10% of subscription for maintenance

    const totalSystemCosts = subscriptionFee + trainingCosts + maintenanceCosts;

    const netSavings = totalCostSavings - totalSystemCosts;
    const roi = totalSystemCosts > 0 ? (netSavings / totalSystemCosts) * 100 : 0;
    const paybackPeriod = netSavings > 0 ? totalSystemCosts / (netSavings / 12) : 0; // in months

    return {
      pharmacyId,
      timeframe,
      costSavings: {
        staffTimeSaved,
        reducedErrors,
        improvedCompliance,
        operationalEfficiency
      },
      systemCosts: {
        subscriptionFee,
        trainingCosts,
        maintenanceCosts
      },
      netSavings,
      roi,
      paybackPeriod
    };
  }

  /**
   * Generate business insights and recommendations
   */
  async generateBusinessInsights(pharmacyId: string): Promise<BusinessInsight[]> {
    const insights: BusinessInsight[] = [];
    
    // Get recent metrics
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000); // Last 30 days
    
    const metrics = await this.generatePharmacyMetrics(pharmacyId, startDate, endDate);

    // Adherence insights
    if (metrics.adherenceMetrics.averageAdherenceScore < 75) {
      insights.push({
        id: `adherence-low-${Date.now()}`,
        type: 'alert',
        priority: 'high',
        title: 'Low Patient Adherence Detected',
        description: `Average adherence score is ${metrics.adherenceMetrics.averageAdherenceScore.toFixed(1)}%, below the recommended 75% threshold.`,
        impact: 'Poor adherence can lead to treatment failures and increased healthcare costs.',
        actionItems: [
          'Increase adherence interventions',
          'Implement automated reminder system',
          'Review medication counseling processes',
          'Consider packaging solutions like dosette boxes'
        ],
        dataPoints: {
          currentScore: metrics.adherenceMetrics.averageAdherenceScore,
          targetScore: 75,
          poorAdherencePatients: metrics.adherenceMetrics.patientsPoor
        },
        generatedAt: new Date()
      });
    }

    // AI accuracy insights
    if (metrics.aiMetrics.aiAccuracy < 90) {
      insights.push({
        id: `ai-accuracy-${Date.now()}`,
        type: 'recommendation',
        priority: 'medium',
        title: 'AI Validation Accuracy Improvement Needed',
        description: `AI validation accuracy is ${metrics.aiMetrics.aiAccuracy.toFixed(1)}%, which could be improved.`,
        impact: 'Higher AI accuracy reduces manual review time and improves workflow efficiency.',
        actionItems: [
          'Review false positive cases',
          'Provide feedback to improve AI training',
          'Update validation rules',
          'Consider additional training data'
        ],
        dataPoints: {
          currentAccuracy: metrics.aiMetrics.aiAccuracy,
          targetAccuracy: 95,
          falsePositives: metrics.aiMetrics.falsePositives
        },
        generatedAt: new Date()
      });
    }

    // Peak hours optimization
    const topPeakHour = metrics.prescriptionMetrics.peakHours[0];
    if (topPeakHour && topPeakHour.count > metrics.prescriptionMetrics.totalPrescriptions * 0.2) {
      insights.push({
        id: `peak-hours-${Date.now()}`,
        type: 'opportunity',
        priority: 'medium',
        title: 'Peak Hour Staffing Optimization',
        description: `Peak prescription processing occurs at ${topPeakHour.hour}:00 with ${topPeakHour.count} prescriptions.`,
        impact: 'Optimizing staffing during peak hours can reduce wait times and improve customer satisfaction.',
        actionItems: [
          'Adjust staff schedules to match peak demand',
          'Consider pre-processing prescriptions',
          'Implement queue management system',
          'Use predictive analytics for staffing'
        ],
        dataPoints: {
          peakHour: topPeakHour.hour,
          peakVolume: topPeakHour.count,
          totalVolume: metrics.prescriptionMetrics.totalPrescriptions
        },
        generatedAt: new Date()
      });
    }

    // ROI opportunity
    const roi = await this.calculateROI(pharmacyId, 'monthly');
    if (roi.roi > 150) {
      insights.push({
        id: `roi-success-${Date.now()}`,
        type: 'opportunity',
        priority: 'low',
        title: 'Excellent ROI Performance',
        description: `System ROI is ${roi.roi.toFixed(1)}%, indicating strong value from automation.`,
        impact: 'Strong ROI demonstrates successful implementation and potential for expansion.',
        actionItems: [
          'Share success metrics with stakeholders',
          'Consider expanding to additional locations',
          'Explore advanced features',
          'Document best practices'
        ],
        dataPoints: {
          currentROI: roi.roi,
          netSavings: roi.netSavings,
          paybackPeriod: roi.paybackPeriod
        },
        generatedAt: new Date()
      });
    }

    return insights;
  }

  /**
   * Get trend analysis for key metrics
   */
  async getTrendAnalysis(
    pharmacyId: string,
    metric: string,
    periods: number = 6
  ): Promise<TrendAnalysis> {
    // Mock trend analysis - in a real system, this would analyze historical data
    const currentValue = Math.random() * 100;
    const trend = Math.random() > 0.5 ? 'increasing' : 'decreasing';
    const changePercentage = (Math.random() - 0.5) * 20; // -10% to +10%
    
    const forecast = Array.from({ length: periods }, (_, i) => {
      const variation = (Math.random() - 0.5) * 10;
      return currentValue + (changePercentage * (i + 1) / 100) + variation;
    });

    return {
      metric,
      period: 'monthly',
      trend: trend as 'increasing' | 'decreasing',
      changePercentage,
      forecast
    };
  }

  // Helper methods for calculations

  private calculateAutomationSavings(prescriptionCount: number): number {
    // Assume £2 saved per prescription through automation
    return prescriptionCount * 2;
  }

  private calculateStaffTimeSaved(prescriptionCount: number): number {
    // Assume 5 minutes saved per prescription at £12/hour
    const minutesSaved = prescriptionCount * 5;
    const hoursSaved = minutesSaved / 60;
    return hoursSaved * 12;
  }

  private calculateErrorReductionSavings(prescriptionCount: number): number {
    // Assume 1% error rate reduced, £50 cost per error
    const errorsReduced = prescriptionCount * 0.01;
    return errorsReduced * 50;
  }

  private calculateComplianceSavings(pharmacyId: string): number {
    // Mock compliance savings
    return Math.random() * 1000 + 500; // £500-£1500
  }

  private calculateEfficiencySavings(prescriptionCount: number): number {
    // 10% efficiency improvement
    return prescriptionCount * 0.5; // £0.50 per prescription
  }

  private getSubscriptionFee(timeframe: 'monthly' | 'quarterly' | 'yearly'): number {
    const monthlyFee = 299; // £299 per month
    switch (timeframe) {
      case 'monthly':
        return monthlyFee;
      case 'quarterly':
        return monthlyFee * 3;
      case 'yearly':
        return monthlyFee * 12 * 0.9; // 10% annual discount
    }
  }
}
