'use client';

import React from 'react';
import { RetroCard } from '../ui/RetroCard';
import { getRankMilestone } from '../../lib/utils/rank-titles';
import { Zap, Award, Sparkles } from 'lucide-react';

interface MissionGaugeProps {
  total: number;
  found: number;
  requiredTargets?: number | null;
}

export const MissionGauge: React.FC<MissionGaugeProps> = ({
  total,
  found,
  requiredTargets,
}) => {
  const goal = requiredTargets && requiredTargets > 0 ? requiredTargets : total;
  const percentage = goal > 0 ? Math.round((found / goal) * 100) : 0;
  const isOverdrive = goal > 0 && found > goal;
  const milestone = getRankMilestone(percentage);

  return (
    <RetroCard className="bg-[#FAF7F2] border-4 border-slate-900 shadow-[4px_4px_0px_0px_#0f172a] p-4 sm:p-5 mb-6">
      {/* Top Readout Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-slate-900 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <div
            className={`h-7 w-7 rounded flex items-center justify-center border-2 border-slate-900 shadow-[1px_1px_0px_0px_#0f172a] text-white ${
              isOverdrive ? 'bg-purple-600' : 'bg-orange-600'
            }`}
          >
            {isOverdrive ? <Sparkles className="h-4 w-4" /> : <Zap className="h-4 w-4" />}
          </div>
          <div>
            <span
              className={`text-[10px] font-mono font-black uppercase tracking-widest block leading-none ${
                isOverdrive ? 'text-purple-600' : 'text-orange-600'
              }`}
            >
              {isOverdrive ? 'SUPER-SCIENCE OVERDRIVE' : 'MISSION PROGRESS'}
            </span>
            <h2 className="text-sm sm:text-base font-black uppercase text-slate-900">
              Threat Level & Gauge
            </h2>
          </div>
        </div>

        {/* Milestone Rank Pill */}
        <div
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded border-2 text-xs font-mono font-black uppercase shadow-[2px_2px_0px_0px_#0f172a] ${milestone.colorClass}`}
        >
          <Award className="h-3.5 w-3.5 shrink-0" />
          <span>{milestone.title}</span>
        </div>
      </div>

      {/* Numerical Counter & Threat Label */}
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
        <div className="flex flex-wrap items-baseline gap-1.5 font-mono">
          <span className="text-2xl sm:text-3xl font-black text-slate-950">
            {found}
          </span>
          <span className="text-sm font-bold text-slate-500">
            / {goal} {requiredTargets && requiredTargets > 0 && requiredTargets !== total ? 'Required' : 'Goal'}
          </span>
          {requiredTargets && requiredTargets > 0 && requiredTargets !== total && (
            <span className="text-xs font-semibold text-slate-400">
              ({total} in list)
            </span>
          )}
          {isOverdrive && (
            <span className="inline-flex items-center gap-1 bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 text-white text-[11px] font-black uppercase px-2 py-0.5 rounded border border-slate-900 shadow-[1px_1px_0px_0px_#0f172a] ml-1">
              <Sparkles className="h-3 w-3 text-amber-300" />
              +{found - goal} Bonus!
            </span>
          )}
        </div>

        <div className="text-right font-mono flex items-baseline gap-1">
          <span
            className={`text-xl sm:text-2xl font-black ${
              isOverdrive ? 'text-purple-600' : 'text-orange-600'
            }`}
          >
            {percentage}%
          </span>
          {isOverdrive && (
            <span className="text-[10px] font-black uppercase text-pink-600">
              OVERDRIVE
            </span>
          )}
        </div>
      </div>

      {/* Retro Power Bar */}
      <div className="relative h-6 w-full overflow-hidden rounded-md border-2 border-slate-900 bg-slate-950 p-0.5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]">
        {/* Background segmented tick marks */}
        <div className="absolute inset-0 flex justify-between px-1 pointer-events-none opacity-20">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="h-full w-0.5 bg-white" />
          ))}
        </div>

        {/* Dynamic fill bar */}
        <div
          className={`h-full rounded-sm transition-all duration-500 ease-out flex items-center justify-end pr-1.5 ${
            isOverdrive ? 'shadow-[0_0_12px_rgba(236,72,153,0.8)]' : ''
          }`}
          style={{
            width: `${Math.min(Math.max(percentage, 2), 100)}%`,
            background: isOverdrive
              ? 'linear-gradient(90deg, #f59e0b, #ec4899, #8b5cf6, #10b981)'
              : percentage >= 100
              ? 'linear-gradient(90deg, #f59e0b, #10b981)'
              : percentage >= 60
              ? 'linear-gradient(90deg, #f59e0b, #ea580c)'
              : 'linear-gradient(90deg, #3b82f6, #f59e0b)',
          }}
        >
          {percentage >= 15 && (
            <span className="text-[10px] font-mono font-black text-slate-950 drop-shadow-sm select-none">
              {percentage}%
            </span>
          )}
        </div>
      </div>

      {/* Flavor Status Text */}
      <div className="mt-2.5 flex items-center justify-between text-[11px] font-mono font-bold text-slate-600">
        <span
          className={`uppercase tracking-wider font-black ${
            isOverdrive ? 'text-purple-700' : 'text-orange-700'
          }`}
        >
          {milestone.threatLevel}
        </span>
        <span className="text-slate-500 italic hidden sm:inline">
          {milestone.flavorText}
        </span>
      </div>
    </RetroCard>
  );
};
