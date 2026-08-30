import React from 'react';
import { notFound } from 'next/navigation';
import { getYearByNumber } from '@/lib/actions/years';
import { getTargetsForYear } from '@/lib/actions/targets';
import { AdminView } from '@/components/admin/AdminView';

interface AdminPageProps {
  params: Promise<{ year: string }>;
}

export default async function AdminPage({ params }: AdminPageProps) {
  const { year: yearParam } = await params;
  const yearNumber = parseInt(yearParam, 10);

  if (isNaN(yearNumber)) {
    notFound();
  }

  const yearData = await getYearByNumber(yearNumber);
  if (!yearData) {
    notFound();
  }

  const targets = await getTargetsForYear(yearNumber);

  return (
    <AdminView
      yearNumber={yearNumber}
      yearData={yearData}
      initialTargets={targets}
    />
  );
}
