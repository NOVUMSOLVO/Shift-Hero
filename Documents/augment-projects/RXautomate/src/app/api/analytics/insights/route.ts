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

    if (!pharmacyId) {
      return NextResponse.json(
        { error: 'Pharmacy ID is required' },
        { status: 400 }
      );
    }

    const insights = await biService.generateBusinessInsights(pharmacyId);

    return NextResponse.json({
      success: true,
      data: insights
    });
  } catch (error) {
    console.error('Error generating business insights:', error);
    return NextResponse.json(
      { error: 'Failed to generate business insights' },
      { status: 500 }
    );
  }
}
