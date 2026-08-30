import React, { ReactNode } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface RetroCardProps {
  children: ReactNode;
  className?: string;
  hasPunchHole?: boolean;
  highlightBorder?: boolean;
}

export const RetroCard: React.FC<RetroCardProps> = ({
  children,
  className,
  hasPunchHole = false,
  highlightBorder = false,
}) => {
  return (
    <div
      className={twMerge(
        clsx(
          'relative rounded-lg border-2 border-slate-900 bg-white p-4 shadow-retro transition-all',
          highlightBorder && 'border-orange-600 shadow-retro-orange',
          hasPunchHole && 'pt-7',
          className
        )
      )}
    >
      {hasPunchHole && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-8 h-2 bg-slate-900 rounded-full opacity-80" />
      )}
      {children}
    </div>
  );
};
