'use client';

import React, { useEffect, useState } from 'react';
import { X, ChevronLeft, ChevronRight, User, Trash2, Loader2 } from 'lucide-react';
import { RetroModal } from '../ui/RetroModal';

export interface LightboxPhoto {
  id?: string;
  targetId?: string;
  imageUrl: string;
  targetName: string;
  categoryTag?: string | null;
  photographerName?: string | null;
  caption?: string | null;
  createdAt?: string | Date | null;
}

interface LightboxProps {
  photos: LightboxPhoto[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (newIndex: number) => void;
  onDeleteSubmission?: (submissionId: string, targetId: string) => Promise<void> | void;
}

export const Lightbox: React.FC<LightboxProps> = ({
  photos,
  currentIndex,
  isOpen,
  onClose,
  onNavigate,
  onDeleteSubmission,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen || showDeleteConfirm || Boolean(errorMessage)) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && currentIndex > 0) onNavigate(currentIndex - 1);
      if (e.key === 'ArrowRight' && currentIndex < photos.length - 1) onNavigate(currentIndex + 1);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, photos.length, onClose, onNavigate, showDeleteConfirm, errorMessage]);

  if (!isOpen || photos.length === 0) return null;

  const currentPhoto = photos[currentIndex];
  if (!currentPhoto) return null;

  const handleConfirmDelete = async () => {
    if (!currentPhoto.id || !currentPhoto.targetId || !onDeleteSubmission) return;

    try {
      setIsDeleting(true);
      await onDeleteSubmission(currentPhoto.id, currentPhoto.targetId);
      setShowDeleteConfirm(false);
    } catch (err) {
      console.error('Failed to delete submission:', err);
      setShowDeleteConfirm(false);
      setErrorMessage('Failed to delete photo submission. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-3 sm:p-6 backdrop-blur-md">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 p-2 bg-slate-900/80 text-white rounded-full hover:bg-orange-600 transition-colors border border-slate-700"
        title="Close Lightbox (Esc)"
      >
        <X className="h-6 w-6" />
      </button>

      {/* Prev / Next Navigation Arrows */}
      {currentIndex > 0 && (
        <button
          onClick={() => onNavigate(currentIndex - 1)}
          className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 z-50 p-2 sm:p-3 bg-slate-900/80 text-white rounded-full hover:bg-orange-600 transition-colors border border-slate-700 shadow-lg"
          title="Previous Photo"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}

      {currentIndex < photos.length - 1 && (
        <button
          onClick={() => onNavigate(currentIndex + 1)}
          className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 z-50 p-2 sm:p-3 bg-slate-900/80 text-white rounded-full hover:bg-orange-600 transition-colors border border-slate-700 shadow-lg"
          title="Next Photo"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}

      {/* Main Container */}
      <div className="flex flex-col items-center max-w-4xl max-h-full w-full">
        {/* Photo Viewport */}
        <div className="relative max-h-[75vh] w-full flex items-center justify-center overflow-hidden rounded-lg border-2 border-slate-800 bg-black">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentPhoto.imageUrl}
            alt={currentPhoto.targetName}
            className="max-h-[72vh] w-auto max-w-full object-contain mx-auto select-none"
          />
        </div>

        {/* Metadata Caption Bar */}
        <div className="w-full mt-3 bg-slate-900 border-2 border-slate-800 text-white p-3 sm:p-4 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-base font-black uppercase text-amber-400">
                {currentPhoto.targetName}
              </span>
              {currentPhoto.categoryTag && (
                <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                  {currentPhoto.categoryTag}
                </span>
              )}
            </div>

            {currentPhoto.caption && (
              <p className="text-xs text-slate-300 mt-1 italic">
                &ldquo;{currentPhoto.caption}&rdquo;
              </p>
            )}
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-4 text-xs text-slate-400 shrink-0">
            {currentPhoto.photographerName && (
              <span className="flex items-center gap-1.5 text-slate-200">
                <User className="h-3.5 w-3.5 text-amber-400" />
                Spotted by <strong className="text-white">{currentPhoto.photographerName}</strong>
              </span>
            )}

            <span className="text-slate-500 font-bold">
              {currentIndex + 1} / {photos.length}
            </span>

            {/* Delete Submission Button */}
            {onDeleteSubmission && currentPhoto.id && currentPhoto.targetId && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isDeleting}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-950/80 hover:bg-red-700 text-red-200 hover:text-white border border-red-800 rounded transition-colors text-xs font-bold disabled:opacity-50 cursor-pointer"
                title="Delete this sighting submission"
              >
                {isDeleting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
                <span>Delete</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <RetroModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete Sighting Photo"
        subtitle="Confirm Deletion"
        message={
          <>
            Are you sure you want to delete this photo sighting for{' '}
            <strong className="text-slate-900 font-bold">
              &ldquo;{currentPhoto.targetName}&rdquo;
            </strong>
            ? This will return the target checklist item to{' '}
            <span className="font-bold text-amber-700">NEEDED</span> status.
          </>
        }
        variant="danger"
        confirmText="Delete Photo"
        cancelText="Cancel"
        isPending={isDeleting}
        onConfirm={handleConfirmDelete}
      />

      {/* Error Alert Modal */}
      <RetroModal
        isOpen={Boolean(errorMessage)}
        onClose={() => setErrorMessage(null)}
        title="Action Failed"
        subtitle="Security Alert"
        message={errorMessage}
        variant="danger"
        confirmText="Dismiss"
      />
    </div>
  );
};
