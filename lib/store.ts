import fs from 'fs';
import path from 'path';
import { Category, Candidate, Vote, AdminSettings, AdminDashboardData, CategoryStats } from '@/types/voting';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'voting_db.json');

interface DatabaseSchema {
  settings: AdminSettings;
  categories: Category[];
  votes: Vote[];
  voterRegistrations: { [identifier: string]: { timestamp: string; ipHash: string; voterName?: string } };
}

// Clean simple initial defaults
const DEFAULT_SETTINGS: AdminSettings = {
  votingStatus: 'ACTIVE',
  electionTitle: 'Official Voting System',
  electionSubtitle: 'Please select your preferred choice for each category and submit your vote. Your vote is private and only visible to the admin.',
  allowVoterName: true,
  requirePasscode: false,
  validPasscodes: [],
  revealResultsToPublic: false,
  adminPin: '', // Managed via ADMIN_PIN environment variable — not stored here
  allowChangeVote: false,
};

const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'cat_1',
    name: 'Category 1: President',
    description: 'Select one candidate',
    icon: 'Award',
    isActive: true,
    order: 1,
    candidates: [
      {
        id: 'opt_1',
        categoryId: 'cat_1',
        name: 'Alex Johnson',
        tagline: '',
        bio: '',
        avatar: '',
      },
      {
        id: 'opt_2',
        categoryId: 'cat_1',
        name: 'Sarah Williams',
        tagline: '',
        bio: '',
        avatar: '',
      },
      {
        id: 'opt_3',
        categoryId: 'cat_1',
        name: 'Michael Brown',
        tagline: '',
        bio: '',
        avatar: '',
      },
    ],
  },
  {
    id: 'cat_2',
    name: 'Category 2: Vice President',
    description: 'Select one candidate',
    icon: 'Award',
    isActive: true,
    order: 2,
    candidates: [
      {
        id: 'opt_4',
        categoryId: 'cat_2',
        name: 'David Miller',
        tagline: '',
        bio: '',
        avatar: '',
      },
      {
        id: 'opt_5',
        categoryId: 'cat_2',
        name: 'Emma Davis',
        tagline: '',
        bio: '',
        avatar: '',
      },
      {
        id: 'opt_6',
        categoryId: 'cat_2',
        name: 'James Wilson',
        tagline: '',
        bio: '',
        avatar: '',
      },
    ],
  },
];

let memoryDb: DatabaseSchema = {
  settings: { ...DEFAULT_SETTINGS },
  categories: JSON.parse(JSON.stringify(DEFAULT_CATEGORIES)),
  votes: [],
  voterRegistrations: {},
};

function ensureInitialized() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      memoryDb = {
        settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
        categories: parsed.categories?.length ? parsed.categories : JSON.parse(JSON.stringify(DEFAULT_CATEGORIES)),
        votes: parsed.votes || [],
        voterRegistrations: parsed.voterRegistrations || {},
      };
    } else {
      saveDb();
    }
  } catch (err) {
    // serverless fallback
  }
}

function saveDb() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(memoryDb, null, 2), 'utf-8');
  } catch (err) {}
}

ensureInitialized();

