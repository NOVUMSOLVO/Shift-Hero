import { NextRequest, NextResponse } from 'next/server';
import NotificationService from '@/services/NotificationService';
import { prisma } from '@/lib/db/prisma';

export async function POST(request: NextRequest) {
  try {
    const { patientId, prescriptionId, type } = await request.json();

    if (!patientId) {
      return NextResponse.json(
        { error: 'Patient ID is required' },
        { status: 400 }
      );
    }

    if (!type) {
      return NextResponse.json(
        { error: 'Reminder type is required' },
        { status: 400 }
      );
    }

    // Get patient details
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        pharmacy: true,
      },
    });

    if (!patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }

    // Check if patient has a phone number
    if (!patient.phoneNumber) {
      return NextResponse.json(
        { error: 'Patient does not have a phone number' },
        { status: 400 }
      );
    }

    // Check for GDPR consent
    const consent = await prisma.consent.findFirst({
      where: {
        patientId: patientId,
        consentType: 'REMINDER',
        consentGiven: true,
        expiryDate: {
          gt: new Date(),
        },
      },
    });

    if (!consent) {
      return NextResponse.json(
        { error: 'Patient has not given consent for reminders' },
        { status: 403 }
      );
    }

    let notificationResult;

    // Send appropriate reminder based on type
    if (type === 'prescription' && prescriptionId) {
      // Get prescription details
      const prescription = await prisma.prescription.findUnique({
        where: { id: prescriptionId },
        include: {
          pharmacy: true,
        },
      });

      if (!prescription) {
        return NextResponse.json(
          { error: 'Prescription not found' },
          { status: 404 }
        );
      }

      // Send prescription reminder
      notificationResult = await NotificationService.sendPrescriptionReminder(patient, prescription);
    } else if (type === 'appointment') {
      // Get upcoming appointment
      const appointment = await prisma.appointment.findFirst({
        where: {
          patientId: patientId,
          date: {
            gt: new Date(),
          },
          status: 'SCHEDULED',
        },
        orderBy: {
          date: 'asc',
        },
        include: {
          pharmacy: true,
        },
      });

      if (!appointment) {
        return NextResponse.json(
          { error: 'No upcoming appointment found' },
          { status: 404 }
        );
      }

      // Send appointment reminder
      notificationResult = await NotificationService.sendAppointmentReminder(patient, appointment);
    } else {
      return NextResponse.json(
        { error: 'Invalid reminder type' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      notification: notificationResult,
      message: 'Reminder sent successfully'
    });
  } catch (error: any) {
    console.error('Error sending reminder:', error);

    return NextResponse.json(
      {
        error: 'Failed to send reminder',
        details: error.message
      },
      { status: 500 }
    );
  }
}
