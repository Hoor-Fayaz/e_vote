'use client';

import React, { useState, useEffect } from 'react';
import { AdminDashboard } from '@/components/AdminDashboard';
import { Lock, ArrowRight, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const verifySession = async () => {
      try {
        const res = await fetch('/api/admin/stats');
        if (res.ok) {
          setIsAuthenticated(true);
        }
      } catch (err) {
      } finally {
        setCheckingAuth(false);
      }
    };
    verifySession();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!pin.trim()) {
      setError('Please enter the admin PIN.');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pin.trim() }),
      });

      if (res.ok) {
        setIsAuthenticated(true);
      } else {
        setError('Incorrect PIN. (Default: admin123 or admin2026)');
      }
    } catch (err) {
      setError('Connection failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/login', { method: 'DELETE' });
    } catch (err) {}
    setIsAuthenticated(false);
    setPin('');
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50">
        <AdminDashboard onLogout={handleLogout} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center py-12 px-4 bg-slate-50">
      <div className="max-w-md w-full mb-4">
        <Link
          href="/"
          className="text-xs text-slate-500 hover:text-blue-600 font-medium transition-colors"
        >
          ← Back to Voting Ballot
        </Link>
      </div>

      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Admin Login</h1>
          <p className="text-xs text-slate-500 mt-1">
            Enter PIN to view live results and manage voting options
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Admin Password / PIN
            </label>
            <input
              type="password"
              required
              autoFocus
              placeholder="e.g. admin123"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
          >
            <span>Login to Admin Panel</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="text-center text-[11px] text-slate-400 mt-4">
          Contact your administrator if you have forgotten your PIN.
        </p>
      </div>
    </div>
  );
}
