'use client';

import React from 'react';
import { Search, Filter, LayoutGrid, ListChecks, X } from 'lucide-react';

interface TargetFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: 'ALL' | 'NEEDED' | 'FOUND';
  onStatusFilterChange: (status: 'ALL' | 'NEEDED' | 'FOUND') => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  categories: string[];
  viewMode: 'list' | 'gallery';
  onViewModeChange: (mode: 'list' | 'gallery') => void;
  counts: { total: number; needed: number; found: number };
}

export const TargetFilterBar: React.FC<TargetFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  selectedCategory,
  onCategoryChange,
  categories,
  viewMode,
  onViewModeChange,
  counts,
}) => {
  return (
    <div className="space-y-3 bg-white p-3 sm:p-4 rounded-lg border-2 border-slate-900 shadow-retro mb-6">
      {/* Search and View Mode Row */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder="Search cosplayers, hints, tags..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-sm bg-venture-cream border-2 border-slate-900 rounded-md focus:outline-none focus:border-orange-600 focus:bg-white placeholder:text-slate-400 font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-700"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* View Toggle */}
        <div className="flex items-center rounded-md border-2 border-slate-900 bg-venture-cream p-0.5 shadow-retro-sm">
          <button
            type="button"
            onClick={() => onViewModeChange('list')}
            className={`p-1.5 rounded text-xs font-bold transition-all ${
              viewMode === 'list'
                ? 'bg-slate-900 text-amber-300'
                : 'text-slate-700 hover:text-slate-950'
            }`}
            title="Checklist View"
          >
            <ListChecks className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('gallery')}
            className={`p-1.5 rounded text-xs font-bold transition-all ${
              viewMode === 'gallery'
                ? 'bg-slate-900 text-amber-300'
                : 'text-slate-700 hover:text-slate-950'
            }`}
            title="Photo Gallery View"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Status Buttons & Category Pill Row */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-200">
        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onStatusFilterChange('ALL')}
            className={`px-2.5 py-1 text-xs font-bold uppercase rounded border-2 border-slate-900 transition-all ${
              statusFilter === 'ALL'
                ? 'bg-slate-900 text-white shadow-retro-sm'
                : 'bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            All ({counts.total})
          </button>
          <button
            type="button"
            onClick={() => onStatusFilterChange('NEEDED')}
            className={`px-2.5 py-1 text-xs font-bold uppercase rounded border-2 border-slate-900 transition-all ${
              statusFilter === 'NEEDED'
                ? 'bg-amber-500 text-slate-950 shadow-retro-sm'
                : 'bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            Needed ({counts.needed})
          </button>
          <button
            type="button"
            onClick={() => onStatusFilterChange('FOUND')}
            className={`px-2.5 py-1 text-xs font-bold uppercase rounded border-2 border-slate-900 transition-all ${
              statusFilter === 'FOUND'
                ? 'bg-emerald-600 text-white shadow-retro-sm'
                : 'bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            Found ({counts.found})
          </button>
        </div>

        {/* Category Filter */}
        {categories.length > 0 && (
          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-slate-500" />
            <select
              value={selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="text-xs font-bold bg-venture-cream text-slate-900 border-2 border-slate-900 rounded px-2 py-1 shadow-[1px_1px_0px_0px_#0f172a] focus:outline-none"
            >
              <option value="ALL">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
};
