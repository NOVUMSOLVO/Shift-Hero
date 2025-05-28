#!/bin/bash

# NHS API Compliance Report Scheduler
# This script runs the NHS API compliance report and can be scheduled with cron

# Navigate to the project directory
cd "$(dirname "$0")/.."

# Set environment variables if needed
# export NODE_ENV=production

# Run the report script
echo "Running NHS API compliance report at $(date)"
node src/scripts/simple-report.js

# Check if the report was generated successfully
if [ $? -eq 0 ]; then
  echo "Report generated successfully"
  exit 0
else
  echo "Error generating report"
  exit 1
fi
