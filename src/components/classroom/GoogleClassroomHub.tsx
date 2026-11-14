import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  BookOpen, 
  FileText, 
  Calendar, 
  Clock, 
  ExternalLink, 
  Sparkles, 
  ArrowLeft, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Layers, 
  Search, 
  Users, 
  Award,
  ChevronRight,
  LogOut,
  HelpCircle,
  Share2
} from 'lucide-react';
import { 
  googleClassroomService, 
  ClassroomCourse, 
  ClassroomCourseWork, 
  ClassroomAnnouncement 
} from '../../lib/googleClassroomService';
import { auth, googleProvider, setCachedAccessToken, getAccessToken } from '../../lib/firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { StudyTopLogo } from '../StudyTopLogo';

interface GoogleClassroomHubProps {
  onBack: () => void;
  onConvertAssignmentToNotes: (assignment: { title: string; content: string; subject?: string }) => void;
  onSolveWithAi?: (assignment: { title: string; content: string }) => void;
}

export const GoogleClassroomHub: React.FC<GoogleClassroomHubProps> = ({
  onBack,
  onConvertAssignmentToNotes,
  onSolveWithAi
}) => {
  const [courses, setCourses] = useState<ClassroomCourse[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<ClassroomCourse | null>(null);
  const [courseWork, setCourseWork] = useState<ClassroomCourseWork[]>([]);
  const [announcements, setAnnouncements] = useState<ClassroomAnnouncement[]>([]);
  const [activeTab, setActiveTab] = useState<'assignments' | 'announcements' | 'materials'>('assignments');

  // Loading & Error States
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [needsConnect, setNeedsConnect] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Check token availability and load courses
  const loadClassroomCourses = async () => {
    setIsLoadingCourses(true);
    setErrorMessage(null);
    try {
      const token = await getAccessToken();
      if (!token) {
        setNeedsConnect(true);
        setIsLoadingCourses(false);
        return;
      }
      setNeedsConnect(false);
      const fetchedCourses = await googleClassroomService.listCourses();
      setCourses(fetchedCourses);
      if (fetchedCourses.length > 0 && !selectedCourse) {
        setSelectedCourse(fetchedCourses[0]);
      }
    } catch (err: any) {
      if (err?.message?.includes('permissions') || err?.message?.includes('token')) {
        setNeedsConnect(true);
      } else {
        setErrorMessage(err.message || 'Could not load courses from Google Classroom.');
      }
    } finally {
      setIsLoadingCourses(false);
    }
  };

  useEffect(() => {
    loadClassroomCourses();
  }, []);

  // When a course is selected, load its courseWork and announcements
  useEffect(() => {
    if (!selectedCourse) return;

    const loadCourseDetails = async () => {
      setIsLoadingDetails(true);
      setErrorMessage(null);
      try {
        const [works, anns] = await Promise.all([
          googleClassroomService.listCourseWork(selectedCourse.id).catch(() => []),
          googleClassroomService.listAnnouncements(selectedCourse.id).catch(() => [])
        ]);
        setCourseWork(works);
        setAnnouncements(anns);
      } catch (err: any) {
        setErrorMessage('Failed to load course content. Please verify your connection.');
      } finally {
        setIsLoadingDetails(false);
      }
    };

    loadCourseDetails();
  }, [selectedCourse]);

  // Connect Google Classroom with Popup
  const handleConnectClassroom = async () => {
    setIsConnecting(true);
    setErrorMessage(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        setCachedAccessToken(credential.accessToken);
        setNeedsConnect(false);
        await loadClassroomCourses();
      } else {
        throw new Error('Access token not granted for Google Classroom.');
      }
    } catch (err: any) {
      console.error('Google Classroom Connect Error:', err);
      setErrorMessage(err.message || 'Failed to authenticate Google Classroom. Please grant Classroom permissions.');
    } finally {
      setIsConnecting(false);
    }
  };

  const filteredWork = courseWork.filter(w => 
    w.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (w.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans select-none">
      
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200/90 px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition cursor-pointer flex items-center gap-1 font-bold text-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Dashboard</span>
          </button>

          <div className="h-5 w-px bg-slate-200" />

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                <span>Google Classroom Integration</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 uppercase">
                  Verified API
                </span>
              </h1>
              <p className="text-[11px] text-slate-500">Sync assignments, courses &amp; turn classwork into AI study notes</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!needsConnect && (
            <button
              onClick={loadClassroomCourses}
              disabled={isLoadingCourses}
              className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition cursor-pointer"
              title="Refresh Classroom Data"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingCourses ? 'animate-spin text-blue-600' : ''}`} />
            </button>
          )}

          {needsConnect && (
            <button
              onClick={handleConnectClassroom}
              disabled={isConnecting}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isConnecting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <GraduationCap className="w-3.5 h-3.5" />}
              <span>Connect Google Classroom</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Workspace Body */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Connection curtain if token missing */}
        {needsConnect ? (
          <div className="lg:col-span-12 my-auto max-w-xl mx-auto w-full">
            <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-10 shadow-xl text-center space-y-5">
              <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <GraduationCap className="w-8 h-8" />
              </div>

              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                  Connect Your Google Classroom
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                  Authorize Study Top to see your active courses, class assignments, and announcements. 
                  You can instantly convert any assignment or study material into structured AI notes with 1-click!
                </p>
              </div>

              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 text-left flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="pt-2">
                <button
                  onClick={handleConnectClassroom}
                  disabled={isConnecting}
                  className="w-full py-3 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition cursor-pointer disabled:opacity-60"
                >
                  {isConnecting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <GraduationCap className="w-4 h-4" />
                  )}
                  <span>{isConnecting ? 'Authorizing Classroom...' : 'Authorize with Google'}</span>
                </button>
              </div>

              <div className="pt-4 border-t border-slate-100 grid grid-cols-3 gap-2 text-left">
                <div className="p-2.5 bg-slate-50 rounded-xl">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Courses</div>
                  <div className="text-xs font-black text-slate-800">Auto-Synced</div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Assignments</div>
                  <div className="text-xs font-black text-slate-800">1-Click Notes</div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Privacy</div>
                  <div className="text-xs font-black text-emerald-700">Encrypted</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Left Sidebar: Course List */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                    <span>My Classes ({courses.length})</span>
                  </h3>
                  {isLoadingCourses && <RefreshCw className="w-3 h-3 text-slate-400 animate-spin" />}
                </div>

                {courses.length === 0 && !isLoadingCourses ? (
                  <div className="p-6 text-center text-slate-400 space-y-2">
                    <BookOpen className="w-8 h-8 mx-auto text-slate-300" />
                    <p className="text-xs">No active Google Classroom courses found.</p>
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-[550px] overflow-y-auto pr-1">
                    {courses.map((c) => {
                      const isSelected = selectedCourse?.id === c.id;
                      return (
                        <div
                          key={c.id}
                          onClick={() => setSelectedCourse(c)}
                          className={`p-3 rounded-2xl cursor-pointer transition border text-left ${
                            isSelected 
                              ? 'bg-blue-50/90 border-blue-200 text-blue-900 shadow-2xs' 
                              : 'bg-white border-slate-100 hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="font-bold text-xs truncate">{c.name}</div>
                            {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />}
                          </div>
                          {c.section && (
                            <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                              Section: {c.section}
                            </div>
                          )}
                          {c.room && (
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              Room: {c.room}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right Pane: Coursework & Assignment Details */}
            <div className="lg:col-span-8 space-y-4">
              {selectedCourse ? (
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xs space-y-5">
                  {/* Selected Course Header Banner */}
                  <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="text-xs uppercase font-bold text-blue-200 tracking-wider">
                        Active Google Classroom Course
                      </div>
                      <h2 className="text-lg sm:text-xl font-black mt-0.5">{selectedCourse.name}</h2>
                      {selectedCourse.section && (
                        <p className="text-xs text-blue-100 mt-0.5">Section: {selectedCourse.section}</p>
                      )}
                    </div>

                    {selectedCourse.alternateLink && (
                      <a
                        href={selectedCourse.alternateLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs transition cursor-pointer"
                      >
                        <span>Open in Classroom</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>

                  {/* Tabs: Assignments vs Announcements */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setActiveTab('assignments')}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer ${
                          activeTab === 'assignments' 
                            ? 'bg-blue-600 text-white shadow-2xs' 
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        Assignments ({courseWork.length})
                      </button>
                      <button
                        onClick={() => setActiveTab('announcements')}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer ${
                          activeTab === 'announcements' 
                            ? 'bg-blue-600 text-white shadow-2xs' 
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        Announcements ({announcements.length})
                      </button>
                    </div>

                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search assignments..."
                        className="pl-8 pr-3 py-1 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none w-36 sm:w-48"
                      />
                    </div>
                  </div>

                  {/* Content List */}
                  {isLoadingDetails ? (
                    <div className="p-12 text-center text-slate-400 space-y-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
                      <p className="text-xs">Loading Google Classroom content...</p>
                    </div>
                  ) : activeTab === 'assignments' ? (
                    filteredWork.length === 0 ? (
                      <div className="p-10 text-center text-slate-400 space-y-2">
                        <FileText className="w-8 h-8 text-slate-300 mx-auto" />
                        <p className="text-xs">No assignments found for this course.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {filteredWork.map((work) => (
                          <div 
                            key={work.id}
                            className="p-4 rounded-2xl border border-slate-200 hover:border-blue-300 bg-white hover:bg-blue-50/30 transition shadow-2xs space-y-2.5"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <h4 className="text-sm font-bold text-slate-900">{work.title}</h4>
                                {work.dueDate && (
                                  <div className="flex items-center gap-1.5 text-[11px] text-amber-700 font-semibold mt-1">
                                    <Clock className="w-3 h-3 text-amber-600" />
                                    <span>
                                      Due: {work.dueDate.year}-{String(work.dueDate.month).padStart(2, '0')}-{String(work.dueDate.day).padStart(2, '0')}
                                    </span>
                                    {typeof work.maxPoints === 'number' && (
                                      <span className="text-slate-400">• {work.maxPoints} pts</span>
                                    )}
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => onConvertAssignmentToNotes({
                                    title: work.title,
                                    content: work.description ? `${work.title}\n\n${work.description}` : work.title,
                                    subject: selectedCourse.name
                                  })}
                                  className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-2xs flex items-center gap-1.5 cursor-pointer"
                                  title="Convert this assignment to AI Study Notes"
                                >
                                  <Sparkles className="w-3.5 h-3.5" />
                                  <span>Make AI Notes</span>
                                </button>

                                {onSolveWithAi && (
                                  <button
                                    onClick={() => onSolveWithAi({
                                      title: work.title,
                                      content: work.description || work.title
                                    })}
                                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition cursor-pointer"
                                    title="Solve question with AI"
                                  >
                                    Solve
                                  </button>
                                )}
                              </div>
                            </div>

                            {work.description && (
                              <p className="text-xs text-slate-600 line-clamp-3 bg-slate-50 p-2.5 rounded-xl font-mono text-[11px] leading-relaxed">
                                {work.description}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )
                  ) : (
                    // Announcements
                    announcements.length === 0 ? (
                      <div className="p-10 text-center text-slate-400 space-y-2">
                        <FileText className="w-8 h-8 text-slate-300 mx-auto" />
                        <p className="text-xs">No announcements in this class stream.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {announcements.map((ann) => (
                          <div 
                            key={ann.id}
                            className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2 shadow-2xs"
                          >
                            <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-line">
                              {ann.text}
                            </p>
                            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-400">
                              <span>{new Date(ann.creationTime).toLocaleDateString()}</span>
                              <button
                                onClick={() => onConvertAssignmentToNotes({
                                  title: `Announcement: ${selectedCourse.name}`,
                                  content: ann.text,
                                  subject: selectedCourse.name
                                })}
                                className="text-blue-600 hover:underline font-bold inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Sparkles className="w-3 h-3" />
                                <span>Create Notes</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  )}
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-400 space-y-2">
                  <GraduationCap className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-xs">Select a course on the left to view assignments and materials.</p>
                </div>
              )}
            </div>
          </>
        )}

      </div>
    </div>
  );
};
