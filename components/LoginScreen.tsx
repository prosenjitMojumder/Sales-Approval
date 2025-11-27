import React, { useState } from 'react';
import { User } from '../types';
import * as StorageService from '../services/storageService';

interface Props {
  onLogin: (user: User) => void;
}

const LoginScreen: React.FC<Props> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate network delay for UX
    setTimeout(() => {
        const users = StorageService.getUsers();
        // Case-insensitive username check, exact password check
        const user = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);

        if (user) {
            onLogin(user);
        } else {
            setError('Invalid username or password');
            setIsLoading(false);
        }
    }, 600);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="bg-slate-900 p-8 text-center">
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
                <i className="fas fa-layer-group mr-2 text-blue-400"></i>
                FlowTrack
            </h1>
            <p className="text-slate-400 mt-2 text-sm">Secure Sales Approval System</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {error && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg flex items-center gap-2 border border-red-100">
                    <i className="fas fa-exclamation-circle"></i>
                    {error}
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-400">
                        <i className="fas fa-user"></i>
                    </span>
                    <input 
                        type="text"
                        required
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        placeholder="Enter your username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-400">
                        <i className="fas fa-lock"></i>
                    </span>
                    <input 
                        type="password"
                        required
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
            </div>

            <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-lg hover:shadow-xl transition-all flex justify-center items-center gap-2"
            >
                {isLoading ? <i className="fas fa-circle-notch fa-spin"></i> : 'Sign In'}
            </button>
            
            <div className="text-center text-xs text-gray-400 mt-4">
                Use <span className="font-mono text-gray-600">admin / password123</span> for initial setup.
            </div>
        </form>
      </div>
    </div>
  );
};

export default LoginScreen;