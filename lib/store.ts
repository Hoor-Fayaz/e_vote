import fs from 'fs';
import path from 'path';
import { Category, Candidate, Vote, AdminSettings, AdminDashboardData, CategoryStats } from '@/types/voting';
import { getRedis, REDIS_DB_KEY } from '@/lib/redis';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'voting_db.json');

interface DatabaseSchema {
  settings: AdminSettings;
  categories: Category[];
  votes: Vote[];
  voterRegistrations: { [identifier: string]: { timestamp: string; ipHash: string; voterName?: string } };
}

const DEFAULT_SETTINGS: AdminSettings = {
  votingStatus: 'ACTIVE',
  electionTitle: ' E-VOTE',
  electionSubtitle: 'Please select your preferred choice for each category and submit your vote. Your vote is private',
  allowVoterName: true,
  requirePasscode: false,
  validPasscodes: [],
  revealResultsToPublic: false,
  adminPin: '',
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
      { id: 'opt_1', categoryId: 'cat_1', name: 'Alex Johnson', tagline: '', bio: '', avatar: '' },
      { id: 'opt_2', categoryId: 'cat_1', name: 'Sarah Williams', tagline: '', bio: '', avatar: '' },
      { id: 'opt_3', categoryId: 'cat_1', name: 'Michael Brown', tagline: '', bio: '', avatar: '' },
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
      { id: 'opt_4', categoryId: 'cat_2', name: 'David Miller', tagline: '', bio: '', avatar: '' },
      { id: 'opt_5', categoryId: 'cat_2', name: 'Emma Davis', tagline: '', bio: '', avatar: '' },
      { id: 'opt_6', categoryId: 'cat_2', name: 'James Wilson', tagline: '', bio: '', avatar: '' },
    ],
  },
];

function getDefaultDb(): DatabaseSchema {
  return {
    settings: { ...DEFAULT_SETTINGS },
    categories: JSON.parse(JSON.stringify(DEFAULT_CATEGORIES)),
    votes: [],
    voterRegistrations: {},
  };
}

// ─── Persistence Layer ────────────────────────────────────────────────────────

let memoryDb: DatabaseSchema | null = null;

async function loadDb(): Promise<DatabaseSchema> {
  const redis = getRedis();

  // 1. Try Redis first (production)
  if (redis) {
    try {
      const rawData = await redis.get<any>(REDIS_DB_KEY);
      if (rawData) {
        const data: DatabaseSchema = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
        const loaded: DatabaseSchema = {
          settings: { ...DEFAULT_SETTINGS, ...(data.settings || {}) },
          categories: Array.isArray(data.categories) && data.categories.length > 0
            ? data.categories
            : JSON.parse(JSON.stringify(DEFAULT_CATEGORIES)),
          votes: Array.isArray(data.votes) ? data.votes : [],
          voterRegistrations: data.voterRegistrations || {},
        };
        memoryDb = loaded;
        return loaded;
      }
      // Redis connected but no data yet — seed with defaults
      const defaults = getDefaultDb();
      await redis.set(REDIS_DB_KEY, defaults);
      memoryDb = defaults;
      return defaults;
    } catch (err) {
      console.error('Redis load error, falling back to filesystem/memory:', err);
    }
  }

  // 2. Filesystem fallback (local dev)
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(content) as DatabaseSchema;
      const loaded: DatabaseSchema = {
        settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) },
        categories: Array.isArray(parsed.categories) && parsed.categories.length > 0
          ? parsed.categories
          : JSON.parse(JSON.stringify(DEFAULT_CATEGORIES)),
        votes: Array.isArray(parsed.votes) ? parsed.votes : [],
        voterRegistrations: parsed.voterRegistrations || {},
      };
      memoryDb = loaded;
      return loaded;
    }
  } catch (err) {
    console.warn('Filesystem load error, using memory fallback:', err);
  }

  // 3. Pure in-memory fallback (for read-only serverless without Redis)
  if (!memoryDb) {
    memoryDb = getDefaultDb();
  }
  return memoryDb;
}

