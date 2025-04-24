import React, { createContext, useContext, useState, useEffect } from 'react';
import { Poll, TimeSlot, Vote } from '../types';
import { useAuth } from './AuthContext';

interface PollContextType {
  polls: Poll[];
  activePoll: Poll | null;
  loading: boolean;
  error: string | null;
  createPoll: (title: string, description: string, timeSlots: TimeSlot[], meetingType: 'google-meet' | 'zoom' | 'other') => Promise<Poll>;
  getPoll: (id: string) => Poll | undefined;
  submitVote: (pollId: string, timeSlotId: string, userName: string, userEmail: string) => Promise<void>;
  finalizePoll: (pollId: string) => Promise<void>;
  cancelPoll: (pollId: string) => Promise<void>;
}

const PollContext = createContext<PollContextType | undefined>(undefined);

export const usePoll = () => {
  const context = useContext(PollContext);
  if (context === undefined) {
    throw new Error('usePoll must be used within a PollProvider');
  }
  return context;
};

// Helper to generate a simple ID
const generateId = () => `id-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

export const PollProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [activePoll, setActivePoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    // Load polls from local storage (in a real app, this would fetch from an API)
    const loadPolls = () => {
      const savedPolls = localStorage.getItem('meetpoll_polls');
      if (savedPolls) {
        try {
          const parsedPolls = JSON.parse(savedPolls);
          // Convert string dates back to Date objects
          const processedPolls = parsedPolls.map((poll: any) => ({
            ...poll,
            created: new Date(poll.created),
            expiresAt: new Date(poll.expiresAt),
            timeSlots: poll.timeSlots.map((slot: any) => ({
              ...slot,
              startTime: new Date(slot.startTime),
              endTime: new Date(slot.endTime)
            })),
            votes: poll.votes.map((vote: any) => ({
              ...vote,
              createdAt: new Date(vote.createdAt)
            }))
          }));
          setPolls(processedPolls);
        } catch (e) {
          console.error('Failed to parse saved polls', e);
          setPolls([]);
        }
      }
    };

    loadPolls();
  }, []);

  // Save polls to localStorage whenever they change
  useEffect(() => {
    if (polls.length > 0) {
      localStorage.setItem('meetpoll_polls', JSON.stringify(polls));
    }
  }, [polls]);

  const createPoll = async (
    title: string, 
    description: string, 
    timeSlots: TimeSlot[], 
    meetingType: 'google-meet' | 'zoom' | 'other'
  ): Promise<Poll> => {
    setLoading(true);
    try {
      if (!user) {
        throw new Error('User must be logged in to create a poll');
      }

      const now = new Date();
      // Set expiration to 7 days from now
      const expiresAt = new Date(now);
      expiresAt.setDate(expiresAt.getDate() + 7);

      const newPoll: Poll = {
        id: generateId(),
        title,
        description,
        createdBy: user,
        timeSlots,
        votes: [],
        expiresAt,
        created: now,
        meetingType,
        status: 'active'
      };

      setPolls(prevPolls => [...prevPolls, newPoll]);
      return newPoll;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create poll';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const getPoll = (id: string): Poll | undefined => {
    return polls.find(poll => poll.id === id);
  };

  const submitVote = async (pollId: string, timeSlotId: string, userName: string, userEmail: string): Promise<void> => {
    setLoading(true);
    try {
      const pollIndex = polls.findIndex(p => p.id === pollId);
      if (pollIndex === -1) {
        throw new Error('Poll not found');
      }

      const poll = polls[pollIndex];
      if (poll.status !== 'active') {
        throw new Error('Cannot vote on a non-active poll');
      }

      // Check if the time slot exists
      const timeSlotExists = poll.timeSlots.some(ts => ts.id === timeSlotId);
      if (!timeSlotExists) {
        throw new Error('Invalid time slot');
      }

      // Create the vote
      const newVote: Vote = {
        userId: generateId(), // Generate a temporary ID for anonymous votes
        userName,
        userEmail,
        timeSlotId,
        createdAt: new Date()
      };

      // Add the vote to the poll
      const updatedPoll = {
        ...poll,
        votes: [...poll.votes, newVote]
      };

      // Update the polls array
      const updatedPolls = [...polls];
      updatedPolls[pollIndex] = updatedPoll;
      setPolls(updatedPolls);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to submit vote';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const finalizePoll = async (pollId: string): Promise<void> => {
    setLoading(true);
    try {
      const pollIndex = polls.findIndex(p => p.id === pollId);
      if (pollIndex === -1) {
        throw new Error('Poll not found');
      }

      const poll = polls[pollIndex];
      if (poll.status !== 'active') {
        throw new Error('Cannot finalize a non-active poll');
      }

      // Count votes for each time slot
      const voteCount: Record<string, number> = {};
      poll.timeSlots.forEach(slot => {
        voteCount[slot.id] = 0;
      });

      poll.votes.forEach(vote => {
        voteCount[vote.timeSlotId] = (voteCount[vote.timeSlotId] || 0) + 1;
      });

      // Find the time slot with the most votes
      let maxVotes = 0;
      let winningTimeSlotId = '';
      Object.entries(voteCount).forEach(([timeSlotId, count]) => {
        if (count > maxVotes) {
          maxVotes = count;
          winningTimeSlotId = timeSlotId;
        }
      });

      // Update the poll
      const updatedPoll: Poll = {
        ...poll,
        status: 'completed',
        winningTimeSlotId
      };

      // Update the polls array
      const updatedPolls = [...polls];
      updatedPolls[pollIndex] = updatedPoll;
      setPolls(updatedPolls);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to finalize poll';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const cancelPoll = async (pollId: string): Promise<void> => {
    setLoading(true);
    try {
      const pollIndex = polls.findIndex(p => p.id === pollId);
      if (pollIndex === -1) {
        throw new Error('Poll not found');
      }

      // Update the poll status
      const updatedPoll: Poll = {
        ...polls[pollIndex],
        status: 'cancelled'
      };

      // Update the polls array
      const updatedPolls = [...polls];
      updatedPolls[pollIndex] = updatedPoll;
      setPolls(updatedPolls);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to cancel poll';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PollContext.Provider value={{ 
      polls, 
      activePoll, 
      loading, 
      error, 
      createPoll, 
      getPoll, 
      submitVote, 
      finalizePoll, 
      cancelPoll 
    }}>
      {children}
    </PollContext.Provider>
  );
};