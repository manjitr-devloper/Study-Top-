import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Calendar,
  Video,
  FileText,
  Search,
  ExternalLink,
  Sparkles,
  ArrowLeft,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Plus,
  Copy,
  Clock,
  BookOpen,
  Share2,
  FolderPlus,
  Users,
  Compass,
  Link,
  ShieldCheck,
  ChevronRight,
  Layers,
  HelpCircle
} from 'lucide-react';
import {
  googleClassroomService,
  ClassroomCourse,
  ClassroomCourseWork,
  ClassroomAnnouncement
} from '../../lib/googleClassroomService';
import {
  buildGoogleCalendarEventUrl,
  getGoogleMeetNewRoomUrl,
  exportToGoogleDocs,
  queryGoogleSearchGrounding,
  GoogleSearchGroundingResult,
  getGoogleWorkspaceAuthStatus
} from '../../lib/googleServices';
import { auth, googleProvider, setCachedAccessToken, getAccessToken } from '../../lib/firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { StudyTopLogo } from '../StudyTopLogo';

export type GoogleTab = 'classroom' | 'calendar' | 'meet' | 'drive' | 'search';

interface GoogleWorkspaceHubProps {
  onBack: () => void;
  initialTab?: GoogleTab;
  onConvertAssignmentToNotes?: (assignment: { title: string; content: string; subject?: string }) => void;
  onSaveSearchAsNote?: (title: string, content: string) => void;
}

