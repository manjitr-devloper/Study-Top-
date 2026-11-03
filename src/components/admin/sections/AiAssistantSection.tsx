import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Sparkles, 
  Cpu, 
  Mic, 
  Sliders, 
  Save, 
  Search, 
  ShieldCheck, 
  MessageSquare, 
  RefreshCw,
  Clock,
  Volume2
} from 'lucide-react';
import { AiAssistantConfig } from '../adminTypes';

interface AiAssistantSectionProps {
  config: AiAssistantConfig;
  voiceChats: any[];
  onUpdateConfig: (updates: Partial<AiAssistantConfig>) => Promise<void>;
  actionLoading: boolean;
  darkMode: boolean;
}

export const AiAssistantSection: React.FC<AiAssistantSectionProps> = ({
  config,
  voiceChats,
  onUpdateConfig,
  actionLoading,
  darkMode
}) => {
  const [model, setModel] = useState(config?.activeModel || 'gemini-3.8-flash');
  const [temperature, setTemperature] = useState(config?.temperature || 0.65);
  const [maxTokens, setMaxTokens] = useState(config?.maxOutputTokens || 8192);
  const [systemPrompt, setSystemPrompt] = useState(config?.systemPrompt || '');
  const [voiceEnabled, setVoiceEnabled] = useState(config?.voiceEnabled ?? true);
  const [voiceAccent, setVoiceAccent] = useState(config?.voiceAccent || 'Puck (Natural Academic)');
  const [searchVault, setSearchVault] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdateConfig({
      activeModel: model,
      temperature,
      maxOutputTokens: maxTokens,
      systemPrompt,
      voiceEnabled,
      voiceAccent
    });
  };

  const filteredVault = voiceChats.filter(v => 
    v.prompt.toLowerCase().includes(searchVault.toLowerCase()) || 
    v.reply.toLowerCase().includes(searchVault.toLowerCase()) ||
    v.userEmail.toLowerCase().includes(searchVault.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-violet-500" />
            <span>AI Assistant &amp; Voice Intelligence Control</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Configure Google Gemini 2.5 Flash / Pro parameters, system prompts, and view live voice transcripts
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-2xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5 border border-emerald-300 dark:border-emerald-800">
            <Cpu className="w-4 h-4 text-emerald-500" />
            <span>Gemini 2.5 Flash Active</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Model Tuning Form */}
        <form onSubmit={handleSave} className={`p-6 rounded-3xl border shadow-xl lg:col-span-2 space-y-5 ${
          darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200/80'
        }`}>
          <div className="flex items-center justify-between border-b pb-4 border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-violet-500" />
              <span>Model Hyperparameters &amp; Prompt Engineering</span>
            </h3>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-4 py-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md hover:from-violet-500 hover:to-indigo-500 transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>Save AI Config</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Active Google Gemini Model
              </label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className={`w-full p-2.5 rounded-xl text-xs font-bold border outline-none cursor-pointer ${
                  darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              >
                <option value="gemini-3.8-flash">Gemini 3.8 Flash (High Speed · Recommended)</option>
                <option value="gemini-flash-latest">Gemini Flash Latest (Fast &amp; Reliable)</option>
                <option value="gemini-4-argon">Gemini 4 Argon (Advanced STEM &amp; Math)</option>
                <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite (Ultra Low Latency)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                AI Voice Accent &amp; Persona
              </label>
              <select
                value={voiceAccent}
                onChange={(e) => setVoiceAccent(e.target.value)}
                className={`w-full p-2.5 rounded-xl text-xs font-bold border outline-none cursor-pointer ${
                  darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              >
                <option value="Puck (Natural Academic)">Puck (Natural Academic English)</option>
                <option value="Aoede (Warm Teacher)">Aoede (Warm Teacher Tone)</option>
                <option value="Fenrir (Fast Technical)">Fenrir (Technical &amp; Concise)</option>
                <option value="Charon (Calm Lecturer)">Charon (Calm Lecturer)</option>
              </select>
            </div>
          </div>

          {/* Temperature & Max Tokens Sliders */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-slate-700 dark:text-slate-300">Creativity (Temperature)</span>
                <span className="font-mono text-violet-600 dark:text-violet-400">{temperature}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full accent-violet-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                <span>Deterministic</span>
                <span>Creative</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-slate-700 dark:text-slate-300">Max Tokens per Response</span>
                <span className="font-mono text-violet-600 dark:text-violet-400">{maxTokens}</span>
              </div>
              <input
                type="range"
                min="1024"
                max="16384"
                step="512"
                value={maxTokens}
                onChange={(e) => setMaxTokens(parseInt(e.target.value, 10))}
                className="w-full accent-violet-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                <span>1,024</span>
                <span>16,384</span>
              </div>
            </div>
          </div>

          {/* System Prompt Editor */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Global Study Top System Instructions (Injected into all student queries)
            </label>
            <textarea
              rows={4}
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              className={`w-full p-3 rounded-2xl text-xs font-medium font-mono border outline-none leading-relaxed ${
                darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            />
          </div>
        </form>

        {/* AI Health & Budget Monitor */}
        <div className={`p-6 rounded-3xl border shadow-xl space-y-4 ${
          darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200/80'
        }`}>
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
            <Cpu className="w-4 h-4 text-emerald-500" />
            <span>Monthly Token Consumption</span>
          </h3>

          <div className="p-4 rounded-2xl bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800 text-center">
            <span className="text-xs text-violet-700 dark:text-violet-300 font-bold uppercase tracking-wider">
              Tokens Consumed (Oct 2026)
            </span>
            <p className="text-3xl font-black text-violet-700 dark:text-violet-200 mt-1">284,190</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Approx. $0.42 API billing cost</p>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">API Status</span>
              <span className="font-bold text-emerald-500">Connected &amp; Ready</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Per-Student Daily Cap</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">50,000 Tokens</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Voice Transcripts Saved</span>
              <span className="font-bold text-cyan-500">{voiceChats.length} Conversations</span>
            </div>
          </div>
        </div>
      </div>

      {/* Complete Voice & Chat Vault Storage Viewer */}
      <div className={`p-6 rounded-3xl border shadow-xl space-y-4 ${
        darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200/80'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-100 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Voice &amp; Chat Data Storage Vault
              </h3>
              <p className="text-xs text-slate-500">
                Audited archive of spoken and written queries processed by the Study Top AI assistant
              </p>
            </div>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchVault}
              onChange={(e) => setSearchVault(e.target.value)}
              placeholder="Filter vault transcripts..."
              className={`pl-9 pr-3 py-1.5 rounded-xl text-xs font-bold outline-none border ${
                darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}
            />
          </div>
        </div>

        <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
          {filteredVault.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-2xl border text-xs space-y-1.5 ${
                darkMode ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-50 border-slate-200/80'
              }`}
            >
              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full font-black uppercase text-[10px] ${
                    item.mode === 'voice' 
                      ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300' 
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                  }`}>
                    {item.mode === 'voice' ? 'Voice Audio' : 'Text Message'}
                  </span>
                  <span className="font-mono text-slate-500 font-bold">{item.userEmail}</span>
                </div>
                <span className="text-slate-400 flex items-center gap-1 font-mono text-[10px]">
                  <Clock className="w-3 h-3" />
                  {new Date(item.timestamp).toLocaleString()}
                </span>
              </div>

              <div className="pt-1">
                <p className="font-bold text-slate-900 dark:text-white">Q: "{item.prompt}"</p>
                <p className="text-slate-600 dark:text-slate-300 mt-1 pl-2 border-l-2 border-indigo-500 leading-relaxed">
                  A: {item.reply}
                </p>
              </div>
            </div>
          ))}

          {filteredVault.length === 0 && (
            <div className="text-center py-8 text-xs text-slate-400">
              No conversations found matching query.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
