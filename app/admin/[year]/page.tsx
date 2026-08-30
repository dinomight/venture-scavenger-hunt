import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { isAdminUnlocked } from '@/lib/session';
import { getYearByNumber, getAllYears } from '@/lib/actions/years';
import { getTargetsForYear } from '@/lib/actions/targets';
import { AdminGate } from '@/components/admin/AdminGate';
import { SessionEditView } from '@/components/admin/SessionEditView';
import { ArrowLeft, Calendar, Plus } from 'lucide-react';

interface AdminYearPageProps {
  params: Promise<{ year: string }>;
}

export default async function AdminYearPage({ params }: AdminYearPageProps) {
  const { year: yearParam } = await params;
  const yearNumber = parseInt(yearParam, 10);

  if (isNaN(yearNumber)) {
    notFound();
  }

  const isUnlocked = await isAdminUnlocked();
  if (!isUnlocked) {
    return <AdminGate activeYear={yearNumber} />;
  }

  const yearData = await getYearByNumber(yearNumber);
  const allYears = await getAllYears();

  if (!yearData) {
    return (
      <div className="min-h-screen bg-venture-cream py-12 px-4 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-xl border-4 border-slate-900 p-6 sm:p-8 shadow-retro text-center space-y-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-orange-100 text-orange-600 mx-auto border-2 border-slate-900">
            <Calendar className="h-7 w-7" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-black uppercase text-orange-600 bg-orange-100 px-2 py-0.5 rounded border border-orange-300">
              SESSION NOT FOUND
            </span>
            <h2 className="text-xl font-black uppercase text-slate-900 mt-2">
              DragonCon {yearNumber}
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              No scavenger hunt session has been created for the year {yearNumber} yet.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
            <Link
              href="/admin"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 text-xs font-mono font-bold uppercase bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded border-2 border-slate-900 shadow-retro-sm"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              All Sessions
            </Link>

            <Link
              href="/admin"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 text-xs font-mono font-bold uppercase bg-orange-600 hover:bg-orange-500 text-white px-4 py-2.5 rounded border-2 border-slate-900 shadow-retro-sm"
            >
              <Plus className="h-3.5 w-3.5" />
              Create Session
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const initialTargets = await getTargetsForYear(yearNumber);

  return (
    <div className="min-h-screen bg-venture-cream py-6 px-4">
      <div className="max-w-5xl mx-auto">
        <SessionEditView
          yearNumber={yearNumber}
          yearData={yearData}
          initialTargets={initialTargets}
          availableYears={allYears}
        />
      </div>
    </div>
  );
}
