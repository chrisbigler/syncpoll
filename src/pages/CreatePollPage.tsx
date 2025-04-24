import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, Info, Users, ArrowRight, Calendar as CalendarIcon, Video } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Textarea from '../components/ui/Textarea';
import TimeSlotPicker from '../components/ui/TimeSlotPicker';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../components/ui/Card';
import { useAuth } from '../context/AuthContext';
import { usePoll } from '../context/PollContext';
import { useCalendar } from '../context/CalendarContext';
import { TimeSlot, CalendarAvailability } from '../types';

const CreatePollPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { createPoll, loading } = usePoll();
  const { connected, connectCalendar, fetchAvailability, loading: calendarLoading } = useCalendar();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
    start: new Date(),
    end: new Date(new Date().setDate(new Date().getDate() + 7)),
  });
  const [availability, setAvailability] = useState<CalendarAvailability[]>([]);
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<string[]>([]);
  const [meetingType, setMeetingType] = useState<'google-meet' | 'zoom' | 'other'>('google-meet');
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');

  // Check if user is authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  // Load availability when calendar is connected
  useEffect(() => {
    const loadAvailability = async () => {
      if (connected) {
        try {
          const availabilityData = await fetchAvailability(
            dateRange.start,
            dateRange.end
          );
          setAvailability(availabilityData);
        } catch (err) {
          setError('Failed to load availability. Please try again.');
        }
      }
    };

    loadAvailability();
  }, [connected, dateRange, fetchAvailability]);

  // Handle calendar connection
  const handleConnectCalendar = async () => {
    try {
      await connectCalendar();
    } catch (err) {
      setError('Failed to connect to calendar. Please try again.');
    }
  };

  // Handle time slot selection
  const handleTimeSlotSelect = (slotId: string) => {
    setSelectedTimeSlots(prev => {
      if (prev.includes(slotId)) {
        return prev.filter(id => id !== slotId);
      } else {
        return [...prev, slotId];
      }
    });
  };

  // Handle poll creation
  const handleCreatePoll = async () => {
    try {
      // Validate inputs
      if (!title.trim()) {
        setError('Please enter a title for your poll');
        return;
      }

      if (selectedTimeSlots.length === 0) {
        setError('Please select at least one time slot');
        return;
      }

      // Collect all selected time slots
      const selectedSlots: TimeSlot[] = [];
      availability.forEach(day => {
        day.availableSlots.forEach(slot => {
          if (selectedTimeSlots.includes(slot.id)) {
            selectedSlots.push(slot);
          }
        });
      });

      // Create the poll
      const newPoll = await createPoll(
        title,
        description,
        selectedSlots,
        meetingType
      );

      // Navigate to the poll details page
      navigate(`/polls/${newPoll.id}`);
    } catch (err) {
      setError('Failed to create poll. Please try again.');
    }
  };

  // Next step handler
  const handleNextStep = () => {
    if (step === 1) {
      if (!title.trim()) {
        setError('Please enter a title for your poll');
        return;
      }
      setError('');
      setStep(2);
    } else if (step === 2) {
      if (!connected) {
        setError('Please connect your calendar first');
        return;
      }
      setError('');
      setStep(3);
    } else if (step === 3) {
      if (selectedTimeSlots.length === 0) {
        setError('Please select at least one time slot');
        return;
      }
      setError('');
      setStep(4);
    }
  };

  // Back step handler
  const handleBackStep = () => {
    setError('');
    setStep(step - 1);
  };

  // Group time slots by date
  const groupTimeSlotsByDate = () => {
    return availability;
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create a Meeting Poll</h1>
          <p className="mt-1 text-md text-gray-500">
            Set up a poll for participants to vote on their preferred meeting times
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`flex items-center ${s < 4 ? 'flex-1' : ''}`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${
                    s <= step ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  {s === 1 ? (
                    <Info className="h-5 w-5" />
                  ) : s === 2 ? (
                    <Calendar className="h-5 w-5" />
                  ) : s === 3 ? (
                    <Clock className="h-5 w-5" />
                  ) : (
                    <Users className="h-5 w-5" />
                  )}
                </div>
                {s < 4 && (
                  <div
                    className={`h-1 w-full ${
                      s < step ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  ></div>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            <div className="text-xs font-medium text-gray-500 w-10 text-center">Details</div>
            <div className="text-xs font-medium text-gray-500 w-10 text-center">Calendar</div>
            <div className="text-xs font-medium text-gray-500 w-10 text-center">Time Slots</div>
            <div className="text-xs font-medium text-gray-500 w-10 text-center">Review</div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-start">
            <div className="flex-shrink-0 mt-0.5">
              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Step 1: Poll Details */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Poll Details</CardTitle>
              <CardDescription>
                Provide basic information about your meeting poll
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Input
                label="Poll Title"
                placeholder="e.g., Team Weekly Sync, Project Kickoff"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
              <Textarea
                label="Description (optional)"
                placeholder="Add any additional details about the meeting..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Meeting Type
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <button
                    type="button"
                    className={`p-4 border rounded-lg text-center hover:border-blue-500 transition-colors ${
                      meetingType === 'google-meet' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                    }`}
                    onClick={() => setMeetingType('google-meet')}
                  >
                    <Video className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                    <span className="text-sm font-medium">Google Meet</span>
                  </button>
                  <button
                    type="button"
                    className={`p-4 border rounded-lg text-center hover:border-blue-500 transition-colors ${
                      meetingType === 'zoom' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                    }`}
                    onClick={() => setMeetingType('zoom')}
                  >
                    <Video className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                    <span className="text-sm font-medium">Zoom</span>
                  </button>
                  <button
                    type="button"
                    className={`p-4 border rounded-lg text-center hover:border-blue-500 transition-colors ${
                      meetingType === 'other' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                    }`}
                    onClick={() => setMeetingType('other')}
                  >
                    <CalendarIcon className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                    <span className="text-sm font-medium">No video</span>
                  </button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={handleNextStep}>
                Next
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Step 2: Connect Calendar */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Connect Calendar</CardTitle>
              <CardDescription>
                Connect your Google Calendar to see your availability
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4 text-blue-800">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <Info className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm">
                      Connecting your calendar allows us to see your availability and avoid scheduling conflicts.
                      Your calendar events remain private.
                    </p>
                  </div>
                </div>
              </div>

              {!connected ? (
                <div className="text-center py-8">
                  <CalendarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Connect your Google Calendar</h3>
                  <p className="text-gray-500 mb-6 max-w-md mx-auto">
                    We'll use this to check your availability and schedule the meeting once voting is complete.
                  </p>
                  <Button 
                    onClick={handleConnectCalendar} 
                    loading={calendarLoading}
                    disabled={calendarLoading}
                  >
                    Connect Google Calendar
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="mx-auto mb-4 h-16 w-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Calendar Connected!</h3>
                  <p className="text-gray-500 mb-2">
                    Your Google Calendar has been successfully connected.
                  </p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={handleBackStep}>
                Back
              </Button>
              <Button 
                onClick={handleNextStep} 
                disabled={!connected || calendarLoading}
              >
                Next
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Step 3: Select Time Slots */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Select Available Time Slots</CardTitle>
              <CardDescription>
                Choose the time slots you want to include in your poll
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Your Availability</h3>
                  <p className="text-sm text-gray-500">
                    {new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(dateRange.start)} - {new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(dateRange.end)}
                  </p>
                </div>
                <div className="text-sm">
                  <span className="font-medium">{selectedTimeSlots.length}</span> time slots selected
                </div>
              </div>

              {calendarLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading availability...</p>
                </div>
              ) : (
                <div>
                  {groupTimeSlotsByDate().map((day, index) => (
                    <TimeSlotPicker
                      key={index}
                      date={day.date}
                      timeSlots={day.availableSlots}
                      selectedSlots={selectedTimeSlots}
                      onSelect={handleTimeSlotSelect}
                    />
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={handleBackStep}>
                Back
              </Button>
              <Button onClick={handleNextStep}>
                Next
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Step 4: Review and Create */}
        {step === 4 && (
          <Card>
            <CardHeader>
              <CardTitle>Review Your Poll</CardTitle>
              <CardDescription>
                Review the details before creating your meeting poll
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="px-4 py-5 sm:px-6 bg-gray-50">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">Poll Summary</h3>
                </div>
                <div className="border-t border-gray-200">
                  <dl>
                    <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Title</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{title}</dd>
                    </div>
                    <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Description</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        {description || <span className="text-gray-400">No description provided</span>}
                      </dd>
                    </div>
                    <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Meeting Type</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        {meetingType === 'google-meet' ? 'Google Meet' : meetingType === 'zoom' ? 'Zoom' : 'No video'}
                      </dd>
                    </div>
                    <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Time Slots</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        <span className="font-medium">{selectedTimeSlots.length}</span> time slots selected
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={handleBackStep}>
                Back
              </Button>
              <Button 
                onClick={handleCreatePoll} 
                loading={loading}
                disabled={loading}
              >
                Create Poll
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default CreatePollPage;