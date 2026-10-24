// d:\Kindr\web\src\components\NurserySvgIllustrations.tsx
import React from 'react';

interface SvgProps {
  size?: number;
}

/** 1. Portal 1: Toy Blocks & Bear SVG */
export const PortalToyShelfSvg: React.FC<SvgProps> = ({ size = 42 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
    <rect x="6" y="24" width="16" height="16" rx="5" fill="#FF6B6B" />
    <rect x="26" y="24" width="16" height="16" rx="5" fill="#4ECDC4" />
    <rect x="16" y="8" width="16" height="16" rx="5" fill="#FFD166" />
    <path
      d="M24 12.5L25.4 15.3L28.5 15.8L26.2 18L26.8 21L24 19.5L21.2 21L21.8 18L19.5 15.8L22.6 15.3L24 12.5Z"
      fill="#FFFFFF"
    />
    <circle cx="14" cy="32" r="4" fill="#FFF0EE" />
    <rect x="30" y="28" width="8" height="8" rx="2" fill="#E6FAF8" />
  </svg>
);

/** 2. Portal 2: Camera & Golden Xu Coin SVG */
export const PortalCameraCoinSvg: React.FC<SvgProps> = ({ size = 42 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
    <rect x="5" y="14" width="32" height="24" rx="7" fill="#4ECDC4" />
    <path d="M13 14L16 9H26L29 14H13Z" fill="#288B86" />
    <circle cx="21" cy="26" r="7" fill="#FFFFFF" />
    <circle cx="21" cy="26" r="4" fill="#38B2AC" />
    <circle cx="36" cy="15" r="9" fill="#FFD166" stroke="#F59E0B" strokeWidth="2" />
    <path
      d="M34 11.5V18.5M34 15L38 11.5M35.5 14L38.2 18.5"
      stroke="#8A5A00"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/** 3. Portal 3: Free 0-Xu Gift Box & Heart SVG */
export const PortalGiftHeartSvg: React.FC<SvgProps> = ({ size = 42 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
    <rect x="8" y="22" width="32" height="20" rx="5" fill="#FF6B6B" />
    <rect x="6" y="16" width="36" height="8" rx="4" fill="#FF8787" />
    <rect x="21" y="16" width="6" height="26" fill="#FFD166" />
    <path
      d="M24 16C24 16 17 16 15 11.5C13.5 8 17.5 5.5 20.5 8C22.5 9.8 24 16 24 16Z"
      fill="#FFD166"
    />
    <path
      d="M24 16C24 16 31 16 33 11.5C34.5 8 30.5 5.5 27.5 8C25.5 9.8 24 16 24 16Z"
      fill="#F59E0B"
    />
  </svg>
);

/** 4. Piggy Bank SVG */
export const PiggyBankSvg: React.FC<SvgProps> = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 36 36" fill="none" aria-hidden="true">
    <ellipse cx="18" cy="20" rx="12" ry="9.5" fill="#FF8787" />
    <rect x="11" y="27" width="3.5" height="5" rx="1.75" fill="#E04F4F" />
    <rect x="21" y="27" width="3.5" height="5" rx="1.75" fill="#E04F4F" />
    <ellipse cx="29.5" cy="20.5" rx="3" ry="4" fill="#FF6B6B" />
    <path d="M12 12L9 7L15 9.5Z" fill="#E04F4F" />
    <circle cx="24" cy="17.5" r="1.6" fill="#231F20" />
    <rect x="15" y="12.5" width="6" height="2" rx="1" fill="#8A5A00" />
    <circle cx="18" cy="7" r="4.5" fill="#FFD166" stroke="#F59E0B" strokeWidth="1.5" />
  </svg>
);

/** 5. Category SVGs */
export const CatAllSvg: React.FC<SvgProps> = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 28 28" fill="none" aria-hidden="true">
    <rect x="3" y="3" width="10" height="10" rx="3.5" fill="#FF6B6B" />
    <rect x="15" y="3" width="10" height="10" rx="3.5" fill="#FFD166" />
    <rect x="3" y="15" width="10" height="10" rx="3.5" fill="#4ECDC4" />
    <rect x="15" y="15" width="10" height="10" rx="3.5" fill="#A78BFA" />
  </svg>
);

export const CatSmallToySvg: React.FC<SvgProps> = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 28 28" fill="none" aria-hidden="true">
    <rect x="12.5" y="4" width="3" height="19" rx="1.5" fill="#F59E0B" />
    <rect x="5" y="20" width="18" height="4.5" rx="2.25" fill="#FF6B6B" />
    <rect x="7" y="15" width="14" height="4.5" rx="2.25" fill="#4ECDC4" />
    <rect x="9" y="10" width="10" height="4.5" rx="2.25" fill="#FFD166" />
    <circle cx="14" cy="6.5" r="3" fill="#FF6B6B" />
  </svg>
);

export const CatLargeToySvg: React.FC<SvgProps> = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 28 28" fill="none" aria-hidden="true">
    <rect x="6" y="5" width="5" height="3" rx="1" fill="#E04F4F" />
    <rect x="17" y="5" width="5" height="3" rx="1" fill="#E04F4F" />
    <rect x="4" y="7.5" width="20" height="8" rx="2.5" fill="#FF6B6B" />
    <rect x="7" y="14" width="4" height="2.5" rx="1" fill="#288B86" />
    <rect x="17" y="14" width="4" height="2.5" rx="1" fill="#288B86" />
    <rect x="4" y="16" width="20" height="8" rx="2.5" fill="#4ECDC4" />
  </svg>
);

