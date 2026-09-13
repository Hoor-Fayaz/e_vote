import { VoterPortal } from '@/components/VoterPortal';
import { ShieldCheck } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Top Navigation */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-50 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="font-bold text-base tracking-tight text-slate-900">
              Voting System
            </span>
          </div>
        </div>
      </header>

      {/* Main Public Voting Interface */}
      <VoterPortal />
    </div>
  );
}
