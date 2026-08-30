'use server';

import { getDb } from '../db';
import { years } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function getAllYears() {
  const db = await getDb();
  return await db.select().from(years).orderBy(desc(years.year));
}

export async function getYearByNumber(yearNumber: number) {
  const db = await getDb();
  const result = await db
    .select()
    .from(years)
    .where(eq(years.year, yearNumber))
    .limit(1);
  return result[0] || null;
}

export async function getActiveYear() {
  const db = await getDb();
  const active = await db
    .select()
    .from(years)
    .where(eq(years.isActive, true))
    .orderBy(desc(years.year))
    .limit(1);

  if (active.length > 0) return active[0];

  const latest = await db.select().from(years).orderBy(desc(years.year)).limit(1);
  return latest[0] || null;
}

function safeRevalidate(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Ignore outside Next.js request context
  }
}

export async function createYearSession(data: {
  year: number;
  title: string;
  joinCode: string;
  requiredTargets?: number | null;
  isActive?: boolean;
}) {
  const db = await getDb();
  const existing = await getYearByNumber(data.year);
  if (existing) {
    throw new Error(`Year ${data.year} already exists`);
  }

  const id = `year-${data.year}`;
  const newYear = {
    id,
    year: data.year,
    title: data.title || `DragonCon ${data.year} Scavenger Hunt`,
    joinCode: data.joinCode.trim().toUpperCase(),
    requiredTargets: data.requiredTargets ? Math.max(1, data.requiredTargets) : null,
    isActive: data.isActive ?? true,
    createdAt: new Date(),
  };

  await db.insert(years).values(newYear);
  safeRevalidate('/');
  safeRevalidate('/admin');
  safeRevalidate(`/admin/${data.year}`);
  safeRevalidate(`/${data.year}`);
  safeRevalidate(`/${data.year}/admin`);
  return newYear;
}

export async function updateYearSettings(
  yearNumber: number,
  data: {
    title?: string;
    joinCode?: string;
    requiredTargets?: number | null;
    isActive?: boolean;
  }
) {
  const db = await getDb();
  const existing = await getYearByNumber(yearNumber);
  if (!existing) {
    throw new Error(`Year ${yearNumber} not found`);
  }

  const updates: Partial<typeof years.$inferInsert> = {};
  if (data.title !== undefined) updates.title = data.title.trim();
  if (data.joinCode !== undefined) updates.joinCode = data.joinCode.trim().toUpperCase();
  if (data.requiredTargets !== undefined) {
    updates.requiredTargets =
      data.requiredTargets && data.requiredTargets > 0 ? data.requiredTargets : null;
  }
  if (data.isActive !== undefined) updates.isActive = data.isActive;

  await db.update(years).set(updates).where(eq(years.year, yearNumber));
  safeRevalidate('/');
  safeRevalidate('/admin');
  safeRevalidate(`/admin/${yearNumber}`);
  safeRevalidate(`/${yearNumber}`);
  safeRevalidate(`/${yearNumber}/admin`);
  return await getYearByNumber(yearNumber);
}
