import React, { useState, useEffect } from 'react';
import { Calendar, Clock, AlertTriangle, Loader } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCalendar } from '../../context/CalendarContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';

type Duration = 15 | 30 | 45 | 60 | 'custom';

interface TimeSlot {
  start: Date;
  end: Date;
  available: boolean;
}

interface DayAvailability {
  date: Date;
  slots: TimeSlot[];
}

const AvailabilityView: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const { connected, loading: calendarLoading, error, fetchAvailability } = useCalendar();
  
  const [selectedDuration, setSelectedDuration] = useState<Duration>(30);
  const [customDuration, setCustomDuration] = useState(30);
  const [availability, setAvailability] = useState<DayAvailability[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);

  // Date range for availability (next 7 days by default)
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 7);

  useEffect(() => {
    if (isAuthenticated && connected) {
      loadAvailability();
    }
  }, [isAuthenticated, connected, selectedDuration, customDuration]);

  const loadAvailability = async () => {
    setLoading(true);
    try {
      const data = await fetchAvailability(startDate, endDate);
      
      // Filter and process slots based on duration and business hours
      const processedData = data.map(day => ({
        date: day.date,
        slots: filterAndProcessSlots(day.availableSlots)
      }));
      
      setAvailability(processedData);
    } catch (err) {
      console.error('Failed to load availability:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterAndProcessSlots = (slots: TimeSlot[]) => {
    const duration = selectedDuration === 'custom' ? customDuration : selectedDuration;
    
    return slots.filter(slot => {
      const slotHour = slot.startTime.getHours();
      return slotHour >= 9 && slotHour < 17; // 9 AM - 5 PM
    });
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  const handleSlotSelect = (slotId: string) => {
    setSelectedSlots(prev => {
      if (prev.includes(slotId)) {
        return prev.filter(id => id !== slotId);
      }
      return [...prev, slotId];
    });
  };

  if (!isAuthenticated) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Sign in to view availability
            </h3>
            <p className="text-gray-500">
              You need to be signed in to access your calendar.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!connected) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Connect your calendar
            </h3>
            <p className="text-gray-500 mb-4">
              Connect your calendar to view and manage your availability.
            </p>
            <Button onClick={() => {}}>Connect Calendar</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Calendar Availability</CardTitle>
          <CardDescription>
            Select your preferred meeting duration and view available time slots
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Duration Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Meeting Duration
              </label>
              <div className="flex flex-wrap gap-2">
                {[15, 30, 45, 60].map(duration => (
                  <button
                    key={duration}
                    onClick={() => setSelectedDuration(duration as Duration)}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${
                      selectedDuration === duration
                        ? 'bg-blue-100 text-blue-700 border border-blue-300'
                        : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                    }`}
                  >
                    {duration} minutes
                  </button>
                ))}
                <button
                  onClick={() => setSelectedDuration('custom')}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    selectedDuration === 'custom'
                      ? 'bg-blue-100 text-blue-700 border border-blue-300'
                      : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                  }`}
                >
                  Custom
                </button>
              </div>
            </div>

            {selectedDuration === 'custom' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Duration (minutes)
                </label>
                <input
                  type="number"
                  min="15"
                  max="240"
                  step="15"
                  value={customDuration}
                  onChange={(e) => setCustomDuration(Number(e.target.value))}
                  className="block w-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Availability Display */}
      {loading || calendarLoading ? (
        <div className="text-center py-12">
          <Loader className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-500">Loading availability...</p>
        </div>
      ) : error ? (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="py-6">
            <div className="flex items-center text-red-700">
              <AlertTriangle className="h-5 w-5 mr-2" />
              <p>Failed to load calendar availability. Please try again.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {availability.map((day, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle>{formatDate(day.date)}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {day.slots.map((slot, slotIndex) => (
                    <button
                      key={slotIndex}
                      onClick={() => slot.available && handleSlotSelect(`${index}-${slotIndex}`)}
                      disabled={!slot.available}
                      className={`
                        p-4 rounded-md text-left transition-all
                        ${slot.available
                          ? selectedSlots.includes(`${index}-${slotIndex}`)
                            ? 'bg-blue-100 border-blue-400 border'
                            : 'bg-white border border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                          : 'bg-gray-100 border border-gray-200 cursor-not-allowed'
                        }
                      `}
                    >
                      <div className="font-medium text-gray-900">
                        {formatTime(slot.start)} - {formatTime(slot.end)}
                      </div>
                      <div className="mt-1">
                        <Badge
                          variant={slot.available ? 'success' : 'danger'}
                        >
                          {slot.available ? 'Available' : 'Unavailable'}
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AvailabilityView;