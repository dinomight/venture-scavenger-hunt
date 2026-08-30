import React from 'react';

interface CarpetPatternProps {
  className?: string;
  opacity?: number;
}

export const CarpetPattern: React.FC<CarpetPatternProps> = ({
  className = '',
  opacity = 0.15,
}) => {
  return (
    <svg
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ opacity }}
    >
      <defs>
        <pattern
          id="marriott-carpet-pattern"
          width="40"
          height="40"
          patternUnits="userSpaceOnUse"
        >
          {/* Base background diamond */}
          <polygon
            points="20,0 40,20 20,40 0,20"
            fill="#1E3A5F"
            stroke="#0F172A"
            strokeWidth="1"
          />
          {/* Inner accent diamond */}
          <polygon
            points="20,6 34,20 20,34 6,20"
            fill="#9E2A2B"
          />
          {/* Center gold flare */}
          <polygon
            points="20,12 28,20 20,28 12,20"
            fill="#E0A96D"
          />
          {/* Center teal pin */}
          <circle cx="20" cy="20" r="2" fill="#FAF7F2" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#marriott-carpet-pattern)" />
    </svg>
  );
};
