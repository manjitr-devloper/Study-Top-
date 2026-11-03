import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Sliders, 
  Save, 
  Globe, 
  Award, 
  ShieldAlert, 
  HardDrive, 
  CheckCircle2, 
  AlertTriangle
} from 'lucide-react';
import { AppConfig } from '../adminTypes';

interface AppConfigSectionProps {
  config: AppConfig;
  onUpdateConfig: (updates: Partial<AppConfig>) => Promise<void>;
  actionLoading: boolean;
  darkMode: boolean;
}

export const AppConfigSection: React.FC<AppConfigSectionProps> = ({
  config,
  onUpdateConfig,
  actionLoading,
  darkMode
}) => {
  const [appName, setAppName] = useState(config?.appName || 'Study Top');
  const [tagline, setTagline] = useState(config?.tagline || 'Smart Notes Making Platform');
  const [creatorCredit, setCreatorCredit] = useState(config?.creatorCredit || 'Created by Manjit Ranjan (Google Developer)');
  const [allowRegistration, setAllowRegistration] = useState(config?.allowNewRegistrations ?? true);
  const [maintenanceMode, setMaintenanceMode] = useState(config?.maintenanceMode ?? false);
  const [defaultStorage, setDefaultStorage] = useState(config?.defaultStorageLimitMb || 500);
  const [contactEmail, setContactEmail] = useState(config?.contactSupportEmail || 'support@studytop.app');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdateConfig({
      appName,
      tagline,
      creatorCredit,
      allowNewRegistrations: allowRegistration,
      maintenanceMode,
      defaultStorageLimitMb: defaultStorage,
      contactSupportEmail: contactEmail
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Sliders className="w-6 h-6 text-indigo-500" />
          <span>Application Configuration &amp; Branding</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Control platform identity, creator attribution, registration availability, and maintenance controls
        </p>
      </div>

      <form onSubmit={handleSubmit} className={`p-6 sm:p-8 rounded-3xl border shadow-xl space-y-6 ${
        darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200/80'
      }`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Application Name
            </label>
            <input
              type="text"
              required
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              className={`w-full p-2.5 rounded-xl text-xs font-bold border outline-none ${
                darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Application Tagline / Subtitle
            </label>
            <input
              type="text"
              required
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className={`w-full p-2.5 rounded-xl text-xs font-bold border outline-none ${
                darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Creator Credit Attribution
            </label>
            <input
              type="text"
              required
              value={creatorCredit}
              onChange={(e) => setCreatorCredit(e.target.value)}
              className={`w-full p-2.5 rounded-xl text-xs font-bold border outline-none ${
                darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Default Storage per Student (MB)
            </label>
            <input
              type="number"
              value={defaultStorage}
              onChange={(e) => setDefaultStorage(Number(e.target.value))}
              className={`w-full p-2.5 rounded-xl text-xs font-bold border outline-none ${
                darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Support Desk Email
            </label>
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className={`w-full p-2.5 rounded-xl text-xs font-bold border outline-none ${
                darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}
            />
          </div>
        </div>

        {/* Toggles */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">Allow New Student Sign-Ups</h4>
              <p className="text-[11px] text-slate-500">Enable or close public student registrations</p>
            </div>
            <button
              type="button"
              onClick={() => setAllowRegistration(!allowRegistration)}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                allowRegistration ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                allowRegistration ? 'left-6.5' : 'left-0.5'
              }`} />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">Platform Maintenance Banner</h4>
              <p className="text-[11px] text-slate-500">Show maintenance advisory to active students</p>
            </div>
            <button
              type="button"
              onClick={() => setMaintenanceMode(!maintenanceMode)}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                maintenanceMode ? 'bg-rose-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                maintenanceMode ? 'left-6.5' : 'left-0.5'
              }`} />
            </button>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="submit"
            disabled={actionLoading}
            className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-indigo-500/20 hover:from-blue-500 hover:to-indigo-500 transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>Save App Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
};
