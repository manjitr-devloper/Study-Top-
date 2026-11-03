import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  Search, 
  ShieldCheck, 
  UserCheck, 
  UserX, 
  Crown, 
  HardDrive, 
  FileText, 
  Mic, 
  MoreVertical,
  Filter,
  Download
} from 'lucide-react';

interface UserManagementSectionProps {
  users: any[];
  onUserAction: (action: string, userId: string, targetEmail: string) => Promise<void>;
  actionLoading: boolean;
  darkMode: boolean;
}

export const UserManagementSection: React.FC<UserManagementSectionProps> = ({
  users,
  onUserAction,
  actionLoading,
  darkMode
}) => {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'super_admin' | 'admin' | 'student'>('all');
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      u.email.toLowerCase().includes(search.toLowerCase()) || 
      (u.displayName || '').toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-500" />
            <span>User Directory &amp; Role Management</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Total {users.length} authenticated users registered in Study Top
          </p>
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search user or email..."
              className={`pl-9 pr-3 py-2 rounded-xl text-xs font-bold outline-none border transition-all ${
                darkMode 
                  ? 'bg-slate-900 border-slate-800 text-white focus:border-indigo-500' 
                  : 'bg-white border-slate-200 text-slate-900 focus:border-indigo-500'
              }`}
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className={`px-3 py-2 rounded-xl text-xs font-bold outline-none border cursor-pointer ${
              darkMode 
                ? 'bg-slate-900 border-slate-800 text-slate-300' 
                : 'bg-white border-slate-200 text-slate-700'
            }`}
          >
            <option value="all">All Roles</option>
            <option value="super_admin">Super Admin</option>
            <option value="admin">Admin</option>
            <option value="student">Student</option>
          </select>
        </div>
      </div>

      {/* Users Table Card */}
      <div className={`rounded-3xl border overflow-hidden shadow-xl ${
        darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200/80'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className={`font-black uppercase text-[10px] tracking-wider border-b ${
              darkMode ? 'bg-slate-800/80 text-slate-400 border-slate-700' : 'bg-slate-50 text-slate-600 border-slate-200'
            }`}>
              <tr>
                <th className="py-3.5 px-5">User</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Storage</th>
                <th className="py-3.5 px-4">Notes</th>
                <th className="py-3.5 px-4">Voice Talks</th>
                <th className="py-3.5 px-5 text-right">Administrative Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y font-medium ${
              darkMode ? 'divide-slate-800 text-slate-300' : 'divide-slate-100 text-slate-700'
            }`}>
              {filteredUsers.map((user) => {
                const isSuperAdmin = user.email === 'manjitranjan180513@gmail.com' || user.role === 'super_admin';
                return (
                  <tr key={user.uid || user.email} className={`transition-colors ${
                    darkMode ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'
                  }`}>
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${
                          isSuperAdmin 
                            ? 'bg-gradient-to-tr from-amber-500 to-rose-600 text-white shadow-sm' 
                            : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                        }`}>
                          {user.displayName?.[0] || user.email[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold flex items-center gap-1.5 text-slate-900 dark:text-white">
                            <span>{user.displayName || 'Student User'}</span>
                            {isSuperAdmin && (
                              <Crown className="w-3.5 h-3.5 text-amber-500 inline shrink-0" />
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">{user.email}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        user.role === 'super_admin' 
                          ? 'bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700' 
                          : user.role === 'admin' 
                          ? 'bg-indigo-100 text-indigo-800 border border-indigo-300 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-700' 
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}>
                        {user.role}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        user.status === 'suspended'
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'suspended' ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                        {user.status || 'active'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px]">
                      {user.storageUsedMb || 2.4} MB
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px]">
                      {user.notesCount || 12}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px]">
                      {user.voiceChatsCount || 4}
                    </td>

                    <td className="py-3.5 px-5 text-right">
                      {isSuperAdmin ? (
                        <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-1 rounded-lg">
                          Super Admin Protected
                        </span>
                      ) : (
                        <div className="flex items-center justify-end gap-1.5">
                          {user.status === 'suspended' ? (
                            <button
                              disabled={actionLoading}
                              onClick={() => onUserAction('activate', user.uid, user.email)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold text-[11px] transition-all cursor-pointer"
                              title="Reactivate student account"
                            >
                              Activate
                            </button>
                          ) : (
                            <button
                              disabled={actionLoading}
                              onClick={() => onUserAction('suspend', user.uid, user.email)}
                              className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 font-bold text-[11px] transition-all cursor-pointer"
                              title="Temporarily suspend student account"
                            >
                              Suspend
                            </button>
                          )}

                          {user.role === 'student' ? (
                            <button
                              disabled={actionLoading}
                              onClick={() => onUserAction('make_admin', user.uid, user.email)}
                              className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 font-bold text-[11px] transition-all cursor-pointer"
                              title="Promote to Admin"
                            >
                              + Admin
                            </button>
                          ) : (
                            <button
                              disabled={actionLoading}
                              onClick={() => onUserAction('make_student', user.uid, user.email)}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-bold text-[11px] transition-all cursor-pointer"
                              title="Demote to Student"
                            >
                              Demote
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
