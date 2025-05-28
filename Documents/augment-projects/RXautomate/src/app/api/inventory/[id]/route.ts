import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import AuditService from '@/services/AuditService';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/inventory/[id]
 * 
 * Retrieves a specific inventory item by ID
 * Requires authentication and appropriate permissions
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { id } = params;
    
    // Get user's pharmacy ID from session
    const user = session.user as any;
    const pharmacyId = user.pharmacyId;
    
    if (!pharmacyId) {
      return NextResponse.json(
        { error: 'User not associated with a pharmacy' },
        { status: 400 }
      );
    }
    
    // Get inventory item
    const inventoryItem = await prisma.inventoryItem.findUnique({
      where: {
        id,
      },
    });
    
    if (!inventoryItem) {
      return NextResponse.json(
        { error: 'Inventory item not found' },
        { status: 404 }
      );
    }
    
    // Check if item belongs to user's pharmacy
    if (inventoryItem.pharmacyId !== pharmacyId) {
      return NextResponse.json(
        { error: 'Unauthorized to access this inventory item' },
        { status: 403 }
      );
    }
    
    // Log the inventory item access
    await AuditService.logSystemEvent('INVENTORY_ITEM_ACCESS', {
      pharmacyId,
      userId: (session.user as any).id,
      itemId: inventoryItem.id,
      productCode: inventoryItem.productCode,
      name: inventoryItem.name,
    });
    
    return NextResponse.json(inventoryItem);
  } catch (error: any) {
    console.error('Error fetching inventory item:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch inventory item',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/inventory/[id]
 * 
 * Updates a specific inventory item by ID
 * Requires authentication and appropriate permissions
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { id } = params;
    
    // Get user's pharmacy ID from session
    const user = session.user as any;
    const pharmacyId = user.pharmacyId;
    
    if (!pharmacyId) {
      return NextResponse.json(
        { error: 'User not associated with a pharmacy' },
        { status: 400 }
      );
    }
    
    // Check if item exists and belongs to user's pharmacy
    const existingItem = await prisma.inventoryItem.findUnique({
      where: {
        id,
      },
    });
    
    if (!existingItem) {
      return NextResponse.json(
        { error: 'Inventory item not found' },
        { status: 404 }
      );
    }
    
    if (existingItem.pharmacyId !== pharmacyId) {
      return NextResponse.json(
        { error: 'Unauthorized to update this inventory item' },
        { status: 403 }
      );
    }
    
    // Parse request body
    const data = await request.json();
    
    // Update inventory item
    const updatedItem = await prisma.inventoryItem.update({
      where: {
        id,
      },
      data: {
        productCode: data.productCode,
        name: data.name,
        description: data.description,
        category: data.category,
        supplier: data.supplier,
        currentStock: data.currentStock,
        reorderLevel: data.reorderLevel,
        reorderQuantity: data.reorderQuantity,
        unitPrice: data.unitPrice,
      },
    });
    
    // Log the inventory item update
    await AuditService.logSystemEvent('INVENTORY_ITEM_UPDATE', {
      pharmacyId,
      userId: (session.user as any).id,
      itemId: updatedItem.id,
      productCode: updatedItem.productCode,
      name: updatedItem.name,
      changes: {
        previousStock: existingItem.currentStock,
        newStock: updatedItem.currentStock,
      },
    });
    
    return NextResponse.json(updatedItem);
  } catch (error: any) {
    console.error('Error updating inventory item:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to update inventory item',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/inventory/[id]
 * 
 * Deletes a specific inventory item by ID
 * Requires authentication and appropriate permissions
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { id } = params;
    
    // Get user's pharmacy ID from session
    const user = session.user as any;
    const pharmacyId = user.pharmacyId;
    
    if (!pharmacyId) {
      return NextResponse.json(
        { error: 'User not associated with a pharmacy' },
        { status: 400 }
      );
    }
    
    // Check if item exists and belongs to user's pharmacy
    const existingItem = await prisma.inventoryItem.findUnique({
      where: {
        id,
      },
    });
    
    if (!existingItem) {
      return NextResponse.json(
        { error: 'Inventory item not found' },
        { status: 404 }
      );
    }
    
    if (existingItem.pharmacyId !== pharmacyId) {
      return NextResponse.json(
        { error: 'Unauthorized to delete this inventory item' },
        { status: 403 }
      );
    }
    
    // Delete inventory item
    await prisma.inventoryItem.delete({
      where: {
        id,
      },
    });
    
    // Log the inventory item deletion
    await AuditService.logSystemEvent('INVENTORY_ITEM_DELETE', {
      pharmacyId,
      userId: (session.user as any).id,
      itemId: id,
      productCode: existingItem.productCode,
      name: existingItem.name,
    });
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting inventory item:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to delete inventory item',
        message: error.message 
      },
      { status: 500 }
    );
  }
}
