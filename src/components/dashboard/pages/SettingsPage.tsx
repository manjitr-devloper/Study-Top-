import React, { useState } from 'react';
import { 
  Settings, 
  Moon, 
  Sun, 
  Bell, 
  Sparkles, 
  ShieldCheck, 
  HardDrive, 
  Eye, 
  Check, 
  Trash2, 
  Lock,
  Volume2
} from 'lucide-react';

export const SettingsPage: React.FC<{
  language?: string;
  onSelectLanguage?: () => void;
}> = ({
  language = 'English',
  onSelectLanguage
}) => {
  const [accentColor, setAccentColor] = useState('#2563eb');
  const [fontSize, setFontSize] = useState('Medium (Default)');
  const [studyReminders, setStudyReminders] = useState(true);
  const [quizReminders, setQuizReminders] = useState(true);
  const [subscriptionAlerts, setSubscriptionAlerts] = useState(true);
  const [explanationLength, setExplanationLength] = useState('Balanced');
  const [reducedMotion, setReducedMotion] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const colors = [
    { name: 'Classic Blue', hex: '#2563eb' },
    { name: 'Royal Indigo', hex: '#4f46e5' },
    { name: 'Emerald Scholar', hex: '#059669' },
    { name: 'Amber Focus', hex: '#d97706' },
    { name: 'Rose Academic', hex: '#e11d48' }
  ];

  const handleSaveSettings = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleClearCache = () => {
    localStorage.removeItem('cached_ai_responses');
    sessionStorage.clear();
    alert('Temporary study cache cleared successfully.');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto font-sans text-slate-900">
      {/* Header */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[11px] font-extrabold uppercase tracking-wider">
            System Preferences
          </span>
          <h2 className="text-2xl font-black text-slate-900 mt-1">Settings &amp; Personalization</h2>
          <p className="text-xs text-slate-500 mt-1">
            Customize interface appearance, notifications, AI explanation depth, and security.
          </p>
        </div>

        <button
          onClick={handleSaveSettings}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black cursor-pointer flex items-center gap-1.5 shadow-2xs self-start sm:self-auto"
        >
          {isSaved ? <Check className="w-4 h-4" /> : <Settings className="w-4 h-4" />}
          <span>{isSaved ? 'Settings Applied!' : 'Save Preferences'}</span>
        </button>
      </div>

      {/* 1. Appearance & Theme */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-5">
        <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <Sun className="w-4 h-4 text-amber-500" />
          <span>Appearance &amp; Theme</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-2">Accent Color</label>
            <div className="flex items-center gap-2.5">
              {colors.map(c => (
                <button
                  key={c.hex}
                  onClick={() => setAccentColor(c.hex)}
                  className="w-7 h-7 rounded-full border-2 transition cursor-pointer flex items-center justify-center text-white"
                  style={{ backgroundColor: c.hex, borderColor: accentColor === c.hex ? '#0f172a' : 'transparent' }}
                  title={c.name}
                >
                  {accentColor === c.hex && <Check className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-2">Display Font Scale</label>
            <select
              value={fontSize}
              onChange={(e) => setFontSize(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none"
            >
              <option>Small (Compact)</option>
              <option>Medium (Default)</option>
              <option>Large (Accessible)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. Notifications & Reminders */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-4">
        <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <Bell className="w-4 h-4 text-blue-600" />
          <span>Notifications &amp; Reminders</span>
        </h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
            <div>
              <p className="text-xs font-black text-slate-900">Daily Study Reminders</p>
              <p className="text-[11px] text-slate-500">Alerts to maintain your active study streak</p>
            </div>
            <input
              type="checkbox"
              checked={studyReminders}
              onChange={(e) => setStudyReminders(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
            <div>
              <p className="text-xs font-black text-slate-900">Spaced Repetition &amp; Quiz Alerts</p>
              <p className="text-[11px] text-slate-500">Scheduled reminders to review non-mastered flashcards</p>
            </div>
            <input
              type="checkbox"
              checked={quizReminders}
              onChange={(e) => setQuizReminders(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
            <div>
              <p className="text-xs font-black text-slate-900">Subscription &amp; Discount Alerts</p>
              <p className="text-[11px] text-slate-500">Exclusive coupon drops and renewal receipts</p>
            </div>
            <input
              type="checkbox"
              checked={subscriptionAlerts}
              onChange={(e) => setSubscriptionAlerts(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* 3. AI Intelligence Preferences */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-4">
        <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <span>AI Explanation Depth &amp; Model Preferences</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Explanation Depth</label>
            <select
              value={explanationLength}
              onChange={(e) => setExplanationLength(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none"
            >
              <option>Concise (Fast Revision)</option>
              <option>Balanced (Standard Notes)</option>
              <option>Deep Academic (Exhaustive Proofs)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Reduced Motion</label>
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-xs font-bold text-slate-700">Disable 3D card tilt</span>
              <input
                type="checkbox"
                checked={reducedMotion}
                onChange={(e) => setReducedMotion(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 4. Cache & Maintenance */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs flex items-center justify-between">
        <div>
          <h4 className="text-xs font-black text-slate-900">Clear Temporary Study Cache</h4>
          <p className="text-[11px] text-slate-500">Free browser storage without affecting saved cloud notes</p>
        </div>
        <button
          onClick={handleClearCache}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-extrabold cursor-pointer transition border border-slate-200"
        >
          Clear Cache
        </button>
      </div>
    </div>
  );
};
