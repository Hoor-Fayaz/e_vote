'use client';

import React from 'react';
import { Candidate } from '@/types/voting';
import { Check, User, Sparkles } from 'lucide-react';

interface CandidateCardProps {
  candidate: Candidate;
  isSelected: boolean;
  onSelect: (candidateId: string) => void;
  disabled?: boolean;
}

export function CandidateCard({ candidate, isSelected, onSelect, disabled }: CandidateCardProps) {
  return (
    <div
      onClick={() => !disabled && onSelect(candidate.id)}
      className={`relative group cursor-pointer rounded-2xl p-5 transition-all duration-300 select-none overflow-hidden ${
        isSelected
          ? 'bg-gradient-to-b from-indigo-950/80 to-slate-900/90 border-2 border-indigo-500 shadow-lg shadow-indigo-500/20 ring-2 ring-indigo-500/30'
          : 'bg-slate-900/60 hover:bg-slate-900/90 border border-slate-800/90 hover:border-slate-700'
      } ${disabled ? 'opacity-60 cursor-not-allowed' : 'card-hover-lift'}`}
    >
      {/* Top Selection Indicator */}
      <div className="absolute top-4 right-4 z-10">
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 ${
            isSelected
              ? 'bg-indigo-500 text-white scale-110 shadow-md shadow-indigo-500/50'
              : 'bg-slate-800/80 border border-slate-700 text-transparent group-hover:border-slate-500'
          }`}
        >
          <Check className="w-4 h-4 stroke-[3]" />
        </div>
      </div>

      <div className="flex items-start gap-4">
        {/* Avatar / Photo */}
        <div className="relative flex-shrink-0">
          <div
            className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 transition-transform duration-300 group-hover:scale-105 ${
              isSelected ? 'border-indigo-400 ring-4 ring-indigo-500/20' : 'border-slate-700'
            }`}
          >
            {candidate.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={candidate.avatar}
                alt={candidate.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(candidate.name)}&backgroundColor=1e293b`;
                }}
              />
            ) : (
              <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-400">
                <User className="w-8 h-8" />
              </div>
            )}
          </div>

          {candidate.badge && (
            <div className="absolute -bottom-2 -left-1 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold text-[10px] px-2 py-0.5 rounded-full shadow-md flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" />
              <span>{candidate.badge}</span>
            </div>
          )}
        </div>

        {/* Candidate Info */}
        <div className="flex-1 min-w-0 pr-6">
          <h3 className="text-lg font-bold text-slate-100 group-hover:text-white transition-colors truncate">
            {candidate.name}
          </h3>
          {candidate.tagline && (
            <p className="text-xs font-medium text-indigo-300/90 mt-0.5 mb-2 line-clamp-1">
              {candidate.tagline}
            </p>
          )}
          {candidate.bio && (
            <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
              {candidate.bio}
            </p>
          )}
        </div>
      </div>

      {/* Selected bottom highlight strip */}
      {isSelected && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 animate-pulse" />
      )}
    </div>
  );
}
