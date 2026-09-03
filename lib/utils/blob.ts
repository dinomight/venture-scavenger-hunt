import { getDb } from '../db';
import { submissions } from '../db/schema';
import { inArray, notInArray, and } from 'drizzle-orm';
import { del } from '@vercel/blob';

/**
 * Deletes images from Vercel Blob storage only if they are not referenced
 * by any other active submissions in the database.
 *
 * @param candidateUrls - Image URLs to potentially delete from blob storage.
 * @param excludingSubmissionIds - IDs of submissions being deleted, so they are not counted as active references.
 */
export async function deleteBlobsIfNotReferenced(
  candidateUrls: (string | null | undefined)[],
  excludingSubmissionIds: string[] = []
): Promise<void> {
  const validUrls = Array.from(
    new Set(
      candidateUrls
        .map((u) => u?.trim())
        .filter((url): url is string => Boolean(url && url.startsWith('https://')))
    )
  );

  if (validUrls.length === 0) return;

  // If Vercel Blob token is missing (e.g., local test env), skip remote blob deletion
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return;
  }

  try {
    const db = await getDb();

    // Query for any remaining submissions that also reference any of these candidate URLs
    const query =
      excludingSubmissionIds.length > 0
        ? db
            .select({ imageUrl: submissions.imageUrl })
            .from(submissions)
            .where(
              and(
                inArray(submissions.imageUrl, validUrls),
                notInArray(submissions.id, excludingSubmissionIds)
              )
            )
        : db
            .select({ imageUrl: submissions.imageUrl })
            .from(submissions)
            .where(inArray(submissions.imageUrl, validUrls));

    const referencedRows = await query;
    const stillReferencedUrls = new Set(referencedRows.map((r) => r.imageUrl));

    const urlsToDelete = validUrls.filter((url) => !stillReferencedUrls.has(url));

    if (urlsToDelete.length > 0) {
      await del(urlsToDelete);
    }
  } catch (err) {
    console.warn('Failed to clean up image blobs from Vercel storage:', err);
  }
}
