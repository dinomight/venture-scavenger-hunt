'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { RetroButton } from '../ui/RetroButton';
import { RetroCard } from '../ui/RetroCard';
import { CarpetPattern } from '../ui/CarpetPattern';
import { VentureIcon } from '../ui/VentureIcon';
import { unlockYearAction } from '../../lib/actions/auth';
import { ShieldAlert, KeyRound, Loader2, Sparkles } from 'lucide-react';

interface LobbyGateProps {
  year: number;
  initialJoinCode?: string;
}

export const LobbyGate: React.FC<LobbyGateProps> = ({
  year,
  initialJoinCode = '',
}) => {
  const [code, setCode] = useState(initialJoinCode);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleUnlock = (passphrase: string) => {
    if (!passphrase.trim()) {
      setError('ENTER PASSPHRASE TO ACCESS COMPOUND');
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        const res = await unlockYearAction(year, passphrase.trim());
        if (res.success) {
          // Set client-side cookie as direct fallback
          document.cookie = `venture_session_${year}=unlocked; path=/; max-age=5184000; SameSite=Lax`;
          // Preserve all existing query parameters and include join code if not already present
          const url = new URL(window.location.href);
          if (!url.searchParams.has('join') && passphrase.trim()) {
            url.searchParams.set('join', passphrase.trim());
          }
          window.location.href = url.toString();
        } else {
          setError(res.error || 'SECURITY ACCESS DENIED');
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'FAILED TO AUTHENTICATE';
        setError(message);
      }
    });
  };

  // Auto-unlock if invite code provided in props or URL query (?join=VENTURE26)
  useEffect(() => {
    let queryCode = initialJoinCode;
    if (!queryCode && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      queryCode = params.get('join') || '';
    }

    if (!queryCode) return;

    let isCancelled = false;
    unlockYearAction(year, queryCode.trim())
      .then((res) => {
        if (isCancelled) return;
        if (res.success) {
          document.cookie = `venture_session_${year}=unlocked; path=/; max-age=5184000; SameSite=Lax`;
          const url = new URL(window.location.href);
          if (!url.searchParams.has('join')) {
            url.searchParams.set('join', queryCode.trim());
          }
          window.location.href = url.toString();
        } else {
          setError(res.error || 'SECURITY ACCESS DENIED');
        }
      })
      .catch((err: unknown) => {
        if (isCancelled) return;
        const message = err instanceof Error ? err.message : 'SECURITY ACCESS DENIED';
        setError(message);
      });

    return () => {
      isCancelled = true;
    };
  }, [initialJoinCode, year]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleUnlock(code);
  };

  return (
    <div className="relative min-h-[85vh] flex items-center justify-center p-4">
      <CarpetPattern opacity={0.18} />

      <div className="relative w-full max-w-md">
        <RetroCard className="bg-[#FAF7F2] p-6 sm:p-8 border-4 border-slate-900 shadow-[6px_6px_0px_0px_#0f172a]">
          {/* Top Security Header */}
          <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4 mb-6">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 bg-orange-600 rounded-md flex items-center justify-center border-2 border-slate-900 text-white shadow-[2px_2px_0px_0px_#0f172a] overflow-hidden p-0.5">
                <VentureIcon className="h-8 w-8" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-black uppercase tracking-widest text-orange-600 block">
                  SECURITY PROTOCOL // OSI
                </span>
                <h2 className="text-xl font-black uppercase tracking-tight text-slate-900">
                  Checkpoint {year}
                </h2>
              </div>
            </div>
            <div className="flex items-center gap-1 bg-amber-400 text-slate-950 px-2 py-1 rounded text-xs font-mono font-bold border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0f172a]">
              <KeyRound className="h-3.5 w-3.5" />
              <span>GATE</span>
            </div>
          </div>

          <p className="text-sm font-medium text-slate-700 mb-6 leading-relaxed">
            Welcome to the <strong className="text-slate-950 font-bold">Venture Compound Scavenger Hunt</strong> for DragonCon {year}.
            Enter your crew&apos;s lobby join code to view target cosplayers and log sightings.
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="join-code"
                className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-900 mb-1.5"
              >
                Passphrase / Join Code
              </label>
              <input
                id="join-code"
                type="text"
                autoComplete="off"
                autoFocus
                placeholder="e.g. VENTURE26"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full font-mono text-center text-lg font-black tracking-widest uppercase bg-white px-4 py-3 border-2 border-slate-900 rounded-md shadow-[3px_3px_0px_0px_#0f172a] focus:outline-none focus:border-orange-600 focus:ring-0 placeholder:text-slate-300 transition-all"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-red-100 border-2 border-red-700 text-red-900 p-3 rounded-md text-xs font-bold font-mono">
                <ShieldAlert className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <RetroButton
              type="submit"
              variant="orange"
              size="lg"
              fullWidth
              disabled={isPending}
              className="mt-2 text-base"
            >
              {isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  AUTHENTICATING...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  GO TEAM VENTURE!
                </span>
              )}
            </RetroButton>
          </form>

          {/* Bottom helper info */}
          <div className="mt-6 pt-4 border-t border-slate-300 text-center text-[11px] font-mono text-slate-500">
            Ask your con group organizer for this year&apos;s passphrase.
          </div>
        </RetroCard>
      </div>
    </div>
  );
};
