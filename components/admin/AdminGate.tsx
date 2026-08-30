'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { RetroButton } from '../ui/RetroButton';
import { CarpetPattern } from '../ui/CarpetPattern';
import { VentureIcon } from '../ui/VentureIcon';
import { unlockAdminAction } from '@/lib/actions/auth';
import { Lock, ShieldAlert, KeyRound, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface AdminGateProps {
  activeYear?: number;
}

export const AdminGate: React.FC<AdminGateProps> = ({ activeYear = 2026 }) => {
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await unlockAdminAction(pin);
      if (result.success) {
        router.refresh();
      } else {
        setError(result.error || 'ACCESS DENIED: INVALID CLEARANCE CODE');
      }
    });
  };

  return (
    <div className="relative min-h-[calc(100vh-80px)] flex items-center justify-center p-4 bg-slate-900 text-slate-100 overflow-hidden">
      {/* Background Carpet Pattern Texture */}
      <CarpetPattern opacity={0.12} />

      <div className="relative z-10 w-full max-w-md bg-slate-950 border-4 border-amber-500 rounded-xl p-6 sm:p-8 shadow-[8px_8px_0px_0px_#ea580c]">
        {/* Header Badge */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl border-3 border-amber-400 bg-amber-400/10 text-amber-400 mb-3 shadow-retro-gold">
            <VentureIcon className="h-12 w-12" />
          </div>
          <span className="text-[11px] font-mono font-black uppercase tracking-widest text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded border border-amber-400/30 mb-2">
            OSI // LEVEL 10 CLEARANCE CHECKPOINT
          </span>
          <h2 className="text-2xl font-black uppercase tracking-tight text-white">
            Command Admin Console
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Master organizer access for creating &amp; managing DragonCon hunt sessions and targets.
          </p>
        </div>

        {/* Security Warning / Error Box */}
        {error && (
          <div className="mb-5 p-3.5 bg-red-950/80 border-2 border-red-500 rounded text-red-200 text-xs font-mono flex items-center gap-2.5 animate-shake">
            <ShieldAlert className="h-5 w-5 text-red-400 shrink-0" />
            <span className="font-bold">{error}</span>
          </div>
        )}

        {/* Passphrase Form */}
        <form onSubmit={handleUnlock} className="space-y-4">
          <div>
            <label className="text-xs font-mono font-bold uppercase text-amber-300 mb-1.5 flex items-center gap-1.5">
              <KeyRound className="h-4 w-4" />
              Master Admin Passphrase
            </label>
            <input
              type="password"
              autoFocus
              placeholder="Enter clearance code..."
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full bg-slate-900 border-2 border-slate-700 text-amber-300 rounded px-3.5 py-2.5 text-base sm:text-lg font-mono tracking-widest uppercase focus:outline-none focus:border-amber-400 placeholder:text-slate-600 font-bold"
            />
          </div>

          <RetroButton
            type="submit"
            variant="gold"
            size="lg"
            className="w-full justify-center bg-amber-500! hover:bg-amber-400! text-slate-950! font-black"
            disabled={isPending || !pin.trim()}
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                VERIFYING CLEARANCE...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                AUTHENTICATE &amp; ENTER
              </span>
            )}
          </RetroButton>
        </form>

        {/* Return Link */}
        <div className="mt-6 pt-5 border-t border-slate-800 text-center">
          <Link
            href={`/${activeYear}`}
            className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-amber-300 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Return to DragonCon {activeYear} Scavenger Hunt
          </Link>
        </div>
      </div>
    </div>
  );
};
