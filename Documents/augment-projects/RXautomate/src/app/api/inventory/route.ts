import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import AuditService from '@/services/AuditService';

/**
 * GET /api/inventory
 * 
 * Retrieves inventory items with optional filtering
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
    const category = url.searchParams.get('category');
    const supplier = url.searchParams.get('supplier');
    const lowStock = url.searchParams.get('lowStock') === 'true';
    const search = url.searchParams.get('search');
    
    // Get user's pharmacy ID from session
    const user = session.user as any;
    const pharmacyId = user.pharmacyId;
    
    if (!pharmacyId) {
      return NextResponse.json(
        { error: 'User not associated with a pharmacy' },
        { status: 400 }
      );
    }
    
    // Build query filters
    const filters: any = {
      pharmacyId,
    };
    
    if (category) {
      filters.category = category;
    }
    
    if (supplier) {
      filters.supplier = supplier;
    }
    
    if (search) {
      filters.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { productCode: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    // Get inventory items
    const inventoryItems = await prisma.inventoryItem.findMany({
      where: filters,
      orderBy: {
        name: 'asc',
      },
    });
    
    // Filter for low stock items if requested
    const filteredItems = lowStock 
      ? inventoryItems.filter(item => item.currentStock < item.reorderLevel)
      : inventoryItems;
    
    // Get unique categories and suppliers for filtering options
    const categories = await prisma.inventoryItem.groupBy({
      by: ['category'],
      where: { pharmacyId },
    });
    
    const suppliers = await prisma.inventoryItem.groupBy({
      by: ['supplier'],
      where: { pharmacyId },
    });
    
    // Log the inventory access
    await AuditService.logSystemEvent('INVENTORY_ACCESS', {
      pharmacyId,
      userId: (session.user as any).id,
      filters: { category, supplier, lowStock, search },
      itemCount: filteredItems.length,
    });
    
    return NextResponse.json({
      items: filteredItems,
      filters: {
        categories: categories.map(c => c.category),
        suppliers: suppliers.map(s => s.supplier).filter(Boolean),
      },
    });
  } catch (error: any) {
    console.error('Error fetching inventory items:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch inventory items',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/inventory
 * 
 * Creates a new inventory item
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
    
    // Get user's pharmacy ID from session
    const user = session.user as any;
    const pharmacyId = user.pharmacyId;
    
    if (!pharmacyId) {
      return NextResponse.json(
        { error: 'User not associated with a pharmacy' },
        { status: 400 }
      );
    }
    
    // Parse request body
    const data = await request.json();
    
    // Validate required fields
    if (!data.productCode || !data.name || data.currentStock === undefined || 
        data.reorderLevel === undefined || data.reorderQuantity === undefined || 
        !data.category || data.unitPrice === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Create new inventory item
    const newItem = await prisma.inventoryItem.create({
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
        pharmacy: {
          connect: { id: pharmacyId },
        },
      },
    });
    
    // Log the inventory creation
    await AuditService.logSystemEvent('INVENTORY_ITEM_CREATE', {
      pharmacyId,
      userId: (session.user as any).id,
      itemId: newItem.id,
      productCode: newItem.productCode,
      name: newItem.name,
    });
    
    return NextResponse.json(newItem, { status: 201 });
  } catch (error: any) {
    console.error('Error creating inventory item:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to create inventory item',
        message: error.message 
      },
      { status: 500 }
    );
  }
}
