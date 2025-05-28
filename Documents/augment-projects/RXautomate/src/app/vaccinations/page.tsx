'use client';

import React, { useState } from 'react';
import Layout from '@/components/Layout';
import AppointmentScheduler from '@/components/AppointmentScheduler';
import { AppointmentType, AppointmentStatus } from '@prisma/client';

// Mock data for demonstration
const mockAppointments = [
  {
    id: '1',
    patientName: 'John Smith',
    appointmentType: 'FLU_VACCINATION' as AppointmentType,
    date: new Date('2023-05-10T10:30:00'),
    status: 'SCHEDULED' as AppointmentStatus,
    phoneNumber: '07123456789',
  },
  {
    id: '2',
    patientName: 'Emma Johnson',
    appointmentType: 'COVID_VACCINATION' as AppointmentType,
    date: new Date('2023-05-10T11:15:00'),
    status: 'SCHEDULED' as AppointmentStatus,
    phoneNumber: '07987654321',
  },
  {
    id: '3',
    patientName: 'David Williams',
    appointmentType: 'FLU_VACCINATION' as AppointmentType,
    date: new Date('2023-05-10T14:00:00'),
    status: 'COMPLETED' as AppointmentStatus,
    phoneNumber: '07456123789',
  },
];

// Mock time slots
const generateTimeSlots = (date: Date) => {
  const slots = [];
  const startHour = 9;
  const endHour = 17;
  const interval = 15; // minutes
  
  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += interval) {
      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      
      // Check if slot is already booked
      const isBooked = mockAppointments.some(appointment => {
        const appointmentDate = new Date(appointment.date);
        return (
          appointmentDate.getDate() === date.getDate() &&
          appointmentDate.getMonth() === date.getMonth() &&
          appointmentDate.getFullYear() === date.getFullYear() &&
          appointmentDate.getHours() === hour &&
          appointmentDate.getMinutes() === minute &&
          appointment.status === 'SCHEDULED'
        );
      });
      
      slots.push({
        time,
        available: !isBooked,
      });
    }
  }
  
  return slots;
};

export default function VaccinationsPage() {
  const [appointments, setAppointments] = useState(mockAppointments);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedType, setSelectedType] = useState<AppointmentType>('FLU_VACCINATION');
  const [filterStatus, setFilterStatus] = useState<AppointmentStatus | 'ALL'>('ALL');
  const [filterType, setFilterType] = useState<AppointmentType | 'ALL'>('ALL');

  // Generate time slots for selected date
  const timeSlots = generateTimeSlots(selectedDate);

  // Handle date change
  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
  };

  // Handle appointment type change
  const handleTypeChange = (type: AppointmentType) => {
    setSelectedType(type);
  };

  // Handle schedule appointment
  const handleScheduleAppointment = (date: Date, time: string, type: AppointmentType) => {
    const newAppointment = {
      id: `${appointments.length + 1}`,
      patientName: 'New Patient', // In a real app, this would come from the form
      appointmentType: type,
      date: date,
      status: 'SCHEDULED' as AppointmentStatus,
      phoneNumber: '07000000000', // In a real app, this would come from the form
    };
    
    setAppointments([...appointments, newAppointment]);
    alert(`Appointment scheduled for ${date.toLocaleDateString()} at ${time}`);
  };

  // Handle status change
  const handleStatusChange = (id: string, status: AppointmentStatus) => {
    setAppointments(prev =>
      prev.map(appointment =>
        appointment.id === id ? { ...appointment, status } : appointment
      )
    );
  };

  // Handle send reminder
  const handleSendReminder = async (id: string) => {
    const appointment = appointments.find(a => a.id === id);
    if (!appointment) return;

    try {
      // In a real app, this would call the API
      console.log(`Sending reminder for appointment ${id}`);
      alert(`Reminder sent to ${appointment.patientName} for their ${appointment.appointmentType} appointment`);
    } catch (error) {
      console.error('Error sending reminder:', error);
      alert('Failed to send reminder');
    }
  };

  // Filter appointments
  const filteredAppointments = appointments.filter(appointment => {
    const statusMatch = filterStatus === 'ALL' || appointment.status === filterStatus;
    const typeMatch = filterType === 'ALL' || appointment.appointmentType === filterType;
    return statusMatch && typeMatch;
  });

  // Get appointment type label
  const getAppointmentTypeLabel = (type: AppointmentType) => {
    switch (type) {
      case 'FLU_VACCINATION':
        return 'Flu Vaccination';
      case 'COVID_VACCINATION':
        return 'COVID Vaccination';
      case 'MEDICATION_REVIEW':
        return 'Medication Review';
      case 'TRAVEL_CLINIC':
        return 'Travel Clinic';
      case 'OTHER':
        return 'Other';
      default:
        return type;
    }
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Vaccination Management</h1>
          <button className="px-4 py-2 bg-nhs-blue text-white rounded-md hover:bg-nhs-dark-blue">
            Sync with PharmOutcomes
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Schedule New Appointment</h2>
            <AppointmentScheduler
              date={selectedDate}
              appointmentType={selectedType}
              timeSlots={timeSlots}
              onDateChange={handleDateChange}
              onTypeChange={handleTypeChange}
              onSchedule={handleScheduleAppointment}
            />
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Upcoming Appointments</h2>
              <div className="flex space-x-2">
                <select
                  className="px-2 py-1 border rounded-md text-sm"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as AppointmentStatus | 'ALL')}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                  <option value="NO_SHOW">No Show</option>
                </select>
                
                <select
                  className="px-2 py-1 border rounded-md text-sm"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as AppointmentType | 'ALL')}
                >
                  <option value="ALL">All Types</option>
                  <option value="FLU_VACCINATION">Flu Vaccination</option>
                  <option value="COVID_VACCINATION">COVID Vaccination</option>
                  <option value="MEDICATION_REVIEW">Medication Review</option>
                  <option value="TRAVEL_CLINIC">Travel Clinic</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              {filteredAppointments.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {filteredAppointments.map((appointment) => (
                    <li key={appointment.id} className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-medium">{appointment.patientName}</h3>
                          <p className="text-sm text-gray-600">
                            {getAppointmentTypeLabel(appointment.appointmentType)}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          appointment.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-800' :
                          appointment.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                          appointment.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {appointment.status}
                        </span>
                      </div>
                      
                      <p className="text-sm mb-3">
                        <span className="text-gray-600">Date & Time:</span>{' '}
                        {new Date(appointment.date).toLocaleDateString()} at{' '}
                        {new Date(appointment.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      
                      <div className="flex space-x-2">
                        <select
                          className="px-2 py-1 border rounded-md text-sm"
                          value={appointment.status}
                          onChange={(e) => handleStatusChange(appointment.id, e.target.value as AppointmentStatus)}
                        >
                          <option value="SCHEDULED">Scheduled</option>
                          <option value="COMPLETED">Completed</option>
                          <option value="CANCELLED">Cancelled</option>
                          <option value="NO_SHOW">No Show</option>
                        </select>
                        
                        {appointment.status === 'SCHEDULED' && (
                          <button
                            className="px-2 py-1 bg-nhs-blue text-white rounded-md text-sm hover:bg-nhs-dark-blue"
                            onClick={() => handleSendReminder(appointment.id)}
                          >
                            Send Reminder
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-6 text-center">
                  <p className="text-gray-500">No appointments match your filters</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
