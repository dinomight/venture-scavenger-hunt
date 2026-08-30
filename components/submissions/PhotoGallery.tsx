'use client';

import React from 'react';
import { type TargetWithSubmissions } from '@/lib/actions/targets';
import { User, Camera } from 'lucide-react';
import { type LightboxPhoto } from './Lightbox';

interface PhotoGalleryProps {
  targets: TargetWithSubmissions[];
  onOpenLightbox: (photoIndex: number) => void;
}

export const PhotoGallery: React.FC<PhotoGalleryProps> = ({
  targets,
  onOpenLightbox,
}) => {
  // Collect all photos in linear order with their target info
  const allPhotos: LightboxPhoto[] = [];
  const photoMap: { target: TargetWithSubmissions; photoIndex: number; globalIndex: number }[] = [];

  for (const target of targets) {
    for (let i = 0; i < target.submissions.length; i++) {
      const sub = target.submissions[i];
      photoMap.push({
        target,
        photoIndex: i,
        globalIndex: allPhotos.length,
      });
      allPhotos.push({
        imageUrl: sub.imageUrl,
        targetName: target.name,
        categoryTag: target.categoryTag,
        photographerName: sub.photographerName,
        caption: sub.caption,
        createdAt: sub.createdAt,
      });
    }
  }

  if (allPhotos.length === 0) {
    return (
      <div className="bg-white border-2 border-slate-900 rounded-lg p-12 text-center shadow-retro">
        <div className="h-12 w-12 rounded-full bg-amber-100 text-amber-700 mx-auto flex items-center justify-center mb-3 border-2 border-slate-900">
          <Camera className="h-6 w-6" />
        </div>
        <h3 className="text-base font-black uppercase text-slate-900">
          No Sightings Logged Yet
        </h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 font-medium">
          Switch to the checklist view and snap your crew&apos;s first cosplayer photo to populate the gallery!
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
      {photoMap.map(({ target, photoIndex, globalIndex }) => {
        const sub = target.submissions[photoIndex];
        return (
          <div
            key={`${target.id}-${sub.id}`}
            onClick={() => onOpenLightbox(globalIndex)}
            className="group cursor-pointer bg-white p-3 pb-4 rounded-md border-2 border-slate-900 shadow-retro hover:shadow-[5px_5px_0px_0px_#ea580c] hover:-translate-y-0.5 transition-all flex flex-col justify-between"
          >
            {/* Polaroid Photo Frame */}
            <div className="relative aspect-square w-full overflow-hidden rounded bg-slate-950 border border-slate-900 mb-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={sub.imageUrl}
                alt={target.name}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
              {target.categoryTag && (
                <div className="absolute top-2 left-2">
                  <span className="text-[9px] font-mono font-black uppercase bg-slate-950/90 text-amber-300 px-2 py-0.5 rounded border border-amber-400/60 shadow">
                    {target.categoryTag}
                  </span>
                </div>
              )}
            </div>

            {/* Polaroid Caption Info */}
            <div>
              <h4 className="text-xs font-black uppercase text-slate-900 truncate leading-snug">
                {target.name}
              </h4>
              {sub.caption && (
                <p className="text-[11px] text-slate-500 truncate italic mt-0.5">
                  &ldquo;{sub.caption}&rdquo;
                </p>
              )}
              {sub.photographerName && (
                <div className="flex items-center gap-1 text-[10px] font-mono text-slate-700 mt-1 font-bold">
                  <User className="h-3 w-3 text-orange-600" />
                  <span>By {sub.photographerName}</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
