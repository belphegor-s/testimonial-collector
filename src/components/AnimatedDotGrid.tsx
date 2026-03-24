'use client';

export function AnimatedDotGrid({ brandColor }: { brandColor?: string }) {
  const dotColor = brandColor
    ? `${brandColor}50` // slightly stronger so it's visible
    : '#71717a'; // zinc-500 (better than faded grey)

  return (
    <div className="absolute inset-0 -z-10 pointer-events-none">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(${dotColor} 1.5px, transparent 1.5px)`,
          backgroundSize: '32px 32px',
          opacity: 0.6,
        }}
      />
    </div>
  );
}
