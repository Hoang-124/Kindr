// d:\Kindr\web\src\components\KindrCoin.tsx
import React, { useState } from 'react';

export const KindrCoin: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    style={{ flexShrink: 0, display: 'inline-block', verticalAlign: 'middle' }}
  >
    <circle cx="12" cy="12" r="11" fill="var(--color-coin-gold)" stroke="var(--color-coin-orange)" strokeWidth="2" />
    <circle cx="12" cy="12" r="8" fill="var(--color-warning)" fillOpacity="0.25" />
    <path
      d="M9.5 8V16M9.5 12L14.5 8M11.2 10.6L14.8 16"
      stroke="var(--color-coin-text)"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const KindrLogo: React.FC<{
  size?: number;
  showWordmark?: boolean;
  tagline?: string;
}> = ({ size = 44, showWordmark = true, tagline }) => (
  <div className="kw-brand-logo" style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
    <div
      className="kw-brand-logo-circle"
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        overflow: 'hidden',
        backgroundColor: 'var(--color-card)',
        border: '1.5px solid var(--color-secondary)',
        boxShadow: 'var(--shadow-soft)',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <img
        src="/assets/images/kindr-logo.png"
        alt="Kindr Logo"
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
      />
    </div>
    {showWordmark && (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span
          className="kw-brand-logo-title"
          style={{
            fontSize: Math.max(20, Math.round(size * 0.5)),
            fontWeight: 800,
            color: 'var(--color-primary)',
            letterSpacing: -0.5,
            lineHeight: 1.1,
          }}
        >
          Kindr
        </span>
        {tagline && (
          <span
            className="kw-brand-logo-tagline"
            style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)' }}
          >
            {tagline}
          </span>
        )}
      </div>
    )}
  </div>
);

export const MascotIcon: React.FC<{
  size?: number;
  mood?: 'happy' | 'protective' | 'celebrate' | 'sleeping';
  dialogue?: string;
  full?: boolean;
}> = ({ size = 60, dialogue, full = false }) => {
  const [imgErr, setImgErr] = useState(false);
  const imgSrc = full
    ? '/assets/images/kindr-mascot-full.png'
    : '/assets/images/kindr-mascot.png';

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
      <div
        style={{
          width: size,
          height: size,
          borderRadius: full ? 'var(--radius-md)' : '50%',
          overflow: 'hidden',
          backgroundColor: 'var(--color-card)',
          border: '2px solid var(--color-secondary)',
          boxShadow: 'var(--shadow-soft)',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {!imgErr ? (
          <img
            src={imgSrc}
            alt="Gấu Kindy Mascot"
            onError={() => setImgErr(true)}
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        ) : (
          <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
            <circle cx="32" cy="32" r="30" fill="var(--color-secondary-light)" stroke="var(--color-secondary)" strokeWidth="2" />
            <circle cx="18" cy="18" r="7" fill="var(--color-secondary)" />
            <circle cx="46" cy="18" r="7" fill="var(--color-secondary)" />
            <circle cx="32" cy="34" r="18" fill="var(--color-card)" stroke="var(--color-secondary-dark)" strokeWidth="2" />
            <circle cx="25" cy="30" r="2.5" fill="var(--color-text)" />
            <circle cx="39" cy="30" r="2.5" fill="var(--color-text)" />
            <ellipse cx="32" cy="36" rx="5" ry="3.5" fill="var(--color-primary)" />
          </svg>
        )}
      </div>

      {dialogue && (
        <div
          style={{
            flex: '1 1 200px',
            backgroundColor: 'var(--color-card)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-default)',
            padding: '10px 14px',
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--color-text)',
            boxShadow: 'var(--shadow-soft)',
            lineHeight: 1.45,
          }}
        >
          {dialogue}
        </div>
      )}
    </div>
  );
};

export const Avatar: React.FC<{
  uri?: string | null;
  name?: string;
  size?: number;
}> = ({ uri, name = 'Kindr', size = 40 }) => {
  const [imgError, setImgError] = useState(false);

  const initials = name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('');

  if (uri && !imgError) {
    return (
      <img
        src={uri}
        alt={name}
        referrerPolicy="no-referrer"
        onError={() => setImgError(true)}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          border: '2px solid var(--color-primary-light)',
          flexShrink: 0,
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: 'var(--color-primary-light)',
        color: 'var(--color-primary-dark)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 800,
        fontSize: Math.max(12, Math.floor(size * 0.38)),
        border: '1px solid var(--color-border)',
        flexShrink: 0,
      }}
    >
      {initials || 'K'}
    </div>
  );
};

export const QrCodeVisual: React.FC<{ value: string; size?: number }> = ({
  value,
  size = 180,
}) => {
  const grid = 21;
  const cell = size / grid;
  const cells: boolean[][] = Array.from({ length: grid }, () => Array(grid).fill(false));

  const drawFinder = (r0: number, c0: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
        const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        cells[r0 + r][c0 + c] = isBorder || isInner;
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(0, grid - 7);
  drawFinder(grid - 7, 0);

  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  for (let r = 0; r < grid; r++) {
    for (let c = 0; c < grid; c++) {
      const inFinder =
        (r < 8 && c < 8) || (r < 8 && c >= grid - 8) || (r >= grid - 8 && c < 8);
      if (inFinder) continue;
      const seed = Math.imul(hash ^ (r * 31 + c * 17), 2654435761);
      cells[r][c] = (seed & 3) === 0 || (seed & 5) === 1;
    }
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{
        backgroundColor: 'var(--color-card)',
        padding: 10,
        borderRadius: 'var(--radius-default)',
        border: '1px solid var(--color-border)',
      }}
    >
      {cells.map((row, r) =>
        row.map((filled, c) =>
          filled ? (
            <rect
              key={`${r}_${c}`}
              x={c * cell}
              y={r * cell}
              width={cell + 0.4}
              height={cell + 0.4}
              fill="var(--color-text)"
            />
          ) : null
        )
      )}
    </svg>
  );
};
