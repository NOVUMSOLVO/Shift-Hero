"use client";

import React, { useState, useEffect } from 'react';

interface ROICalculatorProps {
  initialValues?: {
    dailyPrescriptions?: number;
    staffHourlyRate?: number;
    workingDaysPerMonth?: number;
    selectedTier?: 'basic' | 'standard' | 'premium';
  };
  onCalculate?: (results: ROIResults) => void;
}

interface ROIResults {
  monthlyStaffCostWithoutAutomation: number;
  monthlyStaffCostWithAutomation: number;
  monthlySavings: number;
  systemCost: number;
  netMonthlySavings: number;
  roi: number;
  hoursSaved: number;
  timeReduction: number;
}

const ROICalculator: React.FC<ROICalculatorProps> = ({
  initialValues,
  onCalculate,
}) => {
  // Default values
  const defaultValues = {
    dailyPrescriptions: 100,
    staffHourlyRate: 12,
    workingDaysPerMonth: 26,
    selectedTier: 'standard' as 'basic' | 'standard' | 'premium',
  };
  
  // State for form inputs
  const [dailyPrescriptions, setDailyPrescriptions] = useState(
    initialValues?.dailyPrescriptions || defaultValues.dailyPrescriptions
  );
  const [staffHourlyRate, setStaffHourlyRate] = useState(
    initialValues?.staffHourlyRate || defaultValues.staffHourlyRate
  );
  const [workingDaysPerMonth, setWorkingDaysPerMonth] = useState(
    initialValues?.workingDaysPerMonth || defaultValues.workingDaysPerMonth
  );
  const [selectedTier, setSelectedTier] = useState<'basic' | 'standard' | 'premium'>(
    initialValues?.selectedTier || defaultValues.selectedTier
  );
  
  // State for calculation results
  const [results, setResults] = useState<ROIResults | null>(null);
  
  // Pricing tiers
  const pricingTiers = {
    basic: {
      monthlyFee: 25,
      transactionFee: 0.15,
      timeReduction: 0.5, // 50% time reduction
    },
    standard: {
      monthlyFee: 50,
      transactionFee: 0.10,
      timeReduction: 0.625, // 62.5% time reduction
    },
    premium: {
      monthlyFee: 100,
      transactionFee: 0.05,
      timeReduction: 0.75, // 75% time reduction
    },
  };
  
  // Calculate ROI when inputs change
  useEffect(() => {
    calculateROI();
  }, [dailyPrescriptions, staffHourlyRate, workingDaysPerMonth, selectedTier]);
  
  // Calculate ROI
  const calculateROI = () => {
    // Get pricing for selected tier
    const pricing = pricingTiers[selectedTier];
    
    // Calculate time spent on prescriptions
    const minutesPerPrescriptionWithoutAutomation = 8; // 8 minutes per prescription without automation
    const minutesPerPrescriptionWithAutomation = minutesPerPrescriptionWithoutAutomation * (1 - pricing.timeReduction);
    
    // Calculate monthly prescription volume
    const monthlyPrescriptions = dailyPrescriptions * workingDaysPerMonth;
    
    // Calculate staff hours
    const hoursWithoutAutomation = (minutesPerPrescriptionWithoutAutomation * monthlyPrescriptions) / 60;
    const hoursWithAutomation = (minutesPerPrescriptionWithAutomation * monthlyPrescriptions) / 60;
    const hoursSaved = hoursWithoutAutomation - hoursWithAutomation;
    
    // Calculate staff costs
    const monthlyStaffCostWithoutAutomation = hoursWithoutAutomation * staffHourlyRate;
    const monthlyStaffCostWithAutomation = hoursWithAutomation * staffHourlyRate;
    
    // Calculate system cost
    const systemCost = pricing.monthlyFee + (pricing.transactionFee * monthlyPrescriptions);
    
    // Calculate savings
    const monthlySavings = monthlyStaffCostWithoutAutomation - monthlyStaffCostWithAutomation;
    const netMonthlySavings = monthlySavings - systemCost;
    
    // Calculate ROI
    const roi = (netMonthlySavings / systemCost) * 100;
    
    // Set results
    const calculationResults = {
      monthlyStaffCostWithoutAutomation,
      monthlyStaffCostWithAutomation,
      monthlySavings,
      systemCost,
      netMonthlySavings,
      roi,
      hoursSaved,
      timeReduction: pricing.timeReduction * 100,
    };
    
    setResults(calculationResults);
    
    // Call onCalculate callback if provided
    if (onCalculate) {
      onCalculate(calculationResults);
    }
  };
  
  // Format currency
  const formatCurrency = (value: number) => {
    return `£${value.toFixed(2)}`;
  };
  
  // Format percentage
  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="bg-nhs-blue px-6 py-4">
        <h2 className="text-xl font-semibold text-white">ROI Calculator</h2>
        <p className="text-nhs-pale-blue mt-1">
          Calculate your potential savings with RXautomate
        </p>
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Input Form */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Your Pharmacy Details</h3>
            
            {/* Daily Prescriptions */}
            <div>
              <label htmlFor="dailyPrescriptions" className="block text-sm font-medium text-gray-700 mb-1">
                Average Daily Prescriptions
              </label>
              <input
                type="number"
                id="dailyPrescriptions"
                min="1"
                max="1000"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-nhs-blue focus:border-nhs-blue"
                value={dailyPrescriptions}
                onChange={(e) => setDailyPrescriptions(parseInt(e.target.value) || 0)}
              />
              <div className="mt-1">
                <input
                  type="range"
                  min="10"
                  max="500"
                  step="10"
                  value={dailyPrescriptions}
                  onChange={(e) => setDailyPrescriptions(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>10</span>
                  <span>100</span>
                  <span>250</span>
                  <span>500</span>
                </div>
              </div>
            </div>
            
            {/* Staff Hourly Rate */}
            <div>
              <label htmlFor="staffHourlyRate" className="block text-sm font-medium text-gray-700 mb-1">
                Staff Hourly Rate (£)
              </label>
              <input
                type="number"
                id="staffHourlyRate"
                min="8"
                max="50"
                step="0.5"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-nhs-blue focus:border-nhs-blue"
                value={staffHourlyRate}
                onChange={(e) => setStaffHourlyRate(parseFloat(e.target.value) || 0)}
              />
              <div className="mt-1">
                <input
                  type="range"
                  min="8"
                  max="30"
                  step="0.5"
                  value={staffHourlyRate}
                  onChange={(e) => setStaffHourlyRate(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>£8</span>
                  <span>£15</span>
                  <span>£22</span>
                  <span>£30</span>
                </div>
              </div>
            </div>
            
            {/* Working Days Per Month */}
            <div>
              <label htmlFor="workingDaysPerMonth" className="block text-sm font-medium text-gray-700 mb-1">
                Working Days Per Month
              </label>
              <input
                type="number"
                id="workingDaysPerMonth"
                min="20"
                max="31"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-nhs-blue focus:border-nhs-blue"
                value={workingDaysPerMonth}
                onChange={(e) => setWorkingDaysPerMonth(parseInt(e.target.value) || 0)}
              />
              <div className="mt-1">
                <input
                  type="range"
                  min="20"
                  max="31"
                  value={workingDaysPerMonth}
                  onChange={(e) => setWorkingDaysPerMonth(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>20</span>
                  <span>24</span>
                  <span>28</span>
                  <span>31</span>
                </div>
              </div>
            </div>
            
            {/* Subscription Tier */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subscription Tier
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  className={`px-4 py-2 text-sm font-medium rounded-md ${
                    selectedTier === 'basic'
                      ? 'bg-nhs-blue text-white'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedTier('basic')}
                >
                  Basic
                </button>
                <button
                  type="button"
                  className={`px-4 py-2 text-sm font-medium rounded-md ${
                    selectedTier === 'standard'
                      ? 'bg-nhs-blue text-white'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedTier('standard')}
                >
                  Standard
                </button>
                <button
                  type="button"
                  className={`px-4 py-2 text-sm font-medium rounded-md ${
                    selectedTier === 'premium'
                      ? 'bg-nhs-blue text-white'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedTier('premium')}
                >
                  Premium
                </button>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                {selectedTier === 'basic' && (
                  <p>Basic: £25/month + £0.15 per prescription (50% time reduction)</p>
                )}
                {selectedTier === 'standard' && (
                  <p>Standard: £50/month + £0.10 per prescription (62.5% time reduction)</p>
                )}
                {selectedTier === 'premium' && (
                  <p>Premium: £100/month + £0.05 per prescription (75% time reduction)</p>
                )}
              </div>
            </div>
            
            <button
              type="button"
              className="w-full px-4 py-2 bg-nhs-blue text-white rounded-md hover:bg-nhs-dark-blue focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-nhs-blue"
              onClick={calculateROI}
            >
              Calculate ROI
            </button>
          </div>
          
          {/* Results */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Your Potential Savings</h3>
            
            {results && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-3 rounded-md shadow-sm">
                    <p className="text-sm text-gray-500">Monthly Staff Cost (Current)</p>
                    <p className="text-xl font-semibold text-gray-900">
                      {formatCurrency(results.monthlyStaffCostWithoutAutomation)}
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-md shadow-sm">
                    <p className="text-sm text-gray-500">Monthly Staff Cost (With RXautomate)</p>
                    <p className="text-xl font-semibold text-gray-900">
                      {formatCurrency(results.monthlyStaffCostWithAutomation)}
                    </p>
                  </div>
                </div>
                
                <div className="bg-white p-3 rounded-md shadow-sm">
                  <p className="text-sm text-gray-500">Monthly System Cost</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {formatCurrency(results.systemCost)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {selectedTier === 'basic' && `£25 + £0.15 × ${dailyPrescriptions * workingDaysPerMonth} prescriptions`}
                    {selectedTier === 'standard' && `£50 + £0.10 × ${dailyPrescriptions * workingDaysPerMonth} prescriptions`}
                    {selectedTier === 'premium' && `£100 + £0.05 × ${dailyPrescriptions * workingDaysPerMonth} prescriptions`}
                  </p>
                </div>
                
                <div className="bg-nhs-pale-blue p-3 rounded-md shadow-sm">
                  <p className="text-sm text-nhs-dark-blue">Net Monthly Savings</p>
                  <p className="text-2xl font-bold text-nhs-dark-blue">
                    {formatCurrency(results.netMonthlySavings)}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-3 rounded-md shadow-sm">
                    <p className="text-sm text-gray-500">Return on Investment</p>
                    <p className="text-xl font-semibold text-gray-900">
                      {formatPercentage(results.roi)}
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-md shadow-sm">
                    <p className="text-sm text-gray-500">Hours Saved Monthly</p>
                    <p className="text-xl font-semibold text-gray-900">
                      {results.hoursSaved.toFixed(1)}
                    </p>
                  </div>
                </div>
                
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Additional Benefits</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li className="flex items-start">
                      <svg className="h-5 w-5 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Reduced dispensing errors</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="h-5 w-5 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Improved patient satisfaction</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="h-5 w-5 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Better cash flow management</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="h-5 w-5 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Freed staff time for revenue-generating services</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="h-5 w-5 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Reduced risk of fraud through better verification</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}
            
            {!results && (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No calculation yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Enter your pharmacy details and click Calculate ROI to see your potential savings.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ROICalculator;
