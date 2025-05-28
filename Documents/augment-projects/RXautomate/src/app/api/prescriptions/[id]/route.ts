import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import EPSService from '@/services/EPSService';
import InventoryPrescriptionService from '@/services/InventoryPrescriptionService';

/**
 * GET /api/prescriptions/[id]
 * 
 * Retrieves a specific prescription by ID
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

    // Fetch prescription from EPS service
    const prescription = await EPSService.getPrescription(id);

    return NextResponse.json(prescription);
  } catch (error: any) {
    console.error('Error fetching prescription:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch prescription',
        message: error.message 
      },
      { status: error.statusCode || 500 }
    );
  }
}

/**
 * PUT /api/prescriptions/[id]
 * 
 * Updates a prescription status
 * Requires authentication and appropriate permissions
 */
export async function PUT(
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

    // Parse request body
    const body = await request.json();
    const { status, statusReason, action } = body;

    // Handle different actions based on the action parameter
    if (action === 'cancel') {
      // Handle cancellation
      const { reason } = body;
      
      if (!reason || !reason.code || !reason.display) {
        return NextResponse.json(
          { error: 'Cancellation reason is required' },
          { status: 400 }
        );
      }
      
      // Cancel the prescription
      const updatedPrescription = await EPSService.cancelPrescription(id, reason);
      
      return NextResponse.json(updatedPrescription);
    } 
    else if (action === 'complete') {
      // Handle completion
      
      // Get prescription details
      const prescription = await EPSService.getPrescription(id);
      
      // Check stock before dispensing
      const stockCheckResult = await InventoryPrescriptionService.checkPrescriptionStock(prescription);
      
      // If any items are out of stock, return an error
      if (stockCheckResult.anyOutOfStock) {
        return NextResponse.json(
          {
            error: 'Cannot dispense prescription',
            message: 'Some items are out of stock',
            stockCheckResult
          },
          { status: 400 }
        );
      }
      
      // Complete the prescription
      const updatedPrescription = await EPSService.completePrescription(id);
      
      // Update inventory after dispensing
      const inventoryUpdate = await InventoryPrescriptionService.updateInventoryAfterDispensing(updatedPrescription);
      
      return NextResponse.json({
        prescription: updatedPrescription,
        inventoryUpdate
      });
    }
    else {
      // Regular status update
      if (!status) {
        return NextResponse.json(
          { error: 'Status is required' },
          { status: 400 }
        );
      }
      
      // Update the prescription
      const updatedPrescription = await EPSService.updatePrescriptionStatus(id, status, statusReason);
      
      return NextResponse.json(updatedPrescription);
    }
  } catch (error: any) {
    console.error('Error updating prescription:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to update prescription',
        message: error.message 
      },
      { status: error.statusCode || 500 }
    );
  }
}

/**
 * POST /api/prescriptions/[id]
 * 
 * Handles various prescription actions (cancel, complete, etc.)
 * Requires authentication and appropriate permissions
 */
export async function POST(
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

    // Parse request body
    const body = await request.json();
    const { action } = body;

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'cancel': {
        const { reason } = body;
        
        if (!reason || !reason.code || !reason.display) {
          return NextResponse.json(
            { error: 'Cancellation reason is required' },
            { status: 400 }
          );
        }
        
        // Cancel the prescription
        const updatedPrescription = await EPSService.cancelPrescription(id, reason);
        
        return NextResponse.json(updatedPrescription);
      }
      
      case 'complete': {
        // Get prescription details
        const prescription = await EPSService.getPrescription(id);
        
        // Check stock before dispensing
        const stockCheckResult = await InventoryPrescriptionService.checkPrescriptionStock(prescription);
        
        // If any items are out of stock, return an error
        if (stockCheckResult.anyOutOfStock) {
          return NextResponse.json(
            {
              error: 'Cannot dispense prescription',
              message: 'Some items are out of stock',
              stockCheckResult
            },
            { status: 400 }
          );
        }
        
        // Complete the prescription
        const updatedPrescription = await EPSService.completePrescription(id);
        
        // Update inventory after dispensing
        const inventoryUpdate = await InventoryPrescriptionService.updateInventoryAfterDispensing(updatedPrescription);
        
        return NextResponse.json({
          prescription: updatedPrescription,
          inventoryUpdate
        });
      }
      
      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Error processing prescription action:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to process prescription action',
        message: error.message 
      },
      { status: error.statusCode || 500 }
    );
  }
}
