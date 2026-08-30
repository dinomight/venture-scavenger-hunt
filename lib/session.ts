import { cookies } from 'next/headers';
import { getDb } from './db';
import { years } from './db/schema';
import { eq } from 'drizzle-orm';

const COOKIE_PREFIX = 'venture_session_';
const ADMIN_COOKIE_NAME = 'venture_admin_session';

/**
 * Check if the user has unlocked access to a specific hunt year
 */
export async function isYearUnlocked(year: number): Promise<boolean> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(`${COOKIE_PREFIX}${year}`);
  return sessionCookie?.value === 'unlocked';
}

/**
 * Check if the user has master admin clearance
 */
export async function isAdminUnlocked(): Promise<boolean> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(ADMIN_COOKIE_NAME);
  return sessionCookie?.value === 'unlocked';
}

/**
 * Validate master admin PIN / passphrase
 */
export function validateAdminPin(inputPin: string): boolean {
  if (!inputPin) return false;
  const configuredPin = (process.env.ADMIN_PIN || 'VENTURE').trim().toUpperCase();
  return inputPin.trim().toUpperCase() === configuredPin;
}

/**
 * Set master admin clearance session cookie
 */
export async function unlockAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, 'unlocked', {
    httpOnly: false,
    secure: false,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

/**
 * Revoke master admin clearance
 */
export async function lockAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
}

/**
 * Validate a join code against the year in the database
 */
export async function validateJoinCode(year: number, inputCode: string): Promise<boolean> {
  if (!inputCode) return false;
  
  const db = await getDb();
  const result = await db.select().from(years).where(eq(years.year, year)).limit(1);

  if (result.length === 0) return false;

  const session = result[0];
  // Compare case-insensitively and trim spaces
  const normalizedInput = inputCode.trim().toUpperCase();
  const normalizedStored = session.joinCode.trim().toUpperCase();

  return normalizedInput === normalizedStored;
}

/**
 * Set the unlock session cookie for a year
 */
export async function unlockYearSession(year: number): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(`${COOKIE_PREFIX}${year}`, 'unlocked', {
    httpOnly: false,
    secure: false, // Allow both HTTP (LAN IP testing) and HTTPS
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 60, // 60 days
  });
}
