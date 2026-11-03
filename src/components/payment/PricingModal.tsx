import React, { useState, useEffect } from 'react';
import { X, Sparkles, ShieldCheck, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SubscriptionCard } from './SubscriptionCard';

interface PricingPlan {
  id: string;
  name: string;
  description: string;
  amount: number;
  currency: string;
  interval: string;
  features: string[];
}

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  userProfile: any;
  language?: string;
  onPaymentSuccess?: () => void;
}

export const PricingModal: React.FC<PricingModalProps> = ({
  isOpen,
  onClose,
  user,
  userProfile,
  language = 'English',
  onPaymentSuccess
}) => {
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/payments/plans')
        .then(async res => {
          const text = await res.text();
          try {
            const data = JSON.parse(text);
            if (data.success && data.plans) {
              setPlans(data.plans);
            } else {
              throw new Error(data.error || 'Failed to fetch plans');
            }
          } catch (e) {
            console.warn('Using default plans due to rate limit or fetch error:', text);
            setPlans([
              { id: 'free', name: 'Free Scholar', description: 'Essential AI study tools and notebook creation.', amount: 0, currency: 'INR', interval: 'lifetime', features: ['Up to 10 AI Notes', 'Basic Summaries', 'Math Solver (Free)'] },
              { id: 'starter', name: 'Starter Plan', description: '7-day quick trial access to Pro features.', amount: 20, currency: 'INR', interval: 'one-time', features: ['7 Days Pro Access', 'AI Notes Studio'] },
              { id: 'pro', name: 'Pro Scholar', description: 'Ultimate power package for serious students.', amount: 199, currency: 'INR', interval: 'monthly', features: ['All Pro Features', 'Gemini Flash AI', 'Unlimited OCR'] },
              { id: 'ultimate', name: 'Ultimate Semester Pass', description: '180-day half-year full unlimited premium pass.', amount: 699, currency: 'INR', interval: 'one-time', features: ['180 Days Full Pro Access', 'Priority Processing'] }
            ]);
          }
          setLoadingPlans(false);
        })
        .catch(err => {
          console.error('Failed to fetch plans:', err);
          setLoadingPlans(false);
          setPlans([
            { id: 'free', name: 'Free Scholar', description: 'Essential AI study tools and notebook creation.', amount: 0, currency: 'INR', interval: 'lifetime', features: ['Up to 10 AI Notes', 'Basic Summaries', 'Math Solver (Free)'] },
            { id: 'starter', name: 'Starter Plan', description: '7-day quick trial access to Pro features.', amount: 20, currency: 'INR', interval: 'one-time', features: ['7 Days Pro Access', 'AI Notes Studio'] },
            { id: 'pro', name: 'Pro Scholar', description: 'Ultimate power package for serious students.', amount: 199, currency: 'INR', interval: 'monthly', features: ['All Pro Features', 'Gemini Flash AI', 'Unlimited OCR'] },
            { id: 'ultimate', name: 'Ultimate Semester Pass', description: '180-day half-year full unlimited premium pass.', amount: 699, currency: 'INR', interval: 'one-time', features: ['180 Days Full Pro Access', 'Priority Processing'] }
          ]);
        });
    }
  }, [isOpen]);

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleCheckout = async (plan: PricingPlan) => {
    if (!user) {
      setErrorMessage('Please sign in to your account to proceed with checkout.');
      return;
    }

    if (plan.amount === 0) {
      alert('You are already on the Free Scholar plan!');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Failed to load Razorpay Checkout SDK. Please check your internet connection.');
      }

      const orderRes = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: plan.id,
          uid: user.uid
        })
      });
      const orderData = await orderRes.json();
      if (!orderData.success) {
        throw new Error(orderData.error || 'Failed to create Razorpay order.');
      }

      if (orderData.keyId === 'rzp_test_sandbox' || orderData.isSandbox) {
        // Instant sandbox test checkout completion
        const mockPaymentId = 'pay_sandbox_' + Date.now() + Math.random().toString(36).substring(2, 7);
        const verifyRes = await fetch('/api/payments/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: orderData.orderId,
            paymentId: mockPaymentId,
            signature: 'sandbox_signature_bypass',
            uid: user.uid,
            planId: plan.id
          })
        });
        const verifyData = await verifyRes.json();
        if (verifyData.success) {
          setIsProcessing(false);
          alert('🎉 Secure Sandbox Payment verified successfully! Study Top Pro entitlement activated.');
          if (onPaymentSuccess) onPaymentSuccess();
          onClose();
        } else {
          throw new Error(verifyData.error || 'Sandbox payment verification failed.');
        }
        return;
      }

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'Study Top Pro',
        description: plan.name,
        image: '/logo.svg',
        order_id: orderData.orderId,
        handler: async (response: any) => {
          try {
            const verifyRes = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                uid: user.uid,
                planId: plan.id
              })
            });
            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              setIsProcessing(false);
              alert('🎉 Payment verified successfully! Study Top Pro entitlement activated.');
              if (onPaymentSuccess) onPaymentSuccess();
              onClose();
            } else {
              throw new Error(verifyData.error || 'Payment verification failed.');
            }
          } catch (verifyErr: any) {
            console.error('Verification exception:', verifyErr);
            setErrorMessage(verifyErr?.message || 'Payment verification failed on server.');
            setIsProcessing(false);
          }
        },
        prefill: {
          name: userProfile?.displayName || user.displayName || 'Scholar',
          email: user.email || '',
          contact: ''
        },
        notes: {
          uid: user.uid,
          planId: plan.id
        },
        theme: {
          color: '#2563eb'
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      console.error('Checkout error:', err);
      setErrorMessage(err?.message || 'An error occurred during checkout initialization.');
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[120] flex items-center justify-center p-4 overflow-y-auto"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-3xl max-w-5xl w-full shadow-2xl overflow-hidden border border-slate-100 flex flex-col my-8"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 text-white relative">
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Study Top Pro Upgrade • 3D Interactive Cards</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-2">
              Unlock Your Full Academic Potential
            </h2>
            <p className="text-blue-100 text-sm max-w-xl">
              Powered by Razorpay Secure Payments & Gemini AI. Tap "Details" on any plan card to flip and explore features.
            </p>
          </div>

          {/* Content */}
          <div className="p-6 sm:p-8 flex-1 overflow-y-auto">
            {loadingPlans ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
                <p className="text-sm text-slate-500 font-medium">Loading pricing plans...</p>
              </div>
            ) : (
              <div>
                {errorMessage && (
                  <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs sm:text-sm font-medium">
                    {errorMessage}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {plans.map((plan) => (
                    <SubscriptionCard
                      key={plan.id}
                      plan={plan}
                      onSubscribe={handleCheckout}
                      isPopular={plan.id === 'pro' || plan.id === 'standard'}
                    />
                  ))}
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Razorpay Secure 256-bit SSL Encrypted Checkout</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span>UPI • Cards • NetBanking • Wallets</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
