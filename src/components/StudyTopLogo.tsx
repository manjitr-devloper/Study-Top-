import React from 'react';

export const STUDY_TOP_LOGO_URL = '/assets/aistudio/file_00000000c08481fa98304e6f030e53d7_93183212.png';

export interface StudyTopLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  variant?: 'full' | 'icon' | 'artwork';
  className?: string;
  showTagline?: boolean;
  alt?: string;
}

export const StudyTopLogo: React.FC<StudyTopLogoProps> = ({
  size = 'md',
  variant = 'full',
  className = '',
  showTagline = true,
  alt = 'Study Top Official Logo'
}) => {
  // Dimensions mapping
  const sizeMap = {
    xs: { iconPx: 26, text: 'text-sm', sub: 'text-[9px]', badgePx: 'w-6 h-6' },
    sm: { iconPx: 34, text: 'text-base', sub: 'text-[10px]', badgePx: 'w-8 h-8' },
    md: { iconPx: 44, text: 'text-xl', sub: 'text-[11px]', badgePx: 'w-11 h-11' },
    lg: { iconPx: 56, text: 'text-2xl', sub: 'text-xs', badgePx: 'w-14 h-14' },
    xl: { iconPx: 72, text: 'text-3xl', sub: 'text-sm', badgePx: 'w-18 h-18' },
    hero: { iconPx: 104, text: 'text-4xl', sub: 'text-base', badgePx: 'w-24 h-24 sm:w-28 sm:h-28' }
  };

  const currentSize = sizeMap[size];

  // Official Study Top Emblem Image
  const LogoImg = (
    <img
      src={STUDY_TOP_LOGO_URL}
      alt={alt}
      width={currentSize.iconPx}
      height={currentSize.iconPx}
      className="object-contain rounded-xl drop-shadow-xs select-none pointer-events-none transition-transform duration-200"
      loading="eager"
      onError={(e) => {
        // Fallback to root /logo.png if necessary
        const target = e.currentTarget as HTMLImageElement;
        if (target.src !== '/logo.png') {
          target.src = '/logo.png';
        }
      }}
    />
  );

  // Variant 1: Pure icon badge
  if (variant === 'icon') {
    return (
      <div className={`inline-flex items-center justify-center shrink-0 ${className}`}>
        {LogoImg}
      </div>
    );
  }

  // Variant 2: Full Artwork Card (official badge with artwork)
  if (variant === 'artwork') {
    return (
      <div className={`inline-flex flex-col items-center justify-center ${className}`}>
        <img
          src={STUDY_TOP_LOGO_URL}
          alt={alt}
          className={`${currentSize.badgePx} object-contain rounded-2xl drop-shadow-md select-none`}
          loading="eager"
        />
      </div>
    );
  }

  // Variant 3: Full Logo with Emblem + Styled Brand Typography
  return (
    <div className={`inline-flex items-center gap-2.5 sm:gap-3 select-none ${className}`}>
      <div className="shrink-0 flex items-center justify-center">
        {LogoImg}
      </div>
      <div className="flex flex-col justify-center leading-none">
        <div className={`font-black tracking-tight text-slate-900 flex items-center ${currentSize.text}`}>
          <span>Study</span>
          <span className="text-blue-600 ml-1.5 flex items-center">
            T
            <span className="inline-block relative">
              o
              <svg 
                className="w-2.5 h-2.5 absolute inset-0 m-auto text-white" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="4" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M12 19V5M5 12l7-7 7 7"/>
              </svg>
            </span>
            p
          </span>
        </div>
        {showTagline && (
          <div className={`text-slate-500 font-semibold tracking-wide mt-0.5 flex items-center gap-1.5 ${currentSize.sub}`}>
            <span>Learn</span>
            <span className="text-blue-500 font-black">•</span>
            <span>Create</span>
            <span className="text-blue-500 font-black">•</span>
            <span>Grow</span>
          </div>
        )}
      </div>
    </div>
  );
};
