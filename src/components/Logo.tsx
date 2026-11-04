import React from 'react';
import logoSvg from '../assets/logo.svg';

interface LogoProps {
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ className = '' }) => {
  return (
    <div className={`inline-flex items-center select-none ${className}`}>
      <span className="font-extrabold italic text-2xl sm:text-[27px] tracking-tight leading-none">
        <span
          className="text-transparent select-none inline-block"
          style={{
            WebkitTextStroke: '1.8px #111111',
            letterSpacing: '-0.02em',
          }}
        >
          Bill
        </span>
        <span
          className="text-lime select-none inline-block ml-0.5"
          style={{
            letterSpacing: '-0.02em',
          }}
        >
          Mate
        </span>
      </span>
      {/* Slot file reference */}
      <img src={logoSvg} alt="" className="hidden" aria-hidden="true" />
    </div>
  );
};

