import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { BusinessIntelligenceService } from '@/services/BusinessIntelligenceService';
import { PatientAdherenceService } from '@/services/PatientAdherenceService';
import { NotificationService } from '@/services/NotificationService';
import { EPSService } from '@/services/EPSService';

const prisma = new PrismaClient();
const notificationService = new NotificationService();
const epsService = new EPSService(prisma);
const adherenceService = new PatientAdherenceService(prisma, notificationService, epsService);
const biService = new BusinessIntelligenceService(prisma, adherenceService);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pharmacyId = searchParams.get('pharmacyId');
    const timeframe = searchParams.get('timeframe') as 'monthly' | 'quarterly' | 'yearly' || 'monthly';

    if (!pharmacyId) {
      return NextResponse.json(
        { error: 'Pharmacy ID is required' },
        { status: 400 }
      );
    }

    const roiMetrics = await biService.calculateROI(pharmacyId, timeframe);

    return NextResponse.json({
      success: true,
      data: roiMetrics
    });
  } catch (error) {
    console.error('Error calculating ROI:', error);
    return NextResponse.json(
      { error: 'Failed to calculate ROI' },
      { status: 500 }
    );
  }
}
