#!/bin/bash
export PATH="/usr/local/bin:$PATH"

# Install dependencies
/usr/local/bin/npm install

# Build the project
/usr/local/bin/npm run build

echo "Build completed successfully!"
