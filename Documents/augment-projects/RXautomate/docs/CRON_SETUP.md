# Setting Up Scheduled Tasks for RXautomate

This document provides instructions for setting up scheduled tasks to run the NHS API compliance report regularly.

## Using Cron (Linux/Mac)

1. Open your crontab file for editing:
   ```
   crontab -e
   ```

2. Add the following line to run the report daily at midnight:
   ```
   0 0 * * * /path/to/RXautomate/scripts/run-compliance-report.sh >> /path/to/RXautomate/logs/compliance-report.log 2>&1
   ```

3. Or to run it weekly on Sunday at midnight:
   ```
   0 0 * * 0 /path/to/RXautomate/scripts/run-compliance-report.sh >> /path/to/RXautomate/logs/compliance-report.log 2>&1
   ```

4. Or to run it monthly on the 1st at midnight:
   ```
   0 0 1 * * /path/to/RXautomate/scripts/run-compliance-report.sh >> /path/to/RXautomate/logs/compliance-report.log 2>&1
   ```

5. Save and exit the editor.

## Using Task Scheduler (Windows)

1. Open Task Scheduler (search for "Task Scheduler" in the Start menu).
2. Click "Create Basic Task" in the right panel.
3. Enter a name (e.g., "NHS API Compliance Report") and description, then click "Next".
4. Select when you want the task to start (Daily, Weekly, or Monthly), then click "Next".
5. Set the start time and recurrence pattern, then click "Next".
6. Select "Start a program" and click "Next".
7. In the "Program/script" field, enter:
   ```
   cmd.exe
   ```
8. In the "Add arguments" field, enter:
   ```
   /c "cd /d C:\path\to\RXautomate && node src\scripts\simple-report.js > logs\compliance-report.log 2>&1"
   ```
9. Click "Next", review your settings, and click "Finish".

## Verifying the Scheduled Task

After setting up the scheduled task, you can verify it's working by:

1. Checking the log file after the scheduled time:
   ```
   tail -f /path/to/RXautomate/logs/compliance-report.log
   ```

2. Checking the reports directory for new reports:
   ```
   ls -la /path/to/RXautomate/reports/
   ```

## Troubleshooting

If the scheduled task is not running as expected:

1. Ensure the script has execute permissions:
   ```
   chmod +x /path/to/RXautomate/scripts/run-compliance-report.sh
   ```

2. Check that the paths in the cron job or task scheduler are correct.

3. Verify that the user running the cron job has the necessary permissions.

4. Check the log file for any error messages.

## Email Notifications

To receive email notifications with the report:

1. Modify the `.env.local` file to include your SMTP settings:
   ```
   SMTP_HOST="smtp.example.com"
   SMTP_PORT="587"
   SMTP_SECURE="false"
   SMTP_USER="your-smtp-username"
   SMTP_PASS="your-smtp-password"
   SMTP_FROM="reports@rxautomate.co.uk"
   REPORT_EMAIL_TO="admin@rxautomate.co.uk"
   ```

2. Update the cron job to use the email version of the report:
   ```
   0 0 * * * /path/to/RXautomate/scripts/run-compliance-report.sh --email >> /path/to/RXautomate/logs/compliance-report.log 2>&1
   ```
