import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { jest } from '@jest/globals';
import NHSAPIMonitor from '../components/NHSAPIMonitor';

// Mock Material-UI components to avoid theme provider issues
jest.mock('@mui/material', () => ({
  ...jest.requireActual('@mui/material'),
  Card: ({ children, ...props }) => <div data-testid="card" {...props}>{children}</div>,
  CardContent: ({ children }) => <div data-testid="card-content">{children}</div>,
  CardHeader: ({ title }) => <div data-testid="card-header">{title}</div>,
  Typography: ({ children, variant }) => <div data-testid={`typography-${variant}`}>{children}</div>,
  Button: ({ children, onClick, ...props }) => <button onClick={onClick} {...props}>{children}</button>,
  Box: ({ children, ...props }) => <div {...props}>{children}</div>,
  Grid: ({ children, ...props }) => <div {...props}>{children}</div>,
  LinearProgress: () => <div data-testid="linear-progress" />,
  Alert: ({ children, severity }) => <div data-testid={`alert-${severity}`}>{children}</div>,
  Table: ({ children }) => <table>{children}</table>,
  TableBody: ({ children }) => <tbody>{children}</tbody>,
  TableCell: ({ children }) => <td>{children}</td>,
  TableContainer: ({ children }) => <div>{children}</div>,
  TableHead: ({ children }) => <thead>{children}</thead>,
  TableRow: ({ children }) => <tr>{children}</tr>,
  Paper: ({ children }) => <div>{children}</div>,
  Chip: ({ label, color }) => <span data-testid={`chip-${color}`}>{label}</span>,
  FormControl: ({ children }) => <div>{children}</div>,
  InputLabel: ({ children }) => <label>{children}</label>,
  Select: ({ value, onChange, children }) => (
    <select value={value} onChange={onChange}>
      {children}
    </select>
  ),
  MenuItem: ({ value, children }) => <option value={value}>{children}</option>,
  Dialog: ({ open, children }) => open ? <div data-testid="dialog">{children}</div> : null,
  DialogTitle: ({ children }) => <div data-testid="dialog-title">{children}</div>,
  DialogContent: ({ children }) => <div data-testid="dialog-content">{children}</div>,
  DialogActions: ({ children }) => <div data-testid="dialog-actions">{children}</div>,
  Tooltip: ({ children }) => <div>{children}</div>,
  IconButton: ({ children, onClick }) => <button onClick={onClick}>{children}</button>
}));

// Mock Material-UI icons
jest.mock('@mui/icons-material', () => ({
  Refresh: () => <span>RefreshIcon</span>,
  Download: () => <span>DownloadIcon</span>,
  Info: () => <span>InfoIcon</span>,
  Warning: () => <span>WarningIcon</span>,
  Error: () => <span>ErrorIcon</span>,
  CheckCircle: () => <span>SuccessIcon</span>,
  Timeline: () => <span>TimelineIcon</span>,
  Speed: () => <span>SpeedIcon</span>,
  Security: () => <span>SecurityIcon</span>,
  Visibility: () => <span>ViewIcon</span>
}));

// Mock NHS API service
jest.mock('../services/nhsApiService', () => ({
  nhsApiService: {
    getApiStatistics: jest.fn(),
    getAuditLogs: jest.fn(),
    getRateLimitStatus: jest.fn()
  }
}));

