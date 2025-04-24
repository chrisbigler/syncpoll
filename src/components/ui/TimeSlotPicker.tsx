import React, { useState } from 'react';
import { TimeSlot } from '../../types';
import { Card, CardContent, CardHeader, CardTitle } from './Card';

interface TimeSlotPickerProps {
  date: Date;
  timeSlots: TimeSlot[];
  selectedSlots: string[];
  onSelect: (slotId: string) => void;
}

const TimeSlotPicker: React.FC<TimeSlotPickerProps> = ({
  date,
  timeSlots,
  selectedSlots,
  onSelect
}) => {
  // Format the date for display
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  }).format(date);

  // Group time slots by hour for better organization
  const groupedSlots: Record<string, TimeSlot[]> = {};
  
  timeSlots.forEach(slot => {
    const hour = slot.startTime.getHours();
    const key = `${hour}`;
    
    if (!groupedSlots[key]) {
      groupedSlots[key] = [];
    }
    
    groupedSlots[key].push(slot);
  });

  // Format time for display
  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-blue-800">{formattedDate}</CardTitle>
      </CardHeader>
      <CardContent>
        {Object.entries(groupedSlots).length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(groupedSlots).map(([hour, slots]) => (
              <React.Fragment key={hour}>
                {slots.map(slot => {
                  const isSelected = selectedSlots.includes(slot.id);
                  return (
                    <button
                      key={slot.id}
                      className={`
                        p-3 rounded-md text-left transition-all transform hover:scale-105
                        ${isSelected 
                          ? 'bg-blue-100 border-blue-400 border text-blue-800' 
                          : 'bg-gray-50 border border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                        }
                      `}
                      onClick={() => onSelect(slot.id)}
                    >
                      <div className="font-medium">
                        {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                      </div>
                    </button>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">
            No available time slots for this day
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TimeSlotPicker;