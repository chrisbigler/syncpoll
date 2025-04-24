import React, { createContext, useContext, useState } from 'react';
import { CalendarAvailability, TimeSlot } from '../types';
import { useAuth } from './AuthContext';

interface CalendarContextType {
  connected: boolean;
  loading: boolean;
  error: string | null;
  fetchAvailability: (startDate: Date, endDate: Date) => Promise<CalendarAvailability[]>;
  connectCalendar: () => Promise<void>;
  disconnectCalendar: () => void;
  createEvent: (title: string, startTime: Date, endTime: Date, description?: string, attendees?: string[]) => Promise<string>;
}

const CalendarContext = createContext<CalendarContextType | undefined>(undefined);

export const useCalendar = () => {
  const context = useContext(CalendarContext);
  if (context === undefined) {
    throw new Error('useCalendar must be used within a CalendarProvider');
  }
  return context;
};

export const CalendarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { accessToken } = useAuth();

  const fetchAvailability = async (startDate: Date, endDate: Date): Promise<CalendarAvailability[]> => {
    if (!accessToken) {
      throw new Error('Not authenticated');
    }

    setLoading(true);
    try {
      // Fetch events from Google Calendar
      const timeMin = startDate.toISOString();
      const timeMax = endDate.toISOString();
      
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch calendar events');
      }

      const data = await response.json();
      const busyTimes = data.items.map((event: any) => ({
        start: new Date(event.start.dateTime || event.start.date),
        end: new Date(event.end.dateTime || event.end.date),
      }));

      // Generate available time slots
      const availability: CalendarAvailability[] = [];
      const currentDate = new Date(startDate);

      while (currentDate <= endDate) {
        const dayStart = new Date(currentDate);
        dayStart.setHours(9, 0, 0, 0); // Start at 9 AM
        
        const slots: TimeSlot[] = [];
        
        // Create slots every 30 minutes from 9 AM to 5 PM
        for (let i = 0; i < 16; i++) {
          const slotStart = new Date(dayStart);
          slotStart.setMinutes(slotStart.getMinutes() + i * 30);
          
          const slotEnd = new Date(slotStart);
          slotEnd.setMinutes(slotEnd.getMinutes() + 30);
          
          // Check if slot overlaps with any busy times
          const isAvailable = !busyTimes.some(
            (busy: { start: Date; end: Date }) =>
              slotStart < busy.end && slotEnd > busy.start
          );
          
          if (isAvailable) {
            slots.push({
              id: `slot-${slotStart.toISOString()}`,
              startTime: slotStart,
              endTime: slotEnd,
              available: true
            });
          }
        }
        
        availability.push({
          date: new Date(currentDate),
          availableSlots: slots
        });
        
        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
      }

      return availability;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch calendar availability';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const connectCalendar = async (): Promise<void> => {
    if (!accessToken) {
      throw new Error('Not authenticated');
    }

    setLoading(true);
    try {
      // Test the connection by fetching the calendar list
      const response = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to connect to calendar');
      }

      setConnected(true);
      localStorage.setItem('meetpoll_calendar_connected', 'true');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to connect to calendar';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const disconnectCalendar = () => {
    setConnected(false);
    localStorage.removeItem('meetpoll_calendar_connected');
  };

  const createEvent = async (
    title: string,
    startTime: Date,
    endTime: Date,
    description?: string,
    attendees?: string[]
  ): Promise<string> => {
    if (!accessToken) {
      throw new Error('Not authenticated');
    }

    setLoading(true);
    try {
      const event = {
        summary: title,
        description,
        start: {
          dateTime: startTime.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        end: {
          dateTime: endTime.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        attendees: attendees?.map(email => ({ email })),
        conferenceData: {
          createRequest: {
            requestId: `meetpoll-${Date.now()}`,
            conferenceSolutionKey: { type: 'hangoutsMeet' },
          },
        },
      };

      const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      });

      if (!response.ok) {
        throw new Error('Failed to create calendar event');
      }

      const data = await response.json();
      return data.id;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create calendar event';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <CalendarContext.Provider value={{ 
      connected, 
      loading, 
      error, 
      fetchAvailability, 
      connectCalendar, 
      disconnectCalendar,
      createEvent
    }}>
      {children}
    </CalendarContext.Provider>
  );
};