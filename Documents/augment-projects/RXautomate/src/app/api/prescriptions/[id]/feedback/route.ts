import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/db/prisma';
import axios from 'axios';

/**
 * API handler for submitting feedback on AI validation results
 * POST /api/prescriptions/[id]/feedback
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

    // Parse request body
    const body = await request.json();
    const { issueId, isPositive, validationResultId } = body;

    if (!issueId) {
      return NextResponse.json(
        { error: 'Missing required parameter: issueId' },
        { status: 400 }
      );
    }

    // Log the feedback in the audit trail
    await prisma.auditLog.create({
      data: {
        action: 'AI_VALIDATION_FEEDBACK',
        category: 'PRESCRIPTION',
        prescriptionId: prescriptionId,
        userId: session.user.id || undefined,
        details: JSON.stringify({
          issueId,
          isPositive,
          validationResultId,
          timestamp: new Date().toISOString()
        })
      }
    });

    // If AI API URL is configured, send the feedback to the AI model
    if (process.env.AI_API_URL && process.env.AI_API_KEY) {
      try {
        await axios.post(
          `${process.env.AI_API_URL}/feedback`,
          {
            prescriptionId,
            issueId,
            isPositive,
            validationResultId,
            timestamp: new Date().toISOString(),
            userId: session.user.id
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.AI_API_KEY}`
            }
          }
        );
      } catch (error) {
        console.error('Error sending feedback to AI model:', error);
        // We don't want to fail the request if the AI feedback fails,
        // just log it and continue
      }
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Feedback submitted successfully'
    });
  } catch (error) {
    console.error('Error submitting validation feedback:', error);
    return NextResponse.json(
      { error: 'Failed to submit feedback', details: (error as Error).message },
      { status: 500 }
    );
  }
}
