import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from './Header';
import { callsAPI, dashboardAPI } from '../services/api';
import { BarChart, Users, TrendingDown, Download, Filter, Calendar, FileText, AlertTriangle } from 'lucide-react';

const ManagerDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [calls, setCalls] = useState([]);
  const [reps, setReps] = useState([]);
  const [selectedRep, setSelectedRep] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedRep) {
      fetchCalls(selectedRep);
    } else {
      fetchCalls();
    }
  }, [selectedRep]);

  const fetchData = async () => {
    try {
      const [analyticsRes, repsRes, callsRes] = await Promise.all([
        dashboardAPI.getManagerAnalytics(),
        dashboardAPI.getReps(),
        callsAPI.getCalls({ limit: 20 })
      ]);
      
      setAnalytics(analyticsRes.data);
      setReps(repsRes.data);
      setCalls(callsRes.data);
    } catch (err) {
      setError('Failed to fetch dashboard data');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCalls = async (repId = null) => {
    try {
      const params = { limit: 20 };
      if (repId) params.rep_id = repId;
      
      const response = await callsAPI.getCalls(params);
      setCalls(response.data);
    } catch (err) {
      console.error('Error fetching calls:', err);
    }
  };

  const exportReport = () => {
    const data = {
      analytics,
      calls: calls.slice(0, 10), // Limit for demo
      generated_at: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
    
    const score = Math.max(10, Math.min(100, 60 + (buyingSignals * 15) - (objections * 10) - (recommendations * 5)));
    return Math.round(score);
  };

  const getRepPerformance = () => {
    const repPerformance = {};
    calls.forEach(call => {
      if (!repPerformance[call.rep_name]) {
        repPerformance[call.rep_name] = {
          calls: 0,
          totalScore: 0,
          objections: 0,
          signals: 0
        };
      }
      
      repPerformance[call.rep_name].calls++;
      repPerformance[call.rep_name].totalScore += getCallScore(call.analysis);
      repPerformance[call.rep_name].objections += call.analysis?.key_objections?.length || 0;
      repPerformance[call.rep_name].signals += call.analysis?.buying_signals?.length || 0;
    });

    return Object.entries(repPerformance).map(([name, data]) => ({
      name,
      avgScore: Math.round(data.totalScore / data.calls),
      calls: data.calls,
      objections: data.objections,
      signals: data.signals
    })).sort((a, b) => b.avgScore - a.avgScore);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Manager Dashboard" />
        <div className="flex items-center justify-center h-64">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  const repPerformance = getRepPerformance();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Manager Dashboard" />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="stats-card">
            <FileText className="w-8 h-8 mx-auto mb-2" />
            <p className="text-2xl font-bold">{analytics?.total_calls || 0}</p>
            <p className="text-sm opacity-90">Total Calls</p>
          </div>
          <div className="stats-card">
            <Users className="w-8 h-8 mx-auto mb-2" />
            <p className="text-2xl font-bold">{analytics?.total_reps || 0}</p>
            <p className="text-sm opacity-90">Sales Reps</p>
          </div>
          <div className="stats-card">
            <Calendar className="w-8 h-8 mx-auto mb-2" />
            <p className="text-2xl font-bold">{analytics?.recent_calls || 0}</p>
            <p className="text-sm opacity-90">This Week</p>
          </div>
          <div className="stats-card">
            <TrendingDown className="w-8 h-8 mx-auto mb-2" />
            <p className="text-2xl font-bold">{analytics?.common_objections?.length || 0}</p>
            <p className="text-sm opacity-90">Common Objections</p>
          </div>
        </div>

        {/* Filters and Export */}
        <div className="card p-6 mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center space-x-4">
              <Filter className="w-5 h-5 text-gray-500" />
              <select
                value={selectedRep}
                onChange={(e) => setSelectedRep(e.target.value)}
                className="input-field max-w-xs"
              >
                <option value="">All Sales Reps</option>
                {reps.map((rep) => (
                  <option key={rep.id} value={rep.id}>
                    {rep.rep_name}
                  </option>
                ))}
              </select>
            </div>
            
            <button
              onClick={exportReport}
              className="btn-primary flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Export Report</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Rep Performance */}
          <div className="card p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <BarChart className="w-5 h-5 mr-2" />
              Rep Performance
            </h2>
            
            <div className="space-y-4">
              {repPerformance.map((rep, index) => (
                <div key={rep.name} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                      index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-500' : 'bg-blue-500'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{rep.name}</p>
                      <p className="text-sm text-gray-500">{rep.calls} calls</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-gray-900">{rep.avgScore}%</p>
                    <p className="text-xs text-gray-500">{rep.signals} signals, {rep.objections} objections</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Common Objections */}
          <div className="card p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Common Objections
            </h2>
            
            <div className="space-y-3">
              {analytics?.common_objections?.slice(0, 5).map((objection, index) => (
                <div key={index} className="flex items-center justify-between">
                  <p className="text-gray-800 flex-1">{objection.objection}</p>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-red-500 h-2 rounded-full" 
                        style={{ width: `${Math.min(100, (objection.count / Math.max(...analytics.common_objections.map(o => o.count))) * 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-semibold text-gray-600 w-8">{objection.count}</span>
                  </div>
                </div>
              )) || (
                <p className="text-gray-500 text-center py-4">No objection data available</p>
              )}
            </div>
          </div>
        </div>

        {/* Recent Team Calls */}
        <div className="card p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Recent Team Calls {selectedRep && `- ${reps.find(r => r.id === selectedRep)?.rep_name}`}
          </h2>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg mb-4">
              {error}
            </div>
          )}
          
          {calls.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No calls found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {calls.slice(0, 10).map((call) => (
                <Link
                  key={call.id}
                  to={`/call/${call.id}`}
                  className="call-item block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-1">
                        <h3 className="font-semibold text-gray-900">{call.call_title}</h3>
                        <span className="text-sm text-blue-600 font-medium">{call.rep_name}</span>
                      </div>
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
                            {call.analysis.buying_signals.length} Buying Signals
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ManagerDashboard;