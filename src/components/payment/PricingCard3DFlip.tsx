import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, RotateCw, Check, Zap, ShieldCheck, ArrowRight } from 'lucide-react';

interface PricingCard3DFlipProps {
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

export const PricingCard3DFlip: React.FC<PricingCard3DFlipProps> = ({
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
        className="w-full relative min-h-[380px] sm:min-h-[400px] rounded-[32px] shadow-xl transition-all"
      >
        {/* ========================================================= */}
        | {/* FRONT FACE: Pricing Summary & Price Display            */}
        {/* ========================================================= */}
        <div 
          style={{ backfaceVisibility: 'hidden' }}
          className={`absolute inset-0 w-full h-full rounded-[32px] p-6 sm:p-7 flex flex-col justify-between border-2 bg-white ${
            isPopular ? 'border-blue-600 shadow-2xl shadow-blue-500/10' : 'border-slate-200'
          }`}
        >
          {isPopular && (
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] uppercase font-black px-3.5 py-1 rounded-full shadow-sm tracking-wider">
              Most Popular • Best Value
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-black text-slate-900 tracking-tight">{plan.name}</h3>
              <button
                type="button"
                onClick={toggleFlip}
                className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-xl text-[10px] font-extrabold tracking-wider uppercase transition-all cursor-pointer"
                title="Flip for Features"
              >
                <RotateCw className="w-3 h-3 text-blue-600" />
                <span>Details</span>
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-5 min-h-[36px]">{plan.description}</p>

            <div className="mb-6 flex items-baseline gap-1">
              <span className="text-4xl font-black text-slate-900">
                {isFree ? 'Free' : `₹${plan.amount.toLocaleString('en-IN')}`}
              </span>
              {!isFree && (
                <span className="text-xs text-slate-400 font-bold">
                  /{plan.interval === 'yearly' ? 'year' : plan.interval === 'monthly' ? 'month' : 'pass'}
                </span>
              )}
            </div>

            <div className="space-y-2.5 mb-6">
              {plan.features.slice(0, 3).map((feat, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => onSubscribe(plan)}
            className={`w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
              isFree
                ? 'bg-slate-100 text-slate-600 cursor-default'
                : isPopular
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25'
                : 'bg-slate-900 hover:bg-slate-800 text-white'
            }`}
          >
            <span>{isFree ? 'Current Plan' : 'Subscribe via Razorpay'}</span>
            {!isFree && <ArrowRight className="w-4 h-4" />}
          </button>
        </div>

        {/* ========================================================= */}
        {/* BACK FACE: Detailed Feature Checklist & Perks             */}
        {/* ========================================================= */}
        <div 
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          className="absolute inset-0 w-full h-full rounded-[32px] bg-slate-900 text-white p-6 sm:p-7 flex flex-col justify-between border-2 border-indigo-500/50 shadow-2xl"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-black uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-300" /> Plan Breakdown
              </span>
              <button
                type="button"
                onClick={toggleFlip}
                className="flex items-center gap-1 bg-white/10 hover:bg-white/20 text-indigo-200 px-2.5 py-1 rounded-xl text-[10px] font-extrabold tracking-wider uppercase transition-all cursor-pointer"
              >
                <RotateCw className="w-3 h-3 text-indigo-300" />
                <span>Flip Back</span>
              </button>
            </div>

            <h4 className="text-sm font-black text-white mb-3">Included Features & Perks:</h4>

            <div className="space-y-2.5 mb-6 overflow-y-auto max-h-[180px] pr-1">
              {plan.features.map((feat, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-indigo-100">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => onSubscribe(plan)}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg"
          >
            <span>Proceed to Checkout</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </div>
  );
};
