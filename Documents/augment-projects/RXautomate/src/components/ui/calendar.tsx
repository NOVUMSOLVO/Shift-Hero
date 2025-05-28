'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface CalendarProps extends React.HTMLAttributes<HTMLDivElement> {
  date?: Date;
  onDateChange?: (date: Date) => void;
}

const Calendar = React.forwardRef<HTMLDivElement, CalendarProps>(
  ({ className, date = new Date(), onDateChange, ...props }, ref) => {
    const [currentDate, setCurrentDate] = React.useState(date);
    const [currentMonth, setCurrentMonth] = React.useState(currentDate.getMonth());
    const [currentYear, setCurrentYear] = React.useState(currentDate.getFullYear());

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

    const handlePrevMonth = () => {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    };

    const handleNextMonth = () => {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    };

    const handleDateClick = (day: number) => {
      const newDate = new Date(currentYear, currentMonth, day);
      setCurrentDate(newDate);
      onDateChange?.(newDate);
    };

    const renderDays = () => {
      const days = [];
      const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

      // Render days of week
      for (let i = 0; i < 7; i++) {
        days.push(
          <div key={`header-${i}`} className="text-center font-medium text-xs py-2">
            {daysOfWeek[i]}
          </div>
        );
      }

      // Render empty cells for days before the first day of the month
      for (let i = 0; i < firstDayOfMonth; i++) {
        days.push(<div key={`empty-${i}`} className="p-2"></div>);
      }

      // Render days of the month
      for (let day = 1; day <= daysInMonth; day++) {
        const isSelected =
          currentDate.getDate() === day &&
          currentDate.getMonth() === currentMonth &&
          currentDate.getFullYear() === currentYear;

        days.push(
          <div
            key={`day-${day}`}
            className={cn(
              'text-center p-2 rounded-md cursor-pointer hover:bg-gray-100',
              isSelected && 'bg-nhs-blue text-white hover:bg-nhs-dark-blue'
            )}
            onClick={() => handleDateClick(day)}
          >
            {day}
          </div>
        );
      }

      return days;
    };

    return (
      <div
        ref={ref}
        className={cn('p-3 bg-white border rounded-md shadow-sm', className)}
        {...props}
      >
        <div className="flex justify-between items-center mb-4">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1 rounded-md hover:bg-gray-100"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="font-medium">
            {new Date(currentYear, currentMonth).toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric',
            })}
          </div>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1 rounded-md hover:bg-gray-100"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1">{renderDays()}</div>
      </div>
    );
  }
);
Calendar.displayName = 'Calendar';

export { Calendar };