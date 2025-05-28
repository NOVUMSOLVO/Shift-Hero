#!/usr/bin/env node

console.log('▶ start.js invoked');

const portfinder = require('portfinder');
const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

// Log startup info
console.log(`🚀 Starting RXautomate on ${new Date().toISOString()}`);
console.log(`🔧 Node version: ${process.version}`);
console.log(`💻 Platform: ${process.platform} (${process.arch})`);

(async () => {
  try {
    // Validate environment
    validateEnvironment();
    
    // Find an available port
    const basePort = parseInt(process.env.PORT, 10) || 3000;
    console.log(`Looking for open port at or above ${basePort}`);
    portfinder.basePort = basePort;
    const port = await portfinder.getPortPromise();
    console.log(`Found open port: ${port}`);

    // Check if .next directory exists and contains a production build
    const rootDir = path.join(__dirname, '..');
    const nextDir = path.join(rootDir, '.next');
    
    // Configure memory limit for Node processes
    const NODE_MEM_LIMIT = process.env.NODE_MEM_LIMIT || '4096';  // Default 4GB memory limit
    
    // Check if database needs migration
    const SKIP_DB_CHECK = process.env.SKIP_DB_CHECK === 'true';
    if (!SKIP_DB_CHECK && fs.existsSync(path.join(rootDir, 'prisma', 'schema.prisma'))) {
      try {
        console.log('Checking database status...');
        // Generate Prisma client if needed
        if (!fs.existsSync(path.join(rootDir, 'node_modules', '.prisma'))) {
          console.log('Generating Prisma client...');
          execSync('npx prisma generate', { stdio: 'inherit', cwd: rootDir });
        }
      } catch (err) {
        console.warn('⚠️ Database check failed, but continuing anyway:', err.message);
      }
    }
    
    if (!fs.existsSync(nextDir) || !fs.existsSync(path.join(nextDir, 'BUILD_ID'))) {
      console.log('No production build found. Running next build first...');
      
      // Run the build command with a timeout
      const BUILD_TIMEOUT = 10 * 60 * 1000; // 10 minutes timeout
      const buildResult = await new Promise((resolve, reject) => {
        const buildProcess = spawn('node', [
          `--max-old-space-size=${NODE_MEM_LIMIT}`,
          path.join(rootDir, 'node_modules', 'next', 'dist', 'bin', 'next'), 
          'build'
        ], {
          stdio: 'inherit',
          env: process.env
        });

        const timeoutId = setTimeout(() => {
          console.error('Build process timed out after ' + (BUILD_TIMEOUT/60000) + ' minutes');
          buildProcess.kill();
          reject(new Error('Build timed out'));
        }, BUILD_TIMEOUT);

        buildProcess.on('error', (err) => {
          clearTimeout(timeoutId);
          console.error('Failed to start build process:', err);
          reject(err);
        });

        buildProcess.on('exit', (code) => {
          clearTimeout(timeoutId);
          if (code === 0) {
            console.log('Build completed successfully');
            resolve(true);
          } else {
            console.error(`Build process exited with code ${code}`);
            reject(new Error(`Build failed with exit code ${code}`));
          }
        });
      });
    }

    console.log('Launching Next.js...');
    // Resolve the Next.js binary from local node_modules
    const nextBin = path.join(rootDir, 'node_modules', 'next', 'dist', 'bin', 'next');
    const child = spawn('node', [
      `--max-old-space-size=${NODE_MEM_LIMIT}`,
      nextBin, 
      'start', 
      '--port', 
      String(port)
    ], {
      stdio: 'inherit',
      env: { ...process.env, PORT: String(port) }
    });

    child.on('error', (err) => {
      console.error('Failed to start Next.js process:', err);
      process.exit(1);
    });

    child.on('exit', (code, signal) => {
      console.log(`Next.js process exited with code ${code}${signal ? ` and signal ${signal}` : ''}`);
      process.exit(code ?? 0);
    });

    // Perform health check to ensure the server is running
    await waitForServerReady(port);
    console.log(`✅ Server is up and running at http://localhost:${port}`);
    
    // Setup signal handlers for graceful shutdown
    setupSignalHandlers(child);
    
  } catch (err) {
    console.error('Error in start.js:', err);
    process.exit(1);
  }
})();

