import React from 'react';

type BrandNameProps = {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  theme?: 'dark' | 'light';  // dark = on dark bg, light = on light bg
  showTagline?: boolean;      // whether to show "Est. 1976 · Bikaner" below
  centered?: boolean;
};

export default function BrandName({
  size = 'md',
  theme = 'dark',
  showTagline = false,
  centered = true
}: BrandNameProps) {
  const kashishSize = { sm: 18, md: 24, lg: 36, xl: 52 }[size];
  const handloomSize = { sm: 9, md: 11, lg: 13, xl: 16 }[size];

  const kashishColor = theme === 'dark' ? 'var(--warm-ivory)' : 'var(--ink)';
  const handloomColor = theme === 'dark' ? 'var(--antique-gold)' : 'var(--deep-maroon)';
  const taglineColor = theme === 'dark' ? 'var(--pale-linen)' : '#666666';

  return (
    <div
      className="brand-name-wrapper"
      style={{ alignItems: centered ? 'center' : 'flex-start' }}
    >
      <span
        className="brand-name-kashish"
        style={{ fontSize: kashishSize, color: kashishColor }}
      >
        Kashish
      </span>
      <div className="brand-name-divider-row" style={{ color: handloomColor }}>
        <span className="brand-name-line" />
        <span
          className="brand-name-handloom"
          style={{ fontSize: handloomSize, color: handloomColor }}
        >
          Handloom
        </span>
        <span className="brand-name-line" />
      </div>
      {showTagline && (
        <span className="brand-name-tagline" style={{ color: taglineColor }}>
          Est. 1976 · Bikaner, Rajasthan
        </span>
      )}
    </div>
  );
}
