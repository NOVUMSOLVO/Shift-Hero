import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import EPSService, { PrescriptionSearchParams } from '@/services/EPSService';
import InventoryPrescriptionService from '@/services/InventoryPrescriptionService';

/**
 * Consolidated API routes for prescriptions
 * 
 * This file handles all prescription-related API endpoints:
 * - GET /api/prescriptions - Get all prescriptions with optional filters
 * - POST /api/prescriptions/search - Advanced search for prescriptions
 * - POST /api/prescriptions/batch - Process multiple prescriptions in batch
 */

/**
 * GET /api/prescriptions
 * 
 * Retrieves prescriptions with optional filters
 * Requires authentication and appropriate permissions
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Extract query parameters
    const url = new URL(request.url);
    const pharmacyOdsCode = url.searchParams.get('pharmacyOdsCode');
    const nhsNumber = url.searchParams.get('nhsNumber');
    const status = url.searchParams.get('status');
    const dateFrom = url.searchParams.get('dateFrom');
    const dateTo = url.searchParams.get('dateTo');
    const sortBy = url.searchParams.get('sortBy') || 'dateWritten:desc';

    // Build search parameters
    const searchParams: PrescriptionSearchParams = {
      _sort: sortBy
    };

    if (status) {
      searchParams.status = status;
    }

    if (dateFrom) {
      searchParams.dateWrittenFrom = dateFrom;
    }

    if (dateTo) {
      searchParams.dateWrittenTo = dateTo;
    }

    // Fetch prescriptions based on provided parameters
    if (pharmacyOdsCode) {
      // Fetch prescriptions for a pharmacy
      const prescriptions = await EPSService.getPharmacyPrescriptions(pharmacyOdsCode, searchParams);
      return NextResponse.json(prescriptions);
    } else if (nhsNumber) {
      // Fetch prescriptions for a patient
      const prescriptions = await EPSService.getPatientPrescriptions(nhsNumber, searchParams);
      return NextResponse.json(prescriptions);
    } else {
      // No specific filter provided
      return NextResponse.json(
        { error: 'Either pharmacyOdsCode or nhsNumber is required' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Error fetching prescriptions:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch prescriptions',
        message: error.message 
      },
      { status: error.statusCode || 500 }
    );
  }
}

/**
 * POST /api/prescriptions/search
 * 
 * Advanced search for prescriptions with multiple parameters
 * Requires authentication and appropriate permissions
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the path to determine the action
    const url = new URL(request.url);
    const path = url.pathname;

    // Handle different actions based on the path
    if (path.endsWith('/search')) {
      // Advanced search
      const searchParams: PrescriptionSearchParams = await request.json();

      // Validate search parameters
      if (Object.keys(searchParams).length === 0) {
        return NextResponse.json(
          { error: 'At least one search parameter is required' },
          { status: 400 }
        );
      }

      // Perform search
      const searchResults = await EPSService.searchPrescriptions(searchParams);
      return NextResponse.json(searchResults);
    } 
    else if (path.endsWith('/batch')) {
      // Batch processing
      const body = await request.json();
      const { action, prescriptionIds, reason } = body;

      // Validate request
      if (!action) {
        return NextResponse.json(
          { error: 'Action is required' },
          { status: 400 }
        );
      }

      if (!prescriptionIds || !Array.isArray(prescriptionIds) || prescriptionIds.length === 0) {
        return NextResponse.json(
          { error: 'At least one prescription ID is required' },
          { status: 400 }
        );
      }

      if (action === 'cancel' && (!reason || !reason.code || !reason.display)) {
        return NextResponse.json(
          { error: 'Cancellation reason is required' },
          { status: 400 }
        );
      }

      // Process each prescription
      const results = [];
      const errors = [];
      const inventoryUpdates = [];

      for (const prescriptionId of prescriptionIds) {
        try {
          let result;

          if (action === 'dispense') {
            // Get prescription details
            const prescription = await EPSService.getPrescription(prescriptionId);

            // Check stock before dispensing
            const stockCheckResult = await InventoryPrescriptionService.checkPrescriptionStock(prescription);

            // If any items are out of stock, skip this prescription
            if (stockCheckResult.anyOutOfStock) {
              errors.push({
                id: prescriptionId,
                success: false,
                error: 'Some items are out of stock'
              });
              continue;
            }

            // Complete the prescription
            result = await EPSService.completePrescription(prescriptionId);

            // Update inventory after dispensing
            const inventoryUpdate = await InventoryPrescriptionService.updateInventoryAfterDispensing(result);
            inventoryUpdates.push(inventoryUpdate);
          } else {
            result = await EPSService.cancelPrescription(prescriptionId, reason!);
          }

          results.push({
            id: prescriptionId,
            success: true,
            status: result.status
          });
        } catch (error: any) {
          console.error(`Error processing prescription ${prescriptionId}:`, error);

          errors.push({
            id: prescriptionId,
            success: false,
            error: error.message || 'Unknown error'
          });
        }
      }

      return NextResponse.json({
        action,
        results,
        errors,
        inventoryUpdates: action === 'dispense' ? inventoryUpdates : undefined,
        timestamp: new Date().toISOString()
      });
    }
    else {
      // Unknown action
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Error processing prescription request:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to process prescription request',
        message: error.message 
      },
      { status: error.statusCode || 500 }
    );
  }
}
