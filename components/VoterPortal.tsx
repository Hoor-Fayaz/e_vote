'use client';

import React, { useState, useEffect } from 'react';
import { Category, AdminSettings } from '@/types/voting';
import { CheckCircle2, Lock, AlertCircle, ShieldCheck, RefreshCw } from 'lucide-react';

export function VoterPortal() {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<Partial<AdminSettings>>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [ballot, setBallot] = useState<{ [categoryId: string]: string }>({});
  const [voterIdentifier, setVoterIdentifier] = useState('');
  const [voterName, setVoterName] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/categories', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings || {});
        setCategories(data.categories || []);
      }
    } catch (err) {
      setErrorMessage('Unable to load voting ballot. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelect = (categoryId: string, candidateId: string) => {
    setBallot((prev) => ({
      ...prev,
      [categoryId]: candidateId,
    }));
    setErrorMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!voterIdentifier.trim()) {
      setErrorMessage('Please enter your Name or ID/Email before submitting.');
      return;
    }

    // Check if every active category has a selection
    for (const cat of categories) {
      if (!ballot[cat.id]) {
        setErrorMessage(`Please select an option for "${cat.name}".`);
        return;
      }
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voterIdentifier: voterIdentifier.trim(),
          voterName: voterName.trim() || voterIdentifier.trim(),
          ballot,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        setErrorMessage(result.error || 'Failed to submit vote.');
        setSubmitting(false);
        return;
      }

      setIsSuccess(true);
    } catch (err) {
      setErrorMessage('A network error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-slate-500 font-medium">Loading voting ballot...</p>
      </div>
    );
  }

  if (settings.votingStatus && settings.votingStatus !== 'ACTIVE') {
    return (
      <div className="max-w-xl mx-auto my-16 px-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Voting is Currently Closed</h2>
          <p className="text-slate-600 text-sm">
            The administrator has temporarily paused or concluded this voting session.
          </p>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="max-w-lg mx-auto my-16 px-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-10 text-center shadow-sm">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mb-2">Thank You!</h2>
          <p className="text-base text-slate-700 font-medium mb-4">Your vote has been successfully cast.</p>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 text-left mb-6 space-y-2">
            <div className="flex items-center gap-2 text-slate-800 font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Private & Confidential</span>
            </div>
            <p>
              Your selections have been recorded securely. Votes are confidential and only visible to the admin.
            </p>
          </div>

          <button
            onClick={() => {
              setBallot({});
              setVoterIdentifier('');
              setVoterName('');
              setIsSuccess(false);
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Submit Another Vote</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-3">
          <Lock className="w-3.5 h-3.5" />
          <span>Confidential Ballot</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
          {settings.electionTitle || 'Voting Portal'}
        </h1>
        <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
          {settings.electionSubtitle || 'Please select your preferred option for each category below.'}
        </p>
      </div>

      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Categories Loop */}
        {categories.map((category, index) => (
          <div key={category.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">
                  {category.name || `Category ${index + 1}`}
                </h2>
                <span className="text-xs font-semibold text-slate-400">
                  {ballot[category.id] ? (
                    <span className="text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Selected
                    </span>
                  ) : (
                    'Select 1 option'
                  )}
                </span>
              </div>
              {category.description && (
                <p className="text-xs text-slate-500 mt-0.5">{category.description}</p>
              )}
            </div>

            {/* Options list */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {category.candidates.map((option) => {
                const isSelected = ballot[category.id] === option.id;
                return (
                  <button
                    type="button"
                    key={option.id}
                    onClick={() => handleSelect(category.id, option.id)}
                    className={`p-4 rounded-xl text-left border-2 transition-all flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/60 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <span className={`text-sm font-semibold ${isSelected ? 'text-blue-900' : 'text-slate-800'}`}>
                      {option.name}
                    </span>

                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ${
                        isSelected
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Voter Details Box */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Voter Information</h3>
          <p className="text-xs text-slate-500 mb-4">
            Enter your name or ID/email to confirm your vote and prevent duplicate submissions.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Your Name or Voter ID / Email <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. John Doe or voter@example.com"
              value={voterIdentifier}
              onChange={(e) => setVoterIdentifier(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3.5 px-6 rounded-xl text-base font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm hover:shadow transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {submitting ? (
            <span>Submitting vote...</span>
          ) : (
            <span>Submit Vote</span>
          )}
        </button>
      </form>
    </div>
  );
}
