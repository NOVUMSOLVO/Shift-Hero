'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, TrendingUp, TrendingDown, Activity, Clock, CheckCircle, XCircle } from 'lucide-react';
import DailyActivityChart from '@/components/charts/DailyActivityChart';
import StatusDistributionChart from '@/components/charts/StatusDistributionChart';
import PrescriptionTypesChart from '@/components/charts/PrescriptionTypesChart';

interface AnalyticsData {
  totalPrescriptions: number;
  dispensedPrescriptions: number;
  pendingPrescriptions: number;
  cancelledPrescriptions: number;
  averageProcessingTime: number; // in minutes
  dispensingRate: number; // percentage
  dailyStats: {
    date: string;
    total: number;
    dispensed: number;
    cancelled: number;
  }[];
  statusDistribution: {
    status: string;
    count: number;
  }[];
  prescriptionTypes: {
    type: string;
    count: number;
  }[];
}

export default function PrescriptionAnalytics() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'7days' | '30days' | '90days' | 'year'>('30days');

  useEffect(() => {
    fetchAnalyticsData(timeRange);
  }, [timeRange]);

  const fetchAnalyticsData = async (range: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/analytics/prescriptions?timeRange=${range}`);

      if (!response.ok) {
        throw new Error(`Error fetching analytics data: ${response.statusText}`);
      }

      const data = await response.json();
      setAnalyticsData(data);
    } catch (err: any) {
      console.error('Failed to fetch analytics data:', err);
      setError(err.message || 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  // Format time in minutes to hours and minutes
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);

    if (hours === 0) {
      return `${mins} min${mins !== 1 ? 's' : ''}`;
    }

    return `${hours} hr${hours !== 1 ? 's' : ''} ${mins} min${mins !== 1 ? 's' : ''}`;
  };

  // Format percentage
  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  // Get trend indicator
  const getTrendIndicator = (current: number, previous: number) => {
    const percentChange = previous > 0 ? ((current - previous) / previous) * 100 : 0;

    if (percentChange > 5) {
      return { icon: <TrendingUp className="h-4 w-4 text-green-500" />, text: `+${percentChange.toFixed(1)}%`, color: 'text-green-500' };
    } else if (percentChange < -5) {
      return { icon: <TrendingDown className="h-4 w-4 text-red-500" />, text: `${percentChange.toFixed(1)}%`, color: 'text-red-500' };
    } else {
      return { icon: <Activity className="h-4 w-4 text-yellow-500" />, text: 'Stable', color: 'text-yellow-500' };
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading analytics data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error: </strong>
        <span className="block sm:inline">{error}</span>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="text-center p-8 border border-dashed rounded-lg">
        <p className="text-gray-500">No analytics data available.</p>
      </div>
    );
  }

  // Mock data for charts (in a real implementation, this would come from the API)
  const mockChartData = {
    dailyStats: [
      { date: '2023-05-01', total: 45, dispensed: 38, cancelled: 3 },
      { date: '2023-05-02', total: 52, dispensed: 42, cancelled: 5 },
      { date: '2023-05-03', total: 48, dispensed: 40, cancelled: 2 },
      { date: '2023-05-04', total: 56, dispensed: 45, cancelled: 4 },
      { date: '2023-05-05', total: 62, dispensed: 50, cancelled: 6 },
      { date: '2023-05-06', total: 58, dispensed: 48, cancelled: 3 },
      { date: '2023-05-07', total: 50, dispensed: 42, cancelled: 4 },
    ],
    statusDistribution: [
      { status: 'active', count: 120 },
      { status: 'completed', count: 350 },
      { status: 'cancelled', count: 45 },
      { status: 'on-hold', count: 25 },
    ],
    prescriptionTypes: [
      { type: 'NHS', count: 420 },
      { type: 'Private', count: 85 },
      { type: 'Repeat', count: 210 },
      { type: 'Emergency', count: 15 },
    ],
  };

  // Calculate trends (comparing to previous period)
  const dispensingRateTrend = getTrendIndicator(analyticsData.dispensingRate, 85.2); // Mock previous value
  const processingTimeTrend = getTrendIndicator(analyticsData.averageProcessingTime, 25.5); // Mock previous value
  const totalPrescriptionsTrend = getTrendIndicator(analyticsData.totalPrescriptions, 520); // Mock previous value

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Prescription Analytics</h2>
        <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7days">Last 7 Days</SelectItem>
            <SelectItem value="30days">Last 30 Days</SelectItem>
            <SelectItem value="90days">Last 90 Days</SelectItem>
            <SelectItem value="year">Last Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Prescriptions</CardDescription>
            <div className="flex justify-between items-center">
              <CardTitle className="text-2xl">{analyticsData.totalPrescriptions}</CardTitle>
              <div className="flex items-center">
                {totalPrescriptionsTrend.icon}
                <span className={`text-xs ml-1 ${totalPrescriptionsTrend.color}`}>
                  {totalPrescriptionsTrend.text}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-gray-500">
              Compared to previous period
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Dispensing Rate</CardDescription>
            <div className="flex justify-between items-center">
              <CardTitle className="text-2xl">{formatPercentage(analyticsData.dispensingRate)}</CardTitle>
              <div className="flex items-center">
                {dispensingRateTrend.icon}
                <span className={`text-xs ml-1 ${dispensingRateTrend.color}`}>
                  {dispensingRateTrend.text}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-gray-500">
              Prescriptions successfully dispensed
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Average Processing Time</CardDescription>
            <div className="flex justify-between items-center">
              <CardTitle className="text-2xl">{formatTime(analyticsData.averageProcessingTime)}</CardTitle>
              <div className="flex items-center">
                {processingTimeTrend.icon}
                <span className={`text-xs ml-1 ${processingTimeTrend.color}`}>
                  {processingTimeTrend.text}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-gray-500">
              From receipt to dispensing
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending Prescriptions</CardDescription>
            <CardTitle className="text-2xl">{analyticsData.pendingPrescriptions}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Active: {analyticsData.pendingPrescriptions}</span>
              <span>On Hold: {mockChartData.statusDistribution.find(s => s.status === 'on-hold')?.count || 0}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="overview">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="status">Status Distribution</TabsTrigger>
          <TabsTrigger value="types">Prescription Types</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="p-4 border rounded-md mt-2">
          <h3 className="text-lg font-medium mb-4">Daily Prescription Activity</h3>
          <div className="h-80 w-full">
            <DailyActivityChart data={analyticsData.dailyStats} />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-medium">{analyticsData.dispensedPrescriptions}</div>
              <div className="text-sm text-gray-500 flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                Dispensed
              </div>
            </div>
            <div>
              <div className="text-lg font-medium">{analyticsData.pendingPrescriptions}</div>
              <div className="text-sm text-gray-500 flex items-center justify-center">
                <Clock className="h-4 w-4 text-yellow-500 mr-1" />
                Pending
              </div>
            </div>
            <div>
              <div className="text-lg font-medium">{analyticsData.cancelledPrescriptions}</div>
              <div className="text-sm text-gray-500 flex items-center justify-center">
                <XCircle className="h-4 w-4 text-red-500 mr-1" />
                Cancelled
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="status" className="p-4 border rounded-md mt-2">
          <h3 className="text-lg font-medium mb-4">Prescription Status Distribution</h3>
          <div className="h-80 w-full">
            <StatusDistributionChart data={analyticsData.statusDistribution} />
          </div>
          <div className="mt-4 grid grid-cols-4 gap-4">
            {mockChartData.statusDistribution.map((item) => (
              <div key={item.status} className="text-center">
                <div className="text-lg font-medium">{item.count}</div>
                <div className="text-sm text-gray-500 capitalize">{item.status}</div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="types" className="p-4 border rounded-md mt-2">
          <h3 className="text-lg font-medium mb-4">Prescription Types</h3>
          <div className="h-80 w-full">
            <PrescriptionTypesChart data={analyticsData.prescriptionTypes} />
          </div>
          <div className="mt-4 grid grid-cols-4 gap-4">
            {mockChartData.prescriptionTypes.map((item) => (
              <div key={item.type} className="text-center">
                <div className="text-lg font-medium">{item.count}</div>
                <div className="text-sm text-gray-500">{item.type}</div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
