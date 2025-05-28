"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import BusinessIntelligenceDashboard from '@/components/BusinessIntelligenceDashboard';
import { ArrowLeft, BarChart3, TrendingUp, Brain } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  // In a real application, this would come from authentication/context
  const pharmacyId = "default-pharmacy-id";

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation */}
        <div className="mb-8">
          <Link href="/admin">
            <Button variant="outline" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Admin
            </Button>
          </Link>
        </div>

        {/* Dashboard Introduction */}
        <div className="mb-8">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <BarChart3 className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              RXautomate Business Intelligence
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive analytics and insights to optimize your pharmacy operations, 
              improve patient outcomes, and maximize ROI.
            </p>
          </div>
        </div>

        {/* Feature Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-2 p-2 bg-green-100 rounded-full w-fit">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle>Performance Analytics</CardTitle>
              <CardDescription>
                Track prescription volume, processing times, and operational efficiency
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-2 p-2 bg-purple-100 rounded-full w-fit">
                <Brain className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle>AI Insights</CardTitle>
              <CardDescription>
                Monitor AI validation accuracy and automated decision-making performance
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-2 p-2 bg-blue-100 rounded-full w-fit">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle>ROI Optimization</CardTitle>
              <CardDescription>
                Calculate cost savings, efficiency gains, and return on investment
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Main Dashboard */}
        <BusinessIntelligenceDashboard 
          pharmacyId={pharmacyId}
          timeframe="monthly"
        />
      </div>
    </div>
  );
}
