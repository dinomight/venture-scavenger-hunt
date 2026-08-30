'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { RetroCard } from '../ui/RetroCard';
import { RetroButton } from '../ui/RetroButton';
import { RetroModal } from '../ui/RetroModal';
import { BulkTargetModal } from '../targets/BulkTargetModal';
import {
  createTarget,
  deleteTarget,
  type TargetWithSubmissions,
} from '@/lib/actions/targets';
import { updateYearSettings } from '@/lib/actions/years';
import { lockAdminAction } from '@/lib/actions/auth';
import { copyToClipboard } from '@/lib/utils/clipboard';
import type { Year } from '@/lib/db/schema';
import {
  Plus,
  Upload,
  Trash2,
  Check,
  KeyRound,
  Layers,
  Share2,
  Target,
  Sparkles,
  Lock,
  ExternalLink,
  ShieldCheck,
  Edit3,
  ArrowLeft,
  Quote,
} from 'lucide-react';

interface SessionEditViewProps {
  yearNumber: number;
  yearData: Year;
  initialTargets: TargetWithSubmissions[];
  availableYears?: Year[];
}

export const SessionEditView: React.FC<SessionEditViewProps> = ({
  yearNumber,
  yearData,
  initialTargets,
}) => {
  const router = useRouter();
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Year Settings Form State
  const [yearTitle, setYearTitle] = useState(yearData.title);
  const [yearJoinCode, setYearJoinCode] = useState(yearData.joinCode);
  const [requiredGoalInput, setRequiredGoalInput] = useState(
    yearData.requiredTargets !== null && yearData.requiredTargets !== undefined
      ? yearData.requiredTargets.toString()
      : ''
  );
  const [savedSettingsSuccess, setSavedSettingsSuccess] = useState(false);

  // Single target form
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newDesc, setNewDesc] = useState('');

  // Deletion and modals
  const [targetToDelete, setTargetToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeletingTarget, setIsDeletingTarget] = useState(false);
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

  const handleUpdateYearSettings = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      const parsedGoal = requiredGoalInput.trim() ? parseInt(requiredGoalInput.trim(), 10) : null;
      await updateYearSettings(yearNumber, {
        title: yearTitle,
        joinCode: yearJoinCode,
        requiredTargets: parsedGoal && !isNaN(parsedGoal) && parsedGoal > 0 ? parsedGoal : null,
      });
      setSavedSettingsSuccess(true);
      setTimeout(() => setSavedSettingsSuccess(false), 2500);
      router.refresh();
    });
  };

  const handleAddSingleTarget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    startTransition(async () => {
      await createTarget({
        yearNumber,
        name: newName,
        categoryTag: newCategory || undefined,
        description: newDesc || undefined,
      });
      setNewName('');
      setNewDesc('');
      router.refresh();
    });
  };

  const handleConfirmDeleteTarget = async () => {
    if (!targetToDelete) return;
    try {
      setIsDeletingTarget(true);
      await deleteTarget(targetToDelete.id, yearNumber);
      setTargetToDelete(null);
      router.refresh();
    } catch (err) {
      console.error('Failed to delete target:', err);
      setTargetToDelete(null);
      setNoticeModal({
        isOpen: true,
        title: 'Delete Failed',
        subtitle: 'Error Alert',
        message: 'Failed to delete target item. Please try again.',
        variant: 'danger',
        confirmText: 'Dismiss',
      });
    } finally {
      setIsDeletingTarget(false);
    }
  };

  const handleLockAdmin = () => {
    startTransition(async () => {
      await lockAdminAction();
      router.push(`/${yearNumber}`);
      router.refresh();
    });
  };

  const inviteLink =
    typeof window !== 'undefined'
      ? `${window.location.origin}/${yearNumber}?join=${yearData.joinCode}`
      : `/${yearNumber}?join=${yearData.joinCode}`;

  const copyInviteLink = async () => {
    const success = await copyToClipboard(inviteLink);
    if (success) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Bar / Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 text-white p-3.5 sm:p-4 rounded-xl border-3 border-slate-950 shadow-[4px_4px_0px_0px_#ea580c]">
        <div className="flex items-center gap-2.5">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase bg-slate-800 hover:bg-slate-700 text-amber-300 px-2.5 py-1.5 rounded border border-slate-700 active:translate-x-px active:translate-y-px transition-colors"
            title="Return to all sessions"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">All Sessions</span>
          </Link>

          <div className="h-5 w-px bg-slate-700 hidden sm:block" />

          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded bg-amber-400 text-slate-950 font-black border border-slate-900 shrink-0">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-mono font-black uppercase text-amber-400 bg-slate-950 px-1.5 py-0.2 rounded border border-amber-400/40">
                  {yearNumber} TARGET EDITOR
                </span>
              </div>
              <h1 className="text-sm sm:text-base font-black uppercase tracking-tight text-white leading-tight">
                {yearData.title}
              </h1>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/${yearNumber}`}
            className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase text-slate-900 bg-amber-400 hover:bg-amber-300 px-3 py-1.5 rounded border-2 border-slate-950 shadow-retro-sm active:translate-x-px active:translate-y-px"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Live {yearNumber} Hunt
          </Link>

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

      {/* Session Settings & Invite Link */}
      <RetroCard className="bg-venture-cream p-5 sm:p-6 border-4 border-slate-900 shadow-[4px_4px_0px_0px_#0f172a]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-slate-900 pb-4 mb-4">
          <div>
            <span className="text-[10px] font-mono font-black uppercase tracking-widest text-orange-600">
              CONVENTION SESSION SETTINGS
            </span>
            <h2 className="text-xl font-black uppercase text-slate-900">
              {yearData.title}
            </h2>
          </div>

          <div className="flex items-center gap-2 bg-amber-300 border-2 border-slate-900 px-3 py-1.5 rounded shadow-retro-sm">
            <KeyRound className="h-4 w-4 text-slate-950" />
            <div className="text-xs font-mono">
              <span className="text-slate-700 block text-[9px] uppercase font-bold leading-none">
                JOIN PASSPHRASE
              </span>
              <span className="text-sm font-black text-slate-950 tracking-wider">
                {yearData.joinCode}
              </span>
            </div>
          </div>
        </div>

        {/* Shareable Invite Link Box */}
        <div className="bg-white p-3 rounded-md border-2 border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-2 shadow-retro-sm mb-4">
          <div className="w-full truncate text-xs font-mono text-slate-700">
            <span className="text-slate-400 font-bold block sm:inline mr-2">
              1-CLICK INVITE LINK:
            </span>
            <span className="select-all text-slate-900 font-bold">
              {inviteLink}
            </span>
          </div>
          <RetroButton
            onClick={copyInviteLink}
            variant="orange"
            size="sm"
            className="w-full sm:w-auto shrink-0 text-xs"
          >
            {copiedLink ? (
              <span className="flex items-center gap-1 text-white">
                <Check className="h-3.5 w-3.5" /> COPIED!
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Share2 className="h-3.5 w-3.5" /> COPY INVITE
              </span>
            )}
          </RetroButton>
        </div>

        {/* Session Settings & Goal Form */}
        <form
          onSubmit={handleUpdateYearSettings}
          className="pt-4 border-t-2 border-slate-300 space-y-3"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-mono font-bold uppercase text-slate-900 mb-1 flex items-center gap-1">
                <Edit3 className="h-3.5 w-3.5 text-slate-700" />
                Session Title
              </label>
              <input
                type="text"
                value={yearTitle}
                onChange={(e) => setYearTitle(e.target.value)}
                className="w-full text-xs font-medium bg-white border-2 border-slate-900 rounded p-1.5 focus:outline-none focus:border-orange-600"
              />
            </div>

            <div>
              <label className="text-[11px] font-mono font-bold uppercase text-slate-900 mb-1 flex items-center gap-1">
                <KeyRound className="h-3.5 w-3.5 text-slate-700" />
                Lobby Join Passphrase
              </label>
              <input
                type="text"
                value={yearJoinCode}
                onChange={(e) => setYearJoinCode(e.target.value.toUpperCase())}
                className="w-full text-xs font-mono font-bold uppercase bg-white border-2 border-slate-900 rounded p-1.5 focus:outline-none focus:border-orange-600"
              />
            </div>

            <div>
              <label className="text-[11px] font-mono font-bold uppercase text-slate-900 mb-1 flex items-center gap-1">
                <Target className="h-3.5 w-3.5 text-orange-600" />
                Target Goal (100% Milestone)
              </label>
              <input
                type="number"
                min="1"
                placeholder={`All (${initialTargets.length})`}
                value={requiredGoalInput}
                onChange={(e) => setRequiredGoalInput(e.target.value)}
                className="w-full text-xs font-mono font-bold bg-white border-2 border-slate-900 rounded p-1.5 focus:outline-none focus:border-orange-600"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2">
            <p className="text-[11px] text-slate-600 leading-tight">
              Sightings beyond the goal activate{' '}
              <span className="font-bold text-purple-700 inline-flex items-center gap-0.5">
                <Sparkles className="h-3 w-3" /> Super-Science Overdrive!
              </span>
            </p>

            <RetroButton
              type="submit"
              disabled={isPending}
              variant="orange"
              size="sm"
              className="text-xs shrink-0"
            >
              {savedSettingsSuccess ? (
                <span className="flex items-center gap-1 text-white">
                  <Check className="h-3.5 w-3.5" /> SETTINGS SAVED!
                </span>
              ) : (
                'Save Session Settings'
              )}
            </RetroButton>
          </div>
        </form>
      </RetroCard>

      {/* Target List Management */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Add Single Target */}
        <div className="lg:col-span-1 space-y-6">
          <RetroCard className="p-5">
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2.5 mb-4">
              <h3 className="text-sm font-black uppercase text-slate-900 flex items-center gap-1.5">
                <Plus className="h-4 w-4 text-orange-600" />
                Add Single Target
              </h3>
            </div>

            <form onSubmit={handleAddSingleTarget} className="space-y-3">
              <div>
                <label className="block text-[11px] font-mono font-bold uppercase text-slate-900 mb-1">
                  Cosplayer / Character Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Brock Samson"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full text-xs bg-venture-cream border-2 border-slate-900 rounded p-2 focus:outline-none focus:border-orange-600 font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold uppercase text-slate-900 mb-1">
                  Category Tag (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Team Venture"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full text-xs bg-venture-cream border-2 border-slate-900 rounded p-2 focus:outline-none focus:border-orange-600 font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold uppercase text-slate-900 mb-1">
                  Character Quote (Optional)
                </label>
                <input
                  type="text"
                  placeholder='e.g. "Go ahead. Take it from me."'
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full text-xs bg-venture-cream border-2 border-slate-900 rounded p-2 focus:outline-none focus:border-orange-600 font-medium"
                />
              </div>

              <RetroButton
                type="submit"
                disabled={isPending || !newName.trim()}
                variant="orange"
                size="sm"
                fullWidth
                className="mt-2 text-xs"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Target
              </RetroButton>
            </form>

            <div className="mt-4 pt-4 border-t border-slate-200">
              <RetroButton
                onClick={() => setIsBulkOpen(true)}
                variant="gold"
                size="sm"
                fullWidth
                className="text-xs"
              >
                <Upload className="h-4 w-4 mr-1.5" />
                Bulk Import Paste / CSV
              </RetroButton>
            </div>
          </RetroCard>
        </div>

        {/* Right Column: Existing Targets */}
        <div className="lg:col-span-2">
          <RetroCard className="p-5">
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2.5 mb-4">
              <h3 className="text-sm font-black uppercase text-slate-900 flex items-center gap-1.5">
                <Layers className="h-4 w-4 text-orange-600" />
                Current Target Checklist ({initialTargets.length})
              </h3>
              <RetroButton
                onClick={() => setIsBulkOpen(true)}
                variant="navy"
                size="sm"
                className="text-xs"
              >
                <Upload className="h-3.5 w-3.5 mr-1" />
                Bulk Ingest
              </RetroButton>
            </div>

            {initialTargets.length === 0 ? (
              <div className="text-center py-12 bg-white rounded border-2 border-dashed border-slate-300">
                <Layers className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs text-slate-500 font-mono">
                  No targets added yet for DragonCon {yearNumber}.
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Add individual targets or paste a bulk list on the left.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-200 max-h-150 overflow-y-auto pr-1">
                {initialTargets.map((target, idx) => (
                  <div
                    key={target.id}
                    className="p-3 flex items-center justify-between gap-2 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-[11px] font-mono font-black text-slate-400 w-5 shrink-0 text-right">
                        #{idx + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-black uppercase text-slate-900 truncate">
                            {target.name}
                          </h4>
                          {target.categoryTag && (
                            <span className="text-[9px] font-mono font-bold bg-slate-200 text-slate-700 px-1 rounded uppercase shrink-0">
                              {target.categoryTag}
                            </span>
                          )}
                        </div>
                        {target.description && (
                          <p className="text-[11px] text-slate-500 italic truncate flex items-center gap-1 mt-0.5">
                            <Quote className="h-2.5 w-2.5 text-amber-500 shrink-0 inline" />
                            <span>&ldquo;{target.description}&rdquo;</span>
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {target.submissions && target.submissions.length > 0 ? (
                        <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-300">
                          {target.submissions.length} PHOTO(S)
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded border border-amber-300">
                          NEEDED
                        </span>
                      )}

                      <button
                        onClick={() => setTargetToDelete({ id: target.id, name: target.name })}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded cursor-pointer transition-colors"
                        title="Delete target"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </RetroCard>
        </div>
      </div>

      {/* Delete Target Modal */}
      {targetToDelete && (
        <RetroModal
          isOpen={true}
          title="Delete Target Item?"
          subtitle="Warning: Irreversible Action"
          variant="danger"
          confirmText={isDeletingTarget ? 'Deleting...' : 'Delete Target'}
          cancelText="Cancel"
          isPending={isDeletingTarget}
          onConfirm={handleConfirmDeleteTarget}
          onClose={() => setTargetToDelete(null)}
        >
          <div className="space-y-2">
            <p className="text-sm text-slate-800 font-medium">
              Are you sure you want to remove{' '}
              <span className="font-bold text-slate-950 underline decoration-red-500">
                &ldquo;{targetToDelete.name}&rdquo;
              </span>{' '}
              from the DragonCon {yearNumber} scavenger hunt list?
            </p>
            <p className="text-xs text-red-600 font-mono">
              All associated sighting submissions for this target will also be removed.
            </p>
          </div>
        </RetroModal>
      )}

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

      {/* Bulk Import Modal */}
      <BulkTargetModal
        yearNumber={yearNumber}
        isOpen={isBulkOpen}
        onClose={() => setIsBulkOpen(false)}
        onSuccess={() => {
          setIsBulkOpen(false);
          router.refresh();
        }}
      />
    </div>
  );
};
