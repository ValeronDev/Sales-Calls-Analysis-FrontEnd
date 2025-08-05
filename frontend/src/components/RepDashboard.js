import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from './Header';
import ChatBot from './ChatBot';
import { callsAPI } from '../services/api';
import { Calendar, FileText, TrendingUp, MessageSquare, ChevronRight } from 'lucide-react';

const RepDashboard = () => {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCalls();
  }, []);

  const fetchCalls = async () => {
    try {
      const response = await callsAPI.getCalls({ limit: 10 });
      setCalls(response.data);
    } catch (err) {
      setError('Failed to fetch calls');
      console.error('Error fetching calls:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCallScore = (analysis) => {
    const recommendations = analysis?.recommendations?.length || 0;
    const objections = analysis?.key_objections?.length || 0;
    const buyingSignals = analysis?.buying_signals?.length || 0;
    
    // Simple scoring algorithm
    const score = Math.max(10, Math.min(100, 60 + (buyingSignals * 15) - (objections * 10) - (recommendations * 5)));
    return Math.round(score);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Sales Rep Dashboard" />
        <div className="flex items-center justify-center h-64">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Sales Rep Dashboard" />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="stats-card">
            <FileText className="w-8 h-8 mx-auto mb-2" />
            <p className="text-2xl font-bold">{calls.length}</p>
            <p className="text-sm opacity-90">Total Calls</p>
          </div>
          <div className="stats-card">
            <TrendingUp className="w-8 h-8 mx-auto mb-2" />
            <p className="text-2xl font-bold">
              {calls.length > 0 ? Math.round(calls.reduce((sum, call) => sum + getCallScore(call.analysis), 0) / calls.length) : 0}%
            </p>
            <p className="text-sm opacity-90">Avg Score</p>
          </div>
          <div className="stats-card">
            <Calendar className="w-8 h-8 mx-auto mb-2" />
            <p className="text-2xl font-bold">
              {calls.filter(call => {
                const callDate = new Date(call.call_date);
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                return callDate > weekAgo;
              }).length}
            </p>
            <p className="text-sm opacity-90">This Week</p>
          </div>
          <div className="stats-card">
            <MessageSquare className="w-8 h-8 mx-auto mb-2" />
            <p className="text-2xl font-bold">
              {calls.reduce((sum, call) => sum + (call.analysis?.buying_signals?.length || 0), 0)}
            </p>
            <p className="text-sm opacity-90">Buying Signals</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Calls */}
          <div className="lg:col-span-2">
            <div className="card p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Call Analyses</h2>
              
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg mb-4">
                  {error}
                </div>
              )}
              
              {calls.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No call analyses yet</p>
                  <p className="text-sm text-gray-400 mt-2">Your call analyses will appear here once processed</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {calls.map((call) => (
                    <Link
                      key={call.id}
                      to={`/call/${call.id}`}
                      className="call-item block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">{call.call_title}</h3>
                          <p className="text-sm text-gray-600 mb-2">{formatDate(call.call_date)}</p>
                          <p className="text-sm text-gray-700 line-clamp-2">
                            {call.analysis?.summary || 'No summary available'}
                          </p>
                          <div className="flex items-center space-x-4 mt-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Score: {getCallScore(call.analysis)}%
                            </span>
                            {call.analysis?.key_objections?.length > 0 && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                {call.analysis.key_objections.length} Objections
                              </span>
                            )}
                            {call.analysis?.buying_signals?.length > 0 && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {call.analysis.buying_signals.length} Signals
                              </span>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* AI Chatbot */}
          <div className="lg:col-span-1">
            <ChatBot />
          </div>
        </div>
      </main>
    </div>
  );
};

export default RepDashboard;