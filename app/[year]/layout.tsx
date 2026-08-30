import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { isYearUnlocked } from '@/lib/session';
import { getAllYears, getYearByNumber } from '@/lib/actions/years';
import { HeaderNav } from '@/components/layout/HeaderNav';
import { LobbyGate } from '@/components/auth/LobbyGate';

interface YearLayoutProps {
  children: React.ReactNode;
  params: Promise<{ year: string }>;
}

export default async function YearLayout({
  children,
  params,
}: YearLayoutProps) {
  const { year: yearParam } = await params;
  const yearNumber = parseInt(yearParam, 10);

  if (isNaN(yearNumber)) {
    notFound();
  }

  // Ensure DB and seed runs if needed
  const sessionYear = await getYearByNumber(yearNumber);
  const allYears = await getAllYears();

  if (!sessionYear) {
    // If year does not exist in DB yet
    return (
      <div className="flex flex-col min-h-screen bg-venture-cream">
        <HeaderNav currentYear={yearNumber} availableYears={allYears} isLocked={true} />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white border-2 border-slate-900 rounded-lg p-6 shadow-[4px_4px_0px_0px_#0f172a] text-center">
            <h2 className="text-xl font-black uppercase text-slate-900 mb-2">
              Hunt Session Not Found
            </h2>
            <p className="text-sm text-slate-600 mb-4 font-medium">
              No scavenger hunt session has been created for DragonCon {yearNumber} yet.
            </p>
            <Link
              href={`/admin/${yearNumber}`}
              className="inline-block bg-orange-600 hover:bg-orange-500 text-white font-bold uppercase text-xs px-4 py-2.5 rounded border-2 border-slate-900 shadow-retro-sm"
            >
              Initialize {yearNumber} Hunt
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const isUnlocked = await isYearUnlocked(yearNumber);

  if (!isUnlocked) {
    return (
      <div className="flex flex-col min-h-screen bg-venture-cream">
        <HeaderNav currentYear={yearNumber} availableYears={allYears} isLocked={true} />
        <main className="flex-1">
          <LobbyGate year={yearNumber} />
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-venture-cream">
      <HeaderNav currentYear={yearNumber} availableYears={allYears} isLocked={false} />
      <main className="flex-1 mx-auto w-full max-w-5xl px-4 py-6">
        {children}
      </main>
    </div>
  );
}
