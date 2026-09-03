'use server';

import { getDb } from '../db';
import { years, targets, submissions } from '../db/schema';
import { eq, desc, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { deleteBlobsIfNotReferenced } from '../utils/blob';

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

export async function deleteYearSession(yearNumber: number) {
  const db = await getDb();
  const existing = await getYearByNumber(yearNumber);
  if (!existing) {
    throw new Error(`Year ${yearNumber} not found`);
  }

  // 1. Fetch all targets and submissions for this year session to clean up storage blobs & cascade delete
  const yearTargets = await db
    .select({ id: targets.id })
    .from(targets)
    .where(eq(targets.yearId, existing.id));

  if (yearTargets.length > 0) {
    const targetIds = yearTargets.map((t) => t.id);

    const yearSubmissions = await db
      .select({ id: submissions.id, imageUrl: submissions.imageUrl })
      .from(submissions)
      .where(inArray(submissions.targetId, targetIds));

    if (yearSubmissions.length > 0) {
      const candidateUrls = yearSubmissions.map((s) => s.imageUrl);
      const submissionIds = yearSubmissions.map((s) => s.id);

      // Clean up blobs from storage if not referenced by other targets/sessions
      await deleteBlobsIfNotReferenced(candidateUrls, submissionIds);

      // Delete submissions from DB
      await db.delete(submissions).where(inArray(submissions.targetId, targetIds));
    }
  }

  // 2. Delete all targets for this year
  await db.delete(targets).where(eq(targets.yearId, existing.id));

  // 3. Delete the year session itself
  await db.delete(years).where(eq(years.year, yearNumber));

  safeRevalidate('/');
  safeRevalidate('/admin');
  safeRevalidate(`/admin/${yearNumber}`);
  safeRevalidate(`/${yearNumber}`);
  safeRevalidate(`/${yearNumber}/admin`);

  return { success: true, deletedYear: yearNumber };
}
