'use client';

import React, { useState, useEffect, useRef } from 'react';
import { RetroCard } from '../ui/RetroCard';
import { RetroButton } from '../ui/RetroButton';
import { compressImage } from '../../lib/utils/image-compression';
import { createSubmissionAction } from '../../lib/actions/submissions';
import { upload } from '@vercel/blob/client';
import { type TargetWithSubmissions } from '../../lib/actions/targets';
import {
  Camera,
  Upload,
  X,
  User,
  MessageSquare,
  Loader2,
  AlertCircle,
} from 'lucide-react';

interface PhotoUploadModalProps {
  target: TargetWithSubmissions | null;
  yearNumber: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const PhotoUploadModal: React.FC<PhotoUploadModalProps> = ({
  target,
  yearNumber,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [photographer, setPhotographer] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('venture_photographer_name') || '';
    }
    return '';
  });
  const [caption, setCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clean up object preview URL
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  if (!isOpen || !target) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      const url = URL.createObjectURL(selected);
      setPreviewUrl(url);
      setErrorMessage(null);
    }
  };

  const fileToDataUrl = (f: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(f);
    });
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setErrorMessage('Please snap or select a photo first.');
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);

    try {
      // 1. Save photographer name to localStorage
      if (photographer.trim()) {
        localStorage.setItem('venture_photographer_name', photographer.trim());
      }

      // 2. Compress image client-side
      setStatusMessage('Optimizing & compressing image for con network...');
      setUploadProgress(25);
      const compressedFile = await compressImage(file, (p) => {
        setUploadProgress(Math.round(25 + (p * 0.25)));
      });

      // 3. Upload to Blob (with fallback for local dev/offline)
      setStatusMessage('Uploading to Compound Blob Storage...');
      setUploadProgress(60);

      let finalImageUrl = '';
      try {
        const newBlob = await upload(
          `sightings/${yearNumber}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`,
          compressedFile,
          {
            access: 'public',
            handleUploadUrl: '/api/upload',
          }
        );
        finalImageUrl = newBlob.url;
      } catch (blobErr) {
        console.warn('Direct Blob upload fallback:', blobErr);
        // Fallback: convert to Base64 data URL for local development/offline
        finalImageUrl = await fileToDataUrl(compressedFile);
      }

      setUploadProgress(90);
      setStatusMessage('Logging sighting in the database...');

      // 4. Create submission record in DB
      await createSubmissionAction({
        targetId: target.id,
        yearNumber,
        imageUrl: finalImageUrl,
        photographerName: photographer.trim() || undefined,
        caption: caption.trim() || undefined,
      });

      setUploadProgress(100);
      setStatusMessage('TARGET ACQUIRED!');

      setTimeout(() => {
        setIsUploading(false);
        setFile(null);
        setPreviewUrl(null);
        setCaption('');
        onSuccess();
        onClose();
      }, 900);
    } catch (err: unknown) {
      const error = err as Error;
      console.error(error);
      setIsUploading(false);
      setErrorMessage(error.message || 'Upload failed. Please check network and retry.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-md my-auto animate-in fade-in zoom-in-95 duration-150">
        <RetroCard className="bg-venture-cream p-5 sm:p-6 border-4 border-slate-900 shadow-[6px_6px_0px_0px_#0f172a]">
          {/* Header */}
          <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-orange-600 text-white rounded border border-slate-900 shadow-[1px_1px_0px_0px_#0f172a]">
                <Camera className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-black uppercase text-orange-600 tracking-wider block">
                  SIGHTING LOG
                </span>
                <h3 className="text-base font-black uppercase text-slate-900 leading-tight">
                  {target.name}
                </h3>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isUploading}
              className="p-1 text-slate-500 hover:text-slate-950 rounded hover:bg-slate-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleUploadSubmit} className="space-y-4">
            {/* Camera / Photo Trigger */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
                id="camera-file-input"
              />

              {!previewUrl ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex flex-col items-center justify-center p-6 border-3 border-dashed border-slate-400 bg-white hover:bg-amber-50/40 rounded-lg cursor-pointer transition-all active:scale-[0.99]"
                >
                  <div className="h-12 w-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mb-2 border-2 border-slate-900 shadow-retro-sm">
                    <Camera className="h-6 w-6" />
                  </div>
                  <span className="text-sm font-black uppercase tracking-wider text-slate-900">
                    Snap or Pick Photo
                  </span>
                  <span className="text-[11px] font-mono text-slate-500 mt-1">
                    Direct camera capture or gallery
                  </span>
                </button>
              ) : (
                <div className="relative rounded-lg overflow-hidden border-2 border-slate-900 bg-slate-950 shadow-retro">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-h-56 w-full object-contain mx-auto"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null);
                      setPreviewUrl(null);
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-black/80 text-white rounded-full hover:bg-red-600 transition-colors"
                    title="Change Photo"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Photographer Name (Remembers user) */}
            <div>
              <label className="text-[11px] font-mono font-bold uppercase text-slate-900 mb-1 flex items-center gap-1">
                <User className="h-3.5 w-3.5 text-slate-500" />
                Photographer / Spotted By (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Hank, Dean, Brock..."
                value={photographer}
                onChange={(e) => setPhotographer(e.target.value)}
                className="w-full text-xs bg-white border-2 border-slate-900 rounded p-2 focus:outline-none focus:border-orange-600 font-medium"
              />
            </div>

            {/* Optional Caption */}
            <div>
              <label className="text-[11px] font-mono font-bold uppercase text-slate-900 mb-1 flex items-center gap-1">
                <MessageSquare className="h-3.5 w-3.5 text-slate-500" />
                Caption / Location Note (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Marriott Atrium, Hyatt Walkway..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="w-full text-xs bg-white border-2 border-slate-900 rounded p-2 focus:outline-none focus:border-orange-600 font-medium"
              />
            </div>

            {/* Progress Display */}
            {isUploading && (
              <div className="space-y-1.5 bg-slate-900 text-white p-3 rounded-md border-2 border-slate-900 font-mono text-xs shadow-retro-sm">
                <div className="flex items-center justify-between text-amber-300 font-bold">
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    {statusMessage}
                  </span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="h-2 w-full bg-slate-950 rounded overflow-hidden border border-slate-700">
                  <div
                    className="h-full bg-orange-500 transition-all duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Error Display */}
            {errorMessage && (
              <div className="flex items-start gap-2 bg-red-100 border-2 border-red-700 text-red-900 p-2.5 rounded text-xs font-mono font-bold">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-300">
              <RetroButton
                onClick={onClose}
                disabled={isUploading}
                variant="outline"
                size="sm"
              >
                Cancel
              </RetroButton>
              <RetroButton
                type="submit"
                disabled={!file || isUploading}
                variant="orange"
                size="md"
                className="flex-1 text-xs"
              >
                {isUploading ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    SAVING...
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <Upload className="h-4 w-4" />
                    LOG SIGHTING
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
