import { render, screen, fireEvent } from '@testing-library/react';
import AppointmentScheduler, { AppointmentSchedulerProps } from '@/components/AppointmentScheduler';
import { AppointmentType } from '@prisma/client';

describe('AppointmentScheduler', () => {
  const defaultProps: AppointmentSchedulerProps = {
    date: new Date('2025-05-10'),
    appointmentType: 'FLU_VACCINATION' as AppointmentType,
    timeSlots: [
      { time: '10:00', available: true },
      { time: '11:00', available: true },
      { time: '12:00', available: false },
    ],
    onDateChange: jest.fn(),
    onTypeChange: jest.fn(),
    onSchedule: jest.fn(),
  };

  it('renders the component correctly', () => {
    render(<AppointmentScheduler {...defaultProps} />);

    // Check if the title is rendered
    expect(screen.getByText('Schedule an Appointment')).toBeInTheDocument();
  });

  it('allows selecting a date and time', () => {
    render(<AppointmentScheduler {...defaultProps} />);

    // Simulate selecting a date
    const dateInput = screen.getByLabelText('Appointment Date') as HTMLInputElement;
    fireEvent.change(dateInput, { target: { value: '2025-05-11' } });
    expect(dateInput.value).toBe('2025-05-11');

    // Simulate selecting a time
    const timeButton = screen.getByText('10:00');
    fireEvent.click(timeButton);
    expect(timeButton).toHaveClass('bg-nhs-blue text-white');
  });

  it('submits the form with correct data', () => {
    const mockSchedule = jest.fn();
    render(<AppointmentScheduler {...defaultProps} onSchedule={mockSchedule} />);

    // Simulate selecting a time
    const timeButton = screen.getByText('10:00');
    fireEvent.click(timeButton);

    // Submit the form
    fireEvent.click(screen.getByText('Schedule Appointment'));

    // Check if the form was submitted with correct data
    expect(mockSchedule).toHaveBeenCalledWith(
      new Date('2025-05-10T10:00:00.000Z'),
      '10:00',
      'FLU_VACCINATION'
    );
  });
});