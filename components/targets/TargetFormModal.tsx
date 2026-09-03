'use client';

import React, { useState, useEffect } from 'react';
import { RetroCard } from '../ui/RetroCard';
import { RetroButton } from '../ui/RetroButton';
import { X, Plus, Edit3, Target, Quote, Tag } from 'lucide-react';

interface TargetFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; categoryTag?: string; description?: string }) => Promise<void>;
  initialData?: {
    id?: string;
    name: string;
    categoryTag?: string | null;
    description?: string | null;
  } | null;
  mode: 'add' | 'edit';
  isPending?: boolean;
}

export const TargetFormModal: React.FC<TargetFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode,
  isPending = false,
}) => {
  const [name, setName] = useState('');
  const [categoryTag, setCategoryTag] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName(initialData?.name || '');
      setCategoryTag(initialData?.categoryTag || '');
      setDescription(initialData?.description || '');
      setError(null);
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Cosplayer or character name is required.');
      return;
    }
    setError(null);
    try {
      await onSubmit({
        name: name.trim(),
        categoryTag: categoryTag.trim() || undefined,
        description: description.trim() || undefined,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while saving target.');
    }
  };

  const isEdit = mode === 'edit';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-md my-8 animate-in fade-in zoom-in-95 duration-150">
        <RetroCard className="bg-venture-cream p-5 sm:p-6 border-4 border-slate-900 shadow-[6px_6px_0px_0px_#0f172a]">
          {/* Header */}
          <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <div
                className={`p-1.5 text-white rounded border border-slate-900 ${
                  isEdit ? 'bg-amber-600' : 'bg-orange-600'
                }`}
              >
                {isEdit ? <Edit3 className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              </div>
              <div>
                <h3 className="text-lg font-black uppercase text-slate-900">
                  {isEdit ? 'Edit Target' : 'Add Single Target'}
                </h3>
                <span className="text-[10px] font-mono text-slate-600 uppercase font-bold">
                  {isEdit ? 'Update Target Cosplay Dossier' : 'New Cosplay Checklist Item'}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isPending}
              className="p-1 text-slate-600 hover:text-slate-950 rounded hover:bg-slate-200 cursor-pointer transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-2.5 rounded bg-red-100 border-2 border-red-500 text-xs text-red-900 font-bold font-mono">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono font-bold uppercase text-slate-900 mb-1 flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5 text-orange-600" />
                Cosplayer / Character Name *
              </label>
              <input
                type="text"
                required
                autoFocus
                placeholder="e.g. Brock Samson in speedo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-xs font-bold bg-white border-2 border-slate-900 rounded p-2.5 focus:outline-none focus:border-orange-600 placeholder:text-slate-400 placeholder:font-normal"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-bold uppercase text-slate-900 mb-1 flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5 text-slate-700" />
                Category Tag (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Team Venture, Guild, Henchmen, SPHINX"
                value={categoryTag}
                onChange={(e) => setCategoryTag(e.target.value)}
                className="w-full text-xs bg-white border-2 border-slate-900 rounded p-2.5 focus:outline-none focus:border-orange-600 placeholder:text-slate-400 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-bold uppercase text-slate-900 mb-1 flex items-center gap-1.5">
                <Quote className="h-3.5 w-3.5 text-amber-600" />
                Character Quote or Hint (Optional)
              </label>
              <input
                type="text"
                placeholder='e.g. "Go ahead. Take it from me."'
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full text-xs bg-white border-2 border-slate-900 rounded p-2.5 focus:outline-none focus:border-orange-600 placeholder:text-slate-400 font-medium"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-300">
              <RetroButton
                type="button"
                onClick={onClose}
                disabled={isPending}
                variant="outline"
                size="sm"
              >
                Cancel
              </RetroButton>
              <RetroButton
                type="submit"
                disabled={isPending || !name.trim()}
                variant={isEdit ? 'gold' : 'orange'}
                size="sm"
              >
                {isEdit ? (
                  <span className="flex items-center gap-1.5">
                    <Edit3 className="h-4 w-4" />
                    {isPending ? 'Saving...' : 'Save Changes'}
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <Plus className="h-4 w-4" />
                    {isPending ? 'Adding...' : 'Add Target'}
                  </span>
                )}
              </RetroButton>
            </div>
          </form>
        </RetroCard>
      </div>
    </div>
  );
};
