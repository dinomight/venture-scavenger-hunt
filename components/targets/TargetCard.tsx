'use client';

import React from 'react';
import { RetroCard } from '../ui/RetroCard';
import { RetroButton } from '../ui/RetroButton';
import { BadgeRibbon } from '../ui/BadgeRibbon';
import { type TargetWithSubmissions } from '@/lib/actions/targets';
import { Camera, CheckCircle2, User, Quote } from 'lucide-react';

interface TargetCardProps {
  target: TargetWithSubmissions;
  onUploadClick: (target: TargetWithSubmissions) => void;
  onViewPhotoClick: (target: TargetWithSubmissions, initialIndex?: number) => void;
}

export const TargetCard: React.FC<TargetCardProps> = ({
  target,
  onUploadClick,
  onViewPhotoClick,
}) => {
  const isFound = target.submissions.length > 0 || target.status === 'FOUND';
  const latestSubmission = target.submissions[target.submissions.length - 1];

  const getCategoryVariant = (category?: string | null) => {
    if (!category) return 'neutral';
    const cat = category.toLowerCase();
    if (cat.includes('venture')) return 'venture';
    if (cat.includes('monarch')) return 'monarch';
    if (cat.includes('guild') || cat.includes('calamitous')) return 'guild';
    if (cat.includes('sphinx')) return 'sphinx';
    return 'neutral';
  };

  return (
    <RetroCard
      className={`flex flex-col justify-between overflow-hidden transition-all ${
        isFound
          ? 'bg-emerald-50/50 border-emerald-900 shadow-[3px_3px_0px_0px_#064e3b]'
          : 'bg-white'
      }`}
    >
      {/* Top Tag & Status Banner */}
      <div className="flex items-start justify-between gap-2 mb-3">
        {target.categoryTag ? (
          <BadgeRibbon
            label={target.categoryTag}
            variant={getCategoryVariant(target.categoryTag)}
            size="sm"
          />
        ) : (
          <BadgeRibbon label="COSPLAYER" variant="neutral" size="sm" />
        )}

        <div className="flex items-center gap-1">
          {isFound ? (
            <span className="inline-flex items-center gap-1 bg-emerald-600 text-white text-[11px] font-mono font-black uppercase px-2 py-0.5 rounded border border-emerald-900 shadow-[1px_1px_0px_0px_#064e3b]">
              <CheckCircle2 className="h-3 w-3" />
              FOUND
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 bg-amber-400 text-slate-950 text-[11px] font-mono font-black uppercase px-2 py-0.5 rounded border border-slate-900 shadow-[1px_1px_0px_0px_#0f172a]">
              NEEDED
            </span>
          )}
        </div>
      </div>

      {/* Target Character Name & Quote */}
      <div className="mb-4">
        <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-slate-900 leading-snug">
          {target.name}
        </h3>
        {target.description && (
          <p className="mt-1.5 text-xs text-slate-600 font-medium italic flex items-start gap-1.5">
            <Quote className="h-3.5 w-3.5 shrink-0 text-amber-500 mt-0.5 rotate-180" />
            <span>&ldquo;{target.description.replace(/^["“”']|["“”']$/g, '')}&rdquo;</span>
          </p>
        )}
      </div>

      {/* Sighting Photo Preview if Available */}
      {isFound && latestSubmission && (
        <div className="mb-4">
          <div
            onClick={() => onViewPhotoClick(target, 0)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onViewPhotoClick(target, 0);
              }
            }}
            title="Click to view full photo"
            className="group relative cursor-pointer overflow-hidden rounded-md border-2 border-slate-900 bg-slate-950 shadow-retro-sm aspect-video focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={latestSubmission.imageUrl}
              alt={`Sighting of ${target.name}`}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
            {/* Overlay credit info */}
            <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/90 via-black/50 to-transparent p-2 text-white flex items-end justify-between">
              <div className="text-[11px] font-mono truncate">
                {latestSubmission.photographerName && (
                  <span className="flex items-center gap-1 text-amber-300 font-bold">
                    <User className="h-3 w-3" />
                    {latestSubmission.photographerName}
                  </span>
                )}
                {latestSubmission.caption && (
                  <span className="text-slate-200 block truncate text-[10px]">
                    &ldquo;{latestSubmission.caption}&rdquo;
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {!isFound && (
        <div className="pt-2 border-t border-slate-200 flex items-center gap-2">
          <RetroButton
            onClick={() => onUploadClick(target)}
            variant="orange"
            size="sm"
            className="flex-1 text-xs"
          >
            <Camera className="h-3.5 w-3.5 mr-1" />
            Log Sighting
          </RetroButton>
        </div>
      )}
    </RetroCard>
  );
};
