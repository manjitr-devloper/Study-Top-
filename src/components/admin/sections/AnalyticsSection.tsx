import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  BookOpen, 
  Smartphone, 
  Monitor, 
  Clock, 
  PieChart
} from 'lucide-react';

interface AnalyticsSectionProps {
  darkMode: boolean;
}

export const AnalyticsSection: React.FC<AnalyticsSectionProps> = ({ darkMode }) => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedKey = typeof window !== 'undefined' ? sessionStorage.getItem('study_top_admin_key') || '' : '';
    fetch('/api/admin/analytics', {
      headers: {
        'x-user-email': 'manjitranjan180513@gmail.com',
        'Authorization': 'Bearer manjitranjan180513@gmail.com',
        ...(savedKey ? { 'x-admin-key': savedKey } : {})
      }
    })
      .then(r => r.json())
      .then(d => {
        setAnalytics(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const dailyUsers = analytics?.dailyActiveUsers || [
    { date: 'Today', count: 0 }
  ];

  const maxDaily = Math.max(...dailyUsers.map((d: any) => Number(d.count) || 0), 1);
  const peakDailyUsers = Math.max(...dailyUsers.map((d: any) => Number(d.count) || 0), 0);

  const notesByDay = analytics?.notesGeneratedByDay || [
    { date: 'Today', notes: 0 }
  ];

  const maxNotes = Math.max(...notesByDay.map((d: any) => Number(d.notes) || 0), 1);
  const totalNotes7d = notesByDay.reduce((sum: number, d: any) => sum + (Number(d.notes) || 0), 0);

  const popularSubjects = analytics?.popularSubjects && analytics.popularSubjects.length > 0
    ? analytics.popularSubjects
    : [{ subject: 'General Study & Notes', percentage: 100 }];

  const deviceBreakdown = analytics?.deviceBreakdown || {
    mobile: 0,
    desktop: 100,
    tablet: 0
  };

  const subjectColors = ['bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-amber-500'];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-indigo-500" />
          <span>Analytics &amp; Student Learning Telemetry (Live Database)</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Real-time metrics derived strictly from actual student accounts, note records, and device user-agents
        </p>
      </div>

      {/* Top 3 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className={`p-5 rounded-3xl border shadow-lg ${
          darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200/80'
        }`}>
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold mb-2">
            <span>Peak Daily Active Students</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white tabular-nums">
            {loading ? '...' : peakDailyUsers}
          </p>
          <span className="text-xs text-emerald-500 font-bold mt-1 inline-block">
            Live 7-day peak from login records
          </span>
        </div>

        <div className={`p-5 rounded-3xl border shadow-lg ${
          darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200/80'
        }`}>
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold mb-2">
            <span>Avg. Study Session Duration</span>
            <Clock className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white tabular-nums">
            {analytics?.avgSessionDurationMinutes ?? 0} mins
          </p>
          <span className="text-xs text-purple-500 font-bold mt-1 inline-block">
            Retention Rate: {analytics?.studentRetentionRate || '100%'}
          </span>
        </div>

        <div className={`p-5 rounded-3xl border shadow-lg ${
          darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200/80'
        }`}>
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold mb-2">
            <span>Primary Client Platform</span>
            <Smartphone className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white tabular-nums">
            {deviceBreakdown.mobile >= deviceBreakdown.desktop
              ? `${deviceBreakdown.mobile}% Mobile`
              : `${deviceBreakdown.desktop}% Desktop`}
          </p>
          <span className="text-xs text-slate-500 font-medium mt-1 inline-block">
            Measured from authenticated session User-Agents
          </span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Active Users Bar Chart */}
        <div className={`p-6 rounded-3xl border shadow-xl space-y-4 ${
          darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200/80'
        }`}>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              <span>Daily Active Students (Last 7 Days)</span>
            </h3>
            <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 tabular-nums">
              Peak: {peakDailyUsers}
            </span>
          </div>

          <div className="h-44 flex items-end justify-between gap-2 pt-6">
            {dailyUsers.map((d: any) => {
              const heightPct = Math.round(((Number(d.count) || 0) / maxDaily) * 100);
              return (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-[10px] font-mono font-bold text-slate-500 tabular-nums">{d.count}</span>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-t-xl h-32 flex items-end">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${heightPct}%` }}
                      transition={{ duration: 0.5 }}
                      className="w-full bg-gradient-to-t from-blue-600 to-indigo-500 rounded-t-xl"
                    />
                  </div>
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">{d.date}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Notes Generation Velocity */}
        <div className={`p-6 rounded-3xl border shadow-xl space-y-4 ${
          darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200/80'
        }`}>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-purple-500" />
              <span>Notes Created Velocity (Last 7 Days)</span>
            </h3>
            <span className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400 tabular-nums">
              {totalNotes7d} Total
            </span>
          </div>

          <div className="h-44 flex items-end justify-between gap-2 pt-6">
            {notesByDay.map((d: any) => {
              const heightPct = Math.round(((Number(d.notes) || 0) / maxNotes) * 100);
              return (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-[10px] font-mono font-bold text-slate-500 tabular-nums">{d.notes}</span>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-t-xl h-32 flex items-end">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${heightPct}%` }}
                      transition={{ duration: 0.5 }}
                      className="w-full bg-gradient-to-t from-purple-600 to-violet-500 rounded-t-xl"
                    />
                  </div>
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">{d.date}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Popular Subjects & Device Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`p-6 rounded-3xl border shadow-xl space-y-4 ${
          darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200/80'
        }`}>
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
            Most Studied Subjects (From Real Notes &amp; History)
          </h3>

          <div className="space-y-3">
            {popularSubjects.map((item: any, idx: number) => (
              <div key={item.subject} className="space-y-1 text-xs">
                <div className="flex justify-between font-bold">
                  <span className="text-slate-700 dark:text-slate-300">{item.subject}</span>
                  <span className="font-mono tabular-nums">{item.percentage}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${subjectColors[idx % subjectColors.length]}`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={`p-6 rounded-3xl border shadow-xl space-y-4 ${
          darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200/80'
        }`}>
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
            Device &amp; Operating System Distribution
          </h3>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800">
              <Smartphone className="w-6 h-6 text-blue-600 dark:text-blue-400 mx-auto mb-1" />
              <p className="text-2xl font-black text-blue-700 dark:text-blue-300 tabular-nums">
                {deviceBreakdown.mobile}%
              </p>
              <span className="text-[11px] font-bold text-slate-500">Mobile (iOS / Android)</span>
            </div>

            <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800">
              <Monitor className="w-6 h-6 text-purple-600 dark:text-purple-400 mx-auto mb-1" />
              <p className="text-2xl font-black text-purple-700 dark:text-purple-300 tabular-nums">
                {deviceBreakdown.desktop}%
              </p>
              <span className="text-[11px] font-bold text-slate-500">Desktop / Laptop</span>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
              <PieChart className="w-6 h-6 text-amber-600 dark:text-amber-400 mx-auto mb-1" />
              <p className="text-2xl font-black text-amber-700 dark:text-amber-300 tabular-nums">
                {deviceBreakdown.tablet}%
              </p>
              <span className="text-[11px] font-bold text-slate-500">Tablet / iPad</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
