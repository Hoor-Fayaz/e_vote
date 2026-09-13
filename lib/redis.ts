import { Redis } from '@upstash/redis';

let client: Redis | null = null;

/**
 * Returns an Upstash Redis client if env vars are configured,
 * otherwise returns null (falls back to filesystem/in-memory store).
 */
export function getRedis(): Redis | null {
  if (client) return client;

  let url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  let token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

  if (!url || !token) return null;

  // Strip accidental enclosing quotes from user pasting e.g. "https://..."
  url = url.replace(/^["']|["']$/g, '').trim();
  token = token.replace(/^["']|["']$/g, '').trim();

  try {
    client = new Redis({ url, token });
    return client;
  } catch (err) {
    console.error('Failed to initialize Upstash Redis client:', err);
    return null;
  }
}

export const REDIS_DB_KEY = 'voting:db';
