'use client';

import { motion } from 'framer-motion';

interface ToggleProps {
  checked: boolean;
  onChange: (val: boolean) => void;
  label?: string;
  size?: 'sm' | 'md';
  activeColor?: string;
}

export default function Toggle({ checked, onChange, label, size = 'md', activeColor }: ToggleProps) {
  const isMd = size === 'md';
  const trackW = isMd ? 44 : 36;
  const trackH = isMd ? 24 : 20;
  const knobSize = isMd ? 18 : 14;
  const padding = (trackH - knobSize) / 2;

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onChange(!checked);
        }
      }}
      className="flex items-center gap-3 group outline-none"
    >
      {label && <span className="text-sm text-zinc-600 select-none">{label}</span>}
      <motion.div
        className="relative rounded-full shrink-0 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-400"
        style={{ width: trackW, height: trackH }}
        animate={{
          backgroundColor: checked ? activeColor || '#10b981' : '#d4d4d8',
        }}
        transition={{ duration: 0.2 }}
      >
        <motion.div
          className="absolute rounded-full bg-white"
          style={{
            width: knobSize,
            height: knobSize,
            top: padding,
            boxShadow: '0 1px 3px rgba(0,0,0,0.15), 0 1px 2px rgba(0,0,0,0.1)',
          }}
          animate={{
            left: checked ? trackW - knobSize - padding : padding,
          }}
          transition={{
            type: 'spring',
            stiffness: 500,
            damping: 30,
          }}
        />
      </motion.div>
    </button>
  );
}
