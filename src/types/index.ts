export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export interface TimeSlot {
  id: string;
  startTime: Date;
  endTime: Date;
  available: boolean;
}

export interface Vote {
  userId: string;
  userName: string;
  userEmail: string;
  timeSlotId: string;
  createdAt: Date;
}

export interface Poll {
  id: string;
  title: string;
  description: string;
  createdBy: User;
  timeSlots: TimeSlot[];
  votes: Vote[];
  expiresAt: Date;
  created: Date;
  meetingType: 'google-meet' | 'zoom' | 'other';
  status: 'active' | 'completed' | 'cancelled';
  winningTimeSlotId?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  meetingLink?: string;
  attendees: User[];
}

export interface CalendarAvailability {
  date: Date;
  availableSlots: TimeSlot[];
}

export type NotificationType = 'poll_created' | 'vote_submitted' | 'poll_ended' | 'meeting_scheduled';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  pollId?: string;
}