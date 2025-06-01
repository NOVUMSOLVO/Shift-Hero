#!/bin/bash

echo "Starting NHS Care Management Platform..."

# Navigate to backend and install dependencies if needed
cd nhs-care-homes-app/backend
if [ ! -d "node_modules" ]; then
    echo "Installing backend dependencies..."
    npm install --no-package-lock
fi

# Start backend server
echo "Starting backend server..."
node src/app.js &
BACKEND_PID=$!

# Navigate to frontend and install dependencies if needed
cd ../frontend
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install --no-package-lock
fi

# Start frontend server
echo "Starting frontend server..."
npm start &
FRONTEND_PID=$!

echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo "NHS Care Management Platform started successfully!"
echo "Backend: http://localhost:5000"
echo "Frontend: http://localhost:3000"

# Wait for user input to stop servers
read -p "Press Enter to stop servers..."
kill $BACKEND_PID $FRONTEND_PID
