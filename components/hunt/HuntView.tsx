'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { MissionGauge } from '../progress/MissionGauge';
import { TargetFilterBar } from '../targets/TargetFilterBar';
import { TargetCard } from '../targets/TargetCard';
import { PhotoGallery } from '../submissions/PhotoGallery';
import { PhotoUploadModal } from '../submissions/PhotoUploadModal';
import { Lightbox, type LightboxPhoto } from '../submissions/Lightbox';
import { type TargetWithSubmissions } from '@/lib/actions/targets';
import { deleteSubmissionAction } from '@/lib/actions/submissions';
import { useHuntRealtime } from '@/lib/realtime/useHuntRealtime';
import { Search } from 'lucide-react';

interface HuntViewProps {
  yearNumber: number;
  initialTargets: TargetWithSubmissions[];
  requiredTargets?: number | null;
}

export const HuntView: React.FC<HuntViewProps> = ({
  yearNumber,
  initialTargets,
  requiredTargets,
}) => {
  const router = useRouter();
  const targets = initialTargets;

  // Real-time synchronization
  useHuntRealtime(yearNumber, () => {
    router.refresh();
  });

  // Filters & Views
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'NEEDED' | 'FOUND'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [viewMode, setViewMode] = useState<'list' | 'gallery'>('list');

  // Modals & Lightbox
  const [activeUploadTarget, setActiveUploadTarget] = useState<TargetWithSubmissions | null>(null);
  const [lightboxState, setLightboxState] = useState<{
    isOpen: boolean;
    currentIndex: number;
    photos: LightboxPhoto[];
  }>({
    isOpen: false,
    currentIndex: 0,
    photos: [],
  });

  // Derive counts & categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    targets.forEach((t) => {
      if (t.categoryTag) set.add(t.categoryTag);
    });
    return Array.from(set).sort();
  }, [targets]);

  const counts = useMemo(() => {
    const total = targets.length;
    const found = targets.filter((t) => t.submissions.length > 0 || t.status === 'FOUND').length;
    const needed = total - found;
    return { total, found, needed };
  }, [targets]);

  // Filtered targets
  const filteredTargets = useMemo(() => {
    return targets.filter((target) => {
      const isFound = target.submissions.length > 0 || target.status === 'FOUND';

      // Status check
      if (statusFilter === 'FOUND' && !isFound) return false;
      if (statusFilter === 'NEEDED' && isFound) return false;

      // Category check
      if (selectedCategory !== 'ALL' && target.categoryTag !== selectedCategory) {
        return false;
      }

      // Search query check
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = target.name.toLowerCase().includes(query);
        const matchesDesc = target.description?.toLowerCase().includes(query) ?? false;
        const matchesTag = target.categoryTag?.toLowerCase().includes(query) ?? false;
        const matchesPhotographer = target.submissions.some((s) =>
          s.photographerName?.toLowerCase().includes(query)
        );
        const matchesCaption = target.submissions.some((s) =>
          s.caption?.toLowerCase().includes(query)
        );

        if (!matchesName && !matchesDesc && !matchesTag && !matchesPhotographer && !matchesCaption) {
          return false;
        }
      }

      return true;
    });
  }, [targets, statusFilter, selectedCategory, searchQuery]);

  // Linear photos list for gallery & lightbox
  const allGalleryPhotos = useMemo(() => {
    const photos: LightboxPhoto[] = [];
    for (const target of targets) {
      const sub = target.submissions[0];
      if (sub) {
        photos.push({
          id: sub.id,
          targetId: sub.targetId,
          imageUrl: sub.imageUrl,
          targetName: target.name,
          categoryTag: target.categoryTag,
          photographerName: sub.photographerName,
          caption: sub.caption,
          createdAt: sub.createdAt,
        });
      }
    }
    return photos;
  }, [targets]);

  const handleOpenPhotoView = (target: TargetWithSubmissions) => {
    const sub = target.submissions[0];
    if (!sub) return;

    const targetPhotos: LightboxPhoto[] = [
      {
        id: sub.id,
        targetId: sub.targetId,
        imageUrl: sub.imageUrl,
        targetName: target.name,
        categoryTag: target.categoryTag,
        photographerName: sub.photographerName,
        caption: sub.caption,
        createdAt: sub.createdAt,
      },
    ];

    setLightboxState({
      isOpen: true,
      currentIndex: 0,
      photos: targetPhotos,
    });
  };

  const handleOpenGalleryLightbox = (globalIndex: number) => {
    setLightboxState({
      isOpen: true,
      currentIndex: globalIndex,
      photos: allGalleryPhotos,
    });
  };

  const handleDeleteSubmission = async (submissionId: string, targetId: string) => {
    await deleteSubmissionAction(submissionId, targetId, yearNumber);
    setLightboxState((prev) => ({ ...prev, isOpen: false }));
    router.refresh();
  };

  return (
    <div className="space-y-4 pb-16">
      {/* 1. Mission Progress Gauge */}
      <MissionGauge
        total={counts.total}
        found={counts.found}
        requiredTargets={requiredTargets}
      />

      {/* 2. Target Filter Bar */}
      <TargetFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        categories={categories}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        counts={counts}
      />

      {/* 3. Main Target Content */}
      {viewMode === 'list' ? (
        <div>
          {filteredTargets.length === 0 ? (
            <div className="bg-white border-2 border-slate-900 rounded-lg p-10 text-center shadow-retro">
              <Search className="h-8 w-8 mx-auto text-slate-400 mb-2" />
              <h3 className="text-sm font-black uppercase text-slate-900">
                No matching cosplayers found
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Try adjusting your search query, status, or category filter.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTargets.map((target) => (
                <TargetCard
                  key={target.id}
                  target={target}
                  onUploadClick={(t) => setActiveUploadTarget(t)}
                  onViewPhotoClick={(t) => handleOpenPhotoView(t)}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Gallery View */
        <PhotoGallery
          targets={filteredTargets}
          onOpenLightbox={handleOpenGalleryLightbox}
        />
      )}

      {/* 4. Photo Upload Modal */}
      <PhotoUploadModal
        target={activeUploadTarget}
        yearNumber={yearNumber}
        isOpen={!!activeUploadTarget}
        onClose={() => setActiveUploadTarget(null)}
        onSuccess={() => {
          router.refresh();
        }}
      />

      {/* 5. Fullscreen Lightbox */}
      <Lightbox
        photos={lightboxState.photos}
        currentIndex={lightboxState.currentIndex}
        isOpen={lightboxState.isOpen}
        onClose={() => setLightboxState((prev) => ({ ...prev, isOpen: false }))}
        onNavigate={(newIdx) => setLightboxState((prev) => ({ ...prev, currentIndex: newIdx }))}
        onDeleteSubmission={handleDeleteSubmission}
      />
    </div>
  );
};
