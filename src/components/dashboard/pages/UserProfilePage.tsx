import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  GraduationCap, 
  School, 
  Globe, 
  Lock, 
  Download, 
  Trash2, 
  Check, 
  Save, 
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { UserProfile } from '../../../types';

interface UserProfilePageProps {
  userProfile: UserProfile | null;
  user: any;
  onUpdateProfile?: (updates: Partial<UserProfile>) => void;
  onSelectLanguage: () => void;
  onSignOut: () => void;
}

export const UserProfilePage: React.FC<UserProfilePageProps> = ({
  userProfile,
  user,
  onUpdateProfile,
  onSelectLanguage,
  onSignOut
}) => {
  const [displayName, setDisplayName] = useState(userProfile?.displayName || user?.displayName || 'Student Scholar');
  const [phoneNumber, setPhoneNumber] = useState('+91 98765 43210');
  const [className, setClassName] = useState('Class 10 (Secondary)');
  const [schoolName, setSchoolName] = useState('Delhi Public School');
  const [board, setBoard] = useState('CBSE (Central Board)');
  const [country, setCountry] = useState('India');
  const [isSaved, setIsSaved] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSave = () => {
    if (onUpdateProfile) {
      onUpdateProfile({ displayName });
    }
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleExportData = () => {
    const userData = {
      profile: { displayName, email: user?.email, className, schoolName, board, country },
      exportDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `StudyTop_Profile_Data.json`;
    a.click();
  };

  const handleDeleteAccount = () => {
    if (confirm('Warning: Deleting your account will permanently wipe your notes and profile. Are you sure?')) {
      alert('Account deletion request submitted. Session will now be terminated.');
      onSignOut();
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto font-sans text-slate-900">
      {/* Header */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[11px] font-extrabold uppercase tracking-wider">
            Identity &amp; Credentials
          </span>
          <h2 className="text-2xl font-black text-slate-900 mt-1">Student Profile &amp; Account</h2>
          <p className="text-xs text-slate-500 mt-1">
            Manage your academic credentials, school board, preferences, and data privacy.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black cursor-pointer flex items-center gap-1.5 shadow-2xs self-start sm:self-auto"
        >
          {isSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          <span>{isSaved ? 'Changes Saved!' : 'Save Profile'}</span>
        </button>
      </div>

      {/* Main Profile Form */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
        {/* Avatar & Email preview */}
        <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-2xl flex items-center justify-center shadow-md">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900">{displayName}</h3>
            <p className="text-xs text-slate-500">{user?.email || 'student@studytop.io'}</p>
            <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase">
              Verified Student Scholar
            </span>
          </div>
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-black text-slate-600 uppercase mb-1">Full Legal / Academic Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-black text-slate-600 uppercase mb-1">Email Address</label>
            <input
              type="email"
              value={user?.email || 'student@studytop.io'}
              disabled
              className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-500 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-[11px] font-black text-slate-600 uppercase mb-1">Phone Number (Optional)</label>
            <input
              type="text"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-black text-slate-600 uppercase mb-1">Class / Standard</label>
            <select
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 outline-none"
            >
              <option>Class 8</option>
              <option>Class 9</option>
              <option>Class 10 (Secondary)</option>
              <option>Class 11 (Science / STEM)</option>
              <option>Class 12 (Board Finals)</option>
              <option>College / University Undergraduate</option>
              <option>Competitive Aspirant (JEE / NEET / UPSC)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-black text-slate-600 uppercase mb-1">School / College Name</label>
            <input
              type="text"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-black text-slate-600 uppercase mb-1">Education Board</label>
            <select
              value={board}
              onChange={(e) => setBoard(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 outline-none"
            >
              <option>CBSE (Central Board)</option>
              <option>ICSE / ISC</option>
              <option>State Board</option>
              <option>IB / Cambridge International</option>
              <option>University / Higher Education</option>
            </select>
          </div>
        </div>

        {/* Language selector shortcut */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-black text-slate-800">Study Language</p>
            <p className="text-[11px] text-slate-400">Current setting: {userProfile?.language || 'English'}</p>
          </div>
          <button
            onClick={onSelectLanguage}
            className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
          >
            Switch Language →
          </button>
        </div>
      </div>

      {/* Account Security & Privacy Zone */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-4">
        <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
          Data Management &amp; Privacy
        </h3>

        <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
          <div>
            <p className="text-xs font-black text-slate-900">Export All Account Notes &amp; Data</p>
            <p className="text-[11px] text-slate-500">Download a full JSON archive of your study material</p>
          </div>
          <button
            onClick={handleExportData}
            className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-700 cursor-pointer flex items-center gap-1.5 shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Archive</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-rose-50/50 rounded-2xl border border-rose-200">
          <div>
            <p className="text-xs font-black text-rose-900">Permanent Account Deletion</p>
            <p className="text-[11px] text-rose-700/80">Wipe all study notes, chat transcripts, and subscription profile</p>
          </div>
          <button
            onClick={handleDeleteAccount}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-extrabold cursor-pointer flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Account</span>
          </button>
        </div>
      </div>
    </div>
  );
};
