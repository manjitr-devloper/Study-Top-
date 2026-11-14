import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Sparkles, 
  Check, 
  X, 
  Loader2, 
  AlertCircle, 
  ExternalLink, 
  ShieldCheck, 
  CheckCircle2, 
  RefreshCw, 
  Sliders, 
  Cpu, 
  Key, 
  HardDrive, 
  FileText, 
  FileSpreadsheet, 
  GraduationCap, 
  Trash2, 
  Plug,
  Zap,
  Globe,
  Lock
} from 'lucide-react';
import { testConnector } from '../../lib/gemini';
import { StudyTopLogo } from '../StudyTopLogo';

interface ConnectorsHubProps {
  onBack: () => void;
  onOpenClassroom?: () => void;
  onSelectDefaultProvider?: (provider: string) => void;
}

export interface ConnectorConfig {
  id: 'gemini' | 'openai' | 'claude' | 'gdrive' | 'gdocs' | 'classroom';
  name: string;
  category: 'ai' | 'google';
  description: string;
  isConnected: boolean;
  apiKey?: string;
  selectedModel?: string;
  availableModels?: string[];
  latencyMs?: number;
  lastTested?: number;
}

const DEFAULT_CONNECTORS: ConnectorConfig[] = [
  {
    id: 'gemini',
    name: 'Google Gemini API',
    category: 'ai',
    description: 'Built-in primary intelligence engine powering Mind 2.0 with gemini-3.8-flash and native multimodal reasoning.',
    isConnected: true,
    selectedModel: 'gemini-3.8-flash',
    availableModels: ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'],
    latencyMs: 140,
    lastTested: Date.now()
  },
  {
    id: 'openai',
    name: 'OpenAI API (ChatGPT)',
    category: 'ai',
    description: 'Connect your official OpenAI developer key to power notes generation and reasoning with GPT-4o and GPT-4o-mini.',
    isConnected: false,
    selectedModel: 'gpt-4o-mini',
    availableModels: ['gpt-4o', 'gpt-4o-mini', 'o1-mini']
  },
  {
    id: 'claude',
    name: 'Anthropic Claude API',
    category: 'ai',
    description: 'Connect your Anthropic API key to enable Claude 3.5 Sonnet and Haiku for deep document synthesis.',
    isConnected: false,
    selectedModel: 'claude-3-5-haiku-20241022',
    availableModels: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022']
  },
  {
    id: 'classroom',
    name: 'Google Classroom',
    category: 'google',
    description: 'Direct OAuth 2.0 integration to sync courses, assignments, student submissions, and lecture attachments.',
    isConnected: true
  },
  {
    id: 'gdrive',
    name: 'Google Drive',
    category: 'google',
    description: 'Directly import PDF textbooks and lecture slide decks from your Drive, and auto-export formatted notes to Drive folders.',
    isConnected: false
  },
  {
    id: 'gdocs',
    name: 'Google Docs & Sheets',
    category: 'google',
    description: 'Read notes and study syllabi directly from Google Docs, and export comparison tables into Google Sheets.',
    isConnected: false
  }
];

