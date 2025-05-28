#!/bin/bash
# Set the path to Node.js
export PATH="/usr/local/bin:$PATH"

# Verify Node.js and npm are accessible
NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)
echo "Using Node.js $NODE_VERSION and npm $NPM_VERSION"

# Install dependencies
echo "Installing dependencies..."
npm install

# Build the project
echo "Building the project..."
npm run build

echo "Build process completed!"
