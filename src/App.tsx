import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleAuthProvider } from './context/AuthContext';
import { PollProvider } from './context/PollContext';
import { CalendarProvider } from './context/CalendarContext';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import CreatePollPage from './pages/CreatePollPage';
import PollDetailsPage from './pages/PollDetailsPage';
import VotePage from './pages/VotePage';
import CalendarPage from './pages/CalendarPage';

function App() {
  return (
    <GoogleAuthProvider>
      <PollProvider>
        <CalendarProvider>
          <Router>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/create-poll" element={<CreatePollPage />} />
              <Route path="/polls/:id" element={<PollDetailsPage />} />
              <Route path="/vote/:id" element={<VotePage />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </CalendarProvider>
      </PollProvider>
    </GoogleAuthProvider>
  );
}

export default App;