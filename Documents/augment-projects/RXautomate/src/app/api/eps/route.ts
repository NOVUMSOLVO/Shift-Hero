import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import NHSSpineService from '@/services/NHSSpineService';
import BSAService from '@/services/BSAService';

/**
 * Consolidated API routes for EPS-related functionality
 *
 * This file handles all EPS-related API endpoints:
 * - POST /api/eps/check-eligibility - Check patient eligibility for services
 * - POST /api/eps/check-exemption - Check patient exemption status
 * - POST /api/eps/check-patient-status - Check comprehensive patient status
 */

/**
 * POST /api/eps/check-eligibility
 *
 * Checks patient eligibility for NHS services
 */
export async function POST(request: NextRequest) {
  try {
    // Get the path to determine the action
    const url = new URL(request.url);
    const path = url.pathname;
    const body = await request.json();

    // Handle different actions based on the path
    if (path.endsWith('/check-eligibility')) {
      const { nhsNumber, serviceType } = body;

      if (!nhsNumber) {
        return NextResponse.json(
          { error: 'NHS number is required' },
          { status: 400 }
        );
      }

      // Validate NHS number format (10 digits)
      if (!/^\d{10}$/.test(nhsNumber)) {
        return NextResponse.json(
          { error: 'Invalid NHS number format' },
          { status: 400 }
        );
      }

      if (!serviceType) {
        return NextResponse.json(
          { error: 'Service type is required' },
          { status: 400 }
        );
      }

      // Check eligibility with BSA service
      const eligibilityCheck = {
        nhsNumber,
        serviceType,
        checkDate: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
      };

      const eligibilityResult = await BSAService.checkEligibility(eligibilityCheck);

      return NextResponse.json(eligibilityResult);
    }
    else if (path.endsWith('/check-exemption')) {
      const { nhsNumber } = body;

      if (!nhsNumber) {
        return NextResponse.json(
          { error: 'NHS number is required' },
          { status: 400 }
        );
      }

      // Validate NHS number format (10 digits)
      if (!/^\d{10}$/.test(nhsNumber)) {
        return NextResponse.json(
          { error: 'Invalid NHS number format' },
          { status: 400 }
        );
      }

      // Check exemption status with NHS Spine service
      const exemptionResult = await NHSSpineService.checkExemptionStatus(nhsNumber);

      return NextResponse.json(exemptionResult);
    }
    else if (path.endsWith('/check-patient-status')) {
      const { nhsNumber, serviceType } = body;

      if (!nhsNumber) {
        return NextResponse.json(
          { error: 'NHS number is required' },
          { status: 400 }
        );
      }

      // Validate NHS number format (10 digits)
      if (!/^\d{10}$/.test(nhsNumber)) {
        return NextResponse.json(
          { error: 'Invalid NHS number format' },
          { status: 400 }
        );
      }

      if (!serviceType) {
        return NextResponse.json(
          { error: 'Service type is required' },
          { status: 400 }
        );
      }

      // Get patient details
      const patientDetails = await NHSSpineService.getPatientByNhsNumber(nhsNumber);

      // Check exemption status
      const exemptionStatus = await NHSSpineService.checkExemptionStatus(nhsNumber);

      // Check eligibility for the service
      const eligibilityCheck = {
        nhsNumber,
        serviceType,
        checkDate: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
      };
      const eligibilityStatus = await BSAService.checkEligibility(eligibilityCheck);

      // Return comprehensive patient status
      return NextResponse.json({
        patient: patientDetails,
        exemption: exemptionStatus,
        eligibility: eligibilityStatus,
        timestamp: new Date().toISOString(),
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
    console.error('Error checking patient status:', error);

    return NextResponse.json(
      {
        error: 'Failed to check patient status',
        message: error.message
      },
      { status: error.statusCode || 500 }
    );
  }
}
