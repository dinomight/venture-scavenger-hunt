'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { VentureIcon } from '../ui/VentureIcon';
import { CarpetPattern } from '../ui/CarpetPattern';
import { Settings, ShieldAlert, Archive } from 'lucide-react';

interface HeaderNavProps {
  currentYear: number;
  availableYears?: { year: number; title: string }[];
  isLocked?: boolean;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  currentYear,
  availableYears = [],
  isLocked = false,
}) => {
  const router = useRouter();

  return (
    <header className="relative border-b-4 border-slate-900 bg-orange-600 text-white shadow-[0_4px_0_0_#0f172a] overflow-hidden">
      {/* Background Carpet Motif Watermark */}
      <CarpetPattern opacity={0.12} />

      <div className="relative mx-auto max-w-5xl px-4 py-3 flex items-center justify-between gap-2">
        {/* Brand & Logo */}
        <Link
          href={`/${currentYear}`}
          className="flex items-center gap-2.5 group transition-transform active:scale-95"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-md border-2 border-slate-900 bg-amber-400 text-slate-950 shadow-retro-sm group-hover:bg-amber-300 overflow-hidden p-0.5">
            <VentureIcon className="h-8 w-8" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-mono tracking-widest bg-slate-950 text-amber-400 px-1.5 py-0.5 rounded border border-amber-400/40 font-black">
                OSI // DRAGONCON
              </span>
            </div>
            <h1 className="text-lg font-black tracking-tight uppercase leading-tight drop-shadow-[1px_1px_0px_#0f172a]">
              Venture Hunt <span className="text-amber-300">{currentYear}</span>
            </h1>
          </div>
        </Link>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Year Selector Dropdown if multiple years */}
          {availableYears.length > 1 && (
            <div className="relative flex items-center">
              <select
                aria-label="Select Con Year"
                value={currentYear}
                onChange={(e) => {
                  router.push(`/${e.target.value}`);
                }}
                className="appearance-none bg-slate-900 text-amber-300 text-xs font-bold uppercase tracking-wider py-1.5 pl-3 pr-6 rounded border-2 border-slate-900 shadow-retro-sm cursor-pointer hover:bg-slate-800 focus:outline-none min-w-27"
              >
                {availableYears.map((y) => (
                  <option key={y.year} value={y.year}>
                    {y.year} Con
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-2 flex items-center text-amber-400">
                <Archive className="h-3.5 w-3.5" />
              </div>
            </div>
          )}

          {/* Admin / Settings Link */}
          {!isLocked && (
            <Link
              href={`/${currentYear}/admin`}
              className="flex items-center gap-1 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider px-2.5 py-1.5 rounded border-2 border-slate-900 shadow-retro-sm active:translate-x-px active:translate-y-px active:shadow-none"
              title="Manage Target List"
            >
              <Settings className="h-3.5 w-3.5 text-amber-400" />
              <span className="hidden sm:inline">Admin</span>
            </Link>
          )}

          {isLocked && (
            <div className="flex items-center gap-1 bg-red-900 text-red-200 text-xs font-mono px-2 py-1 rounded border border-red-700">
              <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />
              <span className="hidden sm:inline">LOCKED</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
