import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/db/prisma';
import { EPSService } from '@/services/EPSService';
import { NotificationService } from '@/services/NotificationService';
import { PatientAdherenceService } from '@/services/PatientAdherenceService';

/**
 * API handler for getting a patient's adherence data
 * GET /api/patients/[id]/adherence
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const patientId = params.id;
    
    // Check if patient exists
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      return NextResponse.json(
        { error: `Patient with ID ${patientId} not found` },
        { status: 404 }
      );
    }

    // Initialize services
    const epsService = new EPSService(prisma);
    const notificationService = new NotificationService(prisma);
    const adherenceService = new PatientAdherenceService(
      prisma,
      notificationService,
      epsService
    );

    // Calculate adherence (or get from cache if recent)
    const adherenceData = await adherenceService.calculateAdherence(patientId);

    if (!adherenceData) {
      return NextResponse.json(
        { error: 'Could not calculate adherence data' },
        { status: 500 }
      );
    }

    // Return the adherence data
    return NextResponse.json(adherenceData);
  } catch (error) {
    console.error('Error fetching patient adherence:', error);
    return NextResponse.json(
      { error: 'Failed to fetch adherence data', details: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * API handler for recording an adherence intervention
 * POST /api/patients/[id]/adherence/intervention
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const patientId = params.id;
    
    // Parse request body
    const body = await request.json();
    const { interventionType, notes } = body;

    if (!interventionType || !notes) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Check if patient exists
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      return NextResponse.json(
        { error: `Patient with ID ${patientId} not found` },
        { status: 404 }
      );
    }

    // Initialize services
    const epsService = new EPSService(prisma);
    const notificationService = new NotificationService(prisma);
    const adherenceService = new PatientAdherenceService(
      prisma,
      notificationService,
      epsService
    );

    // Record the intervention
    const intervention = await adherenceService.recordIntervention(
      patientId,
      interventionType,
      notes,
      session.user.id || 'UNKNOWN'
    );

    // Return success response
    return NextResponse.json({
      success: true,
      intervention
    });
  } catch (error) {
    console.error('Error recording adherence intervention:', error);
    return NextResponse.json(
      { error: 'Failed to record intervention', details: (error as Error).message },
      { status: 500 }
    );
  }
}
