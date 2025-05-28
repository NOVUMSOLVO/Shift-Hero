"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Users,
  Activity,
  Brain,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Lightbulb,
  AlertCircle,
  Calendar,
  Download
} from 'lucide-react';

import ROICalculator from './ROICalculator';

interface BusinessIntelligenceDashboardProps {
  pharmacyId: string;
  timeframe?: 'monthly' | 'quarterly' | 'yearly';
}

const BusinessIntelligenceDashboard: React.FC<BusinessIntelligenceDashboardProps> = ({
  pharmacyId,
  timeframe = 'monthly'
}) => {
  const [metrics, setMetrics] = useState<any>(null);
  const [roiData, setRoiData] = useState<any>(null);
  const [insights, setInsights] = useState<any[]>([]);
  const [trends, setTrends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState(timeframe);

  useEffect(() => {
    fetchDashboardData();
  }, [pharmacyId, selectedTimeframe]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // In a real application, these would be API calls
      // Mock data for demonstration
      const mockMetrics = {
        pharmacyName: "RXautomate Pharmacy",
        period: {
          start: new Date(2024, 0, 1),
          end: new Date()
        },
        prescriptionMetrics: {
          totalPrescriptions: 1248,
          completedPrescriptions: 1196,
          pendingPrescriptions: 52,
          validationAccuracy: 94.2,
          averageProcessingTime: 12,
          peakHours: [
            { hour: 14, count: 156 },
            { hour: 11, count: 142 },
            { hour: 16, count: 134 },
            { hour: 10, count: 128 },
            { hour: 15, count: 118 }
          ]
        },
        adherenceMetrics: {
          averageAdherenceScore: 78.5,
          patientsOptimal: 245,
          patientsGood: 180,
          patientsFair: 95,
          patientsPoor: 42,
          interventionsPerformed: 67,
          interventionSuccessRate: 76.8
        },
        financialMetrics: {
          revenue: 31824,
          dispensingFees: 1585,
          averageValuePerPrescription: 25.50,
          costSavings: 2496
        },
        operationalMetrics: {
          stockTurns: 8,
          outOfStockIncidents: 3,
          staffProductivity: 87,
          errorRate: 1.2
        },
        aiMetrics: {
          totalAIValidations: 1248,
          aiAccuracy: 94.2,
          timeSavedByAI: 62.4,
          flaggedPrescriptions: 89,
          falsePositives: 12
        }
      };

      const mockROI = {
        pharmacyId,
        timeframe: selectedTimeframe,
        costSavings: {
          staffTimeSaved: 1248,
          reducedErrors: 624,
          improvedCompliance: 850,
          operationalEfficiency: 624
        },
        systemCosts: {
          subscriptionFee: 299,
          trainingCosts: selectedTimeframe === 'yearly' ? 500 : 0,
          maintenanceCosts: 30
        },
        netSavings: 2517,
        roi: 265.8,
        paybackPeriod: 1.4
      };

      const mockInsights = [
        {
          id: '1',
          type: 'recommendation',
          priority: 'high',
          title: 'Optimize Peak Hour Staffing',
          description: 'Peak prescription processing occurs between 2-4 PM with 290 prescriptions.',
          impact: 'Could reduce average wait time by 15% and improve customer satisfaction.',
          actionItems: [
            'Add one additional staff member during 2-4 PM',
            'Pre-process prescriptions received online',
            'Implement queue management system'
          ],
          dataPoints: {
            peakVolume: 290,
            currentWaitTime: 12,
            projectedImprovement: 15
          },
          generatedAt: new Date()
        },
        {
          id: '2',
          type: 'alert',
          priority: 'medium',
          title: 'Low Adherence in Diabetes Patients',
          description: '42 patients showing poor medication adherence (below 50%).',
          impact: 'Poor adherence can lead to complications and increased healthcare costs.',
          actionItems: [
            'Schedule adherence counseling sessions',
            'Implement automated reminder system',
            'Consider packaging solutions'
          ],
          dataPoints: {
            poorAdherenceCount: 42,
            averageAdherence: 45.2,
            targetAdherence: 80
          },
          generatedAt: new Date()
        },
        {
          id: '3',
          type: 'opportunity',
          priority: 'low',
          title: 'AI Validation Excellence',
          description: 'AI validation accuracy of 94.2% exceeds industry standards.',
          impact: 'Strong AI performance enables confident automation expansion.',
          actionItems: [
            'Document best practices',
            'Share success metrics',
            'Consider expanding AI features'
          ],
          dataPoints: {
            currentAccuracy: 94.2,
            industryAverage: 87.5,
            timeSaved: 62.4
          },
          generatedAt: new Date()
        }
      ];

      const mockTrends = [
        {
          metric: 'Prescription Volume',
          data: [
            { month: 'Jan', value: 980 },
            { month: 'Feb', value: 1050 },
            { month: 'Mar', value: 1120 },
            { month: 'Apr', value: 1180 },
            { month: 'May', value: 1220 },
            { month: 'Jun', value: 1248 }
          ],
          trend: 'increasing',
          change: 12.5
        },
        {
          metric: 'Adherence Score',
          data: [
            { month: 'Jan', value: 72.1 },
            { month: 'Feb', value: 74.3 },
            { month: 'Mar', value: 76.8 },
            { month: 'Apr', value: 77.2 },
            { month: 'May', value: 78.1 },
            { month: 'Jun', value: 78.5 }
          ],
          trend: 'increasing',
          change: 8.9
        },
        {
          metric: 'Cost Savings',
          data: [
            { month: 'Jan', value: 1950 },
            { month: 'Feb', value: 2100 },
            { month: 'Mar', value: 2280 },
            { month: 'Apr', value: 2350 },
            { month: 'May', value: 2420 },
            { month: 'Jun', value: 2496 }
          ],
          trend: 'increasing',
          change: 28.0
        }
      ];

      setMetrics(mockMetrics);
      setRoiData(mockROI);
      setInsights(mockInsights);
      setTrends(mockTrends);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    // In a real application, this would generate and download a PDF report
    console.log('Exporting business intelligence report...');
    alert('Report export functionality would be implemented here');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading business intelligence data...</p>
        </div>
      </div>
    );
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'recommendation':
        return <Lightbulb className="h-5 w-5" />;
      case 'alert':
        return <AlertTriangle className="h-5 w-5" />;
      case 'opportunity':
        return <Target className="h-5 w-5" />;
      default:
        return <AlertCircle className="h-5 w-5" />;
    }
  };

  const getInsightColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const adherenceDistribution = [
    { name: 'Optimal (90%+)', value: metrics?.adherenceMetrics.patientsOptimal || 0, color: '#22c55e' },
    { name: 'Good (75-89%)', value: metrics?.adherenceMetrics.patientsGood || 0, color: '#3b82f6' },
    { name: 'Fair (50-74%)', value: metrics?.adherenceMetrics.patientsFair || 0, color: '#f59e0b' },
    { name: 'Poor (<50%)', value: metrics?.adherenceMetrics.patientsPoor || 0, color: '#ef4444' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Business Intelligence Dashboard</h1>
          <p className="text-gray-600 mt-1">{metrics?.pharmacyName}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={exportReport}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export Report
          </Button>
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            title="Select timeframe for analytics"
            aria-label="Select timeframe for analytics"
          >
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Prescriptions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.prescriptionMetrics.totalPrescriptions}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                +12.5% from last period
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Adherence</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.adherenceMetrics.averageAdherenceScore?.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                +8.9% improvement
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Savings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">£{metrics?.financialMetrics.costSavings?.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                +28% cost reduction
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Accuracy</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.aiMetrics.aiAccuracy?.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600 flex items-center">
                <CheckCircle className="h-3 w-3 mr-1" />
                Above industry standard
              </span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
          <TabsTrigger value="adherence">Adherence</TabsTrigger>
          <TabsTrigger value="roi">ROI Analysis</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Prescription Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Prescription Volume Trends</CardTitle>
                <CardDescription>Monthly prescription processing volume</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={trends[0]?.data || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Adherence Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Patient Adherence Distribution</CardTitle>
                <CardDescription>Breakdown of patient adherence levels</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={adherenceDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {adherenceDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Peak Hours Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Peak Processing Hours</CardTitle>
              <CardDescription>Prescription volume by hour of day</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={metrics?.prescriptionMetrics.peakHours || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" tickFormatter={(hour) => `${hour}:00`} />
                  <YAxis />
                  <Tooltip labelFormatter={(hour) => `${hour}:00`} />
                  <Bar dataKey="count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prescriptions" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Processing Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm">
                    <span>Completed</span>
                    <span>{metrics?.prescriptionMetrics.completedPrescriptions}</span>
                  </div>
                  <Progress 
                    value={(metrics?.prescriptionMetrics.completedPrescriptions / metrics?.prescriptionMetrics.totalPrescriptions) * 100} 
                    className="mt-1"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-sm">
                    <span>Pending</span>
                    <span>{metrics?.prescriptionMetrics.pendingPrescriptions}</span>
                  </div>
                  <Progress 
                    value={(metrics?.prescriptionMetrics.pendingPrescriptions / metrics?.prescriptionMetrics.totalPrescriptions) * 100} 
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Validation Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {metrics?.prescriptionMetrics.validationAccuracy?.toFixed(1)}%
                  </div>
                  <p className="text-sm text-gray-600">Validation Accuracy</p>
                </div>
                <div className="flex justify-between text-sm">
                  <span>AI Validations</span>
                  <span>{metrics?.aiMetrics.totalAIValidations}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>False Positives</span>
                  <span>{metrics?.aiMetrics.falsePositives}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Processing Efficiency</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {metrics?.prescriptionMetrics.averageProcessingTime}min
                  </div>
                  <p className="text-sm text-gray-600">Average Processing Time</p>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Time Saved by AI</span>
                  <span>{metrics?.aiMetrics.timeSavedByAI?.toFixed(1)}h</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="adherence" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Adherence Trend</CardTitle>
                <CardDescription>Average patient adherence over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trends[1]?.data || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis domain={[60, 85]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="#22c55e" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Intervention Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {metrics?.adherenceMetrics.interventionSuccessRate?.toFixed(1)}%
                  </div>
                  <p className="text-sm text-gray-600">Success Rate</p>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Total Interventions</span>
                  <span>{metrics?.adherenceMetrics.interventionsPerformed}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Patients Needing Support</span>
                  <span>{metrics?.adherenceMetrics.patientsPoor + metrics?.adherenceMetrics.patientsFair}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="roi" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>ROI Summary</CardTitle>
                <CardDescription>Return on investment analysis</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-600">
                    {roiData?.roi?.toFixed(1)}%
                  </div>
                  <p className="text-sm text-gray-600">Return on Investment</p>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Net Monthly Savings</span>
                    <span className="font-medium">£{roiData?.netSavings?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Payback Period</span>
                    <span className="font-medium">{roiData?.paybackPeriod?.toFixed(1)} months</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">System Cost</span>
                    <span className="font-medium">£{(roiData?.systemCosts.subscriptionFee + roiData?.systemCosts.maintenanceCosts)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cost Savings Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    { name: 'Staff Time', value: roiData?.costSavings.staffTimeSaved || 0 },
                    { name: 'Error Reduction', value: roiData?.costSavings.reducedErrors || 0 },
                    { name: 'Compliance', value: roiData?.costSavings.improvedCompliance || 0 },
                    { name: 'Efficiency', value: roiData?.costSavings.operationalEfficiency || 0 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`£${value}`, 'Savings']} />
                    <Bar dataKey="value" fill="#22c55e" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* ROI Calculator Integration */}
          <Card>
            <CardHeader>
              <CardTitle>ROI Calculator</CardTitle>
              <CardDescription>Calculate ROI for different scenarios</CardDescription>
            </CardHeader>
            <CardContent>
              <ROICalculator
                initialValues={{
                  dailyPrescriptions: Math.round((metrics?.prescriptionMetrics.totalPrescriptions || 1248) / 30),
                  staffHourlyRate: 12,
                  workingDaysPerMonth: 26,
                  selectedTier: 'standard'
                }}
                onCalculate={(results) => {
                  console.log('ROI Calculation Results:', results);
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="space-y-4">
            {insights.map((insight) => (
              <Alert key={insight.id} className="border-l-4">
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-full ${
                    insight.priority === 'high' ? 'bg-red-100 text-red-600' :
                    insight.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                    'bg-blue-100 text-blue-600'
                  }`}>
                    {getInsightIcon(insight.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <AlertTitle className="flex items-center gap-2">
                        {insight.title}
                        <Badge variant={getInsightColor(insight.priority) as any}>
                          {insight.priority}
                        </Badge>
                      </AlertTitle>
                    </div>
                    <AlertDescription className="mt-2">
                      {insight.description}
                    </AlertDescription>
                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-700">Impact:</p>
                      <p className="text-sm text-gray-600">{insight.impact}</p>
                    </div>
                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-700">Recommended Actions:</p>
                      <ul className="text-sm text-gray-600 list-disc list-inside mt-1">
                        {insight.actionItems.map((action: string, index: number) => (
                          <li key={index}>{action}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </Alert>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BusinessIntelligenceDashboard;
