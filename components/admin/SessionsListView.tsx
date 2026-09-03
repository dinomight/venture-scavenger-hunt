'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { RetroCard } from '../ui/RetroCard';
import { RetroButton } from '../ui/RetroButton';
import { RetroModal } from '../ui/RetroModal';
import { createYearSession } from '@/lib/actions/years';
import { lockAdminAction } from '@/lib/actions/auth';
import { copyToClipboard } from '@/lib/utils/clipboard';
import type { Year } from '@/lib/db/schema';
import {
  Plus,
  Check,
  Calendar,
  Share2,
  Lock,
  ExternalLink,
  ShieldCheck,
  Layers,
  ChevronRight,
  Settings,
} from 'lucide-react';

export interface YearWithCount extends Year {
  targetCount?: number;
}

interface SessionsListViewProps {
  availableYears: YearWithCount[];
  activeYear: number;
}

export const SessionsListView: React.FC<SessionsListViewProps> = ({
  availableYears,
  activeYear,
}) => {
  const router = useRouter();
  const [showCreateYear, setShowCreateYear] = useState(availableYears.length === 0);
  const [createYearNum, setCreateYearNum] = useState(new Date().getFullYear());
  const [createYearCode, setCreateYearCode] = useState(
    `VENTURE${new Date().getFullYear().toString().slice(-2)}`
  );
  const [createYearTitle, setCreateYearTitle] = useState(
    `DragonCon ${new Date().getFullYear()} Scavenger Hunt`
  );
  const [createRequiredTargets, setCreateRequiredTargets] = useState('15');
  const [copiedCodeYear, setCopiedCodeYear] = useState<number | null>(null);

  const [noticeModal, setNoticeModal] = useState<{
    isOpen: boolean;
    title: string;
    subtitle?: string;
    message: React.ReactNode;
    variant?: 'danger' | 'warning' | 'info' | 'success';
    confirmText?: string;
    onConfirm?: () => void;
  } | null>(null);

  const [isPending, startTransition] = useTransition();

  const handleCreateNewYear = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createYearNum || !createYearCode) return;

    startTransition(async () => {
      try {
        const parsedGoal = createRequiredTargets.trim()
          ? parseInt(createRequiredTargets.trim(), 10)
          : null;
        await createYearSession({
          year: createYearNum,
          title: createYearTitle || `DragonCon ${createYearNum} Scavenger Hunt`,
          joinCode: createYearCode,
          requiredTargets: parsedGoal && !isNaN(parsedGoal) && parsedGoal > 0 ? parsedGoal : null,
        });
        setShowCreateYear(false);
        setNoticeModal({
          isOpen: true,
          title: 'Session Initialized',
          subtitle: `DragonCon ${createYearNum}`,
          message: `DragonCon ${createYearNum} hunt session has been created. Join code: "${createYearCode}".`,
          variant: 'success',
          confirmText: 'Open Target Editor',
          onConfirm: () => {
            setNoticeModal(null);
            router.push(`/admin/${createYearNum}`);
          },
        });
        router.refresh();
      } catch (err) {
        console.error('Failed to create year session:', err);
        setNoticeModal({
          isOpen: true,
          title: 'Creation Failed',
          subtitle: 'Error Alert',
          message:
            err instanceof Error
              ? err.message
              : 'Failed to create year session. A session for this year may already exist.',
          variant: 'danger',
          confirmText: 'Dismiss',
        });
      }
    });
  };

  const handleLockAdmin = () => {
    startTransition(async () => {
      await lockAdminAction();
      document.cookie = 'venture_admin_session=; path=/; max-age=0; SameSite=Lax';
      window.location.href = '/admin';
    });
  };

  const copyJoinCode = async (yearNum: number, code: string) => {
    const success = await copyToClipboard(code);
    if (success) {
      setCopiedCodeYear(yearNum);
      setTimeout(() => setCopiedCodeYear(null), 2000);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Bar / Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 text-white p-3.5 sm:p-4 rounded-xl border-3 border-slate-950 shadow-[4px_4px_0px_0px_#ea580c]">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-amber-400 text-slate-950 font-black border border-slate-900">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono font-black uppercase text-amber-400 bg-slate-950 px-1.5 py-0.5 rounded border border-amber-400/40">
                OSI // LEVEL 10 CLEARANCE
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-black uppercase tracking-tight text-white leading-tight">
              Command Admin Console
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeYear && (
            <Link
              href={`/${activeYear}`}
              className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase text-slate-900 bg-amber-400 hover:bg-amber-300 px-3 py-1.5 rounded border-2 border-slate-950 shadow-retro-sm active:translate-x-px active:translate-y-px"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Live {activeYear} Hunt
            </Link>
          )}

          <button
            onClick={handleLockAdmin}
            disabled={isPending}
            className="inline-flex items-center gap-1 text-xs font-mono font-bold uppercase text-red-200 bg-red-950/80 hover:bg-red-900 px-2.5 py-1.5 rounded border border-red-700 cursor-pointer transition-colors"
            title="Lock Admin Console"
          >
            <Lock className="h-3.5 w-3.5 text-red-400" />
            <span className="hidden sm:inline">Lock</span>
          </button>
        </div>
      </div>

      {/* Global Sessions Overview */}
      <RetroCard className="p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-slate-900 pb-3.5 mb-4">
          <div>
            <span className="text-[10px] font-mono font-black uppercase tracking-widest text-orange-600">
              ALL CONVENTIONS
            </span>
            <h2 className="text-lg font-black uppercase text-slate-900 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-orange-600" />
              Scavenger Hunt Sessions
            </h2>
          </div>

          <RetroButton
            onClick={() => setShowCreateYear(!showCreateYear)}
            variant={showCreateYear ? 'outline' : 'orange'}
            size="sm"
            className="text-xs"
          >
            {showCreateYear ? 'Hide Form' : '+ New Hunt Session'}
          </RetroButton>
        </div>

        {/* Create Session Form (Expandable) */}
        {showCreateYear && (
          <form
            onSubmit={handleCreateNewYear}
            className="mb-6 p-4 bg-amber-50 rounded-lg border-2 border-slate-900 space-y-3 shadow-retro-sm"
          >
            <div className="flex items-center justify-between border-b border-amber-300 pb-2">
              <h3 className="text-xs font-mono font-black uppercase text-slate-900 flex items-center gap-1.5">
                <Plus className="h-4 w-4 text-orange-600" />
                Initialize New DragonCon Hunt Session
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-slate-900 mb-1">
                  Convention Year *
                </label>
                <input
                  type="number"
                  required
                  value={createYearNum}
                  onChange={(e) => {
                    const y = parseInt(e.target.value, 10);
                    setCreateYearNum(y);
                    if (!isNaN(y)) {
                      setCreateYearCode(`VENTURE${y.toString().slice(-2)}`);
                      setCreateYearTitle(`DragonCon ${y} Scavenger Hunt`);
                    }
                  }}
                  className="w-full text-xs bg-white border-2 border-slate-900 rounded p-2 focus:outline-none font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-slate-900 mb-1">
                  Lobby Join Code *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. VENTURE26"
                  value={createYearCode}
                  onChange={(e) => setCreateYearCode(e.target.value.toUpperCase())}
                  className="w-full text-xs font-mono font-bold uppercase bg-white border-2 border-slate-900 rounded p-2 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-slate-900 mb-1">
                  Session Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. DragonCon 2026 Scavenger Hunt"
                  value={createYearTitle}
                  onChange={(e) => setCreateYearTitle(e.target.value)}
                  className="w-full text-xs bg-white border-2 border-slate-900 rounded p-2 focus:outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-slate-900 mb-1">
                  Required Target Goal (Optional)
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="e.g. 15"
                  value={createRequiredTargets}
                  onChange={(e) => setCreateRequiredTargets(e.target.value)}
                  className="w-full text-xs font-mono bg-white border-2 border-slate-900 rounded p-2 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <RetroButton
                type="submit"
                disabled={isPending || !createYearNum || !createYearCode}
                variant="orange"
                size="sm"
                className="text-xs"
              >
                Create &amp; Initialize Session
              </RetroButton>
            </div>
          </form>
        )}

        {/* List of Sessions */}
        {availableYears.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-lg border-2 border-dashed border-slate-300">
            <Calendar className="h-8 w-8 text-slate-400 mx-auto mb-2" />
            <h3 className="text-sm font-black uppercase text-slate-900">
              No Scavenger Hunt Sessions Found
            </h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Create your first DragonCon session using the form above to get started.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableYears.map((y) => (
              <div
                key={y.id}
                className="p-4 rounded-lg border-2 bg-white border-slate-900 shadow-retro flex flex-col justify-between transition-all hover:-translate-y-0.5"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="text-[10px] font-mono font-black uppercase px-1.5 py-0.5 rounded bg-slate-900 text-amber-300">
                        {y.year} CON
                      </span>
                      <h3 className="text-sm font-black uppercase text-slate-900 mt-1">
                        {y.title}
                      </h3>
                    </div>
                  </div>

                  <div className="text-xs font-mono text-slate-600 space-y-1.5 my-3 bg-slate-50 p-2.5 rounded border border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Join Passphrase:</span>
                      <button
                        onClick={() => copyJoinCode(y.year, y.joinCode)}
                        className="font-bold text-slate-950 hover:text-orange-600 inline-flex items-center gap-1 cursor-pointer"
                        title="Click to copy join code"
                      >
                        {y.joinCode}
                        {copiedCodeYear === y.year ? (
                          <Check className="h-3 w-3 text-emerald-600" />
                        ) : (
                          <Share2 className="h-3 w-3 text-slate-400" />
                        )}
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Target Goal:</span>
                      <span className="font-bold text-slate-900">
                        {y.requiredTargets ? `${y.requiredTargets} required` : 'All items'}
                      </span>
                    </div>

                    {y.targetCount !== undefined && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Targets:</span>
                        <span className="font-bold text-slate-900 flex items-center gap-1">
                          <Layers className="h-3 w-3 text-orange-600" />
                          {y.targetCount} cosplayers
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-200 mt-2">
                  <Link
                    href={`/admin/${y.year}`}
                    className="flex-1 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase py-2 px-3 rounded border-2 border-slate-900 cursor-pointer shadow-retro-sm text-center inline-flex items-center justify-center gap-1.5 active:translate-x-px active:translate-y-px"
                  >
                    <Settings className="h-3.5 w-3.5 text-amber-400" />
                    Edit &amp; Targets
                    <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                  </Link>

                  <Link
                    href={`/${y.year}`}
                    className="p-2 text-slate-700 hover:text-slate-950 bg-amber-300 hover:bg-amber-200 rounded border-2 border-slate-900 shadow-retro-sm cursor-pointer active:translate-x-px active:translate-y-px"
                    title={`Open live ${y.year} hunt`}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </RetroCard>

      {/* Notice / Alert Modal */}
      {noticeModal && (
        <RetroModal
          isOpen={noticeModal.isOpen}
          title={noticeModal.title}
          subtitle={noticeModal.subtitle}
          variant={noticeModal.variant || 'info'}
          confirmText={noticeModal.confirmText || 'OK'}
          onConfirm={() => {
            if (noticeModal.onConfirm) {
              noticeModal.onConfirm();
            } else {
              setNoticeModal(null);
            }
          }}
          onClose={() => setNoticeModal(null)}
        >
          <div className="text-sm text-slate-700">{noticeModal.message}</div>
        </RetroModal>
      )}
    </div>
  );
};