/**
 * Wait for the Next.js server to be ready by polling the health endpoint
 * @param {number} port - The port the server is running on
 * @param {number} maxRetries - Maximum number of retries before giving up
 * @param {number} retryInterval - Interval between retries in ms
 * @returns {Promise<boolean>} - Returns true when server is ready
 */
/**
 * Validate environment configuration
 */
function validateEnvironment() {
  console.log('Validating environment...');
  
  // Check for essential files
  const rootDir = path.join(__dirname, '..');
  const essentialFiles = [
    'package.json',
    'next.config.js'
  ];
  
  for (const file of essentialFiles) {
    if (!fs.existsSync(path.join(rootDir, file))) {
      console.error(`⛔ Essential file missing: ${file}`);
      process.exit(1);
    }
  }
  
  // Check Node.js version
  const nodeVersion = process.version.match(/^v(\d+)\./)[1];
  if (parseInt(nodeVersion, 10) < 16) {
    console.warn(`⚠️ Warning: Running on Node.js ${process.version}. Node.js 16+ is recommended for Next.js 14.`);
  }
  
  // Verify .env file existence (but don't fail if missing)
  if (!fs.existsSync(path.join(rootDir, '.env')) && 
      !fs.existsSync(path.join(rootDir, '.env.local'))) {
    console.warn('⚠️ Warning: No .env or .env.local file found. Environment variables may be missing.');
  }
  
  console.log('✅ Environment validation passed');
}

/**
 * Wait for the Next.js server to be ready by polling the health endpoint
 * @param {number} port - The port the server is running on
 * @param {number} maxRetries - Maximum number of retries before giving up
 * @param {number} retryInterval - Interval between retries in ms
 * @returns {Promise<boolean>} - Returns true when server is ready
 */
function waitForServerReady(port, maxRetries = 30, retryInterval = 1000) {
  return new Promise((resolve) => {
    let retries = 0;
    
    const checkServer = () => {
      http.get(`http://localhost:${port}`, (res) => {
        if (res.statusCode === 200) {
          resolve(true);
        } else {
          retry();
        }
      }).on('error', retry);
    };
    
    const retry = () => {
      retries++;
      if (retries >= maxRetries) {
        console.log(`Server started but health check timed out after ${maxRetries} attempts`);
        resolve(false);
        return;
      }
      
      if (retries % 5 === 0) {
        console.log(`Still waiting for server to be ready... (${retries}/${maxRetries})`);
      }
      
      setTimeout(checkServer, retryInterval);
    };
    
    console.log(`Waiting for Next.js server to be ready on port ${port}...`);
    setTimeout(checkServer, 1000); // Initial delay to give server time to start
  });
}

/**
 * Set up signal handlers for graceful shutdown
 * @param {ChildProcess} childProcess - The Next.js server child process
 */
function setupSignalHandlers(childProcess) {
  const signals = ['SIGINT', 'SIGTERM', 'SIGHUP'];
  
  signals.forEach(signal => {
    process.on(signal, () => {
      console.log(`\nReceived ${signal}, gracefully shutting down...`);
      
      // First try to kill the child process gracefully
      if (childProcess && !childProcess.killed) {
        console.log('Terminating Next.js server...');
        childProcess.kill(signal);
        
        // Force kill after timeout
        setTimeout(() => {
          if (!childProcess.killed) {
            console.log('Force killing Next.js server after timeout');
            childProcess.kill('SIGKILL');
          }
          process.exit(0);
        }, 5000);
      } else {
        process.exit(0);
      }
    });
  });
  
  console.log('Signal handlers registered for graceful shutdown');
}
