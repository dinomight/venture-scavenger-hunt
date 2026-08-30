'use server';

import { getDb } from '../db';
import { targets, submissions, type Target, type Submission } from '../db/schema';
import { eq, asc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { getYearByNumber } from './years';

export interface TargetWithSubmissions extends Target {
  submissions: Submission[];
}

export async function getTargetsForYear(yearNumber: number): Promise<TargetWithSubmissions[]> {
  const db = await getDb();
  const yearRecord = await getYearByNumber(yearNumber);
  if (!yearRecord) return [];

  const targetList = await db
    .select()
    .from(targets)
    .where(eq(targets.yearId, yearRecord.id))
    .orderBy(asc(targets.orderIndex), asc(targets.createdAt));

  const allSubmissions = await db.select().from(submissions);

  // Group submissions by targetId
  const subMap = new Map<string, Submission[]>();
  for (const sub of allSubmissions) {
    const list = subMap.get(sub.targetId) || [];
    list.push(sub);
    subMap.set(sub.targetId, list);
  }

  return targetList.map((t) => ({
    ...t,
    submissions: subMap.get(t.id) || [],
  }));
}

function safeRevalidate(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Ignore outside Next.js request context
  }
}

export async function createTarget(data: {
  yearNumber: number;
  name: string;
  description?: string;
  categoryTag?: string;
}) {
  const db = await getDb();
  const yearRecord = await getYearByNumber(data.yearNumber);
  if (!yearRecord) {
    throw new Error(`Year ${data.yearNumber} not found`);
  }

  const existing = await db
    .select()
    .from(targets)
    .where(eq(targets.yearId, yearRecord.id));

  const newTarget = {
    id: `target-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    yearId: yearRecord.id,
    name: data.name.trim(),
    description: data.description?.trim() || null,
    categoryTag: data.categoryTag?.trim() || null,
    status: 'NEEDED' as const,
    orderIndex: existing.length,
    createdAt: new Date(),
  };

  await db.insert(targets).values(newTarget);
  safeRevalidate(`/${data.yearNumber}`);
  safeRevalidate(`/${data.yearNumber}/admin`);
  return newTarget;
}

export async function bulkImportTargets(
  yearNumber: number,
  items: { name: string; description?: string; categoryTag?: string }[]
) {
  const db = await getDb();
  const yearRecord = await getYearByNumber(yearNumber);
  if (!yearRecord) {
    throw new Error(`Year ${yearNumber} not found`);
  }

  const existing = await db
    .select()
    .from(targets)
    .where(eq(targets.yearId, yearRecord.id));

  let orderIndex = existing.length;
  const newTargets = [];

  for (const item of items) {
    if (!item.name || item.name.trim() === '') continue;

    const newTarget = {
      id: `target-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      yearId: yearRecord.id,
      name: item.name.trim(),
      description: item.description?.trim() || null,
      categoryTag: item.categoryTag?.trim() || null,
      status: 'NEEDED' as const,
      orderIndex: orderIndex++,
      createdAt: new Date(),
    };
    newTargets.push(newTarget);
  }

  if (newTargets.length > 0) {
    await db.insert(targets).values(newTargets);
  }

  safeRevalidate(`/${yearNumber}`);
  safeRevalidate(`/${yearNumber}/admin`);
  return { count: newTargets.length };
}

export async function deleteTarget(targetId: string, yearNumber: number) {
  const db = await getDb();
  await db.delete(targets).where(eq(targets.id, targetId));
  safeRevalidate(`/${yearNumber}`);
  safeRevalidate(`/${yearNumber}/admin`);
  return { success: true };
}
