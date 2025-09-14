
import * as React from 'react';

export const Logo = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 200 60"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <defs>
      <linearGradient id="fire-gradient" x1="50%" y1="0%" x2="50%" y2="100%">
        <stop offset="0%" stopColor="#FF416C" />
        <stop offset="100%" stopColor="#FF4B2B" />
      </linearGradient>
      <linearGradient id="text-gradient" x1="0%" y1="50%" x2="100%" y2="50%">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="100%" stopColor="#E0E0E0" />
      </linearGradient>
    </defs>
    
    {/* Chama */}
    <path
      d="M50 0 C40 15, 30 20, 45 40 C55 25, 60 15, 50 0 Z"
      fill="url(#fire-gradient)"
    >
      <animateTransform
        attributeName="transform"
        type="scale"
        values="1; 1.05; 1"
        dur="2s"
        repeatCount="indefinite"
        additive="sum"
        accumulate="sum"
      />
    </path>
    
    {/* Texto "AceleraGT" */}
    <text
      x="65"
      y="38"
      fontFamily="Montserrat, sans-serif"
      fontSize="32"
      fontWeight="bold"
      fill="url(#text-gradient)"
      letterSpacing="-1"
    >
      AceleraGT
    </text>
  </svg>
);
