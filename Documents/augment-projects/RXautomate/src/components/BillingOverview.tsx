import React from 'react';
import { TransactionType, TransactionStatus } from '@prisma/client';

interface Transaction {
  id: string;
  transactionType: TransactionType;
  amount: number;
  status: TransactionStatus;
  reference: string | null;
  createdAt: Date;
}

interface BillingOverviewProps {
  transactions: Transaction[];
  totalRevenue: number;
  pendingRevenue: number;
  onViewTransaction?: (id: string) => void;
}

const BillingOverview: React.FC<BillingOverviewProps> = ({
  transactions,
  totalRevenue,
  pendingRevenue,
  onViewTransaction,
}) => {
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount);
  };

  // Get transaction type label
  const getTransactionTypeLabel = (type: TransactionType) => {
    switch (type) {
      case 'PRESCRIPTION_FEE':
        return 'Prescription Fee';
      case 'PRIVATE_SERVICE':
        return 'Private Service';
      case 'VACCINATION':
        return 'Vaccination';
      case 'REFUND':
        return 'Refund';
      case 'OTHER':
        return 'Other';
      default:
        return type;
    }
  };

  // Get status color
  const getStatusColor = (status: TransactionStatus) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      case 'REFUNDED':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Billing Overview</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-nhs-pale-blue p-4 rounded-lg">
          <p className="text-sm text-nhs-dark-blue">Total Revenue</p>
          <p className="text-2xl font-bold text-nhs-blue">{formatCurrency(totalRevenue)}</p>
        </div>
        
        <div className="bg-yellow-50 p-4 rounded-lg">
          <p className="text-sm text-yellow-800">Pending Revenue</p>
          <p className="text-2xl font-bold text-yellow-600">{formatCurrency(pendingRevenue)}</p>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm text-green-800">Transaction Count</p>
          <p className="text-2xl font-bold text-green-600">{transactions.length}</p>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Reference
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {transactions.map((transaction) => (
              <tr key={transaction.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(transaction.createdAt).toLocaleDateString('en-GB')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {getTransactionTypeLabel(transaction.transactionType)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {transaction.reference || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {formatCurrency(transaction.amount)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                    {transaction.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {onViewTransaction && (
                    <button
                      className="text-nhs-blue hover:text-nhs-dark-blue"
                      onClick={() => onViewTransaction(transaction.id)}
                    >
                      View Details
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BillingOverview;
