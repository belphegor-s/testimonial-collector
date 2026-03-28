'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, Upload, Circle, Square, RotateCcw, Check, Camera, X, Clock } from 'lucide-react';

interface VideoRecorderProps {
  brandColor: string;
  onVideoReady: (file: File | null) => void;
  currentFile: File | null;
}

export default function VideoRecorder({ brandColor, onVideoReady, currentFile }: VideoRecorderProps) {
  const [mode, setMode] = useState<'idle' | 'preview' | 'recording' | 'countdown' | 'review' | 'file'>('idle');
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [countdown, setCountdown] = useState(3);

  const videoRef = useRef<HTMLVideoElement>(null);
  const reviewRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const getAudioCtx = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioCtxRef.current;
  };

  const playBeep = (type: 'tick' | 'start') => {
    const ctx = getAudioCtx();

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // 🎯 Different tones
    if (type === 'tick') {
      oscillator.frequency.value = 1000; // sharp tick
      gainNode.gain.value = 0.2;
    } else {
      oscillator.frequency.value = 600; // deeper start tone
      gainNode.gain.value = 0.3;
    }

    oscillator.type = 'square'; // classic digital beep

    oscillator.start();

    // duration control
    const duration = type === 'tick' ? 0.08 : 0.18;

    oscillator.stop(ctx.currentTime + duration);
  };

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    return () => {
      stopStream();
      if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    };
  }, [stopStream, recordedUrl]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: true,
      });
      streamRef.current = stream;

      setMode('preview');
    } catch {
      alert('Could not access camera. Please check permissions.');
    }
  };

  useEffect(() => {
    if ((mode === 'preview' || mode === 'countdown' || mode === 'recording') && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.srcObject = streamRef.current;

      videoRef.current.onloadedmetadata = () => {
        videoRef.current?.play().catch(() => {});
      };
    }
  }, [mode]);

  const startCountdown = () => {
    setCountdown(3);
    setMode('countdown');

    let count = 3;

    playBeep('tick'); // 3

    const interval = setInterval(() => {
      count--;

      if (count > 0) {
        playBeep('tick');
      }

      setCountdown(count);

      if (count === 0) {
        clearInterval(interval);
        playBeep('start');
        startRecording();
      }
    }, 1000);
  };

  const startRecording = () => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus') ? 'video/webm;codecs=vp9,opus' : 'video/webm';

    const mr = new MediaRecorder(streamRef.current, { mimeType });
    mr.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      setRecordedBlob(blob);
      const url = URL.createObjectURL(blob);
      setRecordedUrl(url);
      stopStream();
      setMode('review');
    };
    mediaRecorderRef.current = mr;
    mr.start(100);
    setMode('recording');
    setDuration(0);
    timerRef.current = setInterval(() => {
      setDuration((d) => d + 1);
    }, 1000);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const retake = () => {
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    setRecordedBlob(null);
    setRecordedUrl(null);
    setDuration(0);
    onVideoReady(null);
    startCamera();
  };

  const confirmRecording = () => {
    if (recordedBlob) {
      const file = new File([recordedBlob], `recording-${Date.now()}.webm`, { type: 'video/webm' });
      onVideoReady(file);
      setMode('file');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onVideoReady(file);
      setMode('file');
    }
  };

  const reset = () => {
    stopStream();
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    setRecordedBlob(null);
    setRecordedUrl(null);
    setDuration(0);
    onVideoReady(null);
    setMode('idle');
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  // Already has a file from browse
  if (mode === 'file' && (currentFile || recordedBlob)) {
    return (
      <div className="rounded-xl border-2 border-dashed p-4" style={{ borderColor: brandColor + '40' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: brandColor + '15' }}>
            <Video size={18} style={{ color: brandColor }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-zinc-800 truncate">{currentFile?.name || 'Recorded video'}</p>
            <p className="text-xs text-zinc-400">{currentFile ? `${(currentFile.size / (1024 * 1024)).toFixed(1)} MB` : formatTime(duration)}</p>
          </div>
          <button type="button" onClick={reset} className="p-1.5 rounded-lg hover:bg-zinc-100 transition-colors">
            <X size={16} className="text-zinc-400" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <AnimatePresence mode="wait">
        {mode === 'idle' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
            {/* Record option */}
            <button type="button" onClick={startCamera} className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-dashed border-zinc-200 hover:border-zinc-300 transition-all group">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors" style={{ backgroundColor: brandColor + '10' }}>
                <Camera size={18} style={{ color: brandColor }} />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-zinc-700 group-hover:text-zinc-900">Record a video</p>
                <p className="text-xs text-zinc-400">Use your camera to record live</p>
              </div>
            </button>

            {/* Upload option */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-dashed border-zinc-200 hover:border-zinc-300 transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-zinc-50 flex items-center justify-center transition-colors group-hover:bg-zinc-100">
                <Upload size={18} className="text-zinc-400" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-zinc-700 group-hover:text-zinc-900">Upload a video</p>
                <p className="text-xs text-zinc-400">MP4, MOV, WebM up to 50MB</p>
              </div>
            </button>
            <input ref={fileInputRef} type="file" accept="video/mp4,video/quicktime,video/webm" className="hidden" onChange={handleFileSelect} />
          </motion.div>
        )}

        {(mode === 'preview' || mode === 'countdown' || mode === 'recording') && (
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="relative rounded-xl overflow-hidden bg-black">
            <video ref={videoRef} muted playsInline autoPlay className="w-full aspect-video object-cover" style={{ transform: 'scaleX(-1)' }} />

            {/* Countdown overlay */}
            {mode === 'countdown' && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <motion.div key={countdown} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 1.5, opacity: 0 }} className="text-6xl font-bold text-white">
                  {countdown}
                </motion.div>
              </div>
            )}

            {/* Recording indicator */}
            {mode === 'recording' && (
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/60 rounded-full px-3 py-1.5 backdrop-blur-sm">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-white text-xs font-medium tracking-wide">{formatTime(duration)}</span>
              </div>
            )}

            {/* Controls */}
            <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-3">
              {mode === 'preview' && (
                <>
                  <button type="button" onClick={reset} className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors">
                    <X size={18} className="text-white" />
                  </button>
                  <button type="button" onClick={startCountdown} className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg" style={{ backgroundColor: brandColor }}>
                    <Circle size={24} className="text-white" fill="white" />
                  </button>
                </>
              )}
              {mode === 'recording' && (
                <button type="button" onClick={stopRecording} className="w-14 h-14 rounded-full bg-red-500 flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors">
                  <Square size={20} className="text-white" fill="white" />
                </button>
              )}
            </div>
          </motion.div>
        )}

        {mode === 'review' && recordedUrl && (
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
            <div className="relative rounded-xl overflow-hidden bg-black">
              <video ref={reviewRef} src={recordedUrl} controls playsInline className="w-full aspect-video object-cover" />
              <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/60 rounded-full px-2.5 py-1 backdrop-blur-sm">
                <Clock size={12} className="text-white/70" />
                <span className="text-white text-xs">{formatTime(duration)}</span>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button
                type="button"
                onClick={retake}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border border-zinc-200 text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
              >
                <RotateCcw size={14} /> Retake
              </button>
              <button
                type="button"
                onClick={confirmRecording}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium text-white transition-colors"
                style={{ backgroundColor: brandColor }}
              >
                <Check size={14} /> Use this video
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
