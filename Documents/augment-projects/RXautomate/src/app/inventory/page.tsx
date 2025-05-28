'use client';

import React, { useState } from 'react';
import Layout from '@/components/Layout';
import InventoryAlert from '@/components/InventoryAlert';

// Mock data for demonstration
const mockInventoryItems = [
  {
    id: '1',
    productCode: 'AMX500C',
    name: 'Amoxicillin 500mg capsules',
    currentStock: 5,
    reorderLevel: 10,
    reorderQuantity: 50,
    supplier: 'AAH Pharmaceuticals',
  },
  {
    id: '2',
    productCode: 'PCM500T',
    name: 'Paracetamol 500mg tablets',
    currentStock: 0,
    reorderLevel: 20,
    reorderQuantity: 100,
    supplier: 'Alliance Healthcare',
  },
  {
    id: '3',
    productCode: 'ASP75T',
    name: 'Aspirin 75mg tablets',
    currentStock: 15,
    reorderLevel: 15,
    reorderQuantity: 50,
    supplier: 'Phoenix Healthcare',
  },
  {
    id: '4',
    productCode: 'LIS10T',
    name: 'Lisinopril 10mg tablets',
    currentStock: 8,
    reorderLevel: 10,
    reorderQuantity: 28,
    supplier: 'AAH Pharmaceuticals',
  },
  {
    id: '5',
    productCode: 'ATV20T',
    name: 'Atorvastatin 20mg tablets',
    currentStock: 25,
    reorderLevel: 10,
    reorderQuantity: 28,
    supplier: 'Alliance Healthcare',
  },
  {
    id: '6',
    productCode: 'MET500T',
    name: 'Metformin 500mg tablets',
    currentStock: 3,
    reorderLevel: 15,
    reorderQuantity: 56,
    supplier: 'Phoenix Healthcare',
  },
];

export default function InventoryPage() {
  const [inventory, setInventory] = useState(mockInventoryItems);
  const [filterSupplier, setFilterSupplier] = useState<string | 'ALL'>('ALL');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  // Handle reorder
  const handleReorder = async (id: string, quantity: number) => {
    const item = inventory.find(i => i.id === id);
    if (!item) return;

    try {
      // In a real app, this would call the API
      console.log(`Reordering ${quantity} units of ${item.name} from ${item.supplier}`);
      alert(`Order placed for ${quantity} units of ${item.name}`);
      
      // Update local state to simulate order processing
      setInventory(prev =>
        prev.map(inventoryItem =>
          inventoryItem.id === id ? { ...inventoryItem, currentStock: inventoryItem.currentStock + quantity } : inventoryItem
        )
      );
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Failed to place order');
    }
  };

  // Get unique suppliers for filter
  const suppliers = Array.from(new Set(inventory.map(item => item.supplier)));

  // Filter inventory items
  const filteredInventory = inventory.filter(item => {
    const supplierMatch = filterSupplier === 'ALL' || item.supplier === filterSupplier;
    const stockMatch = !showLowStockOnly || item.currentStock < item.reorderLevel;
    return supplierMatch && stockMatch;
  });

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Inventory Management</h1>
          <button className="px-4 py-2 bg-nhs-blue text-white rounded-md hover:bg-nhs-dark-blue">
            Sync Inventory
          </button>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Supplier
              </label>
              <select
                className="w-full px-3 py-2 border rounded-md"
                value={filterSupplier}
                onChange={(e) => setFilterSupplier(e.target.value)}
              >
                <option value="ALL">All Suppliers</option>
                {suppliers.map((supplier, index) => (
                  <option key={index} value={supplier}>
                    {supplier}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-end">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-nhs-blue focus:ring-nhs-blue"
                  checked={showLowStockOnly}
                  onChange={() => setShowLowStockOnly(!showLowStockOnly)}
                />
                <span className="ml-2 text-sm text-gray-700">Show Low Stock Items Only</span>
              </label>
            </div>
            
            <div className="flex items-end justify-end">
              <button className="px-4 py-2 bg-nhs-green text-white rounded-md hover:bg-nhs-light-green">
                Generate Order Report
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredInventory.length > 0 ? (
            filteredInventory.map((item) => (
              <InventoryAlert
                key={item.id}
                id={item.id}
                productCode={item.productCode}
                name={item.name}
                currentStock={item.currentStock}
                reorderLevel={item.reorderLevel}
                reorderQuantity={item.reorderQuantity}
                supplier={item.supplier}
                onReorder={handleReorder}
              />
            ))
          ) : (
            <div className="col-span-3 bg-white p-6 rounded-lg shadow-md text-center">
              <p className="text-gray-500">No inventory items match your filters</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
