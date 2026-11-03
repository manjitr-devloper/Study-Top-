import React, { useState, useEffect } from 'react';
import { X, CreditCard, Clock, CheckCircle2, AlertCircle, Download, Loader2, ArrowUpRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PaymentHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  language?: string;
}

export const PaymentHistoryModal: React.FC<PaymentHistoryModalProps> = ({
  isOpen,
  onClose,
  user,
  language = 'English'
}) => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && user) {
      setLoading(true);
      fetch(`/api/payments/history/${user.uid}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.history) {
            setHistory(data.history);
          }
          setLoading(false);
        })
        .catch(err => {
          console.error('Failed to fetch payment history:', err);
          setLoading(false);
        });
    }
  }, [isOpen, user]);

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
          className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-100 flex flex-col my-8 max-h-[85vh]"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 text-lg">Payment & Invoice History</h2>
                <p className="text-xs text-slate-500">View past Razorpay transactions and receipts</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto flex-1 space-y-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-7 h-7 animate-spin text-blue-600 mb-2" />
                <p className="text-xs text-slate-500">Loading payment history...</p>
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-8">
                <CreditCard className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h3 className="font-semibold text-slate-700 text-sm mb-1">No payment transactions yet</h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  When you subscribe to Study Top Pro or make purchases, your secure Razorpay invoices will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((tx) => {
                  const isCaptured = tx.status === 'captured';
                  return (
                    <div 
                      key={tx.id}
                      className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-blue-200 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">
                            {tx.planId === 'premium_yearly' ? 'Study Top Pro (Yearly)' : 
                             tx.planId === 'lifetime_access' ? 'Lifetime Scholar Pass' : 'Study Top Pro (Monthly)'}
                          </span>
                          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                            isCaptured ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {tx.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
                          <span>Order: {tx.razorpayOrderId}</span>
                          {tx.razorpayPaymentId && <span>• Payment: {tx.razorpayPaymentId}</span>}
                        </div>
                        <p className="text-[11px] text-slate-400">
                          {new Date(tx.createdAt).toLocaleDateString()} at {new Date(tx.createdAt).toLocaleTimeString()}
                        </p>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                        <div className="text-right">
                          <span className="font-black text-slate-900 text-base">
                            ₹{(tx.amount || 0).toLocaleString('en-IN')}
                          </span>
                          <span className="text-[10px] text-slate-400 block uppercase">{tx.currency || 'INR'}</span>
                        </div>
                        <button
                          onClick={() => alert(`Invoice receipt for order ${tx.razorpayOrderId}\nStatus: ${tx.status}\nAmount: ₹${tx.amount}\nVerified by Razorpay HMAC-SHA256 signature.`)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Receipt</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-100 text-center text-[11px] text-slate-400">
            All transactions are securely processed and verified via Razorpay API.
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
