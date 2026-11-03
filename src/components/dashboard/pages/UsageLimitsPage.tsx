import React from 'react';
import { 
  BarChart2, 
  Sparkles, 
  FileText, 
  FileUp, 
  HardDrive, 
  CheckSquare, 
  Zap, 
  ArrowRight,
  Info
} from 'lucide-react';

interface UsageLimitsPageProps {
  notesCount: number;
  onOpenPricing: () => void;
}

export const UsageLimitsPage: React.FC<UsageLimitsPageProps> = ({
  notesCount,
  onOpenPricing
}) => {
  const quotas = [
    {
      label: 'AI Notes & Chapter Summaries',
      used: notesCount,
      limit: 100,
      unit: 'notes',
      icon: FileText,
      color: 'bg-blue-600',
      desc: 'Monthly limit on notes generated via Gemini Flash'
    },
    {
      label: 'AI Interactive Inquiries',
      used: 68,
      limit: 250,
      unit: 'questions',
      icon: Sparkles,
      color: 'bg-indigo-600',
      desc: 'Questions asked in AI Assistant & PDF Solver'
    },
    {
      label: 'Math Problems Solved',
      used: 48,
      limit: 'Unlimited',
      unit: 'problems',
      icon: Zap,
      color: 'bg-emerald-600',
      desc: 'Free tier guaranteed unlimited math calculations'
    },
    {
      label: 'PDF & Document Uploads',
      used: 4,
      limit: 25,
      unit: 'documents',
      icon: FileUp,
      color: 'bg-amber-600',
      desc: 'Textbook pages and assignments parsed via OCR'
    },
    {
      label: 'Cloud File Storage',
      used: '4.2 MB',
      limit: '100 MB',
      percent: 4.2,
      unit: 'MB',
      icon: HardDrive,
      color: 'bg-purple-600',
      desc: 'Encrypted Firestore & storage space'
    },
    {
      label: 'Quizzes & Practice Tests',
      used: 12,
      limit: 50,
      unit: 'tests',
      icon: CheckSquare,
      color: 'bg-teal-600',
      desc: 'Timed practice assessments evaluated with analytics'
    }
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto font-sans text-slate-900">
      {/* Header */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[11px] font-extrabold uppercase tracking-wider">
            Fair Use &amp; Transparency
          </span>
          <h2 className="text-2xl font-black text-slate-900 mt-1">Usage &amp; Quota Limits</h2>
          <p className="text-xs text-slate-500 mt-1">
            Real-time tracking of your monthly AI processing credits, note generations, and cloud storage.
          </p>
        </div>

        <button
          onClick={onOpenPricing}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black cursor-pointer flex items-center gap-1.5 shadow-2xs self-start sm:self-auto"
        >
          <Zap className="w-4 h-4" />
          <span>Increase Limits</span>
        </button>
      </div>

      {/* Quotas Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {quotas.map((q, idx) => {
          const isNumericLimit = typeof q.limit === 'number';
          const percent = q.percent !== undefined 
            ? q.percent 
            : isNumericLimit 
              ? Math.min(100, Math.round(((q.used as number) / (q.limit as number)) * 100))
              : 100;

          return (
            <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                    <q.icon className="w-4 h-4 text-slate-700" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900">{q.label}</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">{q.desc}</p>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-baseline justify-between mb-1.5 text-xs font-black">
                  <span className="text-slate-900">{q.used} {typeof q.limit === 'number' ? `/ ${q.limit} ${q.unit}` : ''}</span>
                  <span className="text-slate-400 text-[11px] font-bold">
                    {typeof q.limit === 'string' ? q.limit : `${percent}% used`}
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full ${q.color} rounded-full transition-all duration-300`} style={{ width: `${percent}%` }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Reset Date Explanation Box */}
      <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl flex items-start gap-3 text-xs text-blue-900">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-extrabold">Quota Cycle Information:</p>
          <p className="text-blue-800/80 mt-0.5 leading-relaxed">
            All AI credit quotas automatically reset on the <strong>1st day of every calendar month at 00:00 UTC</strong>. Unused monthly credits do not expire your created notes or files.
          </p>
        </div>
      </div>
    </div>
  );
};
