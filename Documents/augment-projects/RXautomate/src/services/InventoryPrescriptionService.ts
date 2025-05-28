import { prisma } from '@/lib/db/prisma';
import { Prescription } from './EPSService';
import AuditService from './AuditService';

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  description?: string;
  category: string;
  currentStock: number;
  reorderLevel: number;
  reorderQuantity: number;
  unitPrice: number;
  supplier: string;
  location?: string;
  expiryDate?: Date;
  batchNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StockCheckResult {
  prescription: Prescription;
  items: {
    medicationName: string;
    inStock: boolean;
    currentStock: number;
    requiredQuantity: number;
    inventoryItemId?: string;
    lowStock: boolean;
    outOfStock: boolean;
  }[];
  allInStock: boolean;
  anyLowStock: boolean;
  anyOutOfStock: boolean;
}

class InventoryPrescriptionService {
  /**
   * Check if all medications in a prescription are in stock
   * @param prescription - The prescription to check
   * @returns Stock check result
   */
  async checkPrescriptionStock(prescription: Prescription): Promise<StockCheckResult> {
    try {
      // Extract medication information from prescription
      const medicationName = prescription.medicationReference?.display ||
                            prescription.medicationCodeableConcept?.coding?.[0]?.display ||
                            '';

      // Get quantity from prescription
      const quantity = prescription.dispenseRequest?.quantity?.value || 1;

      // Query the inventory database for matching medication
      const inventoryItems = await prisma.inventoryItem.findMany({
        where: {
          name: {
            contains: medicationName,
            mode: 'insensitive',
          },
        },
      });

      // Find the best matching inventory item
      const matchingItem = inventoryItems.length > 0 ? inventoryItems[0] : null;

      // Check stock status
      const stockCheck = {
        medicationName,
        inStock: false,
        currentStock: 0,
        requiredQuantity: quantity,
        inventoryItemId: null as string | null,
        lowStock: false,
        outOfStock: true,
      };

      if (matchingItem) {
        stockCheck.currentStock = matchingItem.currentStock;
        stockCheck.inventoryItemId = matchingItem.id;
        stockCheck.inStock = matchingItem.currentStock >= quantity;
        stockCheck.lowStock = matchingItem.currentStock < matchingItem.reorderLevel;
        stockCheck.outOfStock = matchingItem.currentStock === 0;
      }

      const result: StockCheckResult = {
        prescription,
        items: [stockCheck],
        allInStock: stockCheck.inStock,
        anyLowStock: stockCheck.lowStock,
        anyOutOfStock: stockCheck.outOfStock,
      };

      // Log the stock check
      await AuditService.logSystemEvent('PRESCRIPTION_STOCK_CHECK', {
        prescriptionId: prescription.id,
        medicationName,
        inStock: stockCheck.inStock,
        currentStock: stockCheck.currentStock,
        requiredQuantity: quantity,
        inventoryItemId: stockCheck.inventoryItemId,
      });

      return result;
    } catch (error) {
      console.error('Error checking prescription stock:', error);
      throw error;
    }
  }

  /**
   * Update inventory after dispensing a prescription
   * @param prescription - The dispensed prescription
   * @returns Updated inventory items
   */
  async updateInventoryAfterDispensing(prescription: Prescription): Promise<any> {
    try {
      // Extract medication information from prescription
      const medicationName = prescription.medicationReference?.display ||
                            prescription.medicationCodeableConcept?.coding?.[0]?.display ||
                            '';

      // Get quantity from prescription
      const quantity = prescription.dispenseRequest?.quantity?.value || 1;

      // Query the inventory database for matching medication
      const inventoryItems = await prisma.inventoryItem.findMany({
        where: {
          name: {
            contains: medicationName,
            mode: 'insensitive',
          },
        },
      });

      // Find the best matching inventory item
      const matchingItem = inventoryItems.length > 0 ? inventoryItems[0] : null;

      if (!matchingItem) {
        throw new Error(`No matching inventory item found for ${medicationName}`);
      }

      // Check if there's enough stock
      if (matchingItem.currentStock < quantity) {
        throw new Error(`Insufficient stock for ${medicationName}`);
      }

      // Update inventory
      const previousStock = matchingItem.currentStock;
      const newStock = previousStock - quantity;

      const updatedItem = await prisma.inventoryItem.update({
        where: {
          id: matchingItem.id,
        },
        data: {
          currentStock: newStock,
        },
      });

      const inventoryUpdate = {
        medicationName,
        previousStock,
        newStock,
        quantityDispensed: quantity,
        inventoryItemId: matchingItem.id,
      };

      // Log the inventory update
      await AuditService.logSystemEvent('INVENTORY_UPDATE_AFTER_DISPENSING', {
        prescriptionId: prescription.id,
        medicationName,
        previousStock,
        newStock,
        quantityDispensed: quantity,
        inventoryItemId: matchingItem.id,
      });

      return inventoryUpdate;
    } catch (error) {
      console.error('Error updating inventory after dispensing:', error);
      throw error;
    }
  }

  /**
   * Get inventory items that need reordering
   * @param pharmacyId - The pharmacy ID to get items for
   * @returns List of inventory items that need reordering
   */
  async getItemsNeedingReorder(pharmacyId: string): Promise<InventoryItem[]> {
    try {
      // Query the database for items that need reordering
      const items = await prisma.inventoryItem.findMany({
        where: {
          pharmacyId,
          currentStock: {
            lte: { reorderLevel: true },
          },
        },
        orderBy: {
          currentStock: 'asc',
        },
      });

      // Map database items to our interface
      const inventoryItems: InventoryItem[] = items.map(item => ({
        id: item.id,
        name: item.name,
        sku: item.productCode,
        description: item.description || undefined,
        category: item.category,
        currentStock: item.currentStock,
        reorderLevel: item.reorderLevel,
        reorderQuantity: item.reorderQuantity,
        unitPrice: item.unitPrice,
        supplier: item.supplier || undefined,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      }));

      return inventoryItems;
    } catch (error) {
      console.error('Error getting items needing reorder:', error);
      throw error;
    }
  }

  /**
   * Find inventory items matching a medication name
   * @param medicationName - The medication name to search for
   * @param pharmacyId - The pharmacy ID to search in
   * @returns Matching inventory items
   */
  async findInventoryItemsByMedicationName(medicationName: string, pharmacyId: string): Promise<InventoryItem[]> {
    try {
      // Query the database for matching items
      const items = await prisma.inventoryItem.findMany({
        where: {
          pharmacyId,
          name: {
            contains: medicationName,
            mode: 'insensitive',
          },
        },
        orderBy: {
          name: 'asc',
        },
      });

      // Map database items to our interface
      const inventoryItems: InventoryItem[] = items.map(item => ({
        id: item.id,
        name: item.name,
        sku: item.productCode,
        description: item.description || undefined,
        category: item.category,
        currentStock: item.currentStock,
        reorderLevel: item.reorderLevel,
        reorderQuantity: item.reorderQuantity,
        unitPrice: item.unitPrice,
        supplier: item.supplier || undefined,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      }));

      return inventoryItems;
    } catch (error) {
      console.error('Error finding inventory items by medication name:', error);
      throw error;
    }
  }
}

export default new InventoryPrescriptionService();
