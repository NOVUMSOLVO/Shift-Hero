import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import EPSService from '@/services/EPSService';

/**
 * GET /api/prescriptions/[id]/history
 * 
 * Retrieves the history of a specific prescription
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

    // In a real implementation, this would fetch the prescription history from the EPS service
    // For now, we'll return mock data
    
    // Mock history data
    const mockHistory = [
      {
        id: '1',
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
        status: 'created',
        actor: 'Dr. John Smith',
      },
      {
        id: '2',
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
        status: 'active',
        actor: 'NHS EPS System',
      },
      {
        id: '3',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        status: 'on-hold',
        actor: 'Pharmacy Staff',
        reason: 'Awaiting stock',
      },
      {
        id: '4',
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        status: 'active',
        actor: 'Pharmacy Staff',
        reason: 'Stock now available',
      },
    ];

    return NextResponse.json(mockHistory);
  } catch (error: any) {
    console.error('Error fetching prescription history:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch prescription history',
        message: error.message 
      },
      { status: error.statusCode || 500 }
    );
  }
}