export const VotingStore = {
  getSettings(): AdminSettings {
    ensureInitialized();
    return { ...memoryDb.settings };
  },

  updateSettings(partial: Partial<AdminSettings>): AdminSettings {
    ensureInitialized();
    memoryDb.settings = { ...memoryDb.settings, ...partial };
    saveDb();
    return { ...memoryDb.settings };
  },

  getPublicCategories(): { settings: Omit<AdminSettings, 'adminPin' | 'validPasscodes'>; categories: Category[] } {
    ensureInitialized();
    const activeCategories = memoryDb.categories
      .filter((cat) => cat.isActive)
      .sort((a, b) => a.order - b.order);

    return {
      settings: {
        votingStatus: memoryDb.settings.votingStatus,
        electionTitle: memoryDb.settings.electionTitle,
        electionSubtitle: memoryDb.settings.electionSubtitle,
        allowVoterName: memoryDb.settings.allowVoterName,
        requirePasscode: memoryDb.settings.requirePasscode,
        revealResultsToPublic: memoryDb.settings.revealResultsToPublic,
        allowChangeVote: memoryDb.settings.allowChangeVote,
      },
      categories: activeCategories,
    };
  },

  getAllCategories(): Category[] {
    ensureInitialized();
    return [...memoryDb.categories].sort((a, b) => a.order - b.order);
  },

  createCategory(name: string, description: string = ''): Category {
    ensureInitialized();
    const newCategory: Category = {
      id: `cat_${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      icon: 'Award',
      isActive: true,
      order: memoryDb.categories.length + 1,
      candidates: [],
    };
    memoryDb.categories.push(newCategory);
    saveDb();
    return newCategory;
  },

  updateCategory(id: string, updates: Partial<Category>): Category | null {
    ensureInitialized();
    const index = memoryDb.categories.findIndex((c) => c.id === id);
    if (index === -1) return null;
    memoryDb.categories[index] = { ...memoryDb.categories[index], ...updates };
    saveDb();
    return memoryDb.categories[index];
  },

  deleteCategory(id: string): boolean {
    ensureInitialized();
    const initialLen = memoryDb.categories.length;
    memoryDb.categories = memoryDb.categories.filter((c) => c.id !== id);
    memoryDb.votes = memoryDb.votes.filter((v) => v.categoryId !== id);
    saveDb();
    return memoryDb.categories.length < initialLen;
  },

  addCandidate(categoryId: string, name: string): Candidate | null {
    ensureInitialized();
    const category = memoryDb.categories.find((c) => c.id === categoryId);
    if (!category) return null;

    const newCandidate: Candidate = {
      id: `opt_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      categoryId,
      name: name.trim(),
      tagline: '',
      bio: '',
      avatar: '',
    };

    category.candidates.push(newCandidate);
    saveDb();
    return newCandidate;
  },

  updateCandidate(categoryId: string, candidateId: string, name: string): Candidate | null {
    ensureInitialized();
    const category = memoryDb.categories.find((c) => c.id === categoryId);
    if (!category) return null;
    const cand = category.candidates.find((c) => c.id === candidateId);
    if (!cand) return null;

    cand.name = name.trim();
    saveDb();
    return cand;
  },

  deleteCandidate(categoryId: string, candidateId: string): boolean {
    ensureInitialized();
    const category = memoryDb.categories.find((c) => c.id === categoryId);
    if (!category) return false;
    const initialLen = category.candidates.length;
    category.candidates = category.candidates.filter((c) => c.id !== candidateId);
    memoryDb.votes = memoryDb.votes.filter((v) => v.candidateId !== candidateId);
    saveDb();
    return category.candidates.length < initialLen;
  },

  hasVoted(voterIdentifier: string): boolean {
    ensureInitialized();
    return !!memoryDb.voterRegistrations[voterIdentifier];
  },

  castBallot(payload: {
    voterIdentifier: string;
    voterName?: string;
    ballot: { [categoryId: string]: string };
    ipHash: string;
  }): { success: boolean; message: string; receiptId?: string } {
    ensureInitialized();

    if (memoryDb.settings.votingStatus !== 'ACTIVE') {
      return { success: false, message: 'Voting is currently closed or paused by the admin.' };
    }

    if (memoryDb.voterRegistrations[payload.voterIdentifier]) {
      return { success: false, message: 'A vote has already been submitted with this ID / Email.' };
    }

    const timestamp = new Date().toISOString();
    const receiptId = `VOTE-${Date.now().toString(36).toUpperCase()}`;

    for (const [categoryId, candidateId] of Object.entries(payload.ballot)) {
      const category = memoryDb.categories.find((c) => c.id === categoryId && c.isActive);
      if (category) {
        const candidate = category.candidates.find((c) => c.id === candidateId);
        if (candidate) {
          memoryDb.votes.push({
            id: `v_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            categoryId,
            candidateId,
            voterIdentifier: payload.voterIdentifier,
            voterName: payload.voterName,
            timestamp,
            ipHash: payload.ipHash,
          });
        }
      }
    }

    memoryDb.voterRegistrations[payload.voterIdentifier] = {
      timestamp,
      ipHash: payload.ipHash,
      voterName: payload.voterName,
    };

    saveDb();
    return { success: true, message: 'Vote submitted successfully.', receiptId };
  },

  getAdminDashboardData(): AdminDashboardData {
    ensureInitialized();

    const activeCategories = memoryDb.categories.sort((a, b) => a.order - b.order);
    const categoryStats: CategoryStats[] = activeCategories.map((cat) => {
      const categoryVotes = memoryDb.votes.filter((v) => v.categoryId === cat.id);
      const totalVotes = categoryVotes.length;

      const candidatesWithCounts = cat.candidates.map((candidate) => {
        const count = categoryVotes.filter((v) => v.candidateId === candidate.id).length;
        const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
        return {
          candidateId: candidate.id,
          name: candidate.name,
          tagline: candidate.tagline,
          avatar: candidate.avatar,
          badge: candidate.badge,
          votesCount: count,
          percentage,
          isLeader: false,
        };
      });

      const maxVotes = Math.max(0, ...candidatesWithCounts.map((c) => c.votesCount));
      if (maxVotes > 0) {
        candidatesWithCounts.forEach((c) => {
          if (c.votesCount === maxVotes) c.isLeader = true;
        });
      }

      return {
        categoryId: cat.id,
        categoryName: cat.name,
        description: cat.description,
        icon: cat.icon,
        totalVotes,
        candidates: candidatesWithCounts,
      };
    });

    const uniqueVoters = Object.keys(memoryDb.voterRegistrations);
    const recentVotes = uniqueVoters
      .slice(-30)
      .reverse()
      .map((voterId) => {
        const reg = memoryDb.voterRegistrations[voterId];
        const voterVotes = memoryDb.votes.filter((v) => v.voterIdentifier === voterId);

        const selections = voterVotes.map((v) => {
          const cat = memoryDb.categories.find((c) => c.id === v.categoryId);
          const cand = cat?.candidates.find((c) => c.id === v.candidateId);
          return {
            categoryName: cat ? cat.name : 'Category',
            candidateName: cand ? cand.name : 'Option',
          };
        });

        return {
          id: voterId,
          timestamp: reg?.timestamp || new Date().toISOString(),
          voterIdentifierMasked: voterId,
          voterName: reg?.voterName,
          categorySelections: selections,
        };
      });

    return {
      settings: memoryDb.settings,
      categories: memoryDb.categories,
      totalBallotsCast: uniqueVoters.length,
      totalVotesCount: memoryDb.votes.length,
      recentVotes,
      categoryStats,
      hourlyActivity: [],
    };
  },

  resetAllVotes(): void {
    ensureInitialized();
    memoryDb.votes = [];
    memoryDb.voterRegistrations = {};
    saveDb();
  },

  getExportData() {
    ensureInitialized();
    return {
      settings: memoryDb.settings,
      categories: memoryDb.categories,
      votes: memoryDb.votes,
      voterRegistrations: memoryDb.voterRegistrations,
    };
  },
};
