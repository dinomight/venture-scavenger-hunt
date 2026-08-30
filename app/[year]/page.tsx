import React from 'react';
import { getTargetsForYear } from '../../lib/actions/targets';
import { getYearByNumber } from '../../lib/actions/years';
import { HuntView } from '../../components/hunt/HuntView';

interface YearPageProps {
  params: Promise<{ year: string }>;
}

export default async function YearPage({ params }: YearPageProps) {
  const { year: yearParam } = await params;
  const yearNumber = parseInt(yearParam, 10);
  const [yearData, targets] = await Promise.all([
    getYearByNumber(yearNumber),
    getTargetsForYear(yearNumber),
  ]);

  return (
    <HuntView
      yearNumber={yearNumber}
      requiredTargets={yearData?.requiredTargets}
      initialTargets={targets}
    />
  );
}
