'use client';

import React, { useEffect } from 'react';
import { RetroCard } from './RetroCard';
import { RetroButton } from './RetroButton';
import {
  X,
  AlertTriangle,
  CheckCircle2,
  Info,
  ShieldAlert,
  Loader2,
} from 'lucide-react';

export type RetroModalVariant = 'danger' | 'warning' | 'info' | 'success';

export interface RetroModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  message?: React.ReactNode;
  children?: React.ReactNode;
  variant?: RetroModalVariant;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void | Promise<void>;
  isPending?: boolean;
  icon?: React.ReactNode;
}

export const RetroModal: React.FC<RetroModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  message,
  children,
  variant = 'info',
  confirmText,
  cancelText,
  onConfirm,
  isPending = false,
  icon,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen || isPending) return;
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isPending, onClose]);

  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          iconBg: 'bg-red-600 text-white',
          subtitleColor: 'text-red-700',
          defaultIcon: <ShieldAlert className="h-5 w-5" />,
          defaultSubtitle: 'SECURITY ALERT',
          confirmVariant: 'red' as const,
          defaultConfirmText: 'Delete',
        };
      case 'warning':
        return {
          iconBg: 'bg-amber-500 text-slate-950',
          subtitleColor: 'text-amber-800',
          defaultIcon: <AlertTriangle className="h-5 w-5" />,
          defaultSubtitle: 'WARNING',
          confirmVariant: 'gold' as const,
          defaultConfirmText: 'Proceed',
        };
      case 'success':
        return {
          iconBg: 'bg-emerald-600 text-white',
          subtitleColor: 'text-emerald-800',
          defaultIcon: <CheckCircle2 className="h-5 w-5" />,
          defaultSubtitle: 'MISSION SUCCESS',
          confirmVariant: 'orange' as const,
          defaultConfirmText: 'Continue',
        };
      case 'info':
      default:
        return {
          iconBg: 'bg-orange-600 text-white',
          subtitleColor: 'text-orange-700',
          defaultIcon: <Info className="h-5 w-5" />,
          defaultSubtitle: 'NOTICE',
          confirmVariant: 'orange' as const,
          defaultConfirmText: 'Acknowledge',
        };
    }
  };

  const variantStyle = getVariantStyles();
  const isConfirmDialog = Boolean(onConfirm || cancelText);

  const handleConfirm = async () => {
    if (onConfirm) {
      await onConfirm();
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-md my-auto animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="retro-modal-title"
      >
        <RetroCard className="bg-venture-cream p-5 sm:p-6 border-4 border-slate-900 shadow-[6px_6px_0px_0px_#0f172a]">
          {/* Header */}
          <div className="flex items-start justify-between border-b-2 border-slate-900 pb-3 mb-4">
            <div className="flex items-center gap-2.5">
              <div
                className={`p-1.5 rounded border border-slate-900 shadow-[1px_1px_0px_0px_#0f172a] ${variantStyle.iconBg}`}
              >
                {icon || variantStyle.defaultIcon}
              </div>
              <div>
                <span
                  className={`text-[10px] font-mono font-black uppercase tracking-wider block ${variantStyle.subtitleColor}`}
                >
                  {subtitle || variantStyle.defaultSubtitle}
                </span>
                <h3
                  id="retro-modal-title"
                  className="text-base sm:text-lg font-black uppercase text-slate-900 leading-tight"
                >
                  {title}
                </h3>
              </div>
            </div>

            <button
              onClick={onClose}
              disabled={isPending}
              className="p-1 text-slate-500 hover:text-slate-950 rounded hover:bg-slate-200 transition-colors disabled:opacity-50"
              title="Close modal"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="space-y-3">
            {message && (
              <div className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
                {message}
              </div>
            )}

            {children}
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-end gap-2.5 pt-4 mt-5 border-t-2 border-slate-200">
            {isConfirmDialog && (
              <RetroButton
                onClick={onClose}
                disabled={isPending}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                {cancelText || 'Cancel'}
              </RetroButton>
            )}

            <RetroButton
              onClick={handleConfirm}
              disabled={isPending}
              variant={variantStyle.confirmVariant}
              size="sm"
              className="text-xs"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  Processing...
                </>
              ) : (
                confirmText || variantStyle.defaultConfirmText
              )}
            </RetroButton>
          </div>
        </RetroCard>
      </div>
    </div>
  );
};
