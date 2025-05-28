#!/bin/bash

# Script to run the comprehensive seed file
echo "Running comprehensive seed script..."

# Navigate to project root
cd "$(dirname "$0")/.."

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Reset the database (optional - uncomment if you want to start fresh)
# echo "Resetting database..."
# npx prisma migrate reset --force

# Run the comprehensive seed script
echo "Running comprehensive seed..."
npx ts-node --compiler-options "{\"module\":\"CommonJS\"}" prisma/seed-comprehensive.ts

# Check if seeding was successful
if [ $? -eq 0 ]; then
  echo "Comprehensive seed completed successfully!"
  echo "You can now start the application with 'npm run dev'"
else
  echo "Error during seeding. Please check the logs above."
  exit 1
fi
