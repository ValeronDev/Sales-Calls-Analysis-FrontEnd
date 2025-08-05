import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import RepDashboard from './components/RepDashboard';
import ManagerDashboard from './components/ManagerDashboard';
import CallDetail from './components/CallDetail';
import { AuthProvider, useAuth } from './context/AuthContext';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <AppRoutes />
        </div>
      </Router>
    </AuthProvider>
  );
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route 
        path="/login" 
        element={user ? <Navigate to="/dashboard" /> : <LoginPage />} 
      />
      <Route 
        path="/dashboard" 
        element={
          user ? (
            user.role === 'manager' ? <ManagerDashboard /> : <RepDashboard />
          ) : (
            <Navigate to="/login" />
          )
        } 
      />
      <Route 
        path="/call/:callId" 
        element={user ? <CallDetail /> : <Navigate to="/login" />} 
      />
      <Route 
        path="/" 
        element={<Navigate to="/dashboard" />} 
      />
    </Routes>
  );
}

export default App;