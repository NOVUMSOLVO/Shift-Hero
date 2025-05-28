#!/usr/bin/env ts-node

/**
 * NHS API Compliance Report Generator
 * 
 * This script generates a compliance report for NHS API usage.
 * It analyzes audit logs to provide insights into API usage patterns,
 * error rates, and compliance with NHS Digital requirements.
 * 
 * Usage:
 *   npm run report:nhs-api
 *   
 * Options:
 *   --days=30     Number of days to include in the report (default: 30)
 *   --format=csv  Output format (json, csv, html) (default: html)
 *   --email       Send report via email
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { format } from 'date-fns';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Initialize Prisma client
const prisma = new PrismaClient();

// Parse command line arguments
const args = process.argv.slice(2).reduce((acc, arg) => {
  const [key, value] = arg.replace('--', '').split('=');
  acc[key] = value || true;
  return acc;
}, {} as Record<string, any>);

// Configuration
const config = {
  days: parseInt(args.days || '30', 10),
  format: (args.format || 'html') as 'json' | 'csv' | 'html',
  email: Boolean(args.email),
  outputDir: path.join(process.cwd(), 'reports'),
};

// Ensure output directory exists
if (!fs.existsSync(config.outputDir)) {
  fs.mkdirSync(config.outputDir, { recursive: true });
}

// Main function
async function generateReport() {
  try {
    console.log(`Generating NHS API compliance report for the last ${config.days} days...`);
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - config.days);
    
    // Fetch audit logs
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        category: 'NHS_API',
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        timestamp: 'asc',
      },
    });
    
    console.log(`Found ${auditLogs.length} NHS API audit logs.`);
    
    // Analyze the data
    const report = analyzeData(auditLogs, startDate, endDate);
    
    // Generate the report file
    const reportFilePath = generateReportFile(report);
    
    console.log(`Report generated: ${reportFilePath}`);
    
    // Send email if requested
    if (config.email) {
      await sendReportEmail(reportFilePath);
      console.log('Report sent via email.');
    }
    
    return reportFilePath;
  } catch (error) {
    console.error('Error generating report:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Analyze the audit log data
function analyzeData(auditLogs: any[], startDate: Date, endDate: Date) {
  // Group logs by date
  const logsByDate = auditLogs.reduce((acc, log) => {
    const date = format(new Date(log.timestamp), 'yyyy-MM-dd');
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(log);
    return acc;
  }, {} as Record<string, any[]>);
  
  // Group logs by API action
  const logsByAction = auditLogs.reduce((acc, log) => {
    if (!acc[log.action]) {
      acc[log.action] = [];
    }
    acc[log.action].push(log);
    return acc;
  }, {} as Record<string, any[]>);
  
  // Count errors
  const errors = auditLogs.filter(log => log.action === 'API_ERROR');
  
  // Calculate daily averages
  const dailyStats = Object.entries(logsByDate).map(([date, logs]) => {
    const errorCount = logs.filter(log => log.action === 'API_ERROR').length;
    return {
      date,
      totalCalls: logs.length,
      errorCount,
      errorRate: logs.length > 0 ? (errorCount / logs.length) * 100 : 0,
    };
  });
  
  // Calculate API usage by type
  const apiUsage = Object.entries(logsByAction).map(([action, logs]) => {
    return {
      action,
      count: logs.length,
      percentage: (logs.length / auditLogs.length) * 100,
    };
  }).sort((a, b) => b.count - a.count);
  
  // Calculate error types
  const errorTypes = errors.reduce((acc, error) => {
    let errorType = 'Unknown';
    
    try {
      if (error.details) {
        const details = JSON.parse(error.details);
        errorType = details.errorCode || details.statusCode || 'Unknown';
      }
    } catch (e) {
      // Ignore parsing errors
    }
    
    if (!acc[errorType]) {
      acc[errorType] = 0;
    }
    acc[errorType]++;
    return acc;
  }, {} as Record<string, number>);
  
  // Calculate compliance metrics
  const totalCalls = auditLogs.length;
  const totalErrors = errors.length;
  const errorRate = totalCalls > 0 ? (totalErrors / totalCalls) * 100 : 0;
  const complianceScore = 100 - Math.min(errorRate * 2, 100); // Simple scoring formula
  
  // Return the report data
  return {
    period: {
      startDate,
      endDate,
      days: config.days,
    },
    summary: {
      totalCalls,
      totalErrors,
      errorRate,
      complianceScore,
    },
    dailyStats,
    apiUsage,
    errorTypes: Object.entries(errorTypes).map(([type, count]) => ({
      type,
      count,
      percentage: (count / totalErrors) * 100,
    })).sort((a, b) => b.count - a.count),
  };
}

// Generate the report file
function generateReportFile(report: any) {
  const timestamp = format(new Date(), 'yyyyMMdd-HHmmss');
  const filename = `nhs-api-report-${timestamp}.${config.format}`;
  const filePath = path.join(config.outputDir, filename);
  
  let content = '';
  
  switch (config.format) {
    case 'json':
      content = JSON.stringify(report, null, 2);
      break;
    case 'csv':
      content = generateCsvReport(report);
      break;
    case 'html':
    default:
      content = generateHtmlReport(report);
      break;
  }
  
  fs.writeFileSync(filePath, content);
  return filePath;
}

// Generate CSV report
function generateCsvReport(report: any) {
  const lines = [
    // Header
    'Report Type,NHS API Compliance Report',
    `Period,${format(report.period.startDate, 'yyyy-MM-dd')} to ${format(report.period.endDate, 'yyyy-MM-dd')}`,
    `Generated,${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`,
    '',
    // Summary
    'Summary',
    'Total Calls,Total Errors,Error Rate (%),Compliance Score (%)',
    `${report.summary.totalCalls},${report.summary.totalErrors},${report.summary.errorRate.toFixed(2)},${report.summary.complianceScore.toFixed(2)}`,
    '',
    // Daily Stats
    'Daily Statistics',
    'Date,Total Calls,Error Count,Error Rate (%)',
    ...report.dailyStats.map((day: any) => 
      `${day.date},${day.totalCalls},${day.errorCount},${day.errorRate.toFixed(2)}`
    ),
    '',
    // API Usage
    'API Usage',
    'Action,Count,Percentage (%)',
    ...report.apiUsage.map((usage: any) => 
      `${usage.action},${usage.count},${usage.percentage.toFixed(2)}`
    ),
    '',
    // Error Types
    'Error Types',
    'Type,Count,Percentage (%)',
    ...report.errorTypes.map((error: any) => 
      `${error.type},${error.count},${error.percentage.toFixed(2)}`
    ),
  ];
  
  return lines.join('\n');
}

// Generate HTML report
function generateHtmlReport(report: any) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NHS API Compliance Report</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    h1, h2, h3 {
      color: #005EB8; /* NHS Blue */
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    th, td {
      padding: 8px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    th {
      background-color: #005EB8;
      color: white;
    }
    tr:nth-child(even) {
      background-color: #f2f2f2;
    }
    .summary-box {
      display: flex;
      flex-wrap: wrap;
      gap: 20px;
      margin-bottom: 30px;
    }
    .summary-item {
      flex: 1;
      min-width: 200px;
      padding: 15px;
      border-radius: 5px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    .good {
      background-color: #e8f4f8;
      border-left: 5px solid #005EB8;
    }
    .warning {
      background-color: #fff9e6;
      border-left: 5px solid #FFB81C;
    }
    .danger {
      background-color: #fdf2f2;
      border-left: 5px solid #DA291C;
    }
    .chart-container {
      height: 300px;
      margin-bottom: 30px;
    }
    footer {
      margin-top: 50px;
      text-align: center;
      font-size: 0.8em;
      color: #666;
    }
  </style>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
  <h1>NHS API Compliance Report</h1>
  
  <p>
    <strong>Period:</strong> ${format(report.period.startDate, 'dd MMM yyyy')} to ${format(report.period.endDate, 'dd MMM yyyy')} (${report.period.days} days)<br>
    <strong>Generated:</strong> ${format(new Date(), 'dd MMM yyyy HH:mm:ss')}
  </p>
  
  <h2>Summary</h2>
  
  <div class="summary-box">
    <div class="summary-item good">
      <h3>Total API Calls</h3>
      <p style="font-size: 24px;">${report.summary.totalCalls.toLocaleString()}</p>
    </div>
    
    <div class="summary-item ${report.summary.errorRate > 5 ? 'danger' : 'warning'}">
      <h3>Error Rate</h3>
      <p style="font-size: 24px;">${report.summary.errorRate.toFixed(2)}%</p>
      <p>${report.summary.totalErrors.toLocaleString()} errors</p>
    </div>
    
    <div class="summary-item ${report.summary.complianceScore < 90 ? 'danger' : report.summary.complianceScore < 95 ? 'warning' : 'good'}">
      <h3>Compliance Score</h3>
      <p style="font-size: 24px;">${report.summary.complianceScore.toFixed(2)}%</p>
    </div>
  </div>
  
  <h2>Daily API Usage</h2>
  
  <div class="chart-container">
    <canvas id="dailyChart"></canvas>
  </div>
  
  <h2>API Usage by Action</h2>
  
  <div class="chart-container">
    <canvas id="actionChart"></canvas>
  </div>
  
  <table>
    <thead>
      <tr>
        <th>Action</th>
        <th>Count</th>
        <th>Percentage</th>
      </tr>
    </thead>
    <tbody>
      ${report.apiUsage.map((usage: any) => `
        <tr>
          <td>${usage.action}</td>
          <td>${usage.count.toLocaleString()}</td>
          <td>${usage.percentage.toFixed(2)}%</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  
  <h2>Error Analysis</h2>
  
  <div class="chart-container">
    <canvas id="errorChart"></canvas>
  </div>
  
  <table>
    <thead>
      <tr>
        <th>Error Type</th>
        <th>Count</th>
        <th>Percentage</th>
      </tr>
    </thead>
    <tbody>
      ${report.errorTypes.map((error: any) => `
        <tr>
          <td>${error.type}</td>
          <td>${error.count.toLocaleString()}</td>
          <td>${error.percentage.toFixed(2)}%</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  
  <h2>Daily Statistics</h2>
  
  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Total Calls</th>
        <th>Error Count</th>
        <th>Error Rate</th>
      </tr>
    </thead>
    <tbody>
      ${report.dailyStats.map((day: any) => `
        <tr>
          <td>${day.date}</td>
          <td>${day.totalCalls.toLocaleString()}</td>
          <td>${day.errorCount.toLocaleString()}</td>
          <td>${day.errorRate.toFixed(2)}%</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  
  <footer>
    <p>Generated by RXautomate NHS API Compliance Report Generator</p>
  </footer>
  
  <script>
    // Daily API Usage Chart
    const dailyCtx = document.getElementById('dailyChart').getContext('2d');
    new Chart(dailyCtx, {
      type: 'line',
      data: {
        labels: ${JSON.stringify(report.dailyStats.map((day: any) => day.date))},
        datasets: [
          {
            label: 'Total Calls',
            data: ${JSON.stringify(report.dailyStats.map((day: any) => day.totalCalls))},
            borderColor: '#005EB8',
            backgroundColor: 'rgba(0, 94, 184, 0.1)',
            tension: 0.1,
            yAxisID: 'y'
          },
          {
            label: 'Error Rate (%)',
            data: ${JSON.stringify(report.dailyStats.map((day: any) => day.errorRate))},
            borderColor: '#DA291C',
            backgroundColor: 'rgba(218, 41, 28, 0.1)',
            tension: 0.1,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: {
              display: true,
              text: 'Total Calls'
            }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: {
              display: true,
              text: 'Error Rate (%)'
            },
            min: 0,
            max: 100,
            grid: {
              drawOnChartArea: false
            }
          }
        }
      }
    });
    
    // API Usage by Action Chart
    const actionCtx = document.getElementById('actionChart').getContext('2d');
    new Chart(actionCtx, {
      type: 'pie',
      data: {
        labels: ${JSON.stringify(report.apiUsage.map((usage: any) => usage.action))},
        datasets: [{
          data: ${JSON.stringify(report.apiUsage.map((usage: any) => usage.count))},
          backgroundColor: [
            '#005EB8', '#41B6E6', '#0072CE', '#00A9CE', '#768692',
            '#425563', '#231F20', '#330072', '#7C2855', '#AE2573'
          ]
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'right'
          }
        }
      }
    });
    
    // Error Types Chart
    const errorCtx = document.getElementById('errorChart').getContext('2d');
    new Chart(errorCtx, {
      type: 'bar',
      data: {
        labels: ${JSON.stringify(report.errorTypes.map((error: any) => error.type))},
        datasets: [{
          label: 'Error Count',
          data: ${JSON.stringify(report.errorTypes.map((error: any) => error.count))},
          backgroundColor: '#DA291C'
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  </script>
</body>
</html>`;
}

// Send report via email
async function sendReportEmail(reportFilePath: string) {
  // Create a test account if no SMTP settings are provided
  let transporter;
  
  if (process.env.SMTP_HOST && process.env.SMTP_PORT) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT, 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Create a test account for development
    const testAccount = await nodemailer.createTestAccount();
    
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }
  
  // Read the report file
  const reportContent = fs.readFileSync(reportFilePath, 'utf-8');
  
  // Send the email
  const info = await transporter.sendMail({
    from: `"RXautomate" <${process.env.SMTP_FROM || 'reports@rxautomate.co.uk'}>`,
    to: process.env.REPORT_EMAIL_TO || 'admin@rxautomate.co.uk',
    subject: `NHS API Compliance Report - ${format(new Date(), 'yyyy-MM-dd')}`,
    text: `Please find attached the NHS API Compliance Report for the last ${config.days} days.`,
    html: config.format === 'html' ? reportContent : undefined,
    attachments: [
      {
        filename: path.basename(reportFilePath),
        content: reportContent,
        contentType: config.format === 'html' ? 'text/html' : 
                    config.format === 'csv' ? 'text/csv' : 'application/json',
      },
    ],
  });
  
  console.log('Email sent:', info.messageId);
  
  // Log preview URL for test accounts
  if (!process.env.SMTP_HOST) {
    console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
  }
}

// Run the script
generateReport().then(() => {
  console.log('Report generation completed.');
  process.exit(0);
}).catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
