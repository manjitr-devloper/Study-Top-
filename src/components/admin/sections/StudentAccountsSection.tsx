import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  GraduationCap, 
  Search, 
  Flame, 
  BookOpen, 
  Clock, 
  Award, 
  RotateCcw, 
  UserX, 
  UserCheck, 
  Download,
  Filter
} from 'lucide-react';
import { StudentAccount } from '../adminTypes';

interface StudentAccountsSectionProps {
  students: StudentAccount[];
  onStudentAction: (studentId: string, action: string, reason?: string) => Promise<void>;
  actionLoading: boolean;
  darkMode: boolean;
}

export const StudentAccountsSection: React.FC<StudentAccountsSectionProps> = ({
  students,
  onStudentAction,
  actionLoading,
  darkMode
}) => {
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');

  const filtered = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase());
    const matchesGrade = gradeFilter === 'all' || s.grade.toLowerCase().includes(gradeFilter.toLowerCase());
    return matchesSearch && matchesGrade;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-blue-500" />
            <span>Student Accounts &amp; Academic Learning Records</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Monitor student learning streaks, study subjects, and AI voice tutor interactions
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search student..."
              className={`pl-9 pr-3 py-2 rounded-xl text-xs font-bold outline-none border transition-all ${
                darkMode 
                  ? 'bg-slate-900 border-slate-800 text-white focus:border-blue-500' 
                  : 'bg-white border-slate-200 text-slate-900 focus:border-blue-500'
              }`}
            />
          </div>

          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className={`px-3 py-2 rounded-xl text-xs font-bold outline-none border cursor-pointer ${
              darkMode 
                ? 'bg-slate-900 border-slate-800 text-slate-300' 
                : 'bg-white border-slate-200 text-slate-700'
            }`}
          >
            <option value="all">All Grades</option>
            <option value="College">College / Undergrad</option>
            <option value="High School">High School</option>
            <option value="Medical">Medical / NEET</option>
            <option value="Engineering">Engineering / B.Tech</option>
          </select>
        </div>
      </div>

      {/* Grid of Student Cards with 3D feel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((student) => (
          <motion.div
            key={student.id}
            whileHover={{ y: -2 }}
            className={`p-5 rounded-3xl border shadow-lg transition-all ${
              darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200/80'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 text-white font-black text-sm flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
                  {student.name[0]}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <span>{student.name}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      student.status === 'active' 
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' 
                        : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                    }`}>
                      {student.status}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">{student.email}</p>
                  <p className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 mt-0.5">{student.grade}</p>
                </div>
              </div>

              {/* Study Streak Badge */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300">
                <Flame className="w-4 h-4 text-amber-500" />
                <span className="font-black text-xs">{student.studyStreakDays}d streak</span>
              </div>
            </div>

            {/* Subjects Tags */}
            <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
              {student.subjects.map(subj => (
                <span 
                  key={subj}
                  className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  {subj}
                </span>
              ))}
            </div>

            {/* Metrics & Actions */}
            <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                <span><b>{student.totalNotes}</b> Study Notes</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <Clock className="w-3.5 h-3.5 text-cyan-500" />
                <span><b>{student.aiVoiceMinutes}m</b> AI Voice Tutor</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
              <button
                disabled={actionLoading}
                onClick={() => onStudentAction(student.id, 'reset_streak', 'Admin reset')}
                className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                title="Reset streak to 0"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Streak</span>
              </button>

              {student.status === 'suspended' ? (
                <button
                  disabled={actionLoading}
                  onClick={() => onStudentAction(student.id, 'activate', 'Reactivated by Manjit Ranjan')}
                  className="px-2.5 py-1 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                >
                  <UserCheck className="w-3 h-3" />
                  <span>Activate</span>
                </button>
              ) : (
                <button
                  disabled={actionLoading}
                  onClick={() => onStudentAction(student.id, 'suspend', 'Suspended by admin')}
                  className="px-2.5 py-1 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                >
                  <UserX className="w-3 h-3" />
                  <span>Suspend</span>
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
