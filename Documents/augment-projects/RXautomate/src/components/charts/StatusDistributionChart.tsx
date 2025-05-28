'use client';

import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts';

interface StatusDistributionChartProps {
  data: {
    status: string;
    count: number;
  }[];
}

const COLORS = ['#41B6E6', '#005EB8', '#DA291C', '#FFB81C'];

const StatusDistributionChart: React.FC<StatusDistributionChartProps> = ({ data }) => {
  // Format status for display
  const formatStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border rounded shadow-sm">
          <p className="font-medium">{formatStatus(payload[0].name)}</p>
          <p className="text-sm">
            Count: <span className="font-medium">{payload[0].value}</span>
          </p>
          <p className="text-sm">
            Percentage: <span className="font-medium">
              {((payload[0].value / data.reduce((sum, item) => sum + item.count, 0)) * 100).toFixed(1)}%
            </span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={80}
          fill="#8884d8"
          dataKey="count"
          nameKey="status"
          label={({ name, percent }) => `${formatStatus(name)}: ${(percent * 100).toFixed(0)}%`}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend 
          formatter={(value) => formatStatus(value)}
          layout="horizontal" 
          verticalAlign="bottom" 
          align="center"
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default StatusDistributionChart;
