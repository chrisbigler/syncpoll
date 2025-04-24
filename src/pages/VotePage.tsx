import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Check, AlertTriangle } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../components/ui/Card';
import Input from '../components/ui/Input';
import { usePoll } from '../context/PollContext';
import { Poll, TimeSlot } from '../types';

const VotePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getPoll, submitVote, loading } = usePoll();
  
  const [poll, setPoll] = useState<Poll | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [voterName, setVoterName] = useState('');
  const [voterEmail, setVoterEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    // Load poll data
    if (id) {
      const pollData = getPoll(id);
      if (pollData) {
        setPoll(pollData);
      } else {
        // Poll not found, redirect
        navigate('/');
      }
    }
  }, [id, getPoll, navigate]);

  // Format date for display
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium'
    }).format(new Date(date));
  };

  // Format time for display
  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(new Date(date));
  };

  // Get vote count for a time slot
  const getVoteCount = (timeSlotId: string) => {
    if (!poll) return 0;
    return poll.votes.filter(vote => vote.timeSlotId === timeSlotId).length;
  };

  // Handle vote submission
  const handleVoteSubmit = async () => {
    if (!id || !selectedTimeSlot) return;
    
    try {
      // Validate inputs
      if (!voterName.trim()) {
        setError('Please enter your name');
        return;
      }
      
      if (!voterEmail.trim()) {
        setError('Please enter your email');
        return;
      }
      
      // Submit vote
      await submitVote(id, selectedTimeSlot, voterName, voterEmail);
      
      // Show success message
      setSuccess('Your vote has been submitted successfully!');
      
      // Clear form
      setSelectedTimeSlot('');
      setVoterName('');
      setVoterEmail('');
      
      // Reload poll data
      const updatedPoll = getPoll(id);
      if (updatedPoll) {
        setPoll(updatedPoll);
      }
    } catch (err) {
      setError('Failed to submit vote. Please try again.');
    }
  };

  // Group time slots by date
  const groupTimeSlotsByDate = (slots: TimeSlot[]) => {
    const grouped: Record<string, TimeSlot[]> = {};
    
    slots.forEach(slot => {
      const dateKey = new Date(slot.startTime).toDateString();
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(slot);
    });
    
    return Object.entries(grouped).map(([dateKey, slots]) => ({
      date: new Date(dateKey),
      slots: slots.sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
    }));
  };

  if (!poll) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading poll...</p>
          </div>
        </div>
      </Layout>
    );
  }

  const isActive = poll.status === 'active';
  const isCompleted = poll.status === 'completed';
  const isCancelled = poll.status === 'cancelled';
  const groupedTimeSlots = groupTimeSlotsByDate(poll.timeSlots);

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{poll.title}</CardTitle>
            <CardDescription>
              Created by {poll.createdBy.name} on {formatDate(poll.created)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {poll.description && (
              <p className="text-gray-700 mb-4">{poll.description}</p>
            )}
            
            <div className="text-sm text-gray-500">
              {isActive ? (
                <span>This poll is active and accepting votes until {formatDate(poll.expiresAt)}</span>
              ) : isCompleted ? (
                <span className="text-green-600 font-medium">This poll has been finalized and a meeting has been scheduled</span>
              ) : (
                <span className="text-red-600 font-medium">This poll has been cancelled</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-start">
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <p className="ml-3">{error}</p>
          </div>
        )}
        
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md flex items-start">
            <Check className="h-5 w-5 flex-shrink-0" />
            <p className="ml-3">{success}</p>
          </div>
        )}

        {isActive ? (
          <div className="grid gap-8 md:grid-cols-5">
            <div className="md:col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle>Select a Time Slot</CardTitle>
                  <CardDescription>
                    Choose your preferred meeting time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {groupedTimeSlots.map(({ date, slots }, groupIndex) => (
                      <div key={groupIndex}>
                        <h3 className="font-medium text-gray-800 mb-3">
                          {formatDate(date)}
                        </h3>
                        <div className="grid gap-3">
                          {slots.map((slot) => {
                            const isSelected = selectedTimeSlot === slot.id;
                            
                            return (
                              <button
                                key={slot.id}
                                className={`p-3 rounded-md text-left transition-all ${
                                  isSelected 
                                    ? 'bg-blue-100 border-blue-400 border' 
                                    : 'bg-gray-50 border border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                                }`}
                                onClick={() => setSelectedTimeSlot(slot.id)}
                              >
                                <div className="font-medium text-gray-800">
                                  {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                                </div>
                                <div className="text-sm text-gray-500 mt-1">
                                  {getVoteCount(slot.id)} votes so far
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Your Information</CardTitle>
                  <CardDescription>
                    Enter your details to submit your vote
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    label="Your Name"
                    placeholder="Enter your full name"
                    value={voterName}
                    onChange={(e) => setVoterName(e.target.value)}
                    required
                  />
                  <Input
                    label="Email Address"
                    type="email"
                    placeholder="Enter your email"
                    value={voterEmail}
                    onChange={(e) => setVoterEmail(e.target.value)}
                    required
                  />
                  <p className="text-xs text-gray-500">
                    Your email is only used to send you the calendar invitation once the meeting is scheduled.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button 
                    fullWidth
                    disabled={!selectedTimeSlot || loading}
                    loading={loading}
                    onClick={handleVoteSubmit}
                  >
                    Submit Vote
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              {isCompleted ? (
                <>
                  <div className="mx-auto mb-4 h-16 w-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    This poll has been finalized
                  </h3>
                  <p className="text-gray-600 mb-6">
                    A meeting has been scheduled and calendar invitations have been sent to all participants.
                  </p>
                </>
              ) : (
                <>
                  <div className="mx-auto mb-4 h-16 w-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
                    <AlertTriangle className="h-8 w-8" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    This poll has been cancelled
                  </h3>
                  <p className="text-gray-600 mb-6">
                    The poll creator has cancelled this meeting poll.
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default VotePage;