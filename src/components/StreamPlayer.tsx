'use client';

import { useEffect, useRef } from 'react';

type Props = {
  src: string;
  className?: string;
  controls?: boolean;
  playsInline?: boolean;
  preload?: 'none' | 'metadata' | 'auto';
  poster?: string;
};

export default function StreamPlayer({ src, className, controls = true, playsInline = true, preload = 'metadata', poster }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!src || !videoRef.current) return;

    const video = videoRef.current;

    if (src.endsWith('.m3u8')) {
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Safari: native HLS support
        video.src = src;
      } else {
        // Chrome/Firefox: use hls.js
        import('hls.js').then(({ default: Hls }) => {
          if (Hls.isSupported()) {
            const hls = new Hls({ startLevel: -1 });
            hls.loadSource(src);
            hls.attachMedia(video);
            return () => hls.destroy();
          }
        });
      }
    } else {
      video.src = src;
    }
  }, [src]);

  return (
    <video
      ref={videoRef}
      className={className}
      controls={controls}
      playsInline={playsInline}
      preload={preload}
      poster={poster}
    />
  );
}
