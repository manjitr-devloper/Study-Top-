import React, { useState } from 'react';
import { 
  Award, 
  CheckCircle, 
  Zap, 
  CreditCard, 
  Clock, 
  AlertCircle, 
  ShieldCheck, 
  ArrowRight, 
  FileText, 
  X,
  Ticket
} from 'lucide-react';
import { UserProfile } from '../../../types';

interface SubscriptionPageProps {
  userProfile: UserProfile | null;
  onOpenPricing: () => void;
  onOpenStudentVerification: () => void;
}

export const SubscriptionPage: React.FC<SubscriptionPageProps> = ({
  userProfile,
  onOpenPricing,
  onOpenStudentVerification
}) => {
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelConfirmed, setCancelConfirmed] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);

  const planName = 'Student Pro Plan';
  const price = '₹199 / month';
  const purchaseDate = 'October 15, 2026';
  const renewalDate = 'November 15, 2026';

  const planFeatures = [
    'Unlimited AI Notes Generation',
    'Full Gemini 3.8 Flash Neural Engine',
    'Unlimited Math Step-by-Step Solvers (Free for all)',
    'Interactive 3D Flashcard Quizzes',
    'Diagram Studio with SVG & Mermaid Export',
    'PDF & Image Document OCR Question Solvers',
    'Priority Cloud Document Storage (100 MB)',
    'Verified Student Scholar Badge'
  ];

  const handleApplyCoupon = () => {
    if (couponCode.toUpperCase() === 'STUDENT50') {
      setAppliedCoupon('50% OFF (STUDENT50 Applied!)');
    } else if (couponCode.toUpperCase() === 'STUDYTOP20') {
      setAppliedCoupon('₹20 Instant Discount (STUDYTOP20 Applied!)');
    } else {
      alert('Invalid coupon code. Try STUDENT50 or STUDYTOP20.');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto font-sans text-slate-900">
      {/* Header */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[11px] font-extrabold uppercase tracking-wider">
            Membership &amp; Billing
          </span>
          <h2 className="text-2xl font-black text-slate-900 mt-1">My Subscription</h2>
          <p className="text-xs text-slate-500 mt-1">
            Manage your Study Top active plan, billing period, features, and discount coupons.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenPricing}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black cursor-pointer flex items-center gap-1.5 shadow-2xs"
          >
            <Zap className="w-4 h-4" />
            <span>Upgrade Plan</span>
          </button>
        </div>
      </div>

      {/* Plan Details Card */}
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-6 sm:p-8 rounded-3xl shadow-xl space-y-6 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-extrabold flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Active Subscription</span>
              </span>
              <span className="text-xs text-slate-400">Auto-renews monthly</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight">{planName}</h3>
          </div>

          <div className="text-right">
            <span className="text-2xl sm:text-3xl font-black text-white">{price}</span>
            <p className="text-xs text-slate-400 mt-0.5">Renews on {renewalDate}</p>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-white/10">
          {planFeatures.map((feat, idx) => (
            <div key={idx} className="flex items-center gap-2 text-xs text-slate-300">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{feat}</span>
            </div>
          ))}
        </div>

        {/* Manage & Coupon Row */}
        <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCancelModalOpen(true)}
              className="text-xs font-bold text-rose-300 hover:text-rose-100 hover:underline cursor-pointer"
            >
              Cancel Auto-Renewal
            </button>
            <span className="text-white/20">•</span>
            <button
              onClick={onOpenStudentVerification}
              className="text-xs font-bold text-blue-300 hover:text-blue-100 hover:underline cursor-pointer"
            >
              Verify Student ID for 50% Off
            </button>
          </div>

          <div className="text-xs text-slate-400">
            Purchased: {purchaseDate}
          </div>
        </div>
      </div>

      {/* Coupon Application Box */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-3">
        <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
          <Ticket className="w-4 h-4 text-amber-600" />
          <span>Apply Promo Code or Renewal Coupon</span>
        </h4>
        <div className="flex gap-2">
          <input
            type="text"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
            placeholder="Enter promo code (e.g. STUDENT50, STUDYTOP20)..."
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-blue-500 uppercase"
          />
          <button
            onClick={handleApplyCoupon}
            disabled={!couponCode.trim()}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold cursor-pointer disabled:opacity-50"
          >
            Apply Code
          </button>
        </div>
        {appliedCoupon && (
          <p className="text-xs font-black text-emerald-600 flex items-center gap-1">
            <CheckCircle className="w-4 h-4" />
            <span>{appliedCoupon}</span>
          </p>
        )}
      </div>

      {/* Cancel Confirmation Modal */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-md border border-slate-200 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Cancel Auto-Renewal?</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                You will retain full access to all Student Pro Plan features until your billing cycle ends on {renewalDate}. Your saved notes and flashcards will never be deleted.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsCancelModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Keep Subscription
              </button>
              <button
                onClick={() => {
                  setCancelConfirmed(true);
                  setIsCancelModalOpen(false);
                  alert('Auto-renewal has been cancelled. Your access remains active until the end of the billing term.');
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black cursor-pointer"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
