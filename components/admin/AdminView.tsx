'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { RetroCard } from '../ui/RetroCard';
import { RetroButton } from '../ui/RetroButton';
import { RetroModal } from '../ui/RetroModal';
import { BulkTargetModal } from '../targets/BulkTargetModal';
import {
  createTarget,
  deleteTarget,
  type TargetWithSubmissions,
} from '@/lib/actions/targets';
import {
  createYearSession,
  updateYearSettings,
} from '@/lib/actions/years';
import type { Year } from '@/lib/db/schema';
import {
  Plus,
  Upload,
  Trash2,
  Check,
  KeyRound,
  Calendar,
  Layers,
  ArrowLeft,
  Share2,
  Target,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';

interface AdminViewProps {
  yearNumber: number;
  yearData: Year;
  initialTargets: TargetWithSubmissions[];
}

export const AdminView: React.FC<AdminViewProps> = ({
  yearNumber,
  yearData,
  initialTargets,
}) => {
  const router = useRouter();
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Goal settings form
  const [requiredGoalInput, setRequiredGoalInput] = useState(
    yearData.requiredTargets !== null && yearData.requiredTargets !== undefined
      ? yearData.requiredTargets.toString()
      : ''
  );
  const [savedGoalSuccess, setSavedGoalSuccess] = useState(false);

  // Single target form
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newDesc, setNewDesc] = useState('');

  // New Year form
  const [createYearNum, setCreateYearNum] = useState(new Date().getFullYear() + 1);
  const [createYearCode, setCreateYearCode] = useState(
    `VENTURE${(new Date().getFullYear() + 1).toString().slice(-2)}`
  );
  const [createYearTitle] = useState(
    `DragonCon ${new Date().getFullYear() + 1} Scavenger Hunt`
  );
  const [createRequiredTargets, setCreateRequiredTargets] = useState('');

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

  const handleUpdateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const parsed = requiredGoalInput.trim() ? parseInt(requiredGoalInput.trim(), 10) : null;
      await updateYearSettings(yearNumber, {
        requiredTargets: parsed && !isNaN(parsed) && parsed > 0 ? parsed : null,
      });
      setSavedGoalSuccess(true);
      setTimeout(() => setSavedGoalSuccess(false), 2500);
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
          title: createYearTitle,
          joinCode: createYearCode,
          requiredTargets: parsedGoal && !isNaN(parsedGoal) && parsedGoal > 0 ? parsedGoal : null,
        });
        setNoticeModal({
          isOpen: true,
          title: 'Session Initialized',
          subtitle: `DragonCon ${createYearNum}`,
          message: `DragonCon ${createYearNum} hunt session has been created and initialized. Join code: "${createYearCode}".`,
          variant: 'success',
          confirmText: `Go to ${createYearNum} Hunt`,
          onConfirm: () => {
            setNoticeModal(null);
            router.push(`/${createYearNum}`);
          },
        });
      } catch (err: unknown) {
        const error = err as Error;
        setNoticeModal({
          isOpen: true,
          title: 'Session Creation Failed',
          subtitle: 'Error Alert',
          message: error.message || 'Failed to create year session.',
          variant: 'danger',
          confirmText: 'Dismiss',
        });
      }
    });
  };

  const inviteLink =
    typeof window !== 'undefined' && yearData
      ? `${window.location.origin}/${yearNumber}?join=${yearData.joinCode}`
      : '';

  const copyInviteLink = () => {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Back to Hunt bar */}
      <div className="flex items-center justify-between">
        <Link
          href={`/${yearNumber}`}
          className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase text-slate-800 bg-white hover:bg-slate-100 px-3 py-1.5 rounded border-2 border-slate-900 shadow-retro-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {yearNumber} Hunt
        </Link>
        <span className="text-xs font-mono font-black uppercase text-orange-600 bg-orange-100 border border-orange-300 px-2.5 py-1 rounded">
          ORGANIZER CONTROL PANEL
        </span>
      </div>

      {/* Session Details & Invite Link */}
      {yearData && (
        <RetroCard className="bg-venture-cream p-5 sm:p-6 border-4 border-slate-900 shadow-[4px_4px_0px_0px_#0f172a]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-slate-900 pb-4 mb-4">
            <div>
              <span className="text-[10px] font-mono font-black uppercase tracking-widest text-orange-600">
                ACTIVE CON SESSION
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
          <div className="bg-white p-3 rounded-md border-2 border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-2 shadow-retro-sm">
            <div className="w-full truncate text-xs font-mono text-slate-700">
              <span className="text-slate-400 font-bold block sm:inline mr-2">
                1-CLICK INVITE LINK:
              </span>
              <span className="select-all text-slate-900 font-bold">
                {inviteLink || `/${yearNumber}?join=${yearData.joinCode}`}
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

          {/* Target Goal / Subset Configuration Box */}
          <form
            onSubmit={handleUpdateGoal}
            className="mt-4 pt-4 border-t-2 border-slate-300 flex flex-col sm:flex-row sm:items-end justify-between gap-3"
          >
            <div className="flex-1">
              <label className="text-[11px] font-mono font-bold uppercase text-slate-900 mb-1 flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5 text-orange-600" />
                Required Targets Goal (Subset for 100% Progress)
              </label>
              <p className="text-[11px] text-slate-600 mb-2 leading-relaxed">
                Set how many cosplayers your friends need to find (e.g. 15 out of{' '}
                {initialTargets.length}). Leave blank to require all {initialTargets.length} targets.
                Sightings beyond the goal trigger{' '}
                <span className="font-bold text-purple-700 inline-flex items-center gap-0.5">
                  <Sparkles className="h-3 w-3" /> Super-Science Overdrive!
                </span>
              </p>
              <div className="flex items-center gap-2 max-w-xs">
                <input
                  type="number"
                  min="1"
                  placeholder={`All (${initialTargets.length})`}
                  value={requiredGoalInput}
                  onChange={(e) => setRequiredGoalInput(e.target.value)}
                  className="w-28 text-xs font-mono font-bold bg-white border-2 border-slate-900 rounded p-1.5 focus:outline-none focus:border-orange-600"
                />
                <span className="text-xs font-mono font-bold text-slate-600">
                  / {initialTargets.length} in list
                </span>
              </div>
            </div>

            <RetroButton
              type="submit"
              disabled={isPending}
              variant="orange"
              size="sm"
              className="text-xs shrink-0"
            >
              {savedGoalSuccess ? (
                <span className="flex items-center gap-1 text-white">
                  <Check className="h-3.5 w-3.5" /> GOAL SAVED!
                </span>
              ) : (
                'Save Target Goal'
              )}
            </RetroButton>
          </form>
        </RetroCard>
      )}

      {/* Target Management Section */}
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

          {/* Create Another Con Year Session */}
          <RetroCard className="p-5 bg-amber-50/50">
            <h3 className="text-sm font-black uppercase text-slate-900 flex items-center gap-1.5 border-b-2 border-slate-900 pb-2.5 mb-3">
              <Calendar className="h-4 w-4 text-amber-600" />
              Create New Year Session
            </h3>

            <form onSubmit={handleCreateNewYear} className="space-y-2.5">
              <div>
                <label className="block text-[11px] font-mono font-bold uppercase text-slate-900 mb-0.5">
                  Year Number
                </label>
                <input
                  type="number"
                  required
                  value={createYearNum}
                  onChange={(e) => setCreateYearNum(parseInt(e.target.value, 10))}
                  className="w-full text-xs bg-white border-2 border-slate-900 rounded p-2 focus:outline-none font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold uppercase text-slate-900 mb-0.5">
                  Lobby Join Code
                </label>
                <input
                  type="text"
                  required
                  placeholder="VENTURE27"
                  value={createYearCode}
                  onChange={(e) => setCreateYearCode(e.target.value.toUpperCase())}
                  className="w-full text-xs font-mono font-bold uppercase bg-white border-2 border-slate-900 rounded p-2 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold uppercase text-slate-900 mb-0.5">
                  Required Target Goal (Optional)
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="e.g. 15 (leave blank for all)"
                  value={createRequiredTargets}
                  onChange={(e) => setCreateRequiredTargets(e.target.value)}
                  className="w-full text-xs font-mono font-bold bg-white border-2 border-slate-900 rounded p-2 focus:outline-none"
                />
              </div>

              <RetroButton
                type="submit"
                disabled={isPending}
                variant="purple"
                size="sm"
                fullWidth
                className="mt-2 text-xs"
              >
                Create Year Session
              </RetroButton>
            </form>
          </RetroCard>
        </div>

        {/* Right Column: Master Target List */}
        <div className="lg:col-span-2">
          <RetroCard className="p-5">
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3 mb-4">
              <div>
                <h3 className="text-base font-black uppercase text-slate-900 flex items-center gap-1.5">
                  <Layers className="h-4 w-4 text-orange-600" />
                  Target Checklist ({initialTargets.length})
                  {yearData.requiredTargets && (
                    <span className="text-[10px] font-mono font-bold uppercase bg-orange-100 text-orange-800 px-2 py-0.5 rounded border border-orange-300">
                      Goal: {yearData.requiredTargets} Required
                    </span>
                  )}
                </h3>
              </div>
              <RetroButton
                onClick={() => setIsBulkOpen(true)}
                variant="gold"
                size="sm"
                className="text-xs"
              >
                <Upload className="h-3.5 w-3.5 mr-1" />
                Bulk Import
              </RetroButton>
            </div>

            {initialTargets.length === 0 ? (
              <div className="text-center py-10 bg-venture-cream rounded-md border-2 border-dashed border-slate-300">
                <p className="text-sm font-bold text-slate-500 uppercase">
                  No targets added for DragonCon {yearNumber} yet
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Use the quick form or bulk import above to add cosplayers.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-200 overflow-hidden rounded-md border-2 border-slate-900 bg-white">
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
                            <span className="text-[9px] font-mono font-bold uppercase bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-300 shrink-0">
                              {target.categoryTag}
                            </span>
                          )}
                        </div>
                        {target.description && (
                          <p className="text-[11px] text-slate-500 truncate italic">
                            &ldquo;{target.description.replace(/^["“”']|["“”']$/g, '')}&rdquo;
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded border ${
                          target.submissions.length > 0 || target.status === 'FOUND'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : 'bg-amber-100 text-amber-800 border-amber-300'
                        }`}
                      >
                        {target.submissions.length > 0
                          ? `${target.submissions.length} PHOTO(S)`
                          : 'NEEDED'}
                      </span>
                      <button
                        onClick={() => setTargetToDelete({ id: target.id, name: target.name })}
                        className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 cursor-pointer transition-colors"
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
      <RetroModal
        isOpen={Boolean(targetToDelete)}
        onClose={() => setTargetToDelete(null)}
        title="Delete Target"
        subtitle="Confirm Deletion"
        message={
          <>
            Are you sure you want to delete{' '}
            <strong className="text-slate-900 font-bold">
              &ldquo;{targetToDelete?.name}&rdquo;
            </strong>{' '}
            from the DragonCon {yearNumber} checklist? This action cannot be undone.
          </>
        }
        variant="danger"
        confirmText="Delete Target"
        cancelText="Cancel"
        isPending={isDeletingTarget}
        onConfirm={handleConfirmDeleteTarget}
      />

      {/* Notice / Alert Modal */}
      {noticeModal && (
        <RetroModal
          isOpen={noticeModal.isOpen}
          onClose={() => setNoticeModal(null)}
          title={noticeModal.title}
          subtitle={noticeModal.subtitle}
          message={noticeModal.message}
          variant={noticeModal.variant || 'info'}
          confirmText={noticeModal.confirmText}
          onConfirm={noticeModal.onConfirm}
        />
      )}

      {/* Bulk Import Modal */}
      <BulkTargetModal
        yearNumber={yearNumber}
        isOpen={isBulkOpen}
        onClose={() => setIsBulkOpen(false)}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
};
