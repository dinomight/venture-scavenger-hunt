import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface BadgeRibbonProps {
  label: string;
  variant?: 'found' | 'needed' | 'monarch' | 'guild' | 'venture' | 'sphinx' | 'neutral';
  size?: 'sm' | 'md';
  className?: string;
}

export const BadgeRibbon: React.FC<BadgeRibbonProps> = ({
  label,
  variant = 'neutral',
  size = 'md',
  className,
}) => {
  const variantStyles = {
    found: 'bg-emerald-600 text-emerald-50 border-emerald-800',
    needed: 'bg-amber-600 text-amber-50 border-amber-800',
    monarch: 'bg-amber-400 text-slate-950 border-amber-600',
    guild: 'bg-purple-900 text-purple-100 border-purple-950',
    venture: 'bg-orange-600 text-orange-50 border-orange-800',
    sphinx: 'bg-cyan-700 text-cyan-50 border-cyan-900',
    neutral: 'bg-slate-800 text-slate-100 border-slate-900',
  };

  const sizeStyles = {
    sm: 'text-[10px] py-0.5 px-2.5 min-w-[70px]',
    md: 'text-xs py-1 px-3 min-w-[90px]',
  };

  return (
    <div
      className={twMerge(
        clsx(
          'relative inline-flex items-center justify-center font-bold tracking-wider uppercase border-b-2 shadow-[1px_2px_0px_0px_rgba(0,0,0,0.3)]',
          variantStyles[variant],
          sizeStyles[size],
          className
        )
      )}
      style={{
        clipPath: 'polygon(0% 0%, 100% 0%, 100% calc(100% - 6px), 50% 100%, 0% calc(100% - 6px))',
        paddingBottom: '8px',
      }}
    >
      <span className="drop-shadow-sm truncate">{label}</span>
    </div>
  );
};
