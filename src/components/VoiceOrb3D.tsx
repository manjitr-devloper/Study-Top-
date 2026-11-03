import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Mic, Volume2, Cpu } from 'lucide-react';

export type AssistantState = 'idle' | 'listening' | 'processing' | 'speaking';

interface VoiceOrb3DProps {
  state: AssistantState;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const VoiceOrb3D: React.FC<VoiceOrb3DProps> = ({
  state,
  size = 'md',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-20 h-20',
    md: 'w-36 h-36',
    lg: 'w-48 h-48 sm:w-56 sm:h-56'
  };

  const orbDimensions = {
    sm: 80,
    md: 144,
    lg: 224
  };

  const currentDim = orbDimensions[size];

  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      {/* Outer ambient radiant glows based on state */}
      <motion.div
        animate={{
          scale: state === 'speaking' ? [1, 1.25, 1.05] : state === 'listening' ? [1, 1.15, 1] : [1, 1.05, 1],
          opacity: state === 'speaking' ? [0.6, 0.9, 0.6] : state === 'listening' ? [0.5, 0.8, 0.5] : [0.3, 0.5, 0.3]
        }}
        transition={{
          repeat: Infinity,
          duration: state === 'speaking' ? 1.5 : state === 'listening' ? 1.8 : 3,
          ease: 'easeInOut'
        }}
        className={`absolute rounded-full blur-2xl pointer-events-none ${
          state === 'listening'
            ? 'bg-gradient-to-tr from-cyan-400 via-blue-500 to-teal-300'
            : state === 'processing'
            ? 'bg-gradient-to-tr from-violet-500 via-fuchsia-500 to-indigo-500'
            : state === 'speaking'
            ? 'bg-gradient-to-tr from-blue-500 via-indigo-500 to-violet-400'
            : 'bg-gradient-to-tr from-blue-400/50 via-indigo-400/40 to-violet-400/40'
        } ${sizeClasses[size]}`}
      />

      {/* Rotating orbital particle rings for processing/thinking state */}
      {state === 'processing' && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2.5, ease: 'linear' }}
          className="absolute inset-[-12px] rounded-full border-2 border-dashed border-violet-400/60 pointer-events-none"
        />
      )}

      {/* Pulsing acoustic rings for listening state */}
      {state === 'listening' && (
        <>
          <motion.div
            animate={{ scale: [1, 1.45], opacity: [0.8, 0] }}
            transition={{ repeat: Infinity, duration: 1.6, ease: 'easeOut' }}
            className="absolute inset-0 rounded-full border-2 border-cyan-400/80 pointer-events-none"
          />
          <motion.div
            animate={{ scale: [1, 1.3], opacity: [0.9, 0] }}
            transition={{ repeat: Infinity, duration: 1.6, ease: 'easeOut', delay: 0.4 }}
            className="absolute inset-0 rounded-full border border-teal-300/80 pointer-events-none"
          />
        </>
      )}

      {/* Main 3D Holographic AI Sphere */}
      <motion.div
        animate={{
          scale: state === 'speaking' ? [1, 1.08, 0.98, 1.04] : state === 'listening' ? [1, 1.04, 1] : [1, 1.02, 1],
          y: state === 'idle' ? [0, -6, 0] : 0
        }}
        transition={{
          repeat: Infinity,
          duration: state === 'speaking' ? 1.4 : state === 'listening' ? 1.8 : 3.5,
          ease: 'easeInOut'
        }}
        style={{
          boxShadow: state === 'speaking'
            ? '0 0 50px rgba(99, 102, 241, 0.6), inset 0 0 30px rgba(255, 255, 255, 0.5)'
            : state === 'listening'
            ? '0 0 45px rgba(6, 182, 212, 0.6), inset 0 0 25px rgba(255, 255, 255, 0.5)'
            : state === 'processing'
            ? '0 0 45px rgba(168, 85, 247, 0.6), inset 0 0 25px rgba(255, 255, 255, 0.5)'
            : '0 0 35px rgba(79, 70, 229, 0.35), inset 0 0 20px rgba(255, 255, 255, 0.4)'
        }}
        className={`relative rounded-full flex items-center justify-center overflow-hidden border-2 border-white/60 backdrop-blur-xl ${sizeClasses[size]} ${
          state === 'listening'
            ? 'bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-500'
            : state === 'processing'
            ? 'bg-gradient-to-tr from-violet-600 via-purple-600 to-indigo-700'
            : state === 'speaking'
            ? 'bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600'
            : 'bg-gradient-to-tr from-slate-900 via-indigo-950 to-blue-900'
        }`}
      >
        {/* Internal 3D Specular Highlight Glass Curve */}
        <div className="absolute top-2 left-3 w-1/2 h-1/3 bg-white/30 rounded-full blur-[2px] -rotate-45 pointer-events-none" />

        {/* Dynamic Center Visual Icon/Wave */}
        <div className="relative z-10 flex flex-col items-center justify-center text-white">
          {state === 'listening' && (
            <motion.div
              animate={{ scale: [0.95, 1.15, 0.95] }}
              transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
              className="flex items-center gap-1"
            >
              <Mic className={`${size === 'sm' ? 'w-5 h-5' : size === 'md' ? 'w-9 h-9' : 'w-12 h-12'} text-cyan-200 drop-shadow`} />
            </motion.div>
          )}

          {state === 'processing' && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
            >
              <Cpu className={`${size === 'sm' ? 'w-5 h-5' : size === 'md' ? 'w-9 h-9' : 'w-12 h-12'} text-violet-200 drop-shadow`} />
            </motion.div>
          )}

          {state === 'speaking' && (
            <motion.div
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ repeat: Infinity, duration: 0.8, ease: 'easeInOut' }}
              className="flex items-center gap-1"
            >
              <Volume2 className={`${size === 'sm' ? 'w-5 h-5' : size === 'md' ? 'w-9 h-9' : 'w-12 h-12'} text-amber-200 drop-shadow`} />
            </motion.div>
          )}

          {state === 'idle' && (
            <Sparkles className={`${size === 'sm' ? 'w-5 h-5' : size === 'md' ? 'w-8 h-8' : 'w-11 h-11'} text-cyan-200 animate-pulse drop-shadow`} />
          )}

          {/* Micro state status tag on medium and large sizes */}
          {size !== 'sm' && (
            <span className="text-[10px] font-black uppercase tracking-wider mt-1.5 opacity-90 text-white font-mono drop-shadow">
              {state === 'listening' ? 'Listening…' : state === 'processing' ? 'Thinking…' : state === 'speaking' ? 'Speaking…' : 'Study Top AI'}
            </span>
          )}
        </div>
      </motion.div>
    </div>
  );
};
