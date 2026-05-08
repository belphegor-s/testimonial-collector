import { ImageResponse } from 'next/og';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OgImage() {
  return new ImageResponse(
    <div
      style={{
        background: 'linear-gradient(145deg, #1c1c1f 0%, #09090b 100%)',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      {/* Subtle grid overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Logo badge */}
      <div
        style={{
          width: 100,
          height: 100,
          borderRadius: 24,
          background: '#18181b',
          border: '1.5px solid rgba(255,255,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 36,
          boxShadow: '0 0 0 1px rgba(255,255,255,0.04), 0 24px 48px rgba(0,0,0,0.5)',
        }}
      >
        {/* k rendered as serif text at this size — looks elegant */}
        <span
          style={{
            fontSize: 60,
            fontWeight: 700,
            color: 'white',
            lineHeight: 1,
            fontStyle: 'italic',
            letterSpacing: '-1px',
          }}
        >
          k
        </span>
      </div>

      {/* Wordmark */}
      <div
        style={{
          fontSize: 80,
          fontWeight: 700,
          color: 'white',
          letterSpacing: '-3px',
          lineHeight: 1,
          marginBottom: 24,
        }}
      >
        kudoso
      </div>

      {/* Tagline */}
      <div
        style={{
          fontSize: 28,
          color: '#71717a',
          maxWidth: 680,
          textAlign: 'center',
          lineHeight: 1.45,
          letterSpacing: '-0.3px',
        }}
      >
        Collect testimonials your customers will brag about
      </div>

      {/* Bottom badge */}
      <div
        style={{
          position: 'absolute',
          bottom: 48,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 999,
          padding: '8px 20px',
        }}
      >
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: '#10b981',
          }}
        />
        <span style={{ fontSize: 16, color: '#a1a1aa', letterSpacing: '0.3px' }}>
          kudoso.io
        </span>
      </div>
    </div>,
    size,
  );
}
