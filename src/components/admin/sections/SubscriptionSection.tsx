import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  CreditCard, 
  Coins, 
  Check, 
  Sliders, 
  Users, 
  Sparkles, 
  HardDrive, 
  FileText,
  Save
} from 'lucide-react';
import { SubscriptionPlan } from '../adminTypes';

interface SubscriptionSectionProps {
  plans: SubscriptionPlan[];
  monthlyRecurringRevenue: number;
  totalSubscribedUsers: number;
  onUpdatePlan: (planId: string, updates: Partial<SubscriptionPlan>) => Promise<void>;
  actionLoading: boolean;
  darkMode: boolean;
}

export const SubscriptionSection: React.FC<SubscriptionSectionProps> = ({
  plans,
  monthlyRecurringRevenue,
  totalSubscribedUsers,
  onUpdatePlan,
  actionLoading,
  darkMode
}) => {
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [maxNotes, setMaxNotes] = useState(50);
  const [tokens, setTokens] = useState(50000);
  const [storage, setStorage] = useState(250);

  const startEdit = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setMaxNotes(plan.maxNotes);
    setTokens(plan.monthlyAiTokens);
    setStorage(plan.maxStorageMb);
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;
    await onUpdatePlan(editingPlan.id, {
      maxNotes,
      monthlyAiTokens: tokens,
      maxStorageMb: storage
    });
    setEditingPlan(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-emerald-500" />
            <span>Subscription &amp; Student Quota Management</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Configure tier quotas, AI token allocations, and monitor recurring student subscriptions
          </p>
        </div>

        {/* Revenue KPI Pill */}
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800">
          <Coins className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-500">Monthly Recurring Revenue</span>
            <p className="text-lg font-black text-emerald-700 dark:text-emerald-300">${monthlyRecurringRevenue.toFixed(2)} USD</p>
          </div>
        </div>
      </div>

      {/* Plan Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <motion.div
            key={plan.id}
            whileHover={{ y: -4 }}
            className={`p-6 rounded-3xl border shadow-xl flex flex-col justify-between transition-all ${
              plan.isDefault 
                ? darkMode ? 'bg-slate-900 border-indigo-500/40' : 'bg-white border-indigo-300'
                : darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200/80'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black uppercase tracking-wider text-indigo-500">
                  {plan.name}
                </span>
                {plan.isDefault && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                    Default Tier
                  </span>
                )}
              </div>

              <h3 className="text-2xl font-black text-slate-900 dark:text-white">{plan.price}</h3>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <b>{plan.activeUsersCount}</b> active students on tier
              </p>

              <div className="space-y-2.5 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span>Up to <b>{plan.maxNotes.toLocaleString()}</b> Study Notes</span>
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-violet-500 shrink-0" />
                  <span><b>{plan.monthlyAiTokens.toLocaleString()}</b> AI Tokens/month</span>
                </div>
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-amber-500 shrink-0" />
                  <span><b>{plan.maxStorageMb} MB</b> Cloud Storage</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>AI Voice Tutor &amp; OCR included</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => startEdit(plan)}
              className="mt-6 w-full py-2.5 rounded-2xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Sliders className="w-4 h-4" />
              <span>Modify Tier Quotas</span>
            </button>
          </motion.div>
        ))}
      </div>

      {/* Edit Quotas Modal */}
      {editingPlan && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.form
            onSubmit={saveEdit}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`w-full max-w-md rounded-3xl p-6 border shadow-2xl space-y-4 ${
              darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <h3 className="text-base font-black">Configure Limits: {editingPlan.name}</h3>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Max Study Notes</label>
              <input
                type="number"
                value={maxNotes}
                onChange={(e) => setMaxNotes(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl text-xs font-bold border outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Monthly AI Tokens</label>
              <input
                type="number"
                value={tokens}
                onChange={(e) => setTokens(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl text-xs font-bold border outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Max Cloud Storage (MB)</label>
              <input
                type="number"
                value={storage}
                onChange={(e) => setStorage(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl text-xs font-bold border outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingPlan(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Limits</span>
              </button>
            </div>
          </motion.form>
        </div>
      )}
    </div>
  );
};
