import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PatientStatusChecker from '../components/PatientStatusChecker';
import { useRouter } from 'next/navigation';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

describe('PatientStatusChecker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock router
    (useRouter as jest.Mock).mockReturnValue({
      push: jest.fn(),
    });
    
    // Mock fetch
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        patient: {
          nhsNumber: '9434765870',
          details: {
            name: [{ given: ['John'], family: 'Smith' }],
            birthDate: '1970-01-01',
          },
          gpDetails: {
            name: 'Test GP Practice',
          },
        },
        exemption: {
          status: true,
          type: 'MATERNITY',
          expiryDate: '2023-12-31',
          certificateNumber: 'M12345678',
        },
        eligibility: {
          status: true,
          reason: 'AGE_EXEMPT',
          validFrom: '2020-01-01',
          validTo: null,
        },
        message: 'Patient status check completed successfully',
      }),
    });
  });

  it('renders the component correctly', () => {
    render(<PatientStatusChecker />);
    
    // Check for main elements
    expect(screen.getByText('NHS Patient Status Checker')).toBeInTheDocument();
    expect(screen.getByLabelText('NHS Number')).toBeInTheDocument();
    expect(screen.getByLabelText('Service Type')).toBeInTheDocument();
    expect(screen.getByText('Check Status')).toBeInTheDocument();
  });

  it('formats NHS number as user types', () => {
    render(<PatientStatusChecker />);
    
    const input = screen.getByLabelText('NHS Number');
    
    // Type NHS number without formatting
    fireEvent.change(input, { target: { value: '9434765870' } });
    
    // Check that it's formatted correctly
    expect(input).toHaveValue('943 476 5870');
  });

  it('disables the submit button for invalid NHS numbers', () => {
    render(<PatientStatusChecker />);
    
    const button = screen.getByText('Check Status');
    
    // Initially disabled (empty input)
    expect(button).toBeDisabled();
    
    // Type partial NHS number
    const input = screen.getByLabelText('NHS Number');
    fireEvent.change(input, { target: { value: '12345' } });
    
    // Still disabled (too short)
    expect(button).toBeDisabled();
    
    // Type complete NHS number
    fireEvent.change(input, { target: { value: '9434765870' } });
    
    // Now enabled
    expect(button).not.toBeDisabled();
  });

  it('submits the form and displays results', async () => {
    render(<PatientStatusChecker />);
    
    // Fill in the form
    const input = screen.getByLabelText('NHS Number');
    fireEvent.change(input, { target: { value: '9434765870' } });
    
    // Submit the form
    const button = screen.getByText('Check Status');
    fireEvent.click(button);
    
    // Wait for results to be displayed
    await waitFor(() => {
      expect(screen.getByText('Patient Status Results')).toBeInTheDocument();
    });
    
    // Check that results are displayed correctly
    expect(screen.getByText('Smith')).toBeInTheDocument();
    expect(screen.getByText('Exempt')).toBeInTheDocument();
    expect(screen.getByText('Eligible')).toBeInTheDocument();
    
    // Check that fetch was called correctly
    expect(global.fetch).toHaveBeenCalledWith('/api/eps/check-patient-status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nhsNumber: '9434765870',
        serviceType: 'prescription',
      }),
    });
  });

  it('handles API errors correctly', async () => {
    // Mock fetch to return an error
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: jest.fn().mockResolvedValue({
        error: 'Patient not found in NHS records',
      }),
    });
    
    render(<PatientStatusChecker />);
    
    // Fill in the form
    const input = screen.getByLabelText('NHS Number');
    fireEvent.change(input, { target: { value: '9434765870' } });
    
    // Submit the form
    const button = screen.getByText('Check Status');
    fireEvent.click(button);
    
    // Wait for error to be displayed
    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Patient not found in NHS records')).toBeInTheDocument();
  });

  it('calls the onStatusChecked callback when provided', async () => {
    const mockCallback = jest.fn();
    
    render(<PatientStatusChecker onStatusChecked={mockCallback} />);
    
    // Fill in the form
    const input = screen.getByLabelText('NHS Number');
    fireEvent.change(input, { target: { value: '9434765870' } });
    
    // Submit the form
    const button = screen.getByText('Check Status');
    fireEvent.click(button);
    
    // Wait for results and callback
    await waitFor(() => {
      expect(mockCallback).toHaveBeenCalled();
    });
    
    // Check callback was called with the correct data
    expect(mockCallback).toHaveBeenCalledWith(expect.objectContaining({
      patient: expect.any(Object),
      exemption: expect.any(Object),
      eligibility: expect.any(Object),
    }));
  });
});
