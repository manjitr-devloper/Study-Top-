import React, { useState, useEffect } from 'react';
import { GraduationCap, X, Upload, ShieldCheck, Loader2, CheckCircle, Clock, AlertCircle, FileText, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface StudentVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: { uid: string; email?: string; displayName?: string };
}

export const StudentVerificationModal: React.FC<StudentVerificationModalProps> = ({
  isOpen,
  onClose,
  user
}) => {
  const [studentName, setStudentName] = useState(user.displayName || '');
  const [institutionName, setInstitutionName] = useState('');
  const [classGrade, setClassGrade] = useState('College / Undergrad');
  const [rollNumber, setRollNumber] = useState('');
  const [academicSession, setAcademicSession] = useState('2025 - 2026');
  const [documentName, setDocumentName] = useState('');
  const [documentUrl, setDocumentUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [latestVerification, setLatestVerification] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && user?.uid) {
      fetchStatus();
    }
  }, [isOpen, user?.uid]);

  const fetchStatus = async () => {
    setFetching(true);
    try {
      const res = await fetch(`/api/student/verify-status/${user.uid}`);
      const data = await res.json();
      if (data.success) {
        setLatestVerification(data.latestVerification);
        setSubscription(data.subscription);
      }
    } catch (err) {
      console.error('Failed to fetch verification status', err);
    } finally {
      setFetching(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be under 10MB.');
      return;
    }
    setDocumentName(file.name);
    // Convert to mock data URL for storage persistence
    const reader = new FileReader();
    reader.onload = () => {
      setDocumentUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName || !institutionName || !documentUrl) {
      setError('Please fill in all required fields and upload your Student ID document.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/student/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user.uid,
          studentName,
          institutionName,
          classGrade,
          rollNumber,
          academicSession,
          documentUrl,
          documentName
        })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg('Student verification application submitted successfully! Pending admin review.');
        fetchStatus();
      } else {
        setError(data.error || 'Failed to submit verification.');
      }
    } catch (err: any) {
      setError(err?.message || 'Network error during verification submission.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        className="fixed inset-0 bg-slate-950/75 backdrop-blur-md z-[120] flex items-center justify-center p-3 md:p-6 overflow-y-auto"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-[32px] md:rounded-[40px] w-full max-w-2xl shadow-2xl border border-indigo-100 flex flex-col max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 px-6 py-5 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="py-1.5 px-3 rounded-xl bg-white/20 hover:bg-white/30 text-white font-extrabold text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer border border-white/20 shadow-2xs shrink-0"
                title="Back to Dashboard"
              >
                <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
                <span>Back</span>
              </button>

              <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black tracking-tight">Verify Your Student Identity</h3>
                <p className="text-xs text-indigo-100">Get 100% Free Premium Access across all Study Top features</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/20 cursor-pointer">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {fetching ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
              </div>
            ) : (
              <>
                {/* Current Status Card */}
                <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-indigo-900 uppercase tracking-wide">Verification Status</h4>
                      <p className="text-sm font-bold text-slate-700">
                        {latestVerification?.status === 'approved' ? (
                          <span className="text-emerald-600 flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Verified Student (Free Premium Active)</span>
                        ) : latestVerification?.status === 'pending' ? (
                          <span className="text-amber-600 flex items-center gap-1"><Clock className="w-4 h-4" /> Pending Admin Review</span>
                        ) : latestVerification?.status === 'rejected' ? (
                          <span className="text-rose-600 flex items-center gap-1"><AlertCircle className="w-4 h-4" /> Application Rejected ({latestVerification?.rejectionReason || 'Please re-upload valid ID'})</span>
                        ) : (
                          <span className="text-slate-600">Not Verified Yet — Apply Below</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {latestVerification?.status === 'approved' ? (
                  <div className="text-center py-8 space-y-4">
                    <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle className="w-8 h-8" />
                    </div>
                    <h4 className="text-lg font-black text-slate-800">You Are a Verified Student!</h4>
                    <p className="text-xs text-slate-600 max-w-md mx-auto">
                      Your student ID from <span className="font-bold text-slate-800">{latestVerification.institutionName}</span> has been verified by the Study Top admin team. You have free premium access until {new Date(subscription?.endAt || Date.now() + 365*24*60*60*1000).toLocaleDateString()}.
                    </p>
                  </div>
                ) : latestVerification?.status === 'pending' ? (
                  <div className="text-center py-8 space-y-4">
                    <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto animate-pulse">
                      <Clock className="w-8 h-8" />
                    </div>
                    <h4 className="text-lg font-black text-slate-800">Verification Under Review</h4>
                    <p className="text-xs text-slate-600 max-w-md mx-auto">
                      Your student ID card for <span className="font-bold text-slate-800">{latestVerification.institutionName}</span> has been received and is awaiting admin review by Manjit Ranjan. We usually review within 24 hours.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                      <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl">
                        {error}
                      </div>
                    )}
                    {successMsg && (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-xl">
                        {successMsg}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1">Student Full Name *</label>
                        <input
                          type="text"
                          required
                          value={studentName}
                          onChange={(e) => setStudentName(e.target.value)}
                          placeholder="e.g. Aarav Sharma"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:border-indigo-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1">Institution / School / College *</label>
                        <input
                          type="text"
                          required
                          value={institutionName}
                          onChange={(e) => setInstitutionName(e.target.value)}
                          placeholder="e.g. IIT Delhi / Delhi Public School"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:border-indigo-500 outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1">Class / Grade *</label>
                        <select
                          value={classGrade}
                          onChange={(e) => setClassGrade(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:border-indigo-500 outline-none"
                        >
                          {['High School (9th-10th)', 'Higher Secondary (11th-12th)', 'College / Undergrad', 'Postgraduate / Master', 'Other'].map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1">Roll Number / ID No.</label>
                        <input
                          type="text"
                          value={rollNumber}
                          onChange={(e) => setRollNumber(e.target.value)}
                          placeholder="e.g. 2025CS104"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:border-indigo-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1">Academic Session *</label>
                        <input
                          type="text"
                          required
                          value={academicSession}
                          onChange={(e) => setAcademicSession(e.target.value)}
                          placeholder="2025 - 2026"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:border-indigo-500 outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1">Upload Student ID Card (JPG, PNG, PDF &lt; 10MB) *</label>
                      <div className="border-2 border-dashed border-indigo-200 rounded-2xl p-6 text-center bg-indigo-50/30 hover:bg-indigo-50/60 transition-all relative">
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png,.pdf"
                          onChange={handleFileUpload}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                            <Upload className="w-6 h-6" />
                          </div>
                          <p className="text-xs font-bold text-slate-700">
                            {documentName ? <span className="text-indigo-700 font-extrabold flex items-center gap-1"><FileText className="w-4 h-4" /> {documentName}</span> : 'Click to upload or drag & drop student ID card'}
                          </p>
                          <p className="text-[10px] text-slate-400">Secure private storage. Never made public.</p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        type="submit"
                        disabled={loading || !documentUrl}
                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                      >
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        <span>Submit Student Verification</span>
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
