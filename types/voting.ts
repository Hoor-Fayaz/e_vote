export interface Candidate {
  id: string;
  categoryId: string;
  name: string;
  tagline: string;
  bio: string;
  avatar: string;
  badge?: string;
  colorTheme?: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  icon: string; // e.g., 'Trophy', 'Award', 'Star', 'Flame', 'Zap', 'Crown', 'Sparkles'
  isActive: boolean;
  order: number;
  candidates: Candidate[];
}

export interface Vote {
  id: string;
  categoryId: string;
  candidateId: string;
  voterIdentifier: string; // unique anonymized or tracked identifier
  voterName?: string;
  timestamp: string; // ISO string
  ipHash: string;
  deviceHash?: string;
}

export interface AdminSettings {
  votingStatus: 'ACTIVE' | 'PAUSED' | 'ENDED';
  electionTitle: string;
  electionSubtitle: string;
  allowVoterName: boolean;
  requirePasscode: boolean;
  validPasscodes: string[];
  revealResultsToPublic: boolean; // strictly false by default as requested
  adminPin: string; // default hashed or stored securely
  allowChangeVote: boolean;
}

export interface VoteSubmissionPayload {
  voterIdentifier: string;
  voterName?: string;
  passcode?: string;
  ballot: {
    [categoryId: string]: string; // categoryId -> candidateId
  };
}

export interface CategoryStats {
  categoryId: string;
  categoryName: string;
  description: string;
  icon: string;
  totalVotes: number;
  candidates: {
    candidateId: string;
    name: string;
    tagline: string;
    avatar: string;
    badge?: string;
    votesCount: number;
    percentage: number;
    isLeader: boolean;
  }[];
}

export interface AdminDashboardData {
  settings: AdminSettings;
  categories: Category[];
  totalBallotsCast: number;
  totalVotesCount: number;
  recentVotes: {
    id: string;
    timestamp: string;
    voterIdentifierMasked: string;
    voterName?: string;
    categorySelections: {
      categoryName: string;
      candidateName: string;
    }[];
  }[];
  categoryStats: CategoryStats[];
  hourlyActivity: {
    hour: string;
    votes: number;
  }[];
}
