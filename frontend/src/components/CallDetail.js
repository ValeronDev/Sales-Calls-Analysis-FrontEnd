import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Header from './Header';
import ChatBot from './ChatBot';
import { callsAPI } from '../services/api';
import { 
  ArrowLeft, 
  Calendar, 
  ExternalLink, 
  AlertTriangle, 
  TrendingUp, 
  Lightbulb,
  MessageSquare,
  User,
  FileText
} from 'lucide-react';

const CallDetail = () => {
  const { callId } = useParams();
  const [call, setCall] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCallDetail();
  }, [callId]);

  const fetchCallDetail = async () => {
    try {
      const response = await callsAPI.getCallDetail(callId);
      setCall(response.data);
    } catch (err) {
      setError('Failed to fetch call details');
      console.error('Error fetching call:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
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

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Call Details" />
        <div className="flex items-center justify-center h-64">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  if (error || !call) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Call Details" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="card p-8 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Call Not Found</h2>
            <p className="text-gray-600 mb-4">{error || 'The requested call could not be found.'}</p>
            <Link to="/dashboard" className="btn-primary">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const analysis = call.analysis || {};
  const callScore = getCallScore(analysis);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Call Details" />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            to="/dashboard" 
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Dashboard
          </Link>
          
          <div className="card p-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{call.call_title}</h1>
                <div className="flex flex-wrap items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center">
                    <User className="w-4 h-4 mr-1" />
                    {call.rep_name}
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {formatDate(call.call_date)}
                  </div>
                  {call.transcript_url && (
                    <a 
                      href={call.transcript_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-blue-600 hover:text-blue-800"
                    >
                      <ExternalLink className="w-4 h-4 mr-1" />
                      View Transcript
                    </a>
                  )}
                </div>
              </div>
              
              <div className="mt-4 lg:mt-0">
                <div className={`inline-flex items-center px-4 py-2 rounded-full font-semibold ${getScoreColor(callScore)}`}>
                  Call Score: {callScore}%
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Call Summary */}
            <div className="card p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Call Summary
              </h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed">
                  {analysis.summary || 'No summary available for this call.'}
                </p>
              </div>
            </div>

            {/* Key Objections */}
            <div className="card p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2" />
                Key Objections Raised
              </h2>
              {analysis.key_objections && analysis.key_objections.length > 0 ? (
                <div className="space-y-3">
                  {analysis.key_objections.map((objection, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <div className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
                        {index + 1}
                      </div>
                      <p className="text-gray-800">{objection}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">No objections were identified in this call.</p>
              )}
            </div>

            {/* Buying Signals */}
            <div className="card p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                Buying Signals
              </h2>
              {analysis.buying_signals && analysis.buying_signals.length > 0 ? (
                <div className="space-y-3">
                  {analysis.buying_signals.map((signal, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
                        ✓
                      </div>
                      <p className="text-gray-800">{signal}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">No buying signals were identified in this call.</p>
              )}
            </div>

            {/* Recommendations */}
            <div className="card p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <Lightbulb className="w-5 h-5 mr-2" />
                Recommended Improvements
              </h2>
              {analysis.recommendations && analysis.recommendations.length > 0 ? (
                <div className="space-y-3">
                  {analysis.recommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
                        {index + 1}
                      </div>
                      <p className="text-gray-800">{recommendation}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">No specific recommendations were provided for this call.</p>
              )}
            </div>

            {/* Overall Feedback */}
            {analysis.overall_feedback && (
              <div className="card p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Overall Feedback
                </h2>
                <div className="p-4 bg-gray-50 border-l-4 border-blue-500 rounded-r-lg">
                  <p className="text-gray-800 italic">"{analysis.overall_feedback}"</p>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <ChatBot callId={callId} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CallDetail;