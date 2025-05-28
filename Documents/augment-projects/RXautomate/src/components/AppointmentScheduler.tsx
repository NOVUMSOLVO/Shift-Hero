import React, { useState } from 'react';
import { AppointmentType } from '@prisma/client';

export interface TimeSlot {
  time: string;
  available: boolean;
}

export interface AppointmentSchedulerProps {
  date: Date;
  appointmentType: AppointmentType;
  timeSlots: TimeSlot[];
  onDateChange: (date: Date) => void;
  onTypeChange: (type: AppointmentType) => void;
  onSchedule: (date: Date, time: string, type: AppointmentType) => void;
}

const AppointmentScheduler: React.FC<AppointmentSchedulerProps> = ({
  date,
  appointmentType,
  timeSlots,
  onDateChange,
  onTypeChange,
  onSchedule,
}) => {
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [patientDetails, setPatientDetails] = useState({
    nhsNumber: '',
    name: '',
    phoneNumber: '',
  });

  // Format date for input
  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  // Handle date change
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value);
    onDateChange(newDate);
  };

  // Handle appointment type change
  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onTypeChange(e.target.value as AppointmentType);
  };

  // Handle time slot selection
  const handleTimeSelection = (time: string) => {
    setSelectedTime(time);
  };

  // Handle patient details change
  const handlePatientDetailsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPatientDetails((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle schedule button click
  const handleSchedule = () => {
    if (selectedTime) {
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const appointmentDate = new Date(date);
      appointmentDate.setHours(hours, minutes, 0, 0);
      
      onSchedule(appointmentDate, selectedTime, appointmentType);
      
      // Reset form
      setSelectedTime(null);
      setPatientDetails({
        nhsNumber: '',
        name: '',
        phoneNumber: '',
      });
    }
  };

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
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Schedule Appointment</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Appointment Date
          </label>
          <input
            type="date"
            className="w-full px-3 py-2 border rounded-md"
            value={formatDateForInput(date)}
            onChange={handleDateChange}
            min={formatDateForInput(new Date())}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Appointment Type
          </label>
          <select
            className="w-full px-3 py-2 border rounded-md"
            value={appointmentType}
            onChange={handleTypeChange}
          >
            <option value="FLU_VACCINATION">Flu Vaccination</option>
            <option value="COVID_VACCINATION">COVID Vaccination</option>
            <option value="MEDICATION_REVIEW">Medication Review</option>
            <option value="TRAVEL_CLINIC">Travel Clinic</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
      </div>
      
      <div className="mb-6">
        <h3 className="text-md font-medium mb-2">Available Time Slots</h3>
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
          {timeSlots.map((slot, index) => (
            <button
              key={index}
              className={`px-2 py-1 text-sm rounded-md ${
                !slot.available
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : selectedTime === slot.time
                  ? 'bg-nhs-blue text-white'
                  : 'bg-white border border-gray-300 hover:bg-gray-50'
              }`}
              onClick={() => slot.available && handleTimeSelection(slot.time)}
              disabled={!slot.available}
            >
              {slot.time}
            </button>
          ))}
        </div>
      </div>
      
      {selectedTime && (
        <div className="border-t pt-4">
          <h3 className="text-md font-medium mb-3">Patient Details</h3>
          
          <div className="space-y-3 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                NHS Number
              </label>
              <input
                type="text"
                name="nhsNumber"
                className="w-full px-3 py-2 border rounded-md"
                value={patientDetails.nhsNumber}
                onChange={handlePatientDetailsChange}
                placeholder="e.g. 1234567890"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                className="w-full px-3 py-2 border rounded-md"
                value={patientDetails.name}
                onChange={handlePatientDetailsChange}
                placeholder="e.g. John Smith"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                name="phoneNumber"
                className="w-full px-3 py-2 border rounded-md"
                value={patientDetails.phoneNumber}
                onChange={handlePatientDetailsChange}
                placeholder="e.g. 07123456789"
              />
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium">
                {getAppointmentTypeLabel(appointmentType)}
              </p>
              <p className="text-sm text-gray-600">
                {date.toLocaleDateString('en-GB')} at {selectedTime}
              </p>
            </div>
            
            <button
              className="px-4 py-2 bg-nhs-blue text-white rounded-md hover:bg-nhs-dark-blue"
              onClick={handleSchedule}
            >
              Schedule Appointment
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentScheduler;
