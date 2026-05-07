import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// ⚠️ PAALALA: Kung ang folder mo ay "contexts" (may 's'), gawin itong '../contexts/AuthContext'
import { useAuth } from '../contexts/AuthContext'; 

export default function Login() {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!loginId || !password) {
      setError('Please fill in all fields.');
      setIsLoading(false);
      return;
    }

    try {
      // Tinatawag nito ang login function mula sa AuthContext mo
      const success = await login(loginId, password);

      if (success) {
        navigate('/dashboard'); // Pupunta sa dashboard kapag tama ang login
      } else {
        setError('Invalid username/email or password.');
      }
    } catch (err) {
      setError('Something went wrong connecting to the server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 space-y-6 border border-gray-200">
        
        {/* Header Section */}
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Welcome Back</h2>
          <p className="text-gray-500 text-sm">Sign in to your account to continue</p>
        </div>

        {/* Error Message Alert */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
            <p className="text-sm text-red-700 font-medium">{error}</p>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          {/* Username / Email Field */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Username or Email</label>
            <input
              type="text"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all text-gray-900"
              placeholder="Enter your email or username"
              disabled={isLoading}
            />
          </div>

          {/* Password Field */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all text-gray-900"
              placeholder="••••••••"
              disabled={isLoading}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

      </div>
    </div>
  );
}