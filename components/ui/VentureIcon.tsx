import React from 'react';
import Image from 'next/image';

interface VentureIconProps {
  className?: string;
  size?: number;
  alt?: string;
}

export const VentureIcon: React.FC<VentureIconProps> = ({
  className = 'w-6 h-6',
  size,
  alt = 'Venture Bros Emblem',
}) => {
  return (
    <Image
      src="/venture.png"
      alt={alt}
      width={size || 48}
      height={size || 48}
      className={`inline-block object-contain ${className}`}
      priority
    />
  );
};
