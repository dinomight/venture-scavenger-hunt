'use client';

import React, { useState, useTransition } from 'react';
import { RetroCard } from '../ui/RetroCard';
import { RetroButton } from '../ui/RetroButton';
import { bulkImportTargets } from '@/lib/actions/targets';
import { X, FileText, UploadCloud, CheckCircle2, AlertCircle } from 'lucide-react';

interface BulkTargetModalProps {
  yearNumber: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const BulkTargetModal: React.FC<BulkTargetModalProps> = ({
  yearNumber,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [rawText, setRawText] = useState('');
  const [defaultCategory, setDefaultCategory] = useState('');
  const [isPending, startTransition] = useTransition();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Parse lines: line can be "Name", "Name [Category]", or "Name, Category, Quote"
  const parseLines = (text: string) => {
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    return lines.map((line) => {
      // Check for bracket category: "Character Name [Guild]"
      const bracketMatch = line.match(/^(.*?)\s*\[(.*?)]$/);
      if (bracketMatch) {
        return {
          name: bracketMatch[1].trim(),
          categoryTag: bracketMatch[2].trim() || defaultCategory || undefined,
          description: undefined,
        };
      }

      // Check CSV: "Name, Category, Quote"
      if (line.includes(',')) {
        const parts = line.split(',').map((p) => p.trim());
        return {
          name: parts[0],
          categoryTag: parts[1] || defaultCategory || undefined,
          description: parts[2] || undefined,
        };
      }

      return {
        name: line,
        categoryTag: defaultCategory || undefined,
        description: undefined,
      };
    });
  };

  const parsedItems = parseLines(rawText);

  const handleImport = () => {
    if (parsedItems.length === 0) return;

    startTransition(async () => {
      try {
        const res = await bulkImportTargets(yearNumber, parsedItems);
        setStatusMessage(`Successfully imported ${res.count} target items!`);
        setRawText('');
        if (onSuccess) onSuccess();
        setTimeout(() => {
          setStatusMessage(null);
          onClose();
        }, 1200);
      } catch (err) {
        const error = err as Error;
        setStatusMessage(`Import failed: ${error.message}`);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg animate-in fade-in zoom-in-95 duration-150">
        <RetroCard className="bg-venture-cream p-6 border-4 border-slate-900 shadow-[6px_6px_0px_0px_#0f172a]">
          {/* Header */}
          <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-orange-600 text-white rounded border border-slate-900">
                <FileText className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-black uppercase text-slate-900">
                Bulk Import Targets ({yearNumber})
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-slate-600 hover:text-slate-950 rounded hover:bg-slate-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <p className="text-xs text-slate-600 mb-4 leading-relaxed font-medium">
            Paste your list of cosplayers below. One target per line. You can format as{' '}
            <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-900 font-mono">
              Name [Category]
            </code>
            , CSV{' '}
            <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-900 font-mono">
              Name, Category, Quote
            </code>
            , or simply one character name per line.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-mono font-bold uppercase text-slate-900 mb-1">
                Default Category Tag (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Team Venture or Guild"
                value={defaultCategory}
                onChange={(e) => setDefaultCategory(e.target.value)}
                className="w-full text-xs bg-white border-2 border-slate-900 rounded p-2 focus:outline-none focus:border-orange-600 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-bold uppercase text-slate-900 mb-1">
                Target List (Line by line)
              </label>
              <textarea
                rows={7}
                placeholder={
                  "Brock Samson in speedo [Team Venture]\nDr. Girlfriend [Guild]\nHenchman 21 [Henchmen]\nShore Leave [SPHINX]"
                }
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                className="w-full text-xs font-mono bg-white border-2 border-slate-900 rounded p-2.5 focus:outline-none focus:border-orange-600 placeholder:text-slate-400 leading-relaxed"
              />
            </div>

            {parsedItems.length > 0 && (
              <div className="bg-amber-50 border-2 border-amber-500/50 p-2.5 rounded text-xs text-slate-800">
                <strong>{parsedItems.length} items</strong> ready to import.
              </div>
            )}

            {statusMessage && (
              <div
                className={`p-2.5 rounded border-2 text-xs font-bold font-mono flex items-center gap-2 ${
                  statusMessage.includes('Successfully')
                    ? 'bg-emerald-100 border-emerald-700 text-emerald-900'
                    : 'bg-red-100 border-red-700 text-red-900'
                }`}
              >
                {statusMessage.includes('Successfully') ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-700" />
                )}
                <span>{statusMessage}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-300">
              <RetroButton onClick={onClose} variant="outline" size="sm">
                Cancel
              </RetroButton>
              <RetroButton
                onClick={handleImport}
                disabled={parsedItems.length === 0 || isPending}
                variant="orange"
                size="sm"
              >
                <UploadCloud className="h-4 w-4 mr-1.5" />
                {isPending ? 'Importing...' : `Import ${parsedItems.length} Targets`}
              </RetroButton>
            </div>
          </div>
        </RetroCard>
      </div>
    </div>
  );
};
