import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { prisma } from '../../../../../lib/db/prisma';
import AuditService from '../../../../../services/AuditService';

/**
 * GET /api/admin/pharmacies/:id
 *
 * Get a specific pharmacy by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get pharmacy
    const pharmacy = await prisma.pharmacy.findUnique({
      where: {
        id: params.id,
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!pharmacy) {
      return NextResponse.json({ error: 'Pharmacy not found' }, { status: 404 });
    }

    // Check access permissions
    if (
      session.user.role !== 'SUPER_ADMIN' &&
      pharmacy.organizationId !== session.user.organizationId
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Log activity
    await AuditService.logAction({
      action: 'VIEW_PHARMACY' as any,
      category: 'ADMIN' as any,
      userId: session.user.id,
      details: {
        pharmacyId: pharmacy.id,
        pharmacyName: pharmacy.name,
      },
    });

    return NextResponse.json(pharmacy);
  } catch (error) {
    console.error('Error fetching pharmacy:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pharmacy' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/pharmacies/:id
 *
 * Update a specific pharmacy
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get existing pharmacy
    const existingPharmacy = await prisma.pharmacy.findUnique({
      where: {
        id: params.id,
      },
    });

    if (!existingPharmacy) {
      return NextResponse.json({ error: 'Pharmacy not found' }, { status: 404 });
    }

    // Check access permissions
    if (
      session.user.role !== 'SUPER_ADMIN' &&
      existingPharmacy.organizationId !== session.user.organizationId
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.slug || !body.address || !body.postcode || !body.phoneNumber || !body.email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if organization is being changed
    if (body.organizationId && body.organizationId !== existingPharmacy.organizationId) {
      // Only super admins can change organization
      if (session.user.role !== 'SUPER_ADMIN') {
        return NextResponse.json(
          { error: 'You cannot change the organization of a pharmacy' },
          { status: 403 }
        );
      }

      // Check if pharmacy with same slug exists in the new organization
      const conflictingPharmacy = await prisma.pharmacy.findFirst({
        where: {
          organizationId: body.organizationId,
          slug: body.slug,
          id: { not: params.id },
        },
      });

      if (conflictingPharmacy) {
        return NextResponse.json(
          { error: 'A pharmacy with this slug already exists in the target organization' },
          { status: 400 }
        );
      }
    } else if (body.slug !== existingPharmacy.slug) {
      // Check if pharmacy with same slug exists in the same organization
      const conflictingPharmacy = await prisma.pharmacy.findFirst({
        where: {
          organizationId: existingPharmacy.organizationId,
          slug: body.slug,
          id: { not: params.id },
        },
      });

      if (conflictingPharmacy) {
        return NextResponse.json(
          { error: 'A pharmacy with this slug already exists in the organization' },
          { status: 400 }
        );
      }
    }

    // Update pharmacy
    const pharmacy = await prisma.pharmacy.update({
      where: {
        id: params.id,
      },
      data: {
        name: body.name,
        slug: body.slug,
        address: body.address,
        postcode: body.postcode,
        phoneNumber: body.phoneNumber,
        email: body.email,
        nhsContractNumber: body.nhsContractNumber,
        isActive: body.isActive !== undefined ? body.isActive : existingPharmacy.isActive,
        organizationId: body.organizationId || existingPharmacy.organizationId,
      },
    });

    // Log activity
    await AuditService.logAction({
      action: 'UPDATE_PHARMACY' as any,
      category: 'ADMIN' as any,
      userId: session.user.id,
      details: {
        pharmacyId: pharmacy.id,
        pharmacyName: pharmacy.name,
        changes: Object.keys(body).join(','),
      },
    });

    return NextResponse.json(pharmacy);
  } catch (error) {
    console.error('Error updating pharmacy:', error);
    return NextResponse.json(
      { error: 'Failed to update pharmacy' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/pharmacies/:id
 *
 * Delete a specific pharmacy
 * This is a soft delete that sets isActive to false
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only super admins and org admins can delete pharmacies
    if (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ORG_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get existing pharmacy
    const existingPharmacy = await prisma.pharmacy.findUnique({
      where: {
        id: params.id,
      },
    });

    if (!existingPharmacy) {
      return NextResponse.json({ error: 'Pharmacy not found' }, { status: 404 });
    }

    // Check access permissions
    if (
      session.user.role !== 'SUPER_ADMIN' &&
      existingPharmacy.organizationId !== session.user.organizationId
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Soft delete by setting isActive to false
    const pharmacy = await prisma.pharmacy.update({
      where: {
        id: params.id,
      },
      data: {
        isActive: false,
      },
    });

    // Log activity
    await AuditService.logAction({
      action: 'DELETE_PHARMACY' as any,
      category: 'ADMIN' as any,
      userId: session.user.id,
      details: {
        pharmacyId: pharmacy.id,
        pharmacyName: pharmacy.name,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting pharmacy:', error);
    return NextResponse.json(
      { error: 'Failed to delete pharmacy' },
      { status: 500 }
    );
  }
}
