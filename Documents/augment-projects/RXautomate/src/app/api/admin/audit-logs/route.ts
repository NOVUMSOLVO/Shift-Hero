import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/authOptions';

/**
 * API endpoint to fetch audit logs with filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify admin role
    if (!['SUPER_ADMIN', 'ORG_ADMIN'].includes(session.user.role as string)) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category') || undefined;
    const action = searchParams.get('action') || undefined;
    const dateRange = searchParams.get('dateRange') || 'all';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    // Build date filter based on dateRange
    let dateFilter = {};
    const now = new Date();
    
    switch (dateRange) {
      case 'today':
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        dateFilter = {
          timestamp: {
            gte: startOfToday,
          },
        };
        break;
      case 'yesterday':
        const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        const endOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        dateFilter = {
          timestamp: {
            gte: startOfYesterday,
            lt: endOfYesterday,
          },
        };
        break;
      case 'week':
        const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        dateFilter = {
          timestamp: {
            gte: startOfWeek,
          },
        };
        break;
      case 'month':
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
        dateFilter = {
          timestamp: {
            gte: startOfMonth,
          },
        };
        break;
      // 'all' or default: no date filter
    }

    // Build where clause
    const where: any = {
      ...dateFilter,
    };

    // Add category filter if provided
    if (category) {
      where.category = category;
    }

    // Add action filter if provided
    if (action) {
      where.action = action;
    }

    // For organization admins, limit to their organization's data
    if (session.user.role === 'ORG_ADMIN' && session.user.organizationId) {
      // This is a simplified approach - in a real implementation, you would need to join
      // with users, patients, or prescriptions to filter by organization
      where.OR = [
        {
          userId: {
            in: await getUserIdsForOrganization(session.user.organizationId as string),
          },
        },
        {
          patientId: {
            in: await getPatientIdsForOrganization(session.user.organizationId as string),
          },
        },
      ];
    }

    // Count total logs for pagination
    const totalLogs = await prisma.auditLog.count({ where });
    const totalPages = Math.ceil(totalLogs / limit);

    // Fetch logs with pagination
    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: {
        timestamp: 'desc',
      },
      skip,
      take: limit,
    });

    return NextResponse.json({
      logs,
      page,
      limit,
      totalLogs,
      totalPages,
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}

/**
 * Helper function to get all user IDs for an organization
 */
async function getUserIdsForOrganization(organizationId: string): Promise<string[]> {
  const users = await prisma.user.findMany({
    where: { organizationId },
    select: { id: true },
  });
  return users.map(user => user.id);
}

/**
 * Helper function to get all patient IDs for an organization
 */
async function getPatientIdsForOrganization(organizationId: string): Promise<string[]> {
  const pharmacies = await prisma.pharmacy.findMany({
    where: { organizationId },
    select: { id: true },
  });
  
  const pharmacyIds = pharmacies.map(pharmacy => pharmacy.id);
  
  const patients = await prisma.patient.findMany({
    where: {
      pharmacyId: {
        in: pharmacyIds,
      },
    },
    select: { id: true },
  });
  
  return patients.map(patient => patient.id);
}
