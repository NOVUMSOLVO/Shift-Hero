import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import EPSService from '@/services/EPSService';
import InventoryPrescriptionService from '@/services/InventoryPrescriptionService';

/**
 * GET /api/prescriptions/[id]/stock
 * 
 * Checks if all medications in a prescription are in stock
 * Requires authentication and appropriate permissions
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Extract prescription ID from params
    const { id } = params;
    if (!id) {
      return NextResponse.json(
        { error: 'Prescription ID is required' },
        { status: 400 }
      );
    }

    // Get prescription details
    const prescription = await EPSService.getPrescription(id);
    
    // Check stock for prescription
    const stockCheckResult = await InventoryPrescriptionService.checkPrescriptionStock(prescription);

    return NextResponse.json(stockCheckResult);
  } catch (error: any) {
    console.error('Error checking prescription stock:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to check prescription stock',
        message: error.message 
      },
      { status: error.statusCode || 500 }
    );
  }
}
