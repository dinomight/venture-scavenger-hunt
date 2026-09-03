'use client';

import React, { useState, useTransition, useRef, useEffect } from 'react';
import { RetroCard } from '../ui/RetroCard';
import { RetroButton } from '../ui/RetroButton';
import { bulkImportTargets } from '@/lib/actions/targets';
import { performOcr, cleanOcrText, type OcrProgressInfo } from '@/lib/utils/ocr';
import {
  X,
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Camera,
  Sparkles,
  RefreshCw,
  Wand2,
  Trash2,
  Image as ImageIcon,
  Loader2,
} from 'lucide-react';

interface BulkTargetModalProps {
  yearNumber: number;
  isOpen: boolean;
  initialMode?: 'ocr' | 'text';
  onClose: () => void;
  onSuccess?: () => void;
}

export const BulkTargetModal: React.FC<BulkTargetModalProps> = ({
  yearNumber,
  isOpen,
  initialMode = 'ocr',
  onClose,
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'text' | 'ocr'>(initialMode);
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  const [prevInitialMode, setPrevInitialMode] = useState(initialMode);
  const [rawText, setRawText] = useState('');
  const [defaultCategory, setDefaultCategory] = useState('');
  const [isPending, startTransition] = useTransition();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // OCR state
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [ocrProgress, setOcrProgress] = useState<OcrProgressInfo | null>(null);
  const [ocrSuccessMsg, setOcrSuccessMsg] = useState<string | null>(null);
  const [ocrError, setOcrError] = useState<string | null>(null);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Synchronize state during render when props change (idiomatic React pattern)
  if (isOpen !== prevIsOpen || initialMode !== prevInitialMode) {
    setPrevIsOpen(isOpen);
    setPrevInitialMode(initialMode);
    if (isOpen) {
      setActiveTab(initialMode);
      setStatusMessage(null);
      setOcrSuccessMsg(null);
      setOcrError(null);
    }
  }

  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  if (!isOpen) return null;

  const handleImageSelected = async (file: File) => {
    setSelectedImage(file);
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setOcrError(null);
    setOcrSuccessMsg(null);

    // Auto-run OCR on selection
    await runOcrOnImage(file);
  };

  const runOcrOnImage = async (file: File) => {
    setIsScanning(true);
    setOcrError(null);
    setOcrProgress({ status: 'Initializing OCR engine...', progress: 0 });

    try {
      const extractedText = await performOcr(file, (info) => {
        let statusLabel = info.status;
        if (info.status === 'loading tesseract core') statusLabel = 'Loading OCR Core...';
        else if (info.status === 'initializing tesseract') statusLabel = 'Initializing Engine...';
        else if (info.status === 'loading language traineddata') statusLabel = 'Loading English Dictionary...';
        else if (info.status === 'initializing api') statusLabel = 'Preparing OCR API...';
        else if (info.status === 'recognizing text') statusLabel = `Recognizing text (${info.progress}%)...`;

        setOcrProgress({
          status: statusLabel,
          progress: info.progress,
        });
      });

      const cleaned = cleanOcrText(extractedText);

      setRawText((prev) => {
        if (!prev.trim()) {
          return cleaned;
        }
        return `${prev.trim()}\n${cleaned}`;
      });

      setOcrSuccessMsg(
        'Text recognized! Edit any non-target rules or headers below before importing.'
      );
    } catch (err) {
      console.error('OCR processing error:', err);
      setOcrError(
        err instanceof Error
          ? err.message
          : 'Failed to process image with OCR. You can enter names manually below.'
      );
    } finally {
      setIsScanning(false);
      setOcrProgress(null);
    }
  };

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

  const handleCleanText = () => {
    setRawText((prev) => cleanOcrText(prev));
  };

  const handleClearText = () => {
    setRawText('');
    setOcrSuccessMsg(null);
  };

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl my-8 animate-in fade-in zoom-in-95 duration-150">
        <RetroCard className="bg-venture-cream p-5 sm:p-6 border-4 border-slate-900 shadow-[6px_6px_0px_0px_#0f172a]">
          {/* Header */}
          <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-orange-600 text-white rounded border border-slate-900">
                {activeTab === 'ocr' ? (
                  <Camera className="h-5 w-5" />
                ) : (
                  <FileText className="h-5 w-5" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-black uppercase text-slate-900">
                  Bulk Ingest Targets ({yearNumber})
                </h3>
                <span className="text-[10px] font-mono text-slate-600 uppercase font-bold">
                  OCR Photo Scanner & Text Ingestion
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-slate-600 hover:text-slate-950 rounded hover:bg-slate-200 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex gap-2 mb-4 p-1 bg-slate-200 rounded-lg border-2 border-slate-900">
            <button
              type="button"
              onClick={() => setActiveTab('ocr')}
              className={`flex-1 py-1.5 px-3 rounded text-xs font-mono font-bold uppercase flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'ocr'
                  ? 'bg-amber-400 text-slate-950 shadow-retro-sm border-2 border-slate-950'
                  : 'text-slate-700 hover:text-slate-950'
              }`}
            >
              <Camera className="h-3.5 w-3.5" />
              Photo OCR Scanner
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('text')}
              className={`flex-1 py-1.5 px-3 rounded text-xs font-mono font-bold uppercase flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'text'
                  ? 'bg-orange-600 text-white shadow-retro-sm border-2 border-slate-950'
                  : 'text-slate-700 hover:text-slate-950'
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              Manual Paste / CSV
            </button>
          </div>

          {/* OCR Section */}
          {activeTab === 'ocr' && (
            <div className="mb-4 bg-white p-3.5 rounded-lg border-2 border-slate-900 shadow-retro-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase text-slate-900 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-orange-600" />
                  Take Picture / Upload List Image
                </span>
                {selectedImage && !isScanning && (
                  <span className="text-[10px] font-mono text-slate-500 truncate max-w-40">
                    {selectedImage.name}
                  </span>
                )}
              </div>

              {/* Action Buttons & Hidden Inputs */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleImageSelected(f);
                }}
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleImageSelected(f);
                }}
              />

              <div className="grid grid-cols-2 gap-2">
                <RetroButton
                  type="button"
                  variant="orange"
                  size="sm"
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={isScanning}
                  className="text-xs flex items-center justify-center"
                >
                  <Camera className="h-4 w-4 mr-1.5" />
                  Take Photo (Camera)
                </RetroButton>

                <RetroButton
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isScanning}
                  className="text-xs flex items-center justify-center"
                >
                  <ImageIcon className="h-4 w-4 mr-1.5" />
                  Upload Image File
                </RetroButton>
              </div>

              {/* Scanning Progress */}
              {isScanning && (
                <div className="bg-amber-50 p-3 rounded border-2 border-amber-400 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-900">
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-orange-600" />
                      {ocrProgress?.status || 'Scanning document with OCR...'}
                    </span>
                    <span>{ocrProgress?.progress || 0}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden border border-slate-900">
                    <div
                      className="bg-orange-600 h-full transition-all duration-200"
                      style={{ width: `${ocrProgress?.progress || 0}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Error Message */}
              {ocrError && (
                <div className="p-2.5 rounded bg-red-100 border border-red-400 text-xs text-red-900 font-mono flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                  <span>{ocrError}</span>
                </div>
              )}

              {/* Success Feedback */}
              {ocrSuccessMsg && !isScanning && (
                <div className="p-2.5 rounded bg-emerald-100 border border-emerald-400 text-xs text-emerald-950 font-medium flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700" />
                  <span>{ocrSuccessMsg}</span>
                </div>
              )}

              {previewUrl && (
                <div className="flex items-center gap-3 pt-1 border-t border-slate-200">
                  <div className="h-12 w-12 rounded border border-slate-900 overflow-hidden shrink-0 bg-slate-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewUrl}
                      alt="Scanned List Preview"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="text-[11px] text-slate-600 leading-tight">
                    Photo captured. You can re-scan or make manual edits in the text area below.
                  </div>
                  {selectedImage && !isScanning && (
                    <button
                      type="button"
                      onClick={() => runOcrOnImage(selectedImage)}
                      className="ml-auto text-xs font-mono font-bold text-orange-600 hover:text-orange-800 flex items-center gap-1 px-2 py-1 rounded bg-orange-50 border border-orange-200 hover:bg-orange-100 cursor-pointer"
                    >
                      <RefreshCw className="h-3 w-3" /> Re-scan
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'text' && (
            <p className="text-xs text-slate-600 mb-3 leading-relaxed font-medium">
              Paste your list of cosplayers below. One target per line. Formats supported:{' '}
              <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-900 font-mono">
                Name [Category]
              </code>
              , CSV{' '}
              <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-900 font-mono">
                Name, Category, Quote
              </code>
              , or character names.
            </p>
          )}

          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-mono font-bold uppercase text-slate-900 mb-1">
                Default Category Tag (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Team Venture, Guild, Henchmen, SPHINX"
                value={defaultCategory}
                onChange={(e) => setDefaultCategory(e.target.value)}
                className="w-full text-xs bg-white border-2 border-slate-900 rounded p-2 focus:outline-none focus:border-orange-600 font-medium"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-mono font-bold uppercase text-slate-900">
                  Target List Editor (Line by line)
                </label>
                <div className="flex items-center gap-2">
                  {rawText.trim() && (
                    <>
                      <button
                        type="button"
                        onClick={handleCleanText}
                        className="text-[10px] font-mono font-bold uppercase text-slate-700 hover:text-orange-600 flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 border border-slate-300 hover:border-orange-400 cursor-pointer"
                        title="Strip leading numbers and checklist boxes ([ ], 1., •)"
                      >
                        <Wand2 className="h-3 w-3 text-orange-600" />
                        Clean Numbering / Bullets
                      </button>
                      <button
                        type="button"
                        onClick={handleClearText}
                        className="text-[10px] font-mono font-bold uppercase text-red-600 hover:text-red-800 flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-red-50 border border-red-200 hover:border-red-400 cursor-pointer"
                        title="Clear all text"
                      >
                        <Trash2 className="h-3 w-3" />
                        Clear
                      </button>
                    </>
                  )}
                </div>
              </div>
              <textarea
                rows={7}
                placeholder={
                  "Brock Samson in speedo [Team Venture]\nDr. Girlfriend [Guild]\nHenchman 21 [Henchmen]\nShore Leave [SPHINX]"
                }
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                className="w-full text-xs font-mono bg-white border-2 border-slate-900 rounded p-2.5 focus:outline-none focus:border-orange-600 placeholder:text-slate-400 leading-relaxed"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Tip: If OCR included header titles or rules text, simply delete those lines before importing.
              </p>
            </div>

            {parsedItems.length > 0 && (
              <div className="bg-amber-50 border-2 border-amber-500/50 p-2.5 rounded text-xs text-slate-800 space-y-1.5">
                <div className="font-bold font-mono text-slate-900 flex items-center justify-between">
                  <span>{parsedItems.length} Target(s) Ready to Import</span>
                  <span className="text-[10px] text-amber-800 font-normal">
                    {defaultCategory ? `Default tag: [${defaultCategory}]` : 'No default tag'}
                  </span>
                </div>
                <div className="max-h-24 overflow-y-auto divide-y divide-amber-200/60 font-mono text-[11px] pr-1">
                  {parsedItems.map((item, i) => (
                    <div key={i} className="py-0.5 flex items-center justify-between gap-2">
                      <span className="truncate">
                        {i + 1}. {item.name}
                      </span>
                      {item.categoryTag && (
                        <span className="text-[9px] bg-amber-200/80 px-1.5 py-0.2 rounded font-bold uppercase shrink-0">
                          {item.categoryTag}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
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
                disabled={parsedItems.length === 0 || isPending || isScanning}
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