async function saveDb(db: DatabaseSchema): Promise<void> {
  memoryDb = db;
  const redis = getRedis();

  // 1. Save to Redis (production)
  if (redis) {
    try {
      await redis.set(REDIS_DB_KEY, db);
      return; // Redis saved — done
    } catch (err) {
      console.error('Redis save error, attempting filesystem fallback:', err);
    }
  }

  // 2. Filesystem fallback (local dev)
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    // Expected on read-only serverless filesystems (e.g. Vercel) if Redis is not configured
  }
}

// ─── Helper: load → operate → save ───────────────────────────────────────────

async function withDb<T>(fn: (db: DatabaseSchema) => T): Promise<T> {
  const db = await loadDb();
  const result = fn(db);
  await saveDb(db);
  return result;
}

async function readDb<T>(fn: (db: DatabaseSchema) => T): Promise<T> {
  const db = await loadDb();
  return fn(db);
}

// ─── Public Store API (fully async) ──────────────────────────────────────────

export const VotingStore = {
  // ── Settings ──────────────────────────────────────────────────────────────
  async getSettings(): Promise<AdminSettings> {
    return readDb((db) => ({ ...db.settings }));
  },

  async updateSettings(partial: Partial<AdminSettings>): Promise<AdminSettings> {
    return withDb((db) => {
      db.settings = { ...db.settings, ...partial };
      return { ...db.settings };
    });
  },

  // ── Public categories (no vote counts exposed) ────────────────────────────
  async getPublicCategories(): Promise<{ settings: Omit<AdminSettings, 'adminPin' | 'validPasscodes'>; categories: Category[] }> {
    return readDb((db) => {
      const categories = Array.isArray(db.categories) ? db.categories : [];
      const settings = db.settings || DEFAULT_SETTINGS;
      const activeCategories = categories
        .filter((cat) => cat.isActive)
        .sort((a, b) => a.order - b.order);

      return {
        settings: {
          votingStatus: settings.votingStatus,
          electionTitle: settings.electionTitle,
          electionSubtitle: settings.electionSubtitle,
          allowVoterName: settings.allowVoterName,
          requirePasscode: settings.requirePasscode,
          revealResultsToPublic: settings.revealResultsToPublic,
          allowChangeVote: settings.allowChangeVote,
        },
        categories: activeCategories,
      };
    });
  },

  async getAllCategories(): Promise<Category[]> {
    return readDb((db) => [...db.categories].sort((a, b) => a.order - b.order));
  },

  // ── Category management ───────────────────────────────────────────────────
  async createCategory(name: string, description: string = ''): Promise<Category> {
    return withDb((db) => {
      const newCategory: Category = {
        id: `cat_${Date.now()}`,
        name: name.trim(),
        description: description.trim(),
        icon: 'Award',
        isActive: true,
        order: db.categories.length + 1,
        candidates: [],
      };
      db.categories.push(newCategory);
      return newCategory;
    });
  },

  async updateCategory(id: string, updates: Partial<Category>): Promise<Category | null> {
    return withDb((db) => {
      const index = db.categories.findIndex((c) => c.id === id);
      if (index === -1) return null;
      db.categories[index] = { ...db.categories[index], ...updates };
      return db.categories[index];
    });
  },

  async deleteCategory(id: string): Promise<boolean> {
    return withDb((db) => {
      const initialLen = db.categories.length;
      db.categories = db.categories.filter((c) => c.id !== id);
      db.votes = db.votes.filter((v) => v.categoryId !== id);
      return db.categories.length < initialLen;
    });
  },

  // ── Candidate management ──────────────────────────────────────────────────
  async addCandidate(categoryId: string, name: string): Promise<Candidate | null> {
    return withDb((db) => {
      const category = db.categories.find((c) => c.id === categoryId);
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
      return newCandidate;
    });
  },

  async updateCandidate(categoryId: string, candidateId: string, name: string): Promise<Candidate | null> {
    return withDb((db) => {
      const category = db.categories.find((c) => c.id === categoryId);
      if (!category) return null;
      const cand = category.candidates.find((c) => c.id === candidateId);
      if (!cand) return null;
      cand.name = name.trim();
      return cand;
    });
  },

  async deleteCandidate(categoryId: string, candidateId: string): Promise<boolean> {
    return withDb((db) => {
      const category = db.categories.find((c) => c.id === categoryId);
      if (!category) return false;
      const initialLen = category.candidates.length;
      category.candidates = category.candidates.filter((c) => c.id !== candidateId);
      db.votes = db.votes.filter((v) => v.candidateId !== candidateId);
      return category.candidates.length < initialLen;
    });
  },

  // ── Voting ────────────────────────────────────────────────────────────────
  async hasVoted(voterIdentifier: string): Promise<boolean> {
    return readDb((db) => !!db.voterRegistrations[voterIdentifier]);
  },

  async castBallot(payload: {
    voterIdentifier: string;
    voterName?: string;
    ballot: { [categoryId: string]: string };
    ipHash: string;
  }): Promise<{ success: boolean; message: string; receiptId?: string }> {
    return withDb((db) => {
      if (db.settings.votingStatus !== 'ACTIVE') {
        return { success: false, message: 'Voting is currently closed or paused by the admin.' };
      }

      if (db.voterRegistrations[payload.voterIdentifier]) {
        return { success: false, message: 'A vote has already been submitted with this ID / Email.' };
      }

      const timestamp = new Date().toISOString();
      const receiptId = `VOTE-${Date.now().toString(36).toUpperCase()}`;

      for (const [categoryId, candidateId] of Object.entries(payload.ballot)) {
        const category = db.categories.find((c) => c.id === categoryId && c.isActive);
        if (category?.candidates.find((c) => c.id === candidateId)) {
          db.votes.push({
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

      db.voterRegistrations[payload.voterIdentifier] = {
        timestamp,
        ipHash: payload.ipHash,
        voterName: payload.voterName,
      };

      return { success: true, message: 'Vote submitted successfully.', receiptId };
    });
  },

  // ── Admin analytics ───────────────────────────────────────────────────────
  async getAdminDashboardData(): Promise<AdminDashboardData> {
    return readDb((db) => {
      const votes = Array.isArray(db.votes) ? db.votes : [];
      const voterRegistrations = db.voterRegistrations || {};
      const categories = Array.isArray(db.categories) ? db.categories : [];
      const allCategories = [...categories].sort((a, b) => a.order - b.order);

      const categoryStats: CategoryStats[] = allCategories.map((cat) => {
        const categoryVotes = votes.filter((v) => v.categoryId === cat.id);
        const totalVotes = categoryVotes.length;
        const candidates = Array.isArray(cat.candidates) ? cat.candidates : [];

        const candidatesWithCounts = candidates.map((candidate) => {
          const count = categoryVotes.filter((v) => v.candidateId === candidate.id).length;
          const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
          return {
            candidateId: candidate.id,
            name: candidate.name,
            tagline: candidate.tagline || '',
            avatar: candidate.avatar || '',
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
          description: cat.description || '',
          icon: cat.icon || 'Award',
          totalVotes,
          candidates: candidatesWithCounts,
        };
      });

      const uniqueVoters = Object.keys(voterRegistrations);
      const recentVotes = uniqueVoters
        .slice(-30)
        .reverse()
        .map((voterId) => {
          const reg = voterRegistrations[voterId];
          const voterVotes = votes.filter((v) => v.voterIdentifier === voterId);
          const selections = voterVotes.map((v) => {
            const cat = categories.find((c) => c.id === v.categoryId);
            const cand = cat?.candidates?.find((c) => c.id === v.candidateId);
            return {
              categoryName: cat?.name || 'Category',
              candidateName: cand?.name || 'Option',
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
        settings: db.settings || DEFAULT_SETTINGS,
        categories,
        totalBallotsCast: uniqueVoters.length,
        totalVotesCount: votes.length,
        recentVotes,
        categoryStats,
        hourlyActivity: [],
      };
    });
  },

  // ── Admin actions ─────────────────────────────────────────────────────────
  async resetAllVotes(): Promise<void> {
    await withDb((db) => {
      db.votes = [];
      db.voterRegistrations = {};
    });
  },

  async getExportData() {
    return readDb((db) => ({
      settings: db.settings,
      categories: db.categories,
      votes: db.votes,
      voterRegistrations: db.voterRegistrations,
    }));
  },
};