export const GoogleWorkspaceHub: React.FC<GoogleWorkspaceHubProps> = ({
  onBack,
  initialTab = 'classroom',
  onConvertAssignmentToNotes,
  onSaveSearchAsNote
}) => {
  const [activeTab, setActiveTab] = useState<GoogleTab>(initialTab);

  // Classroom State
  const [courses, setCourses] = useState<ClassroomCourse[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<ClassroomCourse | null>(null);
  const [courseWork, setCourseWork] = useState<ClassroomCourseWork[]>([]);
  const [announcements, setAnnouncements] = useState<ClassroomAnnouncement[]>([]);
  const [classroomSubTab, setClassroomSubTab] = useState<'assignments' | 'announcements'>('assignments');
  const [isLoadingClassroom, setIsLoadingClassroom] = useState(false);
  const [isConnectingClassroom, setIsConnectingClassroom] = useState(false);
  const [classroomError, setClassroomError] = useState<string | null>(null);
  const [classroomConnected, setClassroomConnected] = useState(false);

  // Calendar State
  const [eventTitle, setEventTitle] = useState('Biology Midterm Exam Revision');
  const [eventDetails, setEventDetails] = useState('Review Chapter 4 (Cellular Respiration) & Chapter 5 (Photosynthesis) notes.');
  const [eventDurationMinutes, setEventDurationMinutes] = useState(60);
  const [eventLocation, setEventLocation] = useState('Study Top 2.0 / Online');
  const [copiedCalendarNotice, setCopiedCalendarNotice] = useState(false);

  // Meet State
  const [meetTopic, setMeetTopic] = useState('Physics Numerical Problem Solving Session');
  const [meetParticipants, setMeetParticipants] = useState('Study Top Peer Group');
  const [copiedMeetInvite, setCopiedMeetInvite] = useState(false);

  // Drive & Docs State
  const [docTitle, setDocTitle] = useState('Organic Chemistry Formula Sheet');
  const [docContent, setDocContent] = useState('Reaction Mechanisms:\n1. SN1 vs SN2 Nucleophilic Substitution\n2. Markovnikov Addition to Alkenes\n3. Aldol Condensation Derivations');
  const [docCopiedSuccess, setDocCopiedSuccess] = useState(false);

  // Search Grounding State
  const [searchQuery, setSearchQuery] = useState('What are the latest discoveries from the James Webb Space Telescope regarding early galaxies?');
  const [isSearchingGrounding, setIsSearchingGrounding] = useState(false);
  const [groundingResult, setGroundingResult] = useState<GoogleSearchGroundingResult | null>(null);
  const [groundingError, setGroundingError] = useState<string | null>(null);
  const [savedSearchSuccess, setSavedSearchSuccess] = useState(false);

  // Initial Auth Check
  useEffect(() => {
    checkAuthAndLoadClassroom();
  }, []);

  const checkAuthAndLoadClassroom = async () => {
    setIsLoadingClassroom(true);
    setClassroomError(null);
    try {
      const status = await getGoogleWorkspaceAuthStatus();
      if (!status.token) {
        setClassroomConnected(false);
        setIsLoadingClassroom(false);
        return;
      }
      setClassroomConnected(true);
      const fetchedCourses = await googleClassroomService.listCourses();
      setCourses(fetchedCourses);
      if (fetchedCourses.length > 0 && !selectedCourse) {
        setSelectedCourse(fetchedCourses[0]);
      }
    } catch (err: any) {
      if (err?.message?.includes('permissions') || err?.message?.includes('token')) {
        setClassroomConnected(false);
      } else {
        setClassroomError(err.message || 'Could not load courses from Google Classroom.');
      }
    } finally {
      setIsLoadingClassroom(false);
    }
  };

  // Load Course Details (Assignments & Announcements)
  useEffect(() => {
    if (!selectedCourse) return;

    const loadCourseDetails = async () => {
      try {
        const [work, ann] = await Promise.all([
          googleClassroomService.listCourseWork(selectedCourse.id).catch(() => []),
          googleClassroomService.listAnnouncements(selectedCourse.id).catch(() => [])
        ]);
        setCourseWork(work);
        setAnnouncements(ann);
      } catch (e: any) {
        console.warn('Classroom course detail note:', e?.message);
      }
    };

    loadCourseDetails();
  }, [selectedCourse]);

  // Connect Google Classroom via Popup
  const handleConnectClassroom = async () => {
    setIsConnectingClassroom(true);
    setClassroomError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        setCachedAccessToken(credential.accessToken);
        setClassroomConnected(true);
        await checkAuthAndLoadClassroom();
      } else {
        throw new Error('Access token not granted for Google Workspace.');
      }
    } catch (err: any) {
      console.error('Google Classroom Connect Error:', err);
      setClassroomError(err.message || 'Failed to authenticate Google Classroom. Please grant permissions.');
    } finally {
      setIsConnectingClassroom(false);
    }
  };

  // Calendar: Launch Google Calendar Intent
  const handleLaunchGoogleCalendar = () => {
    const start = new Date(Date.now() + 30 * 60 * 1000); // 30 mins from now
    const end = new Date(start.getTime() + eventDurationMinutes * 60 * 1000);
    const url = buildGoogleCalendarEventUrl({
      title: eventTitle,
      details: eventDetails,
      startDate: start,
      endDate: end,
      location: eventLocation
    });
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Meet: Copy study invite & launch Meet
  const handleLaunchGoogleMeet = () => {
    const inviteText = `🎓 Study Top 2.0 Collaborative Study Session
📌 Topic: ${meetTopic}
👥 Group: ${meetParticipants}
🔗 Google Meet Link: ${getGoogleMeetNewRoomUrl()}

Open the link above to join our instant study room!`;

    navigator.clipboard.writeText(inviteText).catch(() => {});
    setCopiedMeetInvite(true);
    setTimeout(() => setCopiedMeetInvite(false), 3000);
    window.open(getGoogleMeetNewRoomUrl(), '_blank', 'noopener,noreferrer');
  };

  // Drive/Docs: Export to Google Docs
  const handleExportToGoogleDocs = () => {
    const res = exportToGoogleDocs(docTitle, docContent);
    setDocCopiedSuccess(true);
    setTimeout(() => setDocCopiedSuccess(false), 3500);
    window.open(res.googleDocsCreateUrl, '_blank', 'noopener,noreferrer');
  };

  // Search Grounding: Run real-time Google search via Gemini
  const handleExecuteSearchGrounding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearchingGrounding(true);
    setGroundingError(null);
    setGroundingResult(null);
    setSavedSearchSuccess(false);

    try {
      const res = await queryGoogleSearchGrounding(searchQuery.trim(), 'Academic Research');
      setGroundingResult(res);
    } catch (err: any) {
      setGroundingError(err.message || 'Google Search Grounding encountered an error. Please try again.');
    } finally {
      setIsSearchingGrounding(false);
    }
  };

  // Save Search Grounding to Notes
  const handleSaveGroundingAsNote = () => {
    if (!groundingResult || !onSaveSearchAsNote) return;
    const sourcesText = groundingResult.sources.length > 0
      ? `\n\n### Verified Google Sources:\n` + groundingResult.sources.map(s => `- [${s.title}](${s.url})`).join('\n')
      : '';
    const fullContent = `${groundingResult.answer}${sourcesText}`;
    onSaveSearchAsNote(`Google Research: ${searchQuery.slice(0, 45)}...`, fullContent);
    setSavedSearchSuccess(true);
    setTimeout(() => setSavedSearchSuccess(false), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 select-none">
      
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5">
            {/* Official Google 4-Color Icon */}
            <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-center p-1.5 shrink-0">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  Google Workspace & Services Hub
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Study Top 2.0 Suite
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium hidden sm:block">
                Classroom, Calendar, Meet, Docs & Live Google Search Grounding for Students
              </p>
            </div>
          </div>
        </div>

        {/* Global Action / Refresh */}
        <div className="flex items-center gap-2">
          {activeTab === 'classroom' && (
            <button
              onClick={checkAuthAndLoadClassroom}
              disabled={isLoadingClassroom}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Refresh Classroom Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingClassroom ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          )}

          <a
            href="https://workspace.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <ExternalLink className="w-3.5 h-3.5 text-blue-300" />
            <span className="hidden sm:inline">Open Google</span>
          </a>
        </div>
      </header>

      {/* Main Navigation Tabs */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6">
        <div className="flex items-center gap-2 overflow-x-auto py-2.5 no-scrollbar">
          <button
            onClick={() => setActiveTab('classroom')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'classroom'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Classroom</span>
          </button>

          <button
            onClick={() => setActiveTab('calendar')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'calendar'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Calendar Sync</span>
          </button>

          <button
            onClick={() => setActiveTab('meet')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'meet'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Video className="w-4 h-4" />
            <span>Meet Study Rooms</span>
          </button>

          <button
            onClick={() => setActiveTab('drive')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'drive'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Drive & Docs</span>
          </button>

          <button
            onClick={() => setActiveTab('search')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'search'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>Search Grounding</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-emerald-500 text-white font-black">
              AI
            </span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6">
        
        {/* =========================================================================
            TAB 1: GOOGLE CLASSROOM
            ========================================================================= */}
        {activeTab === 'classroom' && (
          <div className="space-y-6">
            {/* Auth Banner if not connected */}
            {!classroomConnected && (
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-6 sm:p-8 text-white shadow-lg shadow-blue-500/10 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="space-y-2 text-center sm:text-left">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-xs font-bold text-white">
                    <GraduationCap className="w-4 h-4" />
                    <span>Official Google Classroom Integration</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                    Connect Your Google Classroom
                  </h2>
                  <p className="text-xs sm:text-sm text-blue-100 max-w-xl leading-relaxed">
                    Import your real courses, teacher announcements, and homework coursework directly into Study Top 2.0. Generate instant, organized study notes and exam summaries in seconds.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleConnectClassroom}
                  disabled={isConnectingClassroom}
                  className="px-6 py-3 bg-white hover:bg-blue-50 text-slate-900 font-bold rounded-2xl transition-all shadow-md hover:shadow-xl shrink-0 flex items-center gap-3 cursor-pointer disabled:opacity-60"
                >
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>{isConnectingClassroom ? 'Authorizing Classroom...' : 'Authorize with Google'}</span>
                </button>
              </div>
            )}

            {classroomError && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold">Google Classroom Notice</div>
                  <div>{classroomError}</div>
                </div>
              </div>
            )}

            {/* Courses Overview */}
            {classroomConnected && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Course List Sidebar */}
                <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-blue-600" />
                      <span>My Courses ({courses.length})</span>
                    </h3>
                  </div>

                  {courses.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 space-y-2">
                      <BookOpen className="w-8 h-8 mx-auto opacity-40" />
                      <p className="text-xs font-medium">No active courses found on Google Classroom.</p>
                      <a
                        href="https://classroom.google.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 font-bold hover:underline inline-block mt-2"
                      >
                        Join or create a course on Classroom
                      </a>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                      {courses.map((course) => (
                        <button
                          key={course.id}
                          onClick={() => setSelectedCourse(course)}
                          className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer ${
                            selectedCourse?.id === course.id
                              ? 'bg-blue-50/80 border-blue-300 text-blue-900 shadow-xs'
                              : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                          }`}
                        >
                          <div className="font-bold text-xs truncate">{course.name}</div>
                          {course.section && (
                            <div className="text-[11px] text-slate-500 truncate mt-0.5">{course.section}</div>
                          )}
                          <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2">
                            <span>Code: {course.enrollmentCode || 'Enrolled'}</span>
                            <span className="font-semibold text-blue-600">Active</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Selected Course Work & Announcements */}
                <div className="lg:col-span-2 space-y-4">
                  {selectedCourse ? (
                    <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                        <div>
                          <h2 className="text-base sm:text-lg font-black text-slate-900">
                            {selectedCourse.name}
                          </h2>
                          <p className="text-xs text-slate-500">
                            {selectedCourse.descriptionHeading || 'Coursework & Academic Announcements'}
                          </p>
                        </div>

                        {selectedCourse.alternateLink && (
                          <a
                            href={selectedCourse.alternateLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer w-fit"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Open in Classroom</span>
                          </a>
                        )}
                      </div>

                      {/* Coursework Sub-Tabs */}
                      <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                        <button
                          onClick={() => setClassroomSubTab('assignments')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            classroomSubTab === 'assignments'
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Assignments & CourseWork ({courseWork.length})
                        </button>
                        <button
                          onClick={() => setClassroomSubTab('announcements')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            classroomSubTab === 'announcements'
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Announcements ({announcements.length})
                        </button>
                      </div>

                      {/* Assignments List */}
                      {classroomSubTab === 'assignments' && (
                        <div className="space-y-3">
                          {courseWork.length === 0 ? (
                            <div className="p-8 text-center text-slate-400 space-y-2">
                              <FileText className="w-8 h-8 mx-auto opacity-40" />
                              <p className="text-xs">No active assignments found for this course.</p>
                            </div>
                          ) : (
                            courseWork.map((item) => (
                              <div
                                key={item.id}
                                className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2.5 transition-all hover:border-slate-300"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="space-y-1">
                                    <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                                      {item.title}
                                    </h4>
                                    {item.description && (
                                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                                        {item.description}
                                      </p>
                                    )}
                                  </div>

                                  {item.maxPoints && (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
                                      {item.maxPoints} pts
                                    </span>
                                  )}
                                </div>

                                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/60">
                                  <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium">
                                    {item.dueDate ? (
                                      <span className="flex items-center gap-1 text-slate-600 font-semibold">
                                        <Clock className="w-3.5 h-3.5 text-blue-600" />
                                        Due {item.dueDate.month}/{item.dueDate.day}/{item.dueDate.year}
                                      </span>
                                    ) : (
                                      <span>No deadline specified</span>
                                    )}
                                  </div>

                                  {onConvertAssignmentToNotes && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        onConvertAssignmentToNotes({
                                          title: `${selectedCourse.name}: ${item.title}`,
                                          content: `${item.title}\n\n${item.description || ''}`,
                                          subject: selectedCourse.name
                                        });
                                      }}
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                                    >
                                      <Sparkles className="w-3.5 h-3.5" />
                                      <span>Convert to Study Notes</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}

                      {/* Announcements List */}
                      {classroomSubTab === 'announcements' && (
                        <div className="space-y-3">
                          {announcements.length === 0 ? (
                            <div className="p-8 text-center text-slate-400 space-y-2">
                              <Users className="w-8 h-8 mx-auto opacity-40" />
                              <p className="text-xs">No announcements posted for this course yet.</p>
                            </div>
                          ) : (
                            announcements.map((ann) => (
                              <div
                                key={ann.id}
                                className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2"
                              >
                                <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                                  {ann.text}
                                </p>
                                <div className="text-[10px] text-slate-400 font-medium">
                                  Posted {new Date(ann.creationTime).toLocaleDateString()}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}

                    </div>
                  ) : (
                    <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-400 space-y-2">
                      <GraduationCap className="w-10 h-10 mx-auto opacity-30 text-slate-400" />
                      <p className="text-sm font-bold text-slate-700">Select a course to view coursework</p>
                      <p className="text-xs">Choose any course from the left to view assignments and announcements.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB 2: GOOGLE CALENDAR SYNC
            ========================================================================= */}
        {activeTab === 'calendar' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold mb-2">
                <Calendar className="w-4 h-4" />
                <span>Google Calendar Study Planner Sync</span>
              </div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Add Study Sessions & Exam Milestones to Google Calendar
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                Seamless 1-click sync. Never miss a revision deadline, test preparation block, or assignment submission.
              </p>
            </div>

            {/* Event Setup Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Study Session / Exam Title
                  </label>
                  <input
                    type="text"
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="e.g. Physics Chapter 3 Derivations Review"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Session Agenda & Revision Notes
                  </label>
                  <textarea
                    rows={4}
                    value={eventDetails}
                    onChange={(e) => setEventDetails(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 leading-relaxed"
                    placeholder="Key concepts to cover, chapter summaries, formulas..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Duration
                    </label>
                    <select
                      value={eventDurationMinutes}
                      onChange={(e) => setEventDurationMinutes(Number(e.target.value))}
                      className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value={25}>25 Min (Pomodoro Focus)</option>
                      <option value={45}>45 Min (Standard Session)</option>
                      <option value={60}>60 Min (1 Hour Deep Study)</option>
                      <option value={90}>90 Min (Comprehensive Review)</option>
                      <option value={120}>120 Min (Full Mock Exam)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Location / Mode
                    </label>
                    <input
                      type="text"
                      value={eventLocation}
                      onChange={(e) => setEventLocation(e.target.value)}
                      className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      placeholder="Study Top 2.0 / Desk"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleLaunchGoogleCalendar}
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-2xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2.5 cursor-pointer"
                >
                  <Calendar className="w-4.5 h-4.5" />
                  <span>Add to Google Calendar (1-Click)</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                </button>
              </div>

              {/* Quick Presets & Tips */}
              <div className="space-y-4 bg-slate-50 border border-slate-200/80 rounded-2xl p-5">
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Instant Quick Study Presets</span>
                </h4>

                <div className="space-y-2">
                  {[
                    { title: 'Morning Deep Focus Block', dur: 60, desc: 'Tackle the hardest academic subjects when energy is peak.' },
                    { title: 'Flashcards & Spaced Repetition', dur: 25, desc: 'Quick 25-minute test over 3D flashcards and formula sheets.' },
                    { title: 'Weekend Full-Length Practice Test', dur: 120, desc: 'Timed mock examination with zero distractions.' },
                    { title: 'Evening Chapter Notes Review', dur: 45, desc: 'Summarize today’s lecture materials and solve remaining questions.' }
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setEventTitle(preset.title);
                        setEventDetails(preset.desc);
                        setEventDurationMinutes(preset.dur);
                      }}
                      className="w-full text-left p-3 bg-white border border-slate-200 hover:border-blue-400 rounded-xl transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between text-xs font-bold text-slate-900 group-hover:text-blue-600">
                        <span>{preset.title}</span>
                        <span className="text-[10px] text-slate-400">{preset.dur} min</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{preset.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 3: GOOGLE MEET STUDY ROOMS
            ========================================================================= */}
        {activeTab === 'meet' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold mb-2">
                <Video className="w-4 h-4" />
                <span>Google Meet Collaborative Study Rooms</span>
              </div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Launch Instant Student Study & Peer Discussion Rooms
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                Connect with study partners, review complex math derivations together, and discuss notes via high-quality Google Meet video calls.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Study Session Topic
                  </label>
                  <input
                    type="text"
                    value={meetTopic}
                    onChange={(e) => setMeetTopic(e.target.value)}
                    className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="e.g. Organic Chemistry Reactions Discussion"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Participants / Study Group
                  </label>
                  <input
                    type="text"
                    value={meetParticipants}
                    onChange={(e) => setMeetParticipants(e.target.value)}
                    className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="e.g. Study Top Classmates"
                  />
                </div>

                <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Instant Google Meet Room Ready</span>
                  </div>
                  <p className="text-[11px] text-emerald-800 leading-relaxed">
                    Clicking the button launches a fresh Google Meet meeting immediately and automatically copies the formatted study agenda to your clipboard.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleLaunchGoogleMeet}
                  className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-2xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2.5 cursor-pointer"
                >
                  <Video className="w-4.5 h-4.5" />
                  <span>Launch Google Meet Study Room</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                </button>

                {copiedMeetInvite && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 flex items-center gap-2 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Study room invite copied to clipboard! Share it with your peers.</span>
                  </div>
                )}
              </div>

              {/* Study Group Best Practices */}
              <div className="space-y-4 bg-slate-50 border border-slate-200/80 rounded-2xl p-5">
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span>Peer Learning Guidelines</span>
                </h4>

                <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
                  <div className="p-3 bg-white border border-slate-200 rounded-xl">
                    <span className="font-bold text-slate-900 block mb-0.5">1. Share Your Screen</span>
                    <span>Open Study Top 2.0 side-by-side to review Cornell notes and diagrams together in real-time.</span>
                  </div>

                  <div className="p-3 bg-white border border-slate-200 rounded-xl">
                    <span className="font-bold text-slate-900 block mb-0.5">2. Teach Back Method</span>
                    <span>Take turns explaining difficult theorems and derivations. Teaching is the fastest path to mastery.</span>
                  </div>

                  <div className="p-3 bg-white border border-slate-200 rounded-xl">
                    <span className="font-bold text-slate-900 block mb-0.5">3. Live Quiz Competition</span>
                    <span>Run a 10-question flash quiz from the Quiz Studio and compare answers with your group.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 4: GOOGLE DRIVE & DOCS
            ========================================================================= */}
        {activeTab === 'drive' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold mb-2">
                <FileText className="w-4 h-4" />
                <span>Google Drive & Docs Export Studio</span>
              </div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Export Notes to Google Docs & Save in Google Drive
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                Take any generated study material, formula sheet, or summary and format it cleanly for Google Docs with 1-click clipboard synchronization.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Document Title
                  </label>
                  <input
                    type="text"
                    value={docTitle}
                    onChange={(e) => setDocTitle(e.target.value)}
                    className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="Document Title"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Document Content (Markdown / Formatted Text)
                  </label>
                  <textarea
                    rows={6}
                    value={docContent}
                    onChange={(e) => setDocContent(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 leading-relaxed"
                    placeholder="Enter or paste your notes to export..."
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={handleExportToGoogleDocs}
                    className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-2xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <FileText className="w-4.5 h-4.5" />
                    <span>Open in Google Docs</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                  </button>

                  <a
                    href="https://drive.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-12 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <FolderPlus className="w-4 h-4 text-blue-600" />
                    <span>Google Drive</span>
                  </a>
                </div>

                {docCopiedSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Document formatted and copied to clipboard! Paste it directly into your new Google Doc.</span>
                  </div>
                )}
              </div>

              {/* Drive Tips */}
              <div className="space-y-4 bg-slate-50 border border-slate-200/80 rounded-2xl p-5">
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>Google Drive Academic Organization Tips</span>
                </h4>

                <div className="space-y-2.5 text-xs text-slate-600 leading-relaxed">
                  <p>
                    <strong className="text-slate-900 font-bold">1. Recommended Folder Structure:</strong><br />
                    Create a root folder named <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px]">Study Top 2026</code> with subfolders for each subject (e.g. Mathematics, Physics, Chemistry).
                  </p>
                  <p>
                    <strong className="text-slate-900 font-bold">2. Google Classroom Submission:</strong><br />
                    Files created in Google Docs can be attached in one click inside Google Classroom assignments.
                  </p>
                  <p>
                    <strong className="text-slate-900 font-bold">3. Universal Compatibility:</strong><br />
                    All exported notes retain clean typography, headers, bulleted lists, and formula structures.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 5: GOOGLE SEARCH GROUNDING (LIVE ACADEMIC FACT VERIFICATION)
            ========================================================================= */}
        {activeTab === 'search' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold mb-2">
                <Search className="w-4 h-4" />
                <span>Google Search Grounding Engine</span>
              </div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Academic Research Grounded with Live Google Search
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                Verify contemporary scientific discoveries, historical dates, and facts using real-time Google Search grounding with verified web citations.
              </p>
            </div>

            {/* Search Input Form */}
            <form onSubmit={handleExecuteSearchGrounding} className="space-y-3">
              <div className="relative">
                <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter any academic concept, scientific question, or research query..."
                  disabled={isSearchingGrounding}
                  className="w-full h-12 pl-12 pr-28 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={isSearchingGrounding || !searchQuery.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
                >
                  {isSearchingGrounding ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Searching...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Search</span>
                    </>
                  )}
                </button>
              </div>

              {/* Sample Queries */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] font-bold text-slate-400 mr-1">Try:</span>
                {[
                  'CRISPR gene editing mechanisms',
                  'Latest discoveries from James Webb Space Telescope',
                  'Quantum entanglement verification',
                  'Causes of the 1929 Great Depression'
                ].map((sQuery, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSearchQuery(sQuery)}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                  >
                    {sQuery}
                  </button>
                ))}
              </div>
            </form>

            {groundingError && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>{groundingError}</div>
              </div>
            )}

            {/* Results Display */}
            {groundingResult && (
              <div className="space-y-6 pt-4 border-t border-slate-100 animate-in fade-in duration-300">
                
                {/* Search Queries Used by Google */}
                {groundingResult.searchQueries.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-bold text-slate-500">Google Searches Performed:</span>
                    {groundingResult.searchQueries.map((q, idx) => (
                      <span key={idx} className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-medium text-[11px] border border-blue-100">
                        "{q}"
                      </span>
                    ))}
                  </div>
                )}

                {/* Grounded Academic Answer */}
                <div className="p-6 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs font-bold text-slate-900">Verified Academic Summary</span>
                    </div>

                    {onSaveSearchAsNote && (
                      <button
                        type="button"
                        onClick={handleSaveGroundingAsNote}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Save to Notes Library</span>
                      </button>
                    )}
                  </div>

                  <div className="text-xs sm:text-sm text-slate-800 whitespace-pre-wrap leading-relaxed font-sans">
                    {groundingResult.answer}
                  </div>

                  {savedSearchSuccess && (
                    <div className="p-2.5 bg-emerald-100/70 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Successfully saved to your Notes Library!</span>
                    </div>
                  )}
                </div>

                {/* Verified Web Sources */}
                {groundingResult.sources.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Link className="w-3.5 h-3.5 text-blue-600" />
                      <span>Verified Google Web Sources ({groundingResult.sources.length})</span>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {groundingResult.sources.map((source, idx) => (
                        <a
                          key={idx}
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-3 bg-white border border-slate-200 hover:border-blue-400 rounded-xl transition-all cursor-pointer group flex flex-col justify-between"
                        >
                          <div className="text-xs font-bold text-slate-900 group-hover:text-blue-600 line-clamp-2">
                            {source.title}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate mt-2 flex items-center gap-1">
                            <ExternalLink className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{source.url.replace(/^https?:\/\//, '')}</span>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white px-4 sm:px-6 py-4 text-center text-xs text-slate-400 font-medium">
        Study Top 2.0 • Google Workspace & Services Suite • Powered by Google Cloud & Gemini AI
      </footer>

    </div>
  );
};
