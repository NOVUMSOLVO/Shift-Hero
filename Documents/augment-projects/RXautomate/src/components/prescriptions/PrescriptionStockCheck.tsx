'use client';

import { useState, useEffect } from 'react';
import { Prescription } from '@/services/EPSService';
import { StockCheckResult } from '@/services/InventoryPrescriptionService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertTriangle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

interface PrescriptionStockCheckProps {
  prescription: Prescription;
  onDispense?: () => void;
}

export default function PrescriptionStockCheck({ prescription, onDispense }: PrescriptionStockCheckProps) {
  const [stockCheck, setStockCheck] = useState<StockCheckResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (prescription) {
      checkStock();
    }
  }, [prescription]);

  const checkStock = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/prescriptions/${prescription.id}/stock`);
      
      if (!response.ok) {
        throw new Error(`Error checking stock: ${response.statusText}`);
      }
      
      const data = await response.json();
      setStockCheck(data);
    } catch (err: any) {
      console.error('Failed to check stock:', err);
      setError(err.message || 'Failed to check stock');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-24">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2">Checking stock...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
        <Button variant="outline" size="sm" className="ml-auto" onClick={checkStock}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </Alert>
    );
  }

  if (!stockCheck) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <span>Inventory Check</span>
          {stockCheck.allInStock ? (
            <Badge className="ml-2 bg-green-100 text-green-800">In Stock</Badge>
          ) : stockCheck.anyOutOfStock ? (
            <Badge className="ml-2 bg-red-100 text-red-800">Out of Stock</Badge>
          ) : (
            <Badge className="ml-2 bg-yellow-100 text-yellow-800">Low Stock</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {stockCheck.items.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <div>
                <p className="font-medium">{item.medicationName}</p>
                <p className="text-sm text-gray-500">
                  Required: {item.requiredQuantity} | Available: {item.currentStock}
                </p>
              </div>
              <div>
                {item.outOfStock ? (
                  <div className="flex items-center text-red-600">
                    <XCircle className="h-5 w-5 mr-1" />
                    Out of Stock
                  </div>
                ) : item.lowStock ? (
                  <div className="flex items-center text-yellow-600">
                    <AlertTriangle className="h-5 w-5 mr-1" />
                    Low Stock
                  </div>
                ) : (
                  <div className="flex items-center text-green-600">
                    <CheckCircle className="h-5 w-5 mr-1" />
                    In Stock
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {stockCheck.anyOutOfStock && (
            <Alert className="mt-4 bg-red-50 text-red-800 border-red-200">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Some items are out of stock. Please reorder before dispensing.
              </AlertDescription>
            </Alert>
          )}
          
          {stockCheck.anyLowStock && !stockCheck.anyOutOfStock && (
            <Alert className="mt-4 bg-yellow-50 text-yellow-800 border-yellow-200">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Some items are running low. Consider reordering soon.
              </AlertDescription>
            </Alert>
          )}
          
          {onDispense && (
            <div className="mt-4 flex justify-end">
              <Button 
                onClick={onDispense}
                disabled={stockCheck.anyOutOfStock}
              >
                {stockCheck.anyOutOfStock ? 'Cannot Dispense' : 'Dispense'}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
