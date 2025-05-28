/**
 * Simple NHS API Compliance Report Generator
 * 
 * This script generates a basic compliance report for NHS API usage.
 */

const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function generateSimpleReport() {
  try {
    console.log('Generating simple NHS API compliance report...');
    
    // Create reports directory if it doesn't exist
    const reportsDir = path.join(process.cwd(), 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    // Get current date for report filename
    const date = new Date();
    const dateString = date.toISOString().split('T')[0];
    
    // Calculate date range (last 30 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    console.log(`Date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);
    
    // Try to fetch audit logs
    let auditLogs = [];
    try {
      auditLogs = await prisma.auditLog.findMany({
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
    } catch (error) {
      console.log('No audit logs found or table does not exist yet.');
      auditLogs = [];
    }
    
    // Generate a simple report
    const report = {
      generatedAt: new Date().toISOString(),
      dateRange: {
        from: startDate.toISOString(),
        to: endDate.toISOString(),
      },
      summary: {
        totalApiCalls: auditLogs.length,
        errorCount: auditLogs.filter(log => log.action === 'API_ERROR').length || 0,
      }
    };
    
    // Calculate error rate
    if (report.summary.totalApiCalls > 0) {
      report.summary.errorRate = (report.summary.errorCount / report.summary.totalApiCalls * 100).toFixed(2) + '%';
    } else {
      report.summary.errorRate = '0%';
    }
    
    // Add compliance status
    const errorRateThreshold = 5; // 5% error rate threshold
    const errorRateValue = parseFloat(report.summary.errorRate);
    report.summary.complianceStatus = errorRateValue < errorRateThreshold ? 'COMPLIANT' : 'NON-COMPLIANT';
    
    // Write report to file
    const reportFilePath = path.join(reportsDir, `nhs-api-compliance-report-${dateString}.json`);
    fs.writeFileSync(reportFilePath, JSON.stringify(report, null, 2));
    
    console.log(`Report generated: ${reportFilePath}`);
    return reportFilePath;
  } catch (error) {
    console.error('Error generating report:', error);
    return null;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
generateSimpleReport().then((reportPath) => {
  if (reportPath) {
    console.log('Report generation completed successfully.');
    process.exit(0);
  } else {
    console.error('Report generation failed.');
    process.exit(1);
  }
}).catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
