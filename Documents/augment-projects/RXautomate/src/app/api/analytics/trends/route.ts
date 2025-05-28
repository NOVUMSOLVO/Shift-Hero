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
    const metric = searchParams.get('metric') || 'prescriptions';
    const periods = parseInt(searchParams.get('periods') || '6');

    if (!pharmacyId) {
      return NextResponse.json(
        { error: 'Pharmacy ID is required' },
        { status: 400 }
      );
    }

    const trendAnalysis = await biService.getTrendAnalysis(pharmacyId, metric, periods);

    return NextResponse.json({
      success: true,
      data: trendAnalysis
    });
  } catch (error) {
    console.error('Error generating trend analysis:', error);
    return NextResponse.json(
      { error: 'Failed to generate trend analysis' },
      { status: 500 }
    );
  }
}
