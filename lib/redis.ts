import { Redis } from '@upstash/redis';

let client: Redis | null = null;

/**
 * Returns an Upstash Redis client if env vars are configured,
 * otherwise returns null (falls back to filesystem/in-memory store).
 */
export function getRedis(): Redis | null {
  if (client) return client;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (url && token) {
    client = new Redis({ url, token });
    return client;
  }

  return null;
}

export const REDIS_DB_KEY = 'voting:db';
