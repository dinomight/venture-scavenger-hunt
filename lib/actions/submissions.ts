'use server';

import { getDb } from '../db';
import { submissions, targets } from '../db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

function safeRevalidate(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Ignore outside Next.js request context
  }
}

export async function createSubmissionAction(data: {
  targetId: string;
  yearNumber: number;
  imageUrl: string;
  photographerName?: string;
  caption?: string;
}) {
  const db = await getDb();

  const id = `sub-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const newSubmission = {
    id,
    targetId: data.targetId,
    imageUrl: data.imageUrl,
    photographerName: data.photographerName?.trim() || null,
    caption: data.caption?.trim() || null,
    createdAt: new Date(),
  };

  // Insert submission
  await db.insert(submissions).values(newSubmission);

  // Update target status to FOUND
  await db
    .update(targets)
    .set({ status: 'FOUND' })
    .where(eq(targets.id, data.targetId));

  safeRevalidate(`/${data.yearNumber}`);
  safeRevalidate(`/${data.yearNumber}/admin`);
  return newSubmission;
}

export async function deleteSubmissionAction(submissionId: string, targetId: string, yearNumber: number) {
  const db = await getDb();

  await db.delete(submissions).where(eq(submissions.id, submissionId));

  // Check if target still has any remaining submissions
  const remaining = await db
    .select()
    .from(submissions)
    .where(eq(submissions.targetId, targetId));

  if (remaining.length === 0) {
    await db
      .update(targets)
      .set({ status: 'NEEDED' })
      .where(eq(targets.id, targetId));
  }

  safeRevalidate(`/${yearNumber}`);
  safeRevalidate(`/${yearNumber}/admin`);
  return { success: true };
}