export const CatBookEhonSvg: React.FC<SvgProps> = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 28 28" fill="none" aria-hidden="true">
    <path
      d="M4 7C4 5.89543 4.89543 5 6 5H13C13.5523 5 14 5.44772 14 6V22C14 21.4477 13.5523 21 13 21H6C4.89543 21 4 20.1046 4 19V7Z"
      fill="#38B2AC"
    />
    <path
      d="M24 7C24 5.89543 23.1046 5 22 5H15C14.4477 5 14 5.44772 14 6V22C14 21.4477 14.4477 21 15 21H22C23.1046 21 24 20.1046 24 19V7Z"
      fill="#4ECDC4"
    />
    <circle cx="9" cy="12" r="2.2" fill="#FFD166" />
    <rect x="16.5" y="10" width="5" height="1.8" rx="0.9" fill="#FFFFFF" />
    <rect x="16.5" y="13.5" width="4" height="1.8" rx="0.9" fill="#FFFFFF" />
  </svg>
);

export const CatBabyClothesSvg: React.FC<SvgProps> = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 28 28" fill="none" aria-hidden="true">
    <path
      d="M9 5L4 9L6.5 13L9 11V21C9 22.6569 10.3431 24 12 24H16C17.6569 24 19 22.6569 19 21V11L21.5 13L24 9L19 5C19 6.65685 16.7614 8 14 8C11.2386 8 9 6.65685 9 5Z"
      fill="#FF6B6B"
    />
    <path
      d="M14 16.5C14 16.5 11.2 14.6 11.2 12.8C11.2 11.7 12.1 11 13.1 11C13.7 11 14 11.4 14 11.4C14 11.4 14.3 11 14.9 11C15.9 11 16.8 11.7 16.8 12.8C16.8 14.6 14 16.5 14 16.5Z"
      fill="#FFD166"
    />
  </svg>
);

export const CatStrollerCribSvg: React.FC<SvgProps> = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 28 28" fill="none" aria-hidden="true">
    <path d="M7 13H21L19 19.5H9L7 13Z" fill="#38B2AC" />
    <path d="M14 6C17.866 6 21 9.13401 21 13H14V6Z" fill="#FF6B6B" />
    <path d="M4 9H7L9 19.5" stroke="#288B86" strokeWidth="2.2" strokeLinecap="round" />
    <circle cx="10" cy="22.5" r="2.6" fill="#FFD166" stroke="#231F20" strokeWidth="1.5" />
    <circle cx="18" cy="22.5" r="2.6" fill="#FFD166" stroke="#231F20" strokeWidth="1.5" />
  </svg>
);

export const CatStudySvg: React.FC<SvgProps> = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 28 28" fill="none" aria-hidden="true">
    <rect x="4" y="5" width="20" height="15" rx="3" fill="#8B5CF6" />
    <rect x="6.5" y="7.5" width="15" height="10" rx="1.5" fill="#F3F0FF" />
    <circle cx="10" cy="12.5" r="2" fill="#FF6B6B" />
    <rect x="14" y="10.5" width="5" height="4" rx="1" fill="#4ECDC4" />
    <path d="M9 20L7 24M19 20L21 24" stroke="#6D28D9" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
);

export const CatCharityGiftSvg: React.FC<SvgProps> = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 28 28" fill="none" aria-hidden="true">
    <rect x="5" y="12" width="18" height="12" rx="3" fill="#38B2AC" />
    <rect x="4" y="8.5" width="20" height="4.5" rx="2" fill="#4ECDC4" />
    <rect x="12.5" y="8.5" width="3" height="15.5" fill="#FFD166" />
    <path
      d="M14 8.5C14 8.5 10 8.5 9 6C8.2 4 10.5 2.8 12.2 4.2C13.2 5.2 14 8.5 14 8.5Z"
      fill="#FF6B6B"
    />
    <path
      d="M14 8.5C14 8.5 18 8.5 19 6C19.8 4 17.5 2.8 15.8 4.2C14.8 5.2 14 8.5 14 8.5Z"
      fill="#FF6B6B"
    />
  </svg>
);

export const CribSvg: React.FC<SvgProps> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 28 28" fill="none" aria-hidden="true">
    <rect x="4" y="7" width="3" height="16" rx="1.5" fill="#F59E0B" />
    <rect x="21" y="7" width="3" height="16" rx="1.5" fill="#F59E0B" />
    <rect x="6" y="10" width="16" height="9" rx="2" fill="#FFD166" />
    <line x1="10" y1="10" x2="10" y2="19" stroke="#8A5A00" strokeWidth="1.8" />
    <line x1="14" y1="10" x2="14" y2="19" stroke="#8A5A00" strokeWidth="1.8" />
    <line x1="18" y1="10" x2="18" y2="19" stroke="#8A5A00" strokeWidth="1.8" />
  </svg>
);
