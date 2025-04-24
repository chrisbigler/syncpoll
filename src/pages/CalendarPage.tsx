import React from 'react';
import Layout from '../components/layout/Layout';
import AvailabilityView from '../components/calendar/AvailabilityView';

const CalendarPage: React.FC = () => {
  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Calendar Availability</h1>
        <AvailabilityView />
      </div>
    </Layout>
  );
};

export default CalendarPage;