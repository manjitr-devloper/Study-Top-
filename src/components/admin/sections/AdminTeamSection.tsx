import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  Crown, 
  ShieldCheck, 
  UserPlus, 
  CheckCircle2, 
  Key, 
  Award,
  Mail
} from 'lucide-react';
import { AdminTeamMember } from '../adminTypes';

interface AdminTeamSectionProps {
  team: AdminTeamMember[];
  creatorName: string;
  onInvite: (name: string, email: string, role: string) => Promise<void>;
  actionLoading: boolean;
  darkMode: boolean;
}

export const AdminTeamSection: React.FC<AdminTeamSectionProps> = ({
  team,
  creatorName,
  onInvite,
  actionLoading,
  darkMode
}) => {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Moderator');

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) return;
    await onInvite(inviteName.trim(), inviteEmail.trim(), inviteRole);
    setInviteName('');
    setInviteEmail('');
    setShowInviteModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-500" />
            <span>Admin Team, Creators &amp; Permissions</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Role-based privilege management, creator authentication, and staff governance
          </p>
        </div>

        <button
          onClick={() => setShowInviteModal(true)}
          className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-500/20 hover:from-blue-500 hover:to-indigo-500 transition-all cursor-pointer self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Invite Staff / Moderator</span>
        </button>
      </div>

      {/* Creator Highlight Card */}
      <div className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-tr from-amber-500 via-rose-600 to-indigo-600 text-white shadow-xl shadow-rose-950/20">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-3xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center font-black text-2xl shadow-lg shrink-0">
              MR
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-amber-400 text-slate-950 font-black text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                  Only Admin: Manjit Ranjan
                </span>
                <span className="text-xs font-bold text-amber-200">Founder &amp; Google Developer</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black mt-1">Manjit Ranjan</h3>
              <p className="text-xs text-rose-100 font-mono mt-0.5">manjitranjan180513@gmail.com</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1.5 rounded-xl bg-white/20 backdrop-blur-md text-xs font-bold border border-white/30 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-amber-300" />
              <span>Root Passcode Verified</span>
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-white/20 backdrop-blur-md text-xs font-bold border border-white/30 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
              <span>Unrestricted Root Access</span>
            </span>
          </div>
        </div>
      </div>

      {/* Team Members List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {team.map((member) => (
          <div
            key={member.id}
            className={`p-5 rounded-3xl border shadow-lg space-y-3 ${
              darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200/80'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm text-white ${
                  member.isCreator 
                    ? 'bg-gradient-to-tr from-amber-500 to-rose-600 shadow-sm' 
                    : 'bg-indigo-600'
                }`}>
                  {member.name[0]}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <span>{member.name}</span>
                    {member.isCreator && <Crown className="w-3.5 h-3.5 text-amber-500" />}
                  </h4>
                  <p className="text-xs text-slate-500 font-mono">{member.email}</p>
                </div>
              </div>

              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                member.isCreator 
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300' 
                  : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
              }`}>
                {member.role}
              </span>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                Assigned Privileges
              </span>
              <div className="flex flex-wrap gap-1.5">
                {member.permissions.map(perm => (
                  <span
                    key={perm}
                    className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                  >
                    {perm}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.form
            onSubmit={handleInviteSubmit}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`w-full max-w-md rounded-3xl p-6 border shadow-2xl space-y-4 ${
              darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <h3 className="text-base font-black">Invite Staff or Content Moderator</h3>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                placeholder="e.g. Sarah Jenkins"
                className="w-full p-2.5 rounded-xl text-xs font-bold border outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="staff@example.com"
                className="w-full p-2.5 rounded-xl text-xs font-bold border outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Role &amp; Permissions</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="w-full p-2.5 rounded-xl text-xs font-bold border outline-none cursor-pointer"
              >
                <option value="Moderator">Moderator (Review Content &amp; Reports)</option>
                <option value="Admin">Administrator (Manage Students &amp; Support)</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold cursor-pointer"
              >
                Send Staff Invitation
              </button>
            </div>
          </motion.form>
        </div>
      )}
    </div>
  );
};
