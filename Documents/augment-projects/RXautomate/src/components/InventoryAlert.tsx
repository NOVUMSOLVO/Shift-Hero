import React from 'react';

interface InventoryAlertProps {
  id: string;
  productCode: string;
  name: string;
  currentStock: number;
  reorderLevel: number;
  reorderQuantity: number;
  supplier: string | null;
  onReorder?: (id: string, quantity: number) => void;
}

const InventoryAlert: React.FC<InventoryAlertProps> = ({
  id,
  productCode,
  name,
  currentStock,
  reorderLevel,
  reorderQuantity,
  supplier,
  onReorder,
}) => {
  // Calculate stock status
  const stockStatus = () => {
    if (currentStock === 0) {
      return {
        label: 'Out of Stock',
        color: 'bg-red-100 text-red-800 border-red-200',
        textColor: 'text-red-800',
      };
    } else if (currentStock < reorderLevel) {
      return {
        label: 'Low Stock',
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        textColor: 'text-yellow-800',
      };
    } else {
      return {
        label: 'In Stock',
        color: 'bg-green-100 text-green-800 border-green-200',
        textColor: 'text-green-800',
      };
    }
  };

  const status = stockStatus();

  return (
    <div className={`border rounded-lg p-4 ${status.color}`}>
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-semibold">{name}</h3>
          <p className="text-sm text-gray-700">Code: {productCode}</p>
        </div>
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-white border">
          {status.label}
        </span>
      </div>
      
      <div className="grid grid-cols-3 gap-2 mb-3 text-sm">
        <div>
          <p className="text-gray-600">Current Stock</p>
          <p className={`font-medium ${status.textColor}`}>{currentStock}</p>
        </div>
        <div>
          <p className="text-gray-600">Reorder Level</p>
          <p className="font-medium">{reorderLevel}</p>
        </div>
        <div>
          <p className="text-gray-600">Reorder Qty</p>
          <p className="font-medium">{reorderQuantity}</p>
        </div>
      </div>
      
      {supplier && (
        <p className="text-sm mb-3">
          <span className="text-gray-600">Supplier:</span> {supplier}
        </p>
      )}
      
      {onReorder && currentStock < reorderLevel && (
        <button
          className="w-full px-3 py-2 bg-nhs-blue text-white rounded-md text-sm hover:bg-nhs-dark-blue"
          onClick={() => onReorder(id, reorderQuantity)}
        >
          Reorder {reorderQuantity} Units
        </button>
      )}
    </div>
  );
};

export default InventoryAlert;
