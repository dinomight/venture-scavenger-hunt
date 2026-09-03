'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { VentureIcon } from '../ui/VentureIcon';
import { CarpetPattern } from '../ui/CarpetPattern';
import { Settings, Archive, Share2, Check, Menu, X, Lock } from 'lucide-react';
import { copyToClipboard } from '@/lib/utils/clipboard';

interface HeaderNavProps {
  currentYear: number;
  availableYears?: { year: number; title: string }[];
  isLocked?: boolean;
  joinCode?: string;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  currentYear,
  availableYears = [],
  isLocked = false,
  joinCode,
}) => {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const handleCopyJoinLink = async () => {
    if (!joinCode) return;
    const invitePath = `/${currentYear}?join=${joinCode}`;
    const fullLink =
      typeof window !== 'undefined'
        ? `${window.location.origin}${invitePath}`
        : invitePath;

    const success = await copyToClipboard(fullLink);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Close menu on click outside or escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMenuOpen) {
        setIsMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        isMenuOpen &&
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        menuButtonRef.current &&
        !menuButtonRef.current.contains(e.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  return (
    <header className="sticky top-0 z-40 border-b-4 border-slate-900 bg-orange-600 text-white shadow-[0_4px_0_0_#0f172a]">
      {/* Background Carpet Motif Watermark */}
      <CarpetPattern opacity={0.12} />

      <div className="relative mx-auto max-w-5xl px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2">
        {/* Brand & Logo */}
        <Link
          href={`/${currentYear}`}
          className="flex items-center gap-2 sm:gap-2.5 group transition-transform active:scale-95 shrink-0"
          onClick={() => setIsMenuOpen(false)}
        >
          <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-md border-2 border-slate-900 bg-amber-400 text-slate-950 shadow-retro-sm group-hover:bg-amber-300 overflow-hidden p-0.5">
            <VentureIcon className="h-7 w-7 sm:h-8 sm:w-8" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] sm:text-[10px] uppercase font-mono tracking-widest bg-slate-950 text-amber-400 px-1 sm:px-1.5 py-0.5 rounded border border-amber-400/40 font-black">
                OSI // DRAGONCON
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-black tracking-tight uppercase leading-tight drop-shadow-[1px_1px_0px_#0f172a]">
              Venture Hunt <span className="text-amber-300">{currentYear}</span>
            </h1>
          </div>
        </Link>

        {/* Desktop Action Controls (Tablet & Desktop) */}
        <div className="hidden sm:flex items-center gap-2">
          {isLocked && (
            <div className="flex items-center gap-1 bg-red-950/80 text-red-200 text-[10px] font-mono px-2 py-1 rounded border border-red-700">
              <Lock className="h-3 w-3 text-red-400 shrink-0" />
              <span className="font-bold">LOCKED</span>
            </div>
          )}

          {/* Copy Join Link Button */}
          {joinCode && !isLocked && (
            <button
              type="button"
              onClick={handleCopyJoinLink}
              className="flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold uppercase tracking-wider px-2.5 py-1.5 rounded border-2 border-slate-900 shadow-retro-sm active:translate-x-px active:translate-y-px active:shadow-none transition-colors cursor-pointer"
              title={`Copy 1-click join link for ${currentYear}`}
              aria-label={`Copy 1-click join link for DragonCon ${currentYear}`}
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-900 shrink-0" />
                  <span className="font-extrabold text-emerald-950">Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="h-3.5 w-3.5 text-slate-950 shrink-0" />
                  <span>Share Hunt</span>
                </>
              )}
            </button>
          )}

          {/* Year Selector Dropdown if multiple years */}
          {availableYears.length > 1 && (
            <div className="relative flex items-center">
              <select
                aria-label="Select Con Year"
                value={currentYear}
                onChange={(e) => {
                  router.push(`/${e.target.value}`);
                }}
                className="appearance-none bg-slate-900 text-amber-300 text-xs font-bold uppercase tracking-wider py-1.5 pl-2.5 pr-6 rounded border-2 border-slate-900 shadow-retro-sm cursor-pointer hover:bg-slate-800 focus:outline-none"
              >
                {availableYears.map((y) => (
                  <option key={y.year} value={y.year}>
                    {y.year}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-2 flex items-center text-amber-400">
                <Archive className="h-3.5 w-3.5" />
              </div>
            </div>
          )}

          {/* Admin / Settings Link */}
          <Link
            href={`/admin/${currentYear}`}
            className="flex items-center gap-1 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider px-2.5 py-1.5 rounded border-2 border-slate-900 shadow-retro-sm active:translate-x-px active:translate-y-px active:shadow-none"
            title="Organizer Command Console"
            aria-label="Organizer Command Console"
          >
            <Settings className="h-3.5 w-3.5 text-amber-400" />
            <span>Admin</span>
          </Link>
        </div>

        {/* Mobile Overflow Menu Trigger Button (WCAG Accessible 44x44px minimum tap target) */}
        <div className="flex sm:hidden items-center gap-1.5">
          {isLocked && (
            <div className="flex items-center gap-1 bg-red-950/90 text-red-300 text-[10px] font-mono px-2 py-1 rounded border border-red-700">
              <Lock className="h-3 w-3 text-red-400 shrink-0" />
              <span className="font-bold">LOCKED</span>
            </div>
          )}

          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            aria-expanded={isMenuOpen}
            aria-haspopup="true"
            aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-lg border-2 border-slate-900 bg-slate-900 text-amber-400 hover:bg-slate-800 shadow-retro-sm active:translate-x-px active:translate-y-px active:shadow-none transition-colors cursor-pointer"
          >
            {isMenuOpen ? (
              <X className="h-5 w-5 stroke-[2.5]" />
            ) : (
              <Menu className="h-5 w-5 stroke-[2.5]" />
            )}
          </button>
        </div>
      </div>

      {/* Screen Reader Polite Live Region for Copy Feedback */}
      <div className="sr-only" aria-live="polite" role="status">
        {copied ? `Join link for DragonCon ${currentYear} copied to clipboard` : ''}
      </div>

      {/* Mobile Overflow Drawer / Menu Panel */}
      {isMenuOpen && (
        <div
          ref={menuRef}
          role="menu"
          aria-label="Mobile Navigation Options"
          className="sm:hidden relative z-50 border-t-2 border-slate-900 bg-slate-950 px-4 py-4 text-slate-100 shadow-[0_8px_0_0_#0f172a] animate-in slide-in-from-top-2 duration-150"
        >
          <div className="space-y-3">
            {/* Share Invite Link Action */}
            {joinCode && !isLocked && (
              <button
                type="button"
                onClick={() => {
                  void handleCopyJoinLink()
                }}
                className={`w-full flex items-center justify-between p-3 rounded-lg border-2 text-left transition-all min-h-12 cursor-pointer ${
                  copied
                    ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200'
                    : 'bg-slate-900 hover:bg-slate-850 border-amber-500/40 hover:border-amber-400 text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded border border-amber-400/30 bg-amber-400/10 text-amber-400 shrink-0">
                    {copied ? (
                      <Check className="h-5 w-5 text-emerald-400" />
                    ) : (
                      <Share2 className="h-5 w-5 text-amber-400" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-mono font-bold uppercase tracking-wider text-amber-300">
                      {copied ? 'Link Copied to Clipboard!' : 'Share Hunt Invite'}
                    </div>
                    <div className="text-[11px] text-slate-400 font-sans">
                      Copy 1-click collaborative join link
                    </div>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-mono font-black uppercase px-2 py-1 rounded border ${
                    copied
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                      : 'bg-amber-400 text-slate-950 border-amber-300'
                  }`}
                >
                  {copied ? 'Copied' : 'Copy'}
                </span>
              </button>
            )}

            {/* Year Archive Switcher */}
            {availableYears.length > 1 && (
              <div className="p-3 bg-slate-900 rounded-lg border-2 border-slate-800">
                <label
                  htmlFor="mobile-year-select"
                  className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 mb-1.5 flex items-center gap-1.5"
                >
                  <Archive className="h-3.5 w-3.5" />
                  Con Year
                </label>
                <select
                  id="mobile-year-select"
                  value={currentYear}
                  onChange={(e) => {
                    setIsMenuOpen(false);
                    router.push(`/${e.target.value}`);
                  }}
                  className="w-full bg-slate-950 text-white text-xs font-bold uppercase tracking-wider py-2.5 px-3 rounded border border-slate-700 focus:border-amber-400 focus:outline-none min-h-11"
                >
                  {availableYears.map((y) => (
                    <option key={y.year} value={y.year}>
                      {y.year}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Admin Console Link */}
            <Link
              href={`/admin/${currentYear}`}
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center justify-between p-3 rounded-lg border-2 border-slate-800 hover:border-amber-400/50 bg-slate-900 hover:bg-slate-850 text-white transition-colors min-h-12"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded border border-slate-700 bg-slate-800 text-amber-400 shrink-0">
                  <Settings className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-mono font-bold uppercase tracking-wider text-amber-300">
                    Organizer Console
                  </div>
                  <div className="text-[11px] text-slate-400 font-sans">
                    Admin access for target &amp; session management
                  </div>
                </div>
              </div>
              <span className="text-xs font-mono text-slate-500 group-hover:text-amber-400">
                &rarr;
              </span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
