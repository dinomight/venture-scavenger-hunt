'use client';

import React, { useState, useTransition, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { RetroCard } from '../ui/RetroCard';
import { RetroButton } from '../ui/RetroButton';
import { RetroModal } from '../ui/RetroModal';
import { BulkTargetModal } from '../targets/BulkTargetModal';
import { TargetFormModal } from '../targets/TargetFormModal';
import {
  createTarget,
  updateTarget,
  deleteTarget,
  type TargetWithSubmissions,
} from '@/lib/actions/targets';
import { updateYearSettings, deleteYearSession } from '@/lib/actions/years';
import { lockAdminAction } from '@/lib/actions/auth';
import { copyToClipboard } from '@/lib/utils/clipboard';
import { useHuntRealtime } from '@/lib/realtime/useHuntRealtime';
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
  Search,
  Filter,
  X,
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

  // Real-time synchronization
  useHuntRealtime(yearNumber, () => {
    router.refresh();
  });

  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [targetToEdit, setTargetToEdit] = useState<TargetWithSubmissions | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Year Settings Form State
  const [yearTitle, setYearTitle] = useState(yearData.title);
  const [yearJoinCode, setYearJoinCode] = useState(yearData.joinCode);
  const [requiredGoalInput, setRequiredGoalInput] = useState(
    yearData.requiredTargets !== null && yearData.requiredTargets !== undefined
      ? yearData.requiredTargets.toString()
      : ''
  );
  const [savedSettingsSuccess, setSavedSettingsSuccess] = useState(false);

  // Deletion and modals
  const [targetToDelete, setTargetToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeletingTarget, setIsDeletingTarget] = useState(false);
  const [isDeleteSessionModalOpen, setIsDeleteSessionModalOpen] = useState(false);
  const [isDeletingSession, setIsDeletingSession] = useState(false);
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

  const handleConfirmDeleteSession = async () => {
    try {
      setIsDeletingSession(true);
      await deleteYearSession(yearNumber);
      setIsDeleteSessionModalOpen(false);
      router.push('/admin');
      router.refresh();
    } catch (err) {
      console.error('Failed to delete year session:', err);
      setIsDeleteSessionModalOpen(false);
      setNoticeModal({
        isOpen: true,
        title: 'Delete Failed',
        subtitle: 'Error Alert',
        message: 'Failed to delete hunt session. Please try again.',
        variant: 'danger',
        confirmText: 'Dismiss',
      });
    } finally {
      setIsDeletingSession(false);
    }
  };

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

  const handleAddTarget = async (data: {
    name: string;
    categoryTag?: string;
    description?: string;
  }) => {
    await createTarget({
      yearNumber,
      name: data.name,
      categoryTag: data.categoryTag,
      description: data.description,
    });
    router.refresh();
  };

  const handleEditTarget = async (data: {
    name: string;
    categoryTag?: string;
    description?: string;
  }) => {
    if (!targetToEdit) return;
    await updateTarget(targetToEdit.id, yearNumber, {
      name: data.name,
      categoryTag: data.categoryTag,
      description: data.description,
    });
    setTargetToEdit(null);
    router.refresh();
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
      document.cookie = 'venture_admin_session=; path=/; max-age=0; SameSite=Lax';
      window.location.href = '/admin';
    });
  };

  const origin = useSyncExternalStore(
    () => () => {},
    () => window.location.origin,
    () => ''
  );

  const invitePath = `/${yearNumber}?join=${yearData.joinCode}`;
  const inviteLink = origin ? `${origin}${invitePath}` : invitePath;

  const copyInviteLink = async () => {
    const fullLink = typeof window !== 'undefined'
      ? `${window.location.origin}${invitePath}`
      : invitePath;
    const success = await copyToClipboard(fullLink);
    if (success) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const categories = Array.from(
    new Set(initialTargets.map((t) => t.categoryTag).filter((c): c is string => Boolean(c)))
  ).sort();

  const filteredTargets = initialTargets.filter((t) => {
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !query ||
      t.name.toLowerCase().includes(query) ||
      (t.description && t.description.toLowerCase().includes(query)) ||
      (t.categoryTag && t.categoryTag.toLowerCase().includes(query));

    const matchesCategory =
      selectedCategory === 'ALL' || t.categoryTag === selectedCategory;

    return matchesSearch && matchesCategory;
  });

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
            onClick={() => setIsDeleteSessionModalOpen(true)}
            disabled={isPending}
            className="inline-flex items-center gap-1 text-xs font-mono font-bold uppercase text-red-300 hover:text-red-100 bg-red-950 hover:bg-red-900 px-2.5 py-1.5 rounded border border-red-700 cursor-pointer transition-colors"
            title="Delete Hunt Session"
            aria-label="Delete Hunt Session"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Delete Hunt</span>
          </button>

          <button
            onClick={handleLockAdmin}
            disabled={isPending}
            className="inline-flex items-center gap-1 text-xs font-mono font-bold uppercase text-slate-300 bg-slate-800 hover:bg-slate-700 px-2.5 py-1.5 rounded border border-slate-700 cursor-pointer transition-colors"
            title="Lock Admin Console"
          >
            <Lock className="h-3.5 w-3.5 text-amber-400" />
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

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsDeleteSessionModalOpen(true)}
                disabled={isPending}
                className="inline-flex items-center gap-1 text-xs font-mono font-bold uppercase text-red-700 hover:text-red-900 hover:bg-red-50 px-2.5 py-1.5 rounded border border-red-300 hover:border-red-400 transition-colors cursor-pointer"
                title="Delete this hunt session"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete Hunt
              </button>

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
          </div>
        </form>
      </RetroCard>

      {/* Target List Management */}
      <RetroCard className="p-5 sm:p-6 bg-white border-4 border-slate-900 shadow-[4px_4px_0px_0px_#0f172a]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-slate-900 pb-4 mb-4">
          <div>
            <span className="text-[10px] font-mono font-black uppercase tracking-widest text-orange-600">
              TARGET DOSSIER MANAGEMENT
            </span>
            <h3 className="text-lg sm:text-xl font-black uppercase text-slate-900 flex items-center gap-2">
              <Layers className="h-5 w-5 text-orange-600" />
              Current Target Checklist ({initialTargets.length})
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <RetroButton
              onClick={() => setIsAddModalOpen(true)}
              variant="orange"
              size="sm"
              className="text-xs font-black shadow-retro-sm"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Target
            </RetroButton>

            <RetroButton
              onClick={() => setIsBulkOpen(true)}
              variant="navy"
              size="sm"
              className="text-xs font-bold shadow-retro-sm"
            >
              <Upload className="h-3.5 w-3.5 mr-1" />
              Bulk Ingest
            </RetroButton>
          </div>
        </div>

        {/* Filter / Search Bar */}
        {initialTargets.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center gap-2.5 mb-4 bg-venture-cream p-2.5 rounded-lg border-2 border-slate-900 shadow-retro-sm">
            <div className="relative flex-1 w-full">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5 text-slate-400">
                <Search className="h-3.5 w-3.5" />
              </div>
              <input
                type="text"
                placeholder="Search targets by name, quote, or category tag..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-8 py-1.5 text-xs bg-white border-2 border-slate-900 rounded font-medium focus:outline-none focus:border-orange-600 placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-2 flex items-center text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {categories.length > 0 && (
              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                <Filter className="h-3.5 w-3.5 text-slate-600 shrink-0 hidden sm:block" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full sm:w-auto text-xs font-mono font-bold bg-white text-slate-900 border-2 border-slate-900 rounded px-2.5 py-1.5 focus:outline-none focus:border-orange-600 cursor-pointer"
                >
                  <option value="ALL">All Categories ({initialTargets.length})</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat} (
                      {initialTargets.filter((t) => t.categoryTag === cat).length})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {initialTargets.length === 0 ? (
          <div className="text-center py-12 bg-venture-cream/40 rounded-lg border-2 border-dashed border-slate-300 p-6 space-y-4">
            <Layers className="h-10 w-10 text-slate-400 mx-auto" />
            <div>
              <p className="text-sm font-bold text-slate-700 font-mono">
                No targets added yet for DragonCon {yearNumber}.
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Add individual targets or bulk ingest a list using OCR photo scanning or text paste.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <RetroButton
                onClick={() => setIsAddModalOpen(true)}
                variant="orange"
                size="sm"
                className="text-xs font-black"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add First Target
              </RetroButton>
              <RetroButton
                onClick={() => setIsBulkOpen(true)}
                variant="navy"
                size="sm"
                className="text-xs font-bold"
              >
                <Upload className="h-4 w-4 mr-1" />
                Bulk Ingest Targets
              </RetroButton>
            </div>
          </div>
        ) : filteredTargets.length === 0 ? (
          <div className="text-center py-10 bg-venture-cream/40 rounded border-2 border-dashed border-slate-300 p-4">
            <p className="text-xs font-mono font-bold text-slate-600">
              No targets match your search or filter criteria.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('ALL');
              }}
              className="mt-2 text-xs font-mono font-bold text-orange-600 underline hover:text-orange-800 cursor-pointer"
            >
              Reset Search &amp; Filters
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-200 max-h-160 overflow-y-auto pr-1">
            {filteredTargets.map((target, idx) => {
              const globalIdx = initialTargets.findIndex((t) => t.id === target.id);
              return (
                <div
                  key={target.id}
                  className="p-3 sm:p-3.5 flex items-start justify-between gap-3 hover:bg-slate-50 rounded transition-colors group"
                >
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    <span className="text-[11px] font-mono font-black text-slate-400 w-6 shrink-0 text-right pt-0.5">
                      #{globalIdx >= 0 ? globalIdx + 1 : idx + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <h4 className="text-xs sm:text-sm font-black uppercase text-slate-900 break-words leading-tight">
                          {target.name}
                        </h4>
                        {target.categoryTag && (
                          <span className="text-[9px] font-mono font-bold bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded uppercase shrink-0 border border-slate-300">
                            {target.categoryTag}
                          </span>
                        )}
                      </div>
                      {target.description && (
                        <p className="text-[11px] text-slate-600 italic break-words flex items-start gap-1 mt-1 leading-normal">
                          <Quote className="h-3 w-3 text-amber-500 shrink-0 mt-0.5" />
                          <span>&ldquo;{target.description}&rdquo;</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 pt-0.5">
                    {target.submissions && target.submissions.length > 0 ? (
                      <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-300 whitespace-nowrap">
                        FOUND ({target.submissions.length})
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded border border-amber-300 whitespace-nowrap">
                        NEEDED
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => setTargetToEdit(target)}
                      className="p-1.5 text-slate-500 hover:text-amber-800 hover:bg-amber-100 rounded border border-transparent hover:border-amber-300 cursor-pointer transition-colors"
                      title="Edit target name, category, or quote"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setTargetToDelete({ id: target.id, name: target.name })}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded border border-transparent hover:border-red-200 cursor-pointer transition-colors"
                      title="Delete target"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </RetroCard>

      {/* Add Single Target Modal */}
      <TargetFormModal
        isOpen={isAddModalOpen}
        mode="add"
        onSubmit={handleAddTarget}
        onClose={() => setIsAddModalOpen(false)}
      />

      {/* Edit Target Modal */}
      <TargetFormModal
        isOpen={Boolean(targetToEdit)}
        mode="edit"
        initialData={targetToEdit}
        onSubmit={handleEditTarget}
        onClose={() => setTargetToEdit(null)}
      />

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
              Any associated sighting photo for this target will also be removed.
            </p>
          </div>
        </RetroModal>
      )}

      {/* Delete Hunt Session Modal */}
      {isDeleteSessionModalOpen && (
        <RetroModal
          isOpen={true}
          title={`Delete ${yearNumber} Hunt?`}
          subtitle="Warning: Irreversible Action"
          variant="danger"
          confirmText={isDeletingSession ? 'Deleting...' : 'Delete Hunt'}
          cancelText="Cancel"
          isPending={isDeletingSession}
          onConfirm={handleConfirmDeleteSession}
          onClose={() => setIsDeleteSessionModalOpen(false)}
        >
          <div className="space-y-2">
            <p className="text-sm text-slate-800 font-medium">
              Are you sure you want to permanently delete the{' '}
              <span className="font-bold text-slate-950 underline decoration-red-500">
                {yearData.title}
              </span>{' '}
              hunt session?
            </p>
            <p className="text-xs text-red-600 font-mono">
              This will permanently remove all {initialTargets.length} target cosplayers, all participant photo sightings, and all session settings for {yearNumber}.
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
