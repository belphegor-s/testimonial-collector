'use client';

import { useEffect, useRef } from 'react';
import type Hls from 'hls.js';

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
  const hlsRef = useRef<Hls | null>(null);

  useEffect(() => {
    if (!src || !videoRef.current) return;

    const video = videoRef.current;

    if (src.endsWith('.m3u8')) {
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = src;
      } else {
        import('hls.js').then(({ default: HlsLib }) => {
          if (HlsLib.isSupported()) {
            hlsRef.current?.destroy();
            const hls = new HlsLib({ startLevel: -1 });
            hlsRef.current = hls;
            hls.loadSource(src);
            hls.attachMedia(video);
          }
        });
      }
    } else {
      video.src = src;
    }

    return () => {
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };
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
