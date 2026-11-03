import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, RotateCw, Check, Zap, ShieldCheck, ArrowRight, Star, Crown } from 'lucide-react';

interface SubscriptionCardProps {
  plan: {
    id: string;
    name: string;
    description: string;
    amount: number;
    currency: string;
    interval: string;
    features: string[];
  };
  onSubscribe: (plan: any) => void;
  isPopular?: boolean;
}

export const SubscriptionCard: React.FC<SubscriptionCardProps> = ({
  plan,
  onSubscribe,
  isPopular = false
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const toggleFlip = () => setIsFlipped(!isFlipped);
  const isFree = plan.amount === 0;

  return (
    <div className="relative select-none w-full" style={{ perspective: '1200px' }}>
      <motion.div
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
        style={{ transformStyle: 'preserve-3d' }}
        className="w-full relative min-h-[420px] rounded-[32px] shadow-2xl transition-all"
      >
        {/* ========================================================= */}
        {/* FRONT FACE: Plan Pricing & Summary                       */}
        {/* ========================================================= */}
        <div 
          style={{ backfaceVisibility: 'hidden' }}
          className={`absolute inset-0 w-full h-full rounded-[32px] p-7 flex flex-col justify-between border-2 bg-white ${
            isPopular ? 'border-blue-600 shadow-2xl shadow-blue-500/15' : 'border-slate-200'
          }`}
        >
          {isPopular && (
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] uppercase font-black px-4 py-1 rounded-full shadow-md tracking-wider flex items-center gap-1">
              <Crown className="w-3 h-3 text-amber-300" /> Most Popular • Pro Student Choice
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`w-9 h-9 rounded-2xl flex items-center justify-center ${isPopular ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30' : 'bg-slate-100 text-slate-700'}`}>
                  <Zap className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">{plan.name}</h3>
              </div>
              <button
                type="button"
                onClick={toggleFlip}
                className="flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-xl text-[10px] font-black tracking-wider uppercase transition-all active:scale-95 cursor-pointer"
                title="Click to flip and compare features"
              >
                <RotateCw className="w-3.5 h-3.5 text-blue-600 animate-spin-slow" />
                <span>Compare Features</span>
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-5 min-h-[36px]">{plan.description}</p>

            <div className="mb-6 flex items-baseline gap-1 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <span className="text-4xl font-black text-slate-900">
                {isFree ? 'Free' : `₹${plan.amount.toLocaleString('en-IN')}`}
              </span>
              {!isFree && (
                <span className="text-xs text-slate-400 font-bold ml-1">
                  /{plan.interval === 'yearly' ? 'year' : plan.interval === 'monthly' ? 'month' : 'pass'}
                </span>
              )}
            </div>

            <div className="space-y-2.5 mb-6">
              {plan.features.slice(0, 4).map((feat, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 font-medium">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => onSubscribe(plan)}
            className={`w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md ${
              isFree
                ? 'bg-slate-100 text-slate-600 cursor-default shadow-none'
                : isPopular
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25'
                : 'bg-slate-900 hover:bg-slate-800 text-white'
            }`}
          >
            <span>{isFree ? 'Active Free Plan' : 'Subscribe via Razorpay'}</span>
            {!isFree && <ArrowRight className="w-4 h-4" />}
          </button>
        </div>

        {/* ========================================================= */}
        {/* BACK FACE: Detailed Feature Comparison Matrix              */}
        {/* ========================================================= */}
        <div 
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          className="absolute inset-0 w-full h-full rounded-[32px] bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-7 flex flex-col justify-between border-2 border-indigo-500/50 shadow-2xl"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-black uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-300" /> Full Feature Matrix
              </span>
              <button
                type="button"
                onClick={toggleFlip}
                className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-cyan-200 border border-white/20 px-3 py-1.5 rounded-xl text-[10px] font-black tracking-wider uppercase transition-all active:scale-95 cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5 text-cyan-300" />
                <span>Flip Back</span>
              </button>
            </div>

            <h4 className="text-sm font-black text-white mb-3">What's included in {plan.name}:</h4>

            <div className="space-y-2 mb-6 overflow-y-auto max-h-[200px] pr-1">
              {plan.features.map((feat, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs text-indigo-100">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5 stroke-[3]" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => onSubscribe(plan)}
            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg"
          >
            <span>Activate Pro Access</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </div>
  );
};
