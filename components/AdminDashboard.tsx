'use client';

import React, { useState, useEffect } from 'react';
import { AdminDashboardData, Category, Candidate } from '@/types/voting';
import {
  ShieldCheck,
  LogOut,
  BarChart2,
  Plus,
  Trash2,
  RefreshCw,
  Download,
  CheckCircle2,
  Play,
  Pause,
  Sliders,
  Users,
  Trophy,
} from 'lucide-react';

export function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'RESULTS' | 'MANAGE' | 'LOGS'>('RESULTS');
  const [refreshing, setRefreshing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Quick inputs for adding categories & options
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newOptionNames, setNewOptionNames] = useState<{ [catId: string]: string }>({});

  const fetchStats = async () => {
    try {
      setRefreshing(true);
      const res = await fetch('/api/admin/stats');
      if (res.status === 401) {
        onLogout();
        return;
      }
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const timer = setInterval(fetchStats, 5000);
    return () => clearInterval(timer);
  }, []);

  const notify = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleToggleStatus = async (status: 'ACTIVE' | 'PAUSED') => {
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ votingStatus: status }),
      });
      if (res.ok) {
        notify(`Voting is now ${status === 'ACTIVE' ? 'OPEN' : 'PAUSED'}`);
        fetchStats();
      }
    } catch (err) {
      notify('Failed to update status');
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName.trim() }),
      });
      if (res.ok) {
        setNewCategoryName('');
        notify('Category added successfully');
        fetchStats();
      }
    } catch (err) {
      notify('Failed to add category');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category and its votes?')) return;
    try {
      const res = await fetch(`/api/admin/categories?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        notify('Category deleted');
        fetchStats();
      }
    } catch (err) {
      notify('Failed to delete category');
    }
  };

  const handleAddOption = async (categoryId: string) => {
    const name = (newOptionNames[categoryId] || '').trim();
    if (!name) return;

    try {
      const res = await fetch('/api/admin/candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId,
          candidate: { name },
        }),
      });
      if (res.ok) {
        setNewOptionNames((prev) => ({ ...prev, [categoryId]: '' }));
        notify('Option added');
        fetchStats();
      }
    } catch (err) {
      notify('Failed to add option');
    }
  };

  const handleDeleteOption = async (categoryId: string, candidateId: string) => {
    if (!confirm('Delete this option?')) return;
    try {
      const res = await fetch(`/api/admin/candidates?categoryId=${categoryId}&candidateId=${candidateId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        notify('Option removed');
        fetchStats();
      }
    } catch (err) {
      notify('Failed to delete option');
    }
  };

  const handleResetVotes = async () => {
    if (!confirm('Warning: This will clear all recorded votes and set tallies to 0. Continue?')) return;
    try {
      const res = await fetch('/api/admin/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'RESET_VOTES' }),
      });
      if (res.ok) {
        notify('All votes reset to zero.');
        fetchStats();
      }
    } catch (err) {
      notify('Failed to reset votes');
    }
  };

  if (loading && !data) {
    return (
      <div className="py-24 text-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-slate-500 font-medium">Loading admin panel...</p>
      </div>
    );
  }

  const isLive = data?.settings?.votingStatus === 'ACTIVE';

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Top Admin Navigation & Status */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">Admin Panel</h1>
              <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full font-medium">
                Admin-Only View
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Live vote results and categories management
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Status Button */}
            <button
              onClick={() => handleToggleStatus(isLive ? 'PAUSED' : 'ACTIVE')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                isLive
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                  : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
              }`}
            >
              {isLive ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5 fill-current" />}
              <span>Voting: {isLive ? 'OPEN' : 'PAUSED'}</span>
            </button>

            {/* Refresh */}
            <button
              onClick={fetchStats}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
            </button>

            {/* Export CSV */}
            <a
              href="/api/admin/actions?format=csv"
              className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </a>

            {/* Logout */}
            <button
              onClick={onLogout}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Exit</span>
            </button>
          </div>
        </div>

        {/* Stats Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6 pt-5 border-t border-slate-100">
          <div>
            <span className="text-xs text-slate-500 block">Total Voters</span>
            <span className="text-2xl font-bold text-slate-900">{data?.totalBallotsCast || 0}</span>
          </div>
          <div>
            <span className="text-xs text-slate-500 block">Categories</span>
            <span className="text-2xl font-bold text-slate-900">{data?.categories?.length || 0}</span>
          </div>
          <div>
            <span className="text-xs text-slate-500 block">Total Votes Recorded</span>
            <span className="text-2xl font-bold text-blue-600">{data?.totalVotesCount || 0}</span>
          </div>
        </div>
      </div>

      {statusMessage && (
        <div className="mb-6 p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-blue-600" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 mb-6 pb-2">
        <button
          onClick={() => setActiveTab('RESULTS')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${
            activeTab === 'RESULTS'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          <span>Live Results</span>
        </button>

        <button
          onClick={() => setActiveTab('MANAGE')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${
            activeTab === 'MANAGE'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Manage Categories & Options</span>
        </button>

        <button
          onClick={() => setActiveTab('LOGS')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${
            activeTab === 'LOGS'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Voter Logs</span>
        </button>
      </div>

      {/* TAB 1: LIVE RESULTS */}
      {activeTab === 'RESULTS' && (
        <div className="space-y-6">
          {data?.categoryStats.map((category, idx) => (
            <div key={category.categoryId} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                <div>
                  <span className="text-xs text-blue-600 font-semibold uppercase tracking-wider block">
                    Category {idx + 1}
                  </span>
                  <h2 className="text-lg font-bold text-slate-900">{category.categoryName}</h2>
                </div>
                <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-3 py-1 rounded-full">
                  {category.totalVotes} Total Votes
                </span>
              </div>

              {/* Options Breakdown */}
              <div className="space-y-3">
                {category.candidates.length === 0 ? (
                  <p className="text-xs text-slate-400 py-2">No options added yet.</p>
                ) : (
                  category.candidates.map((option) => (
                    <div key={option.candidateId} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-800">{option.name}</span>
                          {option.isLeader && category.totalVotes > 0 && (
                            <span className="inline-flex items-center gap-1 text-[11px] bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded-full">
                              <Trophy className="w-3 h-3" /> Leading
                            </span>
                          )}
                        </div>

                        <div className="text-right text-xs">
                          <span className="font-bold text-slate-900">{option.votesCount}</span>
                          <span className="text-slate-500 ml-1">votes</span>
                          <span className="text-slate-400 font-medium ml-2">({option.percentage}%)</span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            option.isLeader && category.totalVotes > 0 ? 'bg-amber-500' : 'bg-blue-600'
                          }`}
                          style={{ width: `${Math.max(option.percentage, category.totalVotes > 0 ? 2 : 0)}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: MANAGE CATEGORIES & OPTIONS */}
      {activeTab === 'MANAGE' && (
        <div className="space-y-6">
          {/* Add Category Form */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Add New Category</h3>
            <form onSubmit={handleAddCategory} className="flex gap-3">
              <input
                type="text"
                required
                placeholder="e.g. Category 3: Secretary or Project of the Year"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="flex-1 px-4 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-blue-600"
              />
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add Category</span>
              </button>
            </form>
          </div>

          {/* List of Categories & their Options */}
          {data?.categories.map((category) => (
            <div key={category.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <h3 className="text-base font-bold text-slate-900">{category.name}</h3>
                <button
                  onClick={() => handleDeleteCategory(category.id)}
                  className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1 font-semibold"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Category</span>
                </button>
              </div>

              {/* Options in this category */}
              <div className="space-y-2 mb-4">
                <span className="text-xs font-semibold text-slate-500 block">Options / Candidates:</span>
                {category.candidates.map((option) => (
                  <div
                    key={option.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                  >
                    <span className="font-semibold text-slate-800 text-sm">{option.name}</span>
                    <button
                      onClick={() => handleDeleteOption(category.id, option.id)}
                      className="text-slate-400 hover:text-red-600 p-1"
                      title="Remove option"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Option Input */}
              <div className="flex gap-2 pt-2">
                <input
                  type="text"
                  placeholder="Enter new candidate / option name..."
                  value={newOptionNames[category.id] || ''}
                  onChange={(e) =>
                    setNewOptionNames((prev) => ({ ...prev, [category.id]: e.target.value }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddOption(category.id);
                    }
                  }}
                  className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-blue-600"
                />
                <button
                  type="button"
                  onClick={() => handleAddOption(category.id)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl"
                >
                  Add Option
                </button>
              </div>
            </div>
          ))}

          {/* Reset Votes Danger Area */}
          <div className="bg-red-50 rounded-2xl border border-red-200 p-6">
            <h3 className="text-sm font-bold text-red-900 mb-1">Reset All Votes</h3>
            <p className="text-xs text-red-700 mb-4">
              Clear all submitted votes and start a fresh voting round. Categories and options will remain.
            </p>
            <button
              onClick={handleResetVotes}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-colors"
            >
              Reset Votes to Zero
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: VOTER LOGS */}
      {activeTab === 'LOGS' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Voter Submission Records</h3>
            <p className="text-xs text-slate-500">Record of all cast ballots with timestamp</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold">
                  <th className="p-3.5">Voter Name / ID</th>
                  <th className="p-3.5">Selections</th>
                  <th className="p-3.5 text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data?.recentVotes.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-slate-400">
                      No votes cast yet.
                    </td>
                  </tr>
                ) : (
                  data?.recentVotes.map((vote, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="p-3.5 font-semibold text-slate-800">{vote.voterIdentifierMasked}</td>
                      <td className="p-3.5">
                        <div className="flex flex-wrap gap-1.5">
                          {vote.categorySelections.map((sel, sIdx) => (
                            <span
                              key={sIdx}
                              className="px-2 py-0.5 bg-blue-50 border border-blue-200 text-blue-800 rounded text-[11px]"
                            >
                              <strong>{sel.categoryName}:</strong> {sel.candidateName}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-3.5 text-right text-slate-500 font-mono text-[11px]">
                        {new Date(vote.timestamp).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
