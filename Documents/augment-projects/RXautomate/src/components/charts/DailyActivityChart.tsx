'use client';

import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

interface DailyActivityChartProps {
  data: {
    date: string;
    total: number;
    dispensed: number;
    cancelled: number;
  }[];
}

const DailyActivityChart: React.FC<DailyActivityChartProps> = ({ data }) => {
  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart
        data={data}
        margin={{
          top: 20,
          right: 20,
          bottom: 20,
          left: 20,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="date" 
          tickFormatter={formatDate}
          tick={{ fontSize: 12 }}
        />
        <YAxis 
          yAxisId="left"
          orientation="left"
          tick={{ fontSize: 12 }}
        />
        <Tooltip 
          formatter={(value: number) => [value, '']}
          labelFormatter={(label) => formatDate(label)}
        />
        <Legend />
        <Bar 
          yAxisId="left" 
          dataKey="total" 
          fill="#005EB8" 
          name="Total" 
          barSize={20}
        />
        <Bar 
          yAxisId="left" 
          dataKey="dispensed" 
          fill="#41B6E6" 
          name="Dispensed" 
          barSize={20}
        />
        <Line 
          yAxisId="left" 
          type="monotone" 
          dataKey="cancelled" 
          stroke="#DA291C" 
          name="Cancelled"
          strokeWidth={2}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
};

export default DailyActivityChart;
