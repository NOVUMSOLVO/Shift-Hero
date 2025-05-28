import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '../../../../lib/db/prisma';
import AuditService from '../../../../services/AuditService';

/**
 * GET /api/admin/pharmacies
 *
 * Get all pharmacies for the current user's organization
 * Super admins can see all pharmacies or filter by organization
 */
export async function GET(request: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const organizationId = searchParams.get('organizationId');
    const searchTerm = searchParams.get('search');
    const isActive = searchParams.get('isActive');

    // Build where clause
    let where: any = {};

    // Filter by organization
    if (session.user.role === 'SUPER_ADMIN') {
      // Super admins can filter by organization or see all
      if (organizationId) {
        where.organizationId = organizationId;
      }
    } else {
      // Non-super admins can only see their organization's pharmacies
      where.organizationId = session.user.organizationId;
    }

    // Filter by active status
    if (isActive !== null) {
      where.isActive = isActive === 'true';
    }

    // Search by name, address, or contract number
    if (searchTerm) {
      where.OR = [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { address: { contains: searchTerm, mode: 'insensitive' } },
        { nhsContractNumber: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    // Get pharmacies
    const pharmacies = await prisma.pharmacy.findMany({
      where,
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Log activity
    await AuditService.logAction({
      action: 'LIST_PHARMACIES' as any,
      category: 'ADMIN' as any,
      userId: session.user.id,
      details: {
        count: pharmacies.length,
        filters: { organizationId, searchTerm, isActive },
      },
    });

    return NextResponse.json({ pharmacies });
  } catch (error) {
    console.error('Error fetching pharmacies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pharmacies' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/pharmacies
 *
 * Create a new pharmacy
 * Super admins can create for any organization
 * Org admins can only create for their organization
 */
export async function POST(request: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only super admins and org admins can create pharmacies
    if (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ORG_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.slug || !body.address || !body.postcode || !body.phoneNumber || !body.email || !body.organizationId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate organization access
    if (session.user.role !== 'SUPER_ADMIN' && body.organizationId !== session.user.organizationId) {
      return NextResponse.json(
        { error: 'You can only create pharmacies for your organization' },
        { status: 403 }
      );
    }

    // Check if pharmacy with same slug exists in the organization
    const existingPharmacy = await prisma.pharmacy.findFirst({
      where: {
        organizationId: body.organizationId,
        slug: body.slug,
      },
    });

    if (existingPharmacy) {
      return NextResponse.json(
        { error: 'A pharmacy with this slug already exists in the organization' },
        { status: 400 }
      );
    }

    // Create pharmacy
    const pharmacy = await prisma.pharmacy.create({
      data: {
        name: body.name,
        slug: body.slug,
        address: body.address,
        postcode: body.postcode,
        phoneNumber: body.phoneNumber,
        email: body.email,
        nhsContractNumber: body.nhsContractNumber,
        isActive: body.isActive !== undefined ? body.isActive : true,
        organizationId: body.organizationId,
      },
    });

    // Log activity
    await AuditService.logAction({
      action: 'CREATE_PHARMACY' as any,
      category: 'ADMIN' as any,
      userId: session.user.id,
      details: {
        pharmacyId: pharmacy.id,
        pharmacyName: pharmacy.name,
        organizationId: pharmacy.organizationId,
      },
    });

    return NextResponse.json({ pharmacy }, { status: 201 });
  } catch (error) {
    console.error('Error creating pharmacy:', error);
    return NextResponse.json(
      { error: 'Failed to create pharmacy' },
      { status: 500 }
    );
  }
}
