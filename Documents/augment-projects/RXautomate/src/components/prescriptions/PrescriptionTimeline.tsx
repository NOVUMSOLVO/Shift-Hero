'use client';

import { useState, useEffect } from 'react';
import { Prescription } from '@/services/EPSService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface TimelineEvent {
  id: string;
  date: string;
  status: string;
  actor?: string;
  reason?: string;
}

interface PrescriptionTimelineProps {
  prescriptionId: string;
}

export default function PrescriptionTimeline({ prescriptionId }: PrescriptionTimelineProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (prescriptionId) {
      fetchPrescriptionHistory(prescriptionId);
    }
  }, [prescriptionId]);

  const fetchPrescriptionHistory = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/prescriptions/${id}/history`);
      
      if (!response.ok) {
        throw new Error(`Error fetching prescription history: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Process the history data into timeline events
      const timelineEvents = processHistoryData(data);
      setEvents(timelineEvents);
    } catch (err: any) {
      console.error('Failed to fetch prescription history:', err);
      setError(err.message || 'Failed to load prescription history');
    } finally {
      setLoading(false);
    }
  };

  // Process the history data into a format suitable for the timeline
  const processHistoryData = (data: any): TimelineEvent[] => {
    // This is a placeholder implementation
    // In a real application, this would process the actual history data from the API
    
    // For now, we'll create some mock timeline events based on the current prescription
    const mockEvents: TimelineEvent[] = [
      {
        id: '1',
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
        status: 'created',
        actor: 'Dr. John Smith',
      },
      {
        id: '2',
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
        status: 'active',
        actor: 'NHS EPS System',
      },
      {
        id: '3',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        status: 'on-hold',
        actor: 'Pharmacy Staff',
        reason: 'Awaiting stock',
      },
      {
        id: '4',
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        status: 'active',
        actor: 'Pharmacy Staff',
        reason: 'Stock now available',
      },
    ];
    
    return mockEvents;
  };

  // Helper function to format dates
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'PPP p');
  };

  // Helper function to get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'created':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'active':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'on-hold':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // Helper function to get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'created':
        return '📝';
      case 'active':
        return '✅';
      case 'on-hold':
        return '⏸️';
      case 'completed':
        return '🏁';
      case 'cancelled':
        return '❌';
      default:
        return '⚪';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2">Loading timeline...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error: </strong>
        <span className="block sm:inline">{error}</span>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center p-4 border border-dashed rounded-lg">
        <p className="text-gray-500">No history available for this prescription.</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Prescription Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
          
          <div className="space-y-6">
            {events.map((event, index) => (
              <div key={event.id} className="relative pl-10">
                {/* Timeline dot */}
                <div className={`absolute left-0 w-8 h-8 rounded-full flex items-center justify-center ${getStatusColor(event.status)}`}>
                  <span>{getStatusIcon(event.status)}</span>
                </div>
                
                {/* Event content */}
                <div className="bg-white p-3 rounded-lg border">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium capitalize">
                        {event.status === 'on-hold' ? 'On Hold' : event.status}
                      </h4>
                      {event.actor && (
                        <p className="text-sm text-gray-600">By: {event.actor}</p>
                      )}
                    </div>
                    <time className="text-xs text-gray-500">{formatDate(event.date)}</time>
                  </div>
                  
                  {event.reason && (
                    <p className="mt-1 text-sm text-gray-700">
                      Reason: {event.reason}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
