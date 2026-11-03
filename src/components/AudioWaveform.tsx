import React from 'react';
import { motion } from 'motion/react';

interface AudioWaveformProps {
  isActive: boolean;
  mode?: 'listening' | 'speaking';
  barCount?: number;
  className?: string;
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({
  isActive,
  mode = 'listening',
  barCount = 18,
  className = ''
}) => {
  const bars = Array.from({ length: barCount });

  return (
    <div className={`flex items-center justify-center gap-1 h-10 ${className}`}>
      {bars.map((_, i) => {
        // Vary heights and delays for organic speech wave rhythm
        const minHeight = 4;
        const maxHeight = mode === 'speaking' ? 32 : 24;
        const duration = 0.4 + (i % 5) * 0.12;

        return (
          <motion.div
            key={i}
            animate={
              isActive
                ? {
                    height: [
                      `${minHeight}px`,
                      `${Math.max(minHeight, Math.sin((i / barCount) * Math.PI) * maxHeight)}px`,
                      `${minHeight + 6}px`,
                      `${minHeight}px`
                    ]
                  }
                : { height: `${minHeight}px` }
            }
            transition={
              isActive
                ? {
                    repeat: Infinity,
                    duration,
                    ease: 'easeInOut',
                    delay: (i * 0.05) % 0.4
                  }
                : { duration: 0.3 }
            }
            className={`w-1 rounded-full ${
              mode === 'listening'
                ? 'bg-gradient-to-t from-cyan-500 to-blue-400'
                : 'bg-gradient-to-t from-violet-500 to-indigo-400'
            }`}
          />
        );
      })}
    </div>
  );
};