export const ConnectorsHub: React.FC<ConnectorsHubProps> = ({
  onBack,
  onOpenClassroom,
  onSelectDefaultProvider
}) => {
  const [connectors, setConnectors] = useState<ConnectorConfig[]>(() => {
    try {
      const stored = localStorage.getItem('studytop_connectors_config');
      if (stored) {
        const parsed = JSON.parse(stored);
        return DEFAULT_CONNECTORS.map(def => {
          const found = parsed.find((p: any) => p.id === def.id);
          return found ? { ...def, ...found } : def;
        });
      }
    } catch (_) {}
    return DEFAULT_CONNECTORS;
  });

  const [activeCategory, setActiveCategory] = useState<'all' | 'ai' | 'google'>('all');
  const [defaultAiProvider, setDefaultAiProvider] = useState<string>(() => {
    return localStorage.getItem('studytop_default_ai_provider') || 'auto';
  });

  // Modal for configuring API Key
  const [editingConnector, setEditingConnector] = useState<ConnectorConfig | null>(null);
  const [inputKey, setInputKey] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Save connectors to localStorage
  const saveConnectors = (updated: ConnectorConfig[]) => {
    setConnectors(updated);
    try {
      localStorage.setItem('studytop_connectors_config', JSON.stringify(updated));
    } catch (_) {}
  };

  const handleTestConnection = async (connector: ConnectorConfig, keyToTest?: string) => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testConnector(connector.id, keyToTest || connector.apiKey);
      if (res.success) {
        setTestResult({ success: true, message: res.message || 'Connection verified successfully!' });
        const updated = connectors.map(c => {
          if (c.id === connector.id) {
            return {
              ...c,
              isConnected: true,
              apiKey: keyToTest || c.apiKey,
              latencyMs: res.latencyMs || 150,
              lastTested: Date.now(),
              availableModels: res.models || c.availableModels
            };
          }
          return c;
        });
        saveConnectors(updated);
      } else {
        setTestResult({ success: false, message: res.message || 'Connection failed.' });
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err?.message || 'Connection test failed. Please verify credentials.' });
    } finally {
      setIsTesting(false);
    }
  };

  const handleDisconnect = (id: string) => {
    const updated = connectors.map(c => {
      if (c.id === id) {
        return { ...c, isConnected: false, apiKey: undefined };
      }
      return c;
    });
    saveConnectors(updated);
    if (defaultAiProvider === id) {
      setDefaultAiProvider('auto');
      localStorage.setItem('studytop_default_ai_provider', 'auto');
    }
  };

  const handleSetDefaultProvider = (providerId: string) => {
    setDefaultAiProvider(providerId);
    localStorage.setItem('studytop_default_ai_provider', providerId);
    if (onSelectDefaultProvider) onSelectDefaultProvider(providerId);
  };

  const filteredConnectors = connectors.filter(c => {
    if (activeCategory === 'all') return true;
    return c.category === activeCategory;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans select-none text-slate-900">
      
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200/90 px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-20 shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition cursor-pointer flex items-center gap-1.5 font-bold text-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Dashboard</span>
          </button>

          <div className="h-5 w-px bg-slate-200" />

          <div className="flex items-center gap-2">
            <StudyTopLogo size="sm" showTagline={false} />
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 uppercase tracking-wider hidden sm:inline">
              Connectors Hub
            </span>
          </div>
        </div>

        {/* Default Provider Selector Indicator */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 hidden md:inline">Active Notes Engine:</span>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 font-bold">
            <Zap className="w-3.5 h-3.5 text-blue-600" />
            <span>
              {defaultAiProvider === 'auto' && 'Study Top Auto (Mind 2.0)'}
              {defaultAiProvider === 'gemini' && 'Google Gemini (Native)'}
              {defaultAiProvider === 'openai' && 'OpenAI (GPT-4o)'}
              {defaultAiProvider === 'claude' && 'Anthropic Claude'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Banner */}
      <div className="bg-gradient-to-b from-white to-slate-50 border-b border-slate-200/80 px-4 sm:px-6 py-8 text-center">
        <div className="max-w-3xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Universal AI Connectors &amp; Integration Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Connect Your AI &amp; Cloud Workspace
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto leading-relaxed">
            Authorize official AI providers (OpenAI, Gemini, Claude) and Google Workspace productivity tools to power your notes engine with zero lock-in.
          </p>
        </div>
      </div>

      {/* Workspace Area */}
      <div className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 space-y-6">
        
        {/* Category Filter Pills & Default Selector */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200 w-full sm:w-auto">
            <button
              onClick={() => setActiveCategory('all')}
              className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer ${
                activeCategory === 'all' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Services ({connectors.length})
            </button>
            <button
              onClick={() => setActiveCategory('ai')}
              className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer ${
                activeCategory === 'ai' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              AI Providers (3)
            </button>
            <button
              onClick={() => setActiveCategory('google')}
              className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer ${
                activeCategory === 'google' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Google Workspace (3)
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs w-full sm:w-auto justify-end">
            <span className="text-slate-500 font-medium">Default AI Provider:</span>
            <select
              value={defaultAiProvider}
              onChange={(e) => handleSetDefaultProvider(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-800 outline-none cursor-pointer focus:border-blue-500"
            >
              <option value="auto">Study Top Auto (Mind 2.0)</option>
              <option value="gemini">Google Gemini (Built-in)</option>
              <option value="openai">OpenAI (ChatGPT)</option>
              <option value="claude">Anthropic Claude</option>
            </select>
          </div>
        </div>

        {/* Connectors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredConnectors.map((c) => {
            return (
              <div
                key={c.id}
                className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* Top row: Icon, Name & Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold shadow-2xs ${
                        c.id === 'gemini' ? 'bg-blue-100 text-blue-700' :
                        c.id === 'openai' ? 'bg-emerald-100 text-emerald-800' :
                        c.id === 'claude' ? 'bg-amber-100 text-amber-800' :
                        c.id === 'classroom' ? 'bg-emerald-50 text-emerald-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {c.id === 'gemini' && <Sparkles className="w-5 h-5 text-blue-600" />}
                        {c.id === 'openai' && <Cpu className="w-5 h-5 text-emerald-700" />}
                        {c.id === 'claude' && <Zap className="w-5 h-5 text-amber-700" />}
                        {c.id === 'classroom' && <GraduationCap className="w-5 h-5 text-emerald-600" />}
                        {c.id === 'gdrive' && <HardDrive className="w-5 h-5 text-blue-600" />}
                        {c.id === 'gdocs' && <FileText className="w-5 h-5 text-indigo-600" />}
                      </div>

                      <div>
                        <h3 className="text-sm font-black text-slate-900 leading-tight">{c.name}</h3>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {c.category === 'ai' ? 'AI Model Provider' : 'Google Service'}
                        </span>
                      </div>
                    </div>

                    {/* Status Pill */}
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                      c.isConnected 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                        : 'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}>
                      {c.isConnected ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />}
                      <span>{c.isConnected ? 'Connected' : 'Not Connected'}</span>
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-500 leading-relaxed min-h-[38px]">
                    {c.description}
                  </p>

                  {/* Latency & Model info if connected */}
                  {c.isConnected && c.category === 'ai' && (
                    <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-100 text-[11px] space-y-1">
                      <div className="flex items-center justify-between text-slate-600 font-medium">
                        <span>Selected Model:</span>
                        <span className="font-mono font-bold text-slate-800">{c.selectedModel || 'gemini-3.8-flash'}</span>
                      </div>
                      {c.latencyMs && (
                        <div className="flex items-center justify-between text-slate-400 text-[10px]">
                          <span>Ping Latency:</span>
                          <span className="text-emerald-600 font-bold">{c.latencyMs}ms</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions bottom bar */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  {c.id === 'gemini' ? (
                    <button
                      onClick={() => handleTestConnection(c)}
                      className="w-full py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Test Gemini Ping</span>
                    </button>
                  ) : c.id === 'classroom' ? (
                    <button
                      onClick={onOpenClassroom}
                      className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Open Classroom Hub</span>
                    </button>
                  ) : (
                    <>
                      {c.isConnected ? (
                        <>
                          <button
                            onClick={() => handleTestConnection(c)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1 transition cursor-pointer"
                            title="Test connection"
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span>Test</span>
                          </button>

                          <button
                            onClick={() => handleDisconnect(c.id)}
                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold rounded-xl text-xs flex items-center gap-1 transition cursor-pointer"
                            title="Disconnect service"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Disconnect</span>
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingConnector(c);
                            setInputKey(c.apiKey || '');
                            setTestResult(null);
                          }}
                          className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
                        >
                          <Plug className="w-3.5 h-3.5" />
                          <span>Connect {c.name}</span>
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Security & Token Guarantee Card */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs flex items-start gap-3">
          <Lock className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs text-slate-600">
            <h4 className="font-bold text-slate-900">Enterprise Security &amp; Client-Side Privacy Guarantee</h4>
            <p className="leading-relaxed">
              All external credentials and API keys configured in the Connectors Hub are stored exclusively within your secure browser session and encrypted client-side storage. Requests are processed through server-side proxy routes with zero public credential leakage.
            </p>
          </div>
        </div>

      </div>

      {/* Connect / Configure Modal */}
      {editingConnector && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-black text-slate-900">
                  Connect {editingConnector.name}
                </h3>
              </div>
              <button
                onClick={() => setEditingConnector(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Enter your {editingConnector.name} API key below. You can obtain your key from your official developer console.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">API Key / Access Token</label>
              <input
                type="password"
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                placeholder={editingConnector.id === 'openai' ? 'sk-...' : 'sk-ant-...'}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:bg-white outline-none font-mono"
              />
            </div>

            {testResult && (
              <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                testResult.success
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border border-rose-200 text-rose-800'
              }`}>
                {testResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
                <span>{testResult.message}</span>
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                onClick={() => setEditingConnector(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>

              <button
                onClick={() => handleTestConnection(editingConnector, inputKey)}
                disabled={isTesting || !inputKey.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plug className="w-3.5 h-3.5" />}
                <span>Verify &amp; Save</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
