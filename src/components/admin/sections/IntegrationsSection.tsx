import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Cpu, 
  CheckCircle2, 
  RefreshCw, 
  ExternalLink, 
  ShieldCheck, 
  Database, 
  Sparkles, 
  Eye,
  Activity
} from 'lucide-react';

interface IntegrationsSectionProps {
  darkMode: boolean;
}

export const IntegrationsSection: React.FC<IntegrationsSectionProps> = ({ darkMode }) => {
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<any | null>(null);

  const loadIntegrations = async () => {
    try {
      const res = await fetch('/api/admin/integrations', {
        headers: {
          'x-user-email': 'manjitranjan180513@gmail.com',
          'Authorization': 'Bearer manjitranjan180513@gmail.com'
        }
      });
      const data = await res.json();
      setIntegrations(data.integrations || []);
    } catch (_) {}
  };

  useEffect(() => {
    loadIntegrations();
  }, []);

  const runTestPing = async (id: string) => {
    setTestingId(id);
    setTestResult(null);
    try {
      const res = await fetch('/api/admin/integrations/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': 'manjitranjan180513@gmail.com',
          'Authorization': 'Bearer manjitranjan180513@gmail.com'
        },
        body: JSON.stringify({ integrationId: id })
      });
      const data = await res.json();
      setTestResult(data);
    } catch (_) {
      setTestResult({ success: false, message: 'Ping test failed' });
    } finally {
      setTestingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Cpu className="w-6 h-6 text-indigo-500" />
            <span>Cloud Integrations &amp; API Connectivity</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Real-time health status, live diagnostic latency, and external API gateways
          </p>
        </div>

        <button
          onClick={loadIntegrations}
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 self-start sm:self-auto cursor-pointer"
          title="Refresh connection status"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {testResult && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between ${
            testResult.success
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300'
          }`}
        >
          <span>{testResult.message} ({testResult.latencyMs}ms latency)</span>
          <button onClick={() => setTestResult(null)} className="text-xs underline cursor-pointer">Dismiss</button>
        </motion.div>
      )}

      {/* Grid of Integrations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {integrations.map((item) => (
          <div
            key={item.id}
            className={`p-6 rounded-3xl border shadow-xl flex flex-col justify-between space-y-4 ${
              darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200/80'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-500">
                  {item.category}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  {item.status}
                </span>
              </div>

              <h3 className="text-base font-black text-slate-900 dark:text-white">{item.name}</h3>
              <p className="text-xs text-slate-500 mt-0.5 font-mono">
                {item.projectId || item.mode || 'API Key Authorized'}
              </p>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
              <span className="font-mono text-slate-500 flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-emerald-500" />
                <span>{item.latencyMs}ms latency</span>
              </span>

              <button
                disabled={testingId === item.id}
                onClick={() => runTestPing(item.id)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-[11px] flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${testingId === item.id ? 'animate-spin' : ''}`} />
                <span>{testingId === item.id ? 'Testing...' : 'Test Ping'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
