import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Check, Copy, Clock, Calendar, Users, AlertTriangle, ArrowRight, CheckCircle } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../components/ui/Card';
import Input from '../components/ui/Input';
import { useAuth } from '../context/AuthContext';
import { usePoll } from '../context/PollContext';
import { useCalendar } from '../context/CalendarContext';
import { Poll, Vote, TimeSlot } from '../types';

const PollDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { polls, getPoll, submitVote, finalizePoll, cancelPoll, loading } = usePoll();
  const { createEvent } = useCalendar();
  
  const [poll, setPoll] = useState<Poll | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [voterName, setVoterName] = useState('');
  const [voterEmail, setVoterEmail] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [finalizing, setFinalizing] = useState(false);

  useEffect(() => {
    // Load poll data
    if (id) {
      const pollData = getPoll(id);
      if (pollData) {
        setPoll(pollData);
      } else {
        // Poll not found, redirect to dashboard
        navigate('/dashboard');
      }
    }
  }, [id, polls, getPoll, navigate]);

  // Check if the current user created the poll
  const isCreator = poll && user && poll.createdBy.id === user.id;

  // Check if the poll is active
  const isActive = poll && poll.status === 'active';

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

  // Get winning time slot
  const getWinningTimeSlot = () => {
    if (!poll || !poll.winningTimeSlotId) return null;
    return poll.timeSlots.find(slot => slot.id === poll.winningTimeSlotId);
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
      
      // Clear form and show success message
      setSelectedTimeSlot('');
      setSuccess('Your vote has been submitted successfully!');
      
      // Reload poll data
      const updatedPoll = getPoll(id);
      if (updatedPoll) {
        setPoll(updatedPoll);
      }
    } catch (err) {
      setError('Failed to submit vote. Please try again.');
    }
  };

  // Handle poll finalization
  const handleFinalizePoll = async () => {
    if (!id) return;
    
    try {
      setFinalizing(true);
      await finalizePoll(id);
      
      // Get updated poll data
      const updatedPoll = getPoll(id);
      if (updatedPoll) {
        setPoll(updatedPoll);
        
        // Get the winning time slot
        const winningSlot = updatedPoll.timeSlots.find(
          slot => slot.id === updatedPoll.winningTimeSlotId
        );
        
        if (winningSlot) {
          // Create a calendar event
          const attendees = Array.from(
            new Set(updatedPoll.votes.map(vote => vote.userEmail))
          );
          
          await createEvent(
            updatedPoll.title,
            winningSlot.startTime,
            winningSlot.endTime,
            updatedPoll.description,
            attendees
          );
          
          setSuccess('Poll finalized and calendar event created successfully!');
        }
      }
    } catch (err) {
      setError('Failed to finalize poll. Please try again.');
    } finally {
      setFinalizing(false);
    }
  };

  // Handle poll cancellation
  const handleCancelPoll = async () => {
    if (!id) return;
    
    try {
      await cancelPoll(id);
      
      // Get updated poll data
      const updatedPoll = getPoll(id);
      if (updatedPoll) {
        setPoll(updatedPoll);
        setSuccess('Poll cancelled successfully.');
      }
    } catch (err) {
      setError('Failed to cancel poll. Please try again.');
    }
  };

  // Copy poll link to clipboard
  const copyPollLink = () => {
    const link = `${window.location.origin}/polls/${id}`;
    navigator.clipboard.writeText(link).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      },
      () => {
        setError('Failed to copy link. Please try manually.');
      }
    );
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
            <p className="mt-4 text-gray-600">Loading poll details...</p>
          </div>
        </div>
      </Layout>
    );
  }

  const isCompleted = poll.status === 'completed';
  const isCancelled = poll.status === 'cancelled';
  const groupedTimeSlots = groupTimeSlotsByDate(poll.timeSlots);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Poll Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="px-6 py-5 sm:px-10">
            <div className="flex flex-wrap items-center justify-between">
              <div className="mb-4 md:mb-0">
                <div className="flex items-center">
                  <h1 className="text-2xl font-bold text-gray-900 mr-3">{poll.title}</h1>
                  <Badge 
                    variant={
                      isActive ? 'primary' : 
                      isCompleted ? 'success' : 
                      'danger'
                    }
                  >
                    {isActive ? 'Active' : isCompleted ? 'Completed' : 'Cancelled'}
                  </Badge>
                </div>
                <p className="text-gray-500 mt-1">Created by {poll.createdBy.name} on {formatDate(poll.created)}</p>
              </div>
              
              <div className="flex space-x-3">
                <Button 
                  variant="outline" 
                  onClick={copyPollLink}
                  icon={<Copy className="h-4 w-4" />}
                >
                  {copied ? 'Copied!' : 'Copy Link'}
                </Button>
                
                {isCreator && isActive && (
                  <Button 
                    onClick={handleFinalizePoll}
                    loading={finalizing}
                    disabled={finalizing || poll.votes.length === 0}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Finalize Poll
                  </Button>
                )}
                
                {isCreator && isActive && (
                  <Button 
                    variant="danger" 
                    onClick={handleCancelPoll}
                    disabled={loading}
                  >
                    Cancel Poll
                  </Button>
                )}
              </div>
            </div>
            
            {poll.description && (
              <div className="mt-4 text-gray-700">
                <p>{poll.description}</p>
              </div>
            )}
            
            <div className="mt-6 flex flex-wrap items-center text-sm text-gray-500 gap-4">
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                <span>{poll.timeSlots.length} time slots</span>
              </div>
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-1" />
                <span>{new Set(poll.votes.map(vote => vote.userEmail)).size} participants</span>
              </div>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                <span>Expires {formatDate(poll.expiresAt)}</span>
              </div>
            </div>
          </div>
        </div>

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

        <div className="grid gap-8 md:grid-cols-3">
          {/* Time Slots Section */}
          <div className="md:col-span-2">
            {isCompleted && getWinningTimeSlot() && (
              <Card className="mb-8 bg-green-50 border-green-200">
                <CardHeader>
                  <CardTitle className="flex items-center text-green-800">
                    <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                    Selected Time Slot
                  </CardTitle>
                  <CardDescription className="text-green-700">
                    The following time has been scheduled based on votes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-white p-6 rounded-md border border-green-200">
                    <div className="text-lg font-medium text-gray-900 mb-2">
                      {formatDate(getWinningTimeSlot()!.startTime)}
                    </div>
                    <div className="text-2xl font-bold text-gray-900 mb-4">
                      {formatTime(getWinningTimeSlot()!.startTime)} - {formatTime(getWinningTimeSlot()!.endTime)}
                    </div>
                    <p className="text-gray-600 mb-4">
                      A calendar invitation has been sent to all participants with a {poll.meetingType === 'google-meet' ? 'Google Meet' : poll.meetingType === 'zoom' ? 'Zoom' : 'calendar'} link.
                    </p>
                    <div className="text-sm text-gray-500">
                      <span className="font-medium">{getVoteCount(poll.winningTimeSlotId!)} votes</span> received for this time slot
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {isCancelled && (
              <Card className="mb-8 bg-red-50 border-red-200">
                <CardContent className="py-6">
                  <div className="flex items-center">
                    <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                    <p className="text-red-700">This poll has been cancelled and is no longer accepting votes.</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {isActive && (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Vote for a Time Slot</CardTitle>
                  <CardDescription>
                    Select your preferred meeting time from the options below
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {groupedTimeSlots.map(({ date, slots }, groupIndex) => (
                      <div key={groupIndex} className="border border-gray-200 rounded-md overflow-hidden">
                        <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                          <h3 className="font-medium text-gray-800">
                            {formatDate(date)}
                          </h3>
                        </div>
                        <div className="p-4">
                          <div className="grid gap-3 sm:grid-cols-2">
                            {slots.map((slot) => {
                              const isSelected = selectedTimeSlot === slot.id;
                              const voteCount = getVoteCount(slot.id);
                              
                              return (
                                <button
                                  key={slot.id}
                                  className={`p-4 rounded-md text-left transition-all ${
                                    isSelected 
                                      ? 'bg-blue-100 border-blue-400 border-2' 
                                      : 'bg-white border border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                                  }`}
                                  onClick={() => setSelectedTimeSlot(slot.id)}
                                  disabled={!isActive}
                                >
                                  <div className="font-medium text-gray-800 mb-1">
                                    {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                                  </div>
                                  <div className="flex items-center text-sm text-gray-500">
                                    <span className="font-medium text-blue-600">
                                      {voteCount}
                                    </span>
                                    <span className="ml-1">
                                      {voteCount === 1 ? 'vote' : 'votes'}
                                    </span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar: Your Information */}
          <div>
            {isActive ? (
              <Card className="sticky top-24">
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
                    disabled={!isActive}
                  />
                  <Input
                    label="Email Address"
                    type="email"
                    placeholder="Enter your email"
                    value={voterEmail}
                    onChange={(e) => setVoterEmail(e.target.value)}
                    required
                    disabled={!isActive}
                  />
                  <p className="text-xs text-gray-500">
                    Your email is only used to send you the calendar invitation.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button 
                    fullWidth
                    disabled={!selectedTimeSlot || !isActive || loading}
                    loading={loading}
                    onClick={handleVoteSubmit}
                  >
                    Submit Vote
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Poll {isCompleted ? 'Completed' : 'Cancelled'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    {isCompleted 
                      ? 'This poll has been finalized and a meeting has been scheduled.' 
                      : 'This poll has been cancelled and is no longer accepting votes.'
                    }
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PollDetailsPage;