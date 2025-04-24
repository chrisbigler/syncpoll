import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Check, Clock, Users, ArrowRight } from 'lucide-react';
import Button from '../components/ui/Button';
import Layout from '../components/layout/Layout';
import { useAuth } from '../context/AuthContext';

const HomePage: React.FC = () => {
  const { isAuthenticated, login } = useAuth();

  return (
    <Layout>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="md:flex md:items-center md:space-x-12">
            <div className="md:w-1/2 mb-10 md:mb-0">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
                Schedule meetings with consensus, not conflicts
              </h1>
              <p className="text-xl md:text-2xl text-blue-100 mb-8">
                Create polls of available times, let participants vote, and automatically schedule the most popular option with calendar integration.
              </p>
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                {isAuthenticated ? (
                  <Link to="/create-poll">
                    <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50">
                      Create Your First Poll
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                ) : (
                  <Button 
                    size="lg" 
                    className="bg-white text-blue-700 hover:bg-blue-50"
                    onClick={login}
                  >
                    Sign in with Google
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                )}
                <Link to="/how-it-works">
                  <Button size="lg" variant="ghost" className="text-white hover:bg-blue-700 border border-white">
                    Learn How It Works
                  </Button>
                </Link>
              </div>
            </div>
            <div className="md:w-1/2 relative">
              <div className="bg-white rounded-lg shadow-xl p-6 text-gray-800 transform rotate-1 transition-transform hover:rotate-0 duration-500">
                <div className="flex items-center mb-4">
                  <Calendar className="h-6 w-6 text-blue-600 mr-2" />
                  <h3 className="font-bold text-lg">Team Planning Poll</h3>
                </div>
                <p className="text-gray-600 mb-4">Please vote for the times you're available:</p>
                <div className="space-y-3">
                  {['Monday, 2pm-3pm', 'Tuesday, 10am-11am', 'Wednesday, 4pm-5pm'].map((time, i) => (
                    <div 
                      key={i} 
                      className="flex items-center p-3 rounded-md border border-gray-200 bg-gray-50"
                    >
                      <Check className={`h-5 w-5 ${i < 2 ? 'text-green-500' : 'text-gray-300'}`} />
                      <span className="ml-2">{time}</span>
                      <span className="ml-auto text-sm text-gray-500">
                        {i === 0 ? '6 votes' : i === 1 ? '4 votes' : '2 votes'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              How MeetPoll Works
            </h2>
            <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
              Simplify your meeting scheduling process in three easy steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 text-center transition-transform hover:translate-y-[-8px] duration-300">
              <div className="inline-flex items-center justify-center h-16 w-16 bg-blue-100 text-blue-600 rounded-full mb-4">
                <Calendar className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Create a Poll</h3>
              <p className="text-gray-600">
                Select multiple available time slots from your connected calendar to create a meeting poll.
              </p>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 text-center transition-transform hover:translate-y-[-8px] duration-300">
              <div className="inline-flex items-center justify-center h-16 w-16 bg-purple-100 text-purple-600 rounded-full mb-4">
                <Users className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Collect Votes</h3>
              <p className="text-gray-600">
                Share the poll with participants who vote on which time slots work best for them.
              </p>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 text-center transition-transform hover:translate-y-[-8px] duration-300">
              <div className="inline-flex items-center justify-center h-16 w-16 bg-teal-100 text-teal-600 rounded-full mb-4">
                <Clock className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Schedule Automatically</h3>
              <p className="text-gray-600">
                MeetPoll selects the time with the most votes and automatically schedules the meeting.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl shadow-xl overflow-hidden">
            <div className="px-6 py-12 sm:px-12 sm:py-16 lg:flex lg:items-center lg:justify-between">
              <div>
                <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
                  Ready to simplify your scheduling?
                </h2>
                <p className="mt-4 text-lg text-indigo-100">
                  Create your first meeting poll in minutes and say goodbye to endless email chains.
                </p>
              </div>
              <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
                {isAuthenticated ? (
                  <Link to="/create-poll">
                    <Button size="lg" className="bg-white text-indigo-600 hover:bg-indigo-50">
                      Create a Poll Now
                    </Button>
                  </Link>
                ) : (
                  <Button 
                    size="lg" 
                    className="bg-white text-indigo-600 hover:bg-indigo-50"
                    onClick={login}
                  >
                    Get Started for Free
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default HomePage;