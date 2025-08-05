import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, MessageCircle } from 'lucide-react';

const Header = ({ title }) => {
  const { user, logout } = useAuth();

  return (
    <header className="nav-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <MessageCircle className="w-8 h-8 text-blue-600 mr-3" />
            <h1 className="text-xl font-bold text-gray-900">{title}</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <User className="w-5 h-5 text-gray-500" />
              <div className="text-sm">
                <p className="font-medium text-gray-900">{user?.rep_name}</p>
                <p className="text-gray-500 capitalize">{user?.role}</p>
              </div>
            </div>
            
            <button
              onClick={logout}
              className="btn-secondary flex items-center space-x-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;