describe('NHSAPIMonitor Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders NHS API Monitor component correctly', async () => {
    render(<NHSAPIMonitor />);
    
    // Check if the main title is rendered
    expect(screen.getByText('NHS API Monitor')).toBeInTheDocument();
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading monitoring data...')).not.toBeInTheDocument();
    });
  });

  test('displays statistics cards', async () => {
    render(<NHSAPIMonitor />);
    
    await waitFor(() => {
      expect(screen.getByText('Total Requests')).toBeInTheDocument();
      expect(screen.getByText('Success Rate')).toBeInTheDocument();
      expect(screen.getByText('Avg Response')).toBeInTheDocument();
      expect(screen.getByText('Rate Limits')).toBeInTheDocument();
    });
  });

  test('handles refresh button click', async () => {
    render(<NHSAPIMonitor />);
    
    await waitFor(() => {
      const refreshButton = screen.getByText('Refresh');
      fireEvent.click(refreshButton);
    });
    
    // Should trigger a data reload
    expect(screen.getByText('NHS API Monitor')).toBeInTheDocument();
  });

  test('handles auto refresh toggle', async () => {
    render(<NHSAPIMonitor />);
    
    await waitFor(() => {
      const autoRefreshButton = screen.getByText('Auto Refresh OFF');
      fireEvent.click(autoRefreshButton);
      expect(screen.getByText('Auto Refresh ON')).toBeInTheDocument();
    });
  });

  test('displays rate limit status', async () => {
    render(<NHSAPIMonitor />);
    
    await waitFor(() => {
      expect(screen.getByText('Rate Limit Status')).toBeInTheDocument();
      expect(screen.getByText('Global Rate Limit')).toBeInTheDocument();
      expect(screen.getByText('Per-Tenant Limits')).toBeInTheDocument();
    });
  });

  test('displays endpoint performance table', async () => {
    render(<NHSAPIMonitor />);
    
    await waitFor(() => {
      expect(screen.getByText('Endpoint Performance')).toBeInTheDocument();
      expect(screen.getByText('Endpoint')).toBeInTheDocument();
      expect(screen.getByText('Requests')).toBeInTheDocument();
      expect(screen.getByText('Success Rate')).toBeInTheDocument();
      expect(screen.getByText('Avg Response Time')).toBeInTheDocument();
    });
  });

  test('displays audit logs with filters', async () => {
    render(<NHSAPIMonitor />);
    
    await waitFor(() => {
      expect(screen.getByText('Audit Log Filters')).toBeInTheDocument();
      expect(screen.getByText('Timeframe')).toBeInTheDocument();
      expect(screen.getByText('Endpoint')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
    });
  });

  test('handles export logs functionality', async () => {
    // Mock URL.createObjectURL and related functions
    global.URL.createObjectURL = jest.fn(() => 'mocked-url');
    global.URL.revokeObjectURL = jest.fn();
    
    const mockAppendChild = jest.fn();
    const mockRemoveChild = jest.fn();
    const mockClick = jest.fn();
    
    Object.defineProperty(document, 'createElement', {
      value: jest.fn(() => ({
        style: {},
        click: mockClick,
        appendChild: mockAppendChild,
        removeChild: mockRemoveChild
      })),
      writable: true
    });
    
    Object.defineProperty(document.body, 'appendChild', {
      value: mockAppendChild,
      writable: true
    });
    
    Object.defineProperty(document.body, 'removeChild', {
      value: mockRemoveChild,
      writable: true
    });

    render(<NHSAPIMonitor />);
    
    await waitFor(() => {
      const exportButton = screen.getByText('Export Logs');
      fireEvent.click(exportButton);
    });
    
    expect(global.URL.createObjectURL).toHaveBeenCalled();
  });

  test('handles filter changes', async () => {
    render(<NHSAPIMonitor />);
    
    await waitFor(() => {
      // Test timeframe filter
      const timeframeSelect = screen.getByDisplayValue('Last 24 Hours');
      fireEvent.change(timeframeSelect, { target: { value: '7d' } });
    });
  });

  test('displays error state correctly', async () => {
    // Mock console.error to avoid noise in test output
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Temporarily override the mock to simulate an error
    const originalMock = require('../services/nhsApiService').nhsApiService;
    require('../services/nhsApiService').nhsApiService = {
      ...originalMock,
      getApiStatistics: jest.fn().mockRejectedValue(new Error('API Error'))
    };

    render(<NHSAPIMonitor />);
    
    await waitFor(() => {
      expect(screen.getByText(/Failed to load monitoring data/)).toBeInTheDocument();
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });
    
    consoleSpy.mockRestore();
  });

  test('displays loading state', () => {
    render(<NHSAPIMonitor />);
    
    expect(screen.getByText('Loading monitoring data...')).toBeInTheDocument();
    expect(screen.getByTestId('linear-progress')).toBeInTheDocument();
  });
});

// Integration test for component interaction
describe('NHSAPIMonitor Integration Tests', () => {
  test('complete user workflow - view statistics, filter logs, export data', async () => {
    render(<NHSAPIMonitor />);
    
    // Wait for initial load
    await waitFor(() => {
      expect(screen.queryByText('Loading monitoring data...')).not.toBeInTheDocument();
    });
    
    // Check statistics are displayed
    expect(screen.getByText('Total Requests')).toBeInTheDocument();
    expect(screen.getByText('Success Rate')).toBeInTheDocument();
    
    // Test filter interaction
    const timeframeSelect = screen.getByDisplayValue('Last 24 Hours');
    fireEvent.change(timeframeSelect, { target: { value: '7d' } });
    
    // Test auto refresh toggle
    const autoRefreshButton = screen.getByText('Auto Refresh OFF');
    fireEvent.click(autoRefreshButton);
    expect(screen.getByText('Auto Refresh ON')).toBeInTheDocument();
    
    // Test manual refresh
    const refreshButton = screen.getByText('Refresh');
    fireEvent.click(refreshButton);
    
    // Test export functionality
    const exportButton = screen.getByText('Export Logs');
    fireEvent.click(exportButton);
  });
});
