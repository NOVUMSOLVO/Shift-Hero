import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/db/prisma';
import { EPSService } from '@/services/EPSService';
import { NotificationService } from '@/services/NotificationService';
import { PrescriptionValidationService } from '@/services/PrescriptionValidationService';
import { AIPrescriptionValidationService } from '@/services/AIPrescriptionValidationService';

/**
 * API handler for validating a prescription
 * POST /api/prescriptions/[id]/validate
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

    const prescriptionId = params.id;
    
    // Check if prescription exists
    const prescription = await prisma.prescription.findUnique({
      where: { id: prescriptionId },
    });

    if (!prescription) {
      return NextResponse.json(
        { error: `Prescription with ID ${prescriptionId} not found` },
        { status: 404 }
      );
    }

    // Initialize services
    const epsService = new EPSService(prisma);
    const notificationService = new NotificationService(prisma);
    
    // Use the AI-powered validation service instead of the base service
    const validationService = new AIPrescriptionValidationService(
      prisma,
      epsService,
      notificationService
    );

    // Validate the prescription
    const validationResult = await validationService.validatePrescription(prescriptionId);

    // Log the validation attempt in the audit trail
    await prisma.auditLog.create({
      data: {
        action: 'PRESCRIPTION_VALIDATION_API',
        category: 'PRESCRIPTION',
        prescriptionId: prescriptionId,
        userId: session.user.id || undefined,
        details: JSON.stringify({
          validationResult,
          timestamp: new Date().toISOString()
        })
      }
    });

    // Return the validation result
    return NextResponse.json(validationResult);
  } catch (error) {
    console.error('Error validating prescription:', error);
    return NextResponse.json(
      { error: 'Failed to validate prescription', details: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * API handler for getting validation history for a prescription
 * GET /api/prescriptions/[id]/validate
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

    const prescriptionId = params.id;
    
    // Get validation history from audit logs
    const validationLogs = await prisma.auditLog.findMany({
      where: {
        category: 'PRESCRIPTION',
        prescriptionId: prescriptionId,
        action: {
          in: ['PRESCRIPTION_VALIDATION', 'PRESCRIPTION_VALIDATION_API']
        }
      },
      orderBy: {
        timestamp: 'desc'
      }
    });

    // Parse the details from each log
    const validationHistory = validationLogs.map(log => {
      try {
        const details = JSON.parse(log.details || '{}');
        return {
          id: log.id,
          timestamp: log.timestamp,
          userId: log.userId,
          result: details.validationResult || details
        };
      } catch (e) {
        return {
          id: log.id,
          timestamp: log.timestamp,
          userId: log.userId,
          result: { error: 'Failed to parse validation details' }
        };
      }
    });

    return NextResponse.json(validationHistory);
  } catch (error) {
    console.error('Error fetching validation history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch validation history', details: (error as Error).message },
      { status: 500 }
    );
  }
}
