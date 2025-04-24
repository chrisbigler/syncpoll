import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, Plus, CheckCircle, AlertCircle, Clock, CalendarDays } from 'lucide-react';
import Layout from '../components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { useAuth } from '../context/AuthContext';
import { usePoll } from '../context/PollContext';
import { useCalendar } from '../context/CalendarContext';
import { Poll } from '../types';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const { polls, loading: pollsLoading, error } = usePoll();
  const { connected, connectCalendar } = useCalendar();
  const [activePolls, setActivePolls] = React.useState<Poll[]>([]);
  const [completedPolls, setCompletedPolls] = React.useState<Poll[]>([]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/', { replace: true });
      return;
    }
  }, [isAuthenticated, authLoading, navigate]);

  useEffect(() => {
    if (polls.length > 0) {
      const active = polls.filter(poll => poll.status === 'active');
      const completed = polls.filter(poll => poll.status === 'completed' || poll.status === 'cancelled');
      
      setActivePolls(active);
      setCompletedPolls(completed);
    }
  }, [polls]);

  // Format date for display
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(new Date(date));
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="primary">Active</Badge>;
      case 'completed':
        return <Badge variant="success">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="danger">Cancelled</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  // Get vote count for a poll
  const getVoteCount = (poll: Poll) => {
    const voters = new Set();
    poll.votes.forEach(vote => {
      voters.add(vote.userEmail);
    });
    return voters.size;
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.name}</h1>
          <p className="mt-1 text-lg text-gray-500">
            Manage your meetings and polls from one place
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">Create a Meeting Poll</h2>
                  <p className="text-gray-600 mb-4">
                    Set up a new poll to find the best meeting time for everyone
                  </p>
                  <Link to="/create-poll">
                    <Button>
                      <Plus className="h-5 w-5 mr-2" />
                      New Poll
                    </Button>
                  </Link>
                </div>
                <Calendar className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">View Calendar</h2>
                  <p className="text-gray-600 mb-4">
                    Check your availability and scheduled meetings
                  </p>
                  {connected ? (
                    <Link to="/calendar">
                      <Button>
                        <CalendarDays className="h-5 w-5 mr-2" />
                        View Calendar
                      </Button>
                    </Link>
                  ) : (
                    <Button onClick={() => connectCalendar()}>
                      <CalendarDays className="h-5 w-5 mr-2" />
                      Connect Calendar
                    </Button>
                  )}
                </div>
                <CalendarDays className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {pollsLoading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your polls...</p>
          </div>
        ) : error ? (
          <Card className="bg-red-50 border-red-200">
            <CardContent className="py-6">
              <div className="flex items-center text-red-700">
                <AlertCircle className="h-5 w-5 mr-2" />
                <p>There was an error loading your polls. Please try again later.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-10">
            {/* Active Polls Section */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Clock className="h-5 w-5 text-blue-500 mr-2" />
                Active Polls
              </h2>
              
              {activePolls.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-gray-700 mb-1">No active polls</h3>
                    <p className="text-gray-500 mb-6">
                      You don't have any active polls at the moment.
                    </p>
                    <Link to="/create-poll">
                      <Button>
                        <Plus className="h-5 w-5 mr-2" />
                        Create Your First Poll
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {activePolls.map((poll) => (
                    <Card key={poll.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">{poll.title}</CardTitle>
                          {getStatusBadge(poll.status)}
                        </div>
                        <CardDescription>
                          Created {formatDate(poll.created)}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Time slots:</span>
                            <span className="font-medium">{poll.timeSlots.length}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Participants:</span>
                            <span className="font-medium">{getVoteCount(poll)}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Expires:</span>
                            <span className="font-medium">{formatDate(poll.expiresAt)}</span>
                          </div>
                          <div className="pt-4">
                            <Link to={`/polls/${poll.id}`}>
                              <Button variant="outline" fullWidth>
                                View Details
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </section>

            {/* Completed Polls Section */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                Completed Polls
              </h2>
              
              {completedPolls.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <p className="text-gray-500">
                      No completed polls yet. Polls will appear here once they are finalized.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Poll
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Participants
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {completedPolls.map((poll) => (
                        <tr key={poll.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{poll.title}</div>
                            <div className="text-sm text-gray-500">{poll.description.substring(0, 50)}{poll.description.length > 50 ? '...' : ''}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(poll.status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(poll.created)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {getVoteCount(poll)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <Link to={`/polls/${poll.id}`} className="text-blue-600 hover:text-blue-900">
                              View Details
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default DashboardPage;