import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { POST } from '../app/api/eps/check-patient-status/route';
import NHSSpineService from '../services/NHSSpineService';
import { prisma } from '../lib/db/prisma';
import { getServerSession } from 'next-auth/next';

// Mock dependencies
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('../lib/db/prisma', () => ({
  prisma: {
    patient: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  },
}));

jest.mock('../services/NHSSpineService', () => ({
  validateNHSNumber: jest.fn(),
  getPatientByNhsNumber: jest.fn(),
  checkExemptionStatus: jest.fn(),
  verifyEligibility: jest.fn(),
  getPatientGP: jest.fn(),
  __esModule: true,
  default: {
    validateNHSNumber: jest.fn(),
    getPatientByNhsNumber: jest.fn(),
    checkExemptionStatus: jest.fn(),
    verifyEligibility: jest.fn(),
    getPatientGP: jest.fn(),
  },
}));

describe('Check Patient Status API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock session
    (getServerSession as jest.Mock).mockResolvedValue({
      user: {
        id: 'test-user-id',
        name: 'Test User',
        email: 'test@example.com',
      },
    });
    
    // Mock patient data
    (prisma.patient.findFirst as jest.Mock).mockResolvedValue({
      id: 'test-patient-id',
      nhsNumber: '9434765870',
      firstName: 'John',
      lastName: 'Smith',
    });
    
    // Mock patient update
    (prisma.patient.update as jest.Mock).mockResolvedValue({
      id: 'test-patient-id',
      nhsNumber: '9434765870',
      firstName: 'John',
      lastName: 'Smith',
      exemptionStatus: 'MATERNITY',
      exemptionEndDate: new Date('2023-12-31'),
      lastExemptionCheck: expect.any(Date),
      eligibilityStatus: 'ELIGIBLE',
      lastEligibilityCheck: expect.any(Date),
    });
    
    // Mock audit log creation
    (prisma.auditLog.create as jest.Mock).mockResolvedValue({
      id: 'test-audit-log-id',
    });
    
    // Mock NHS Spine Service
    (NHSSpineService.default.validateNHSNumber as jest.Mock).mockReturnValue(true);
    (NHSSpineService.default.getPatientByNhsNumber as jest.Mock).mockResolvedValue({
      resourceType: 'Patient',
      id: '9434765870',
      name: [{ family: 'Smith', given: ['John'] }],
      birthDate: '1970-01-01',
    });
    (NHSSpineService.default.checkExemptionStatus as jest.Mock).mockResolvedValue({
      exemptionStatus: true,
      exemptionType: 'MATERNITY',
      expiryDate: '2023-12-31',
      certificateNumber: 'M12345678',
    });
    (NHSSpineService.default.verifyEligibility as jest.Mock).mockResolvedValue({
      eligibilityStatus: true,
      eligibilityReason: 'AGE_EXEMPT',
      validFrom: '2020-01-01',
      validTo: null,
    });
    (NHSSpineService.default.getPatientGP as jest.Mock).mockResolvedValue({
      resourceType: 'Organization',
      id: 'GP123',
      name: 'Test GP Practice',
    });
  });

  it('should return 401 if not authenticated', async () => {
    // Mock no session
    (getServerSession as jest.Mock).mockResolvedValueOnce(null);
    
    // Create request
    const request = new NextRequest('http://localhost:3000/api/eps/check-patient-status', {
      method: 'POST',
      body: JSON.stringify({ nhsNumber: '9434765870' }),
    });
    
    // Call API
    const response = await POST(request);
    
    // Assertions
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: 'Unauthorized' });
  });

  it('should return 400 if NHS number is missing', async () => {
    // Create request with missing NHS number
    const request = new NextRequest('http://localhost:3000/api/eps/check-patient-status', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    
    // Call API
    const response = await POST(request);
    
    // Assertions
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'NHS number is required' });
  });

  it('should return 400 if NHS number is invalid', async () => {
    // Mock invalid NHS number
    (NHSSpineService.default.validateNHSNumber as jest.Mock).mockReturnValueOnce(false);
    
    // Create request
    const request = new NextRequest('http://localhost:3000/api/eps/check-patient-status', {
      method: 'POST',
      body: JSON.stringify({ nhsNumber: '1234567890' }),
    });
    
    // Call API
    const response = await POST(request);
    
    // Assertions
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'Invalid NHS number format or checksum' });
  });

  it('should return 200 with patient status data', async () => {
    // Create request
    const request = new NextRequest('http://localhost:3000/api/eps/check-patient-status', {
      method: 'POST',
      body: JSON.stringify({ nhsNumber: '9434765870', serviceType: 'prescription' }),
    });
    
    // Call API
    const response = await POST(request);
    
    // Assertions
    expect(response.status).toBe(200);
    const data = await response.json();
    
    expect(data).toHaveProperty('patient');
    expect(data).toHaveProperty('exemption');
    expect(data).toHaveProperty('eligibility');
    expect(data.message).toBe('Patient status check completed successfully');
    
    // Verify service calls
    expect(NHSSpineService.default.validateNHSNumber).toHaveBeenCalledWith('9434765870');
    expect(NHSSpineService.default.getPatientByNhsNumber).toHaveBeenCalledWith('9434765870');
    expect(NHSSpineService.default.checkExemptionStatus).toHaveBeenCalledWith('9434765870');
    expect(NHSSpineService.default.verifyEligibility).toHaveBeenCalledWith('9434765870', 'prescription');
    expect(NHSSpineService.default.getPatientGP).toHaveBeenCalledWith('9434765870');
    
    // Verify database updates
    expect(prisma.patient.update).toHaveBeenCalled();
    expect(prisma.auditLog.create).toHaveBeenCalled();
  });

  it('should handle NHS API errors gracefully', async () => {
    // Mock API error
    (NHSSpineService.default.getPatientByNhsNumber as jest.Mock).mockRejectedValueOnce({
      statusCode: 404,
      message: 'Patient not found in NHS records',
    });
    
    // Create request
    const request = new NextRequest('http://localhost:3000/api/eps/check-patient-status', {
      method: 'POST',
      body: JSON.stringify({ nhsNumber: '9434765870' }),
    });
    
    // Call API
    const response = await POST(request);
    
    // Assertions
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: 'Patient not found in NHS records' });
  });
});
