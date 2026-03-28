'use client';

export function DotGrid({ brandColor }: { brandColor?: string }) {
  const dotColor = brandColor ? `${brandColor}50` : '#71717a';

  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10"
      style={{
        backgroundImage: `radial-gradient(${dotColor} 1.5px, transparent 1.5px)`,
        backgroundSize: '32px 32px',
        opacity: 0.6,
      }}
    />
  );
}
