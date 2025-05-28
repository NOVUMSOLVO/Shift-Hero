"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pill, Calendar, Package, Bell, Loader2, ExternalLink, AlertTriangle, BarChart3, TrendingUp } from 'lucide-react';

export default function MobileHomePage() {
  const [stats, setStats] = useState({
    activePrescriptions: 0,
    todayAppointments: 0,
    lowStockItems: 0,
    notifications: 0
  });
  
  const [loading, setLoading] = useState(true);
  
  // Fetch dashboard stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        // In a real app, these would be actual API calls
        // Here we're just simulating with random numbers
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setStats({
          activePrescriptions: Math.floor(Math.random() * 30) + 5,
          todayAppointments: Math.floor(Math.random() * 10),
          lowStockItems: Math.floor(Math.random() * 8),
          notifications: Math.floor(Math.random() * 12)
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, []);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-[80vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">RXautomate</h1>
        <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700 px-2">
          Pharmacy Mode
        </Badge>
      </div>
      
      {/* Quick Stats Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-4 pb-2 px-3">
            <div className="flex items-center justify-between mb-1">
              <Pill className="h-5 w-5 text-blue-600" />
              <span className="text-xl font-bold text-blue-600">{stats.activePrescriptions}</span>
            </div>
            <p className="text-sm text-blue-700">Active Prescriptions</p>
          </CardContent>
        </Card>
        
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="pt-4 pb-2 px-3">
            <div className="flex items-center justify-between mb-1">
              <Calendar className="h-5 w-5 text-purple-600" />
              <span className="text-xl font-bold text-purple-600">{stats.todayAppointments}</span>
            </div>
            <p className="text-sm text-purple-700">Today's Appointments</p>
          </CardContent>
        </Card>
        
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="pt-4 pb-2 px-3">
            <div className="flex items-center justify-between mb-1">
              <Package className="h-5 w-5 text-amber-600" />
              <span className="text-xl font-bold text-amber-600">{stats.lowStockItems}</span>
            </div>
            <p className="text-sm text-amber-700">Low Stock Items</p>
          </CardContent>
        </Card>
        
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-4 pb-2 px-3">
            <div className="flex items-center justify-between mb-1">
              <Bell className="h-5 w-5 text-green-600" />
              <span className="text-xl font-bold text-green-600">{stats.notifications}</span>
            </div>
            <p className="text-sm text-green-700">New Notifications</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Quick Actions */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="py-2">
          <div className="grid grid-cols-2 gap-3">
            <Link href="/mobile/prescriptions">
              <Button className="w-full">View Prescriptions</Button>
            </Link>
            <Link href="/mobile/appointments">
              <Button variant="outline" className="w-full">Appointments</Button>
            </Link>
            <Link href="/mobile/inventory">
              <Button variant="outline" className="w-full">Inventory</Button>
            </Link>
            <Link href="/mobile/search">
              <Button variant="outline" className="w-full">Search Patient</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
      
      {/* Alerts */}
      {stats.lowStockItems > 0 && (
        <Card className="mb-6 bg-amber-50 border-amber-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center text-amber-700">
              <AlertTriangle className="h-5 w-5 mr-2 text-amber-600" />
              Inventory Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            <p className="text-amber-800">
              {stats.lowStockItems} items are running low on stock and need reordering.
            </p>
          </CardContent>
          <CardFooter className="pt-0">
            <Link href="/mobile/inventory?filter=low-stock">
              <Button variant="outline" size="sm" className="text-amber-700 border-amber-300">
                View Low Stock Items
              </Button>
            </Link>
          </CardFooter>
        </Card>
      )}
      
      {/* Patient Adherence Program Highlight */}
      <Card className="mb-6">
        <CardHeader className="pb-2 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardTitle className="text-lg">Patient Adherence Program</CardTitle>
          <CardDescription>
            Help your patients stay on track with their medications
          </CardDescription>
        </CardHeader>
        <CardContent className="py-4">
          <p className="text-sm text-gray-700 mb-4">
            Monitor patient adherence, set up medication reminders, and provide timely interventions
            for better health outcomes.
          </p>
          <Link href="/mobile/adherence">
            <Button className="w-full">
              View Adherence Dashboard
              <ExternalLink className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Business Intelligence Dashboard */}
      <Card className="mb-6">
        <CardHeader className="pb-2 bg-gradient-to-r from-purple-50 to-pink-50">
          <CardTitle className="text-lg flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-purple-600" />
            Business Intelligence
          </CardTitle>
          <CardDescription>
            Analyze performance metrics and optimize operations with AI-driven insights
          </CardDescription>
        </CardHeader>
        <CardContent className="py-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm text-gray-700">ROI Tracking</span>
            </div>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-gray-700">Analytics</span>
            </div>
          </div>
          <p className="text-sm text-gray-700 mb-4">
            Access comprehensive analytics, ROI calculations, and actionable insights 
            to maximize your pharmacy's efficiency and profitability.
          </p>
          <Link href="/dashboard">
            <Button className="w-full bg-purple-600 hover:bg-purple-700">
              Open BI Dashboard
              <ExternalLink className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
