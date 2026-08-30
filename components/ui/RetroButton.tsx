import React, { ButtonHTMLAttributes } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface RetroButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'orange' | 'gold' | 'purple' | 'navy' | 'cream' | 'red' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const RetroButton: React.FC<RetroButtonProps> = ({
  children,
  className,
  variant = 'orange',
  size = 'md',
  fullWidth = false,
  disabled,
  type = 'button',
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-bold uppercase tracking-wider select-none border-2 border-slate-900 rounded-md transition-all cursor-pointer duration-75 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:translate-x-[2px] active:translate-y-[2px] active:shadow-none';

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs shadow-[2px_2px_0px_0px_#0f172a]',
    md: 'px-4 py-2 text-sm shadow-[3px_3px_0px_0px_#0f172a]',
    lg: 'px-6 py-3 text-base shadow-[4px_4px_0px_0px_#0f172a]',
  };

  const variantStyles = {
    orange: 'bg-orange-600 text-white hover:bg-orange-500 active:bg-orange-600',
    gold: 'bg-amber-500 text-slate-950 hover:bg-amber-400 active:bg-amber-500',
    purple: 'bg-purple-800 text-white hover:bg-purple-700 active:bg-purple-800',
    navy: 'bg-slate-900 text-white hover:bg-slate-800 active:bg-slate-900',
    cream: 'bg-[#FAF7F2] text-slate-900 hover:bg-[#f2ece1] active:bg-[#FAF7F2]',
    red: 'bg-red-600 text-white hover:bg-red-500 active:bg-red-600',
    outline: 'bg-transparent text-slate-900 hover:bg-slate-100',
  };

  return (
    <button
      type={type}
      disabled={disabled}
      className={twMerge(
        clsx(
          baseStyles,
          sizeStyles[size],
          variantStyles[variant],
          fullWidth && 'w-full',
          className
        )
      )}
      {...props}
    >
      {children}
    </button>
  );
};
