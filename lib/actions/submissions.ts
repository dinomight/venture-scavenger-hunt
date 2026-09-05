'use server';

import { getDb } from '../db';
import { submissions, targets } from '../db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { deleteBlobsIfNotReferenced } from '../utils/blob';
import { broadcastHuntUpdate } from '../realtime/broadcast';

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

  // Ensure single photo per target: check if a submission already exists
  const existingSubmissions = await db
    .select()
    .from(submissions)
    .where(eq(submissions.targetId, data.targetId));

  if (existingSubmissions.length > 0) {
    throw new Error('This target already has a sighting photo logged.');
  }

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
  safeRevalidate('/admin');
  safeRevalidate(`/admin/${data.yearNumber}`);
  await broadcastHuntUpdate(data.yearNumber, 'submission-created', {
    submissionId: id,
    targetId: data.targetId,
  });
  return newSubmission;
}

export async function deleteSubmissionAction(submissionId: string, targetId: string, yearNumber: number) {
  const db = await getDb();

  // 1. Fetch submission record to get the image URL before deletion
  const existingSubmissions = await db
    .select()
    .from(submissions)
    .where(eq(submissions.id, submissionId));
  const submission = existingSubmissions[0];

  // 2. Clean up from blob storage if not referenced elsewhere
  if (submission?.imageUrl) {
    await deleteBlobsIfNotReferenced([submission.imageUrl], [submissionId]);
  }

  // 3. Delete database record
  await db.delete(submissions).where(eq(submissions.id, submissionId));

  // 4. Check if target still has any remaining submissions
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
  safeRevalidate('/admin');
  safeRevalidate(`/admin/${yearNumber}`);
  await broadcastHuntUpdate(yearNumber, 'submission-deleted', {
    submissionId,
    targetId,
  });
  return { success: true };
}
