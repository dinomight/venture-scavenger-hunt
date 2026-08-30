import React from 'react';
import { redirect } from 'next/navigation';
import { isAdminUnlocked } from '@/lib/session';
import { getAllYears, getActiveYear } from '@/lib/actions/years';
import { getTargetsForYear } from '@/lib/actions/targets';
import { AdminGate } from '@/components/admin/AdminGate';
import { SessionsListView, type YearWithCount } from '@/components/admin/SessionsListView';

interface AdminPageProps {
  searchParams?: Promise<{ year?: string }>;
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const isUnlocked = await isAdminUnlocked();
  const activeYearRecord = await getActiveYear();
  const defaultYear = activeYearRecord?.year || 2026;

  if (!isUnlocked) {
    return <AdminGate activeYear={defaultYear} />;
  }

  const resolvedSearchParams = searchParams ? await searchParams : {};
  const requestedYearNum = resolvedSearchParams.year
    ? parseInt(resolvedSearchParams.year, 10)
    : NaN;

  if (!isNaN(requestedYearNum)) {
    redirect(`/admin/${requestedYearNum}`);
  }

  const allYears = await getAllYears();

  // Fetch target counts for each session
  const yearsWithCounts: YearWithCount[] = await Promise.all(
    allYears.map(async (y) => {
      try {
        const targets = await getTargetsForYear(y.year);
        return {
          ...y,
          targetCount: targets.length,
        };
      } catch {
        return {
          ...y,
          targetCount: 0,
        };
      }
    })
  );

  return (
    <div className="min-h-screen bg-venture-cream py-6 px-4">
      <div className="max-w-5xl mx-auto">
        <SessionsListView
          availableYears={yearsWithCounts}
          activeYear={defaultYear}
        />
      </div>
    </div>
  );
}
