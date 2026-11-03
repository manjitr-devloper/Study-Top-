import React, { useState, useMemo } from 'react';
import { 
  Calculator, 
  Atom, 
  FlaskConical, 
  Dna, 
  BookOpen, 
  Languages, 
  Globe, 
  Landmark, 
  Compass, 
  Scale, 
  TrendingUp, 
  Terminal, 
  Cpu, 
  Leaf, 
  Sparkles, 
  Brain, 
  Bot, 
  Code2, 
  Briefcase, 
  Building2, 
  BarChart3, 
  Search, 
  ArrowRight, 
  Sliders, 
  CheckCircle2, 
  Award,
  Zap,
  HelpCircle,
  FileText
} from 'lucide-react';

export interface SubjectData {
  id: string;
  name: string;
  category: 'Math & Stats' | 'Sciences' | 'Languages' | 'Social Studies' | 'Tech & AI' | 'Commerce' | 'Aptitude';
  icon: any;
  gradient: string;
  badgeColor: string;
  description: string;
  topics: string[];
  sampleQuestion: string;
}

export const ALL_23_SUBJECTS: SubjectData[] = [
  // 1. Mathematics
  {
    id: 'Mathematics',
    name: 'Mathematics',
    category: 'Math & Stats',
    icon: Calculator,
    gradient: 'from-blue-600 to-indigo-700',
    badgeColor: 'bg-blue-100 text-blue-800',
    description: 'Algebra, Calculus, Geometry, Trigonometry, Fractions, Matrices & Word Problems with full step-by-step LaTeX derivations.',
    topics: ['Algebra & Equations', 'Trigonometry & Heights', 'Calculus (Diff & Int)', 'Geometry & Coordinate', 'Matrices & Determinants', 'Word Problems'],
    sampleQuestion: 'Solve the quadratic equation 2x^2 - 7x + 3 = 0 using quadratic formula and find roots step by step.'
  },
  // 2. Science
  {
    id: 'Science',
    name: 'Science (General)',
    category: 'Sciences',
    icon: Atom,
    gradient: 'from-emerald-600 to-teal-700',
    badgeColor: 'bg-emerald-100 text-emerald-800',
    description: 'Integrated physical and life sciences with foundational concepts, experiments, diagrams, and numerical problems.',
    topics: ['Scientific Method', 'Matter & States', 'Energy Forms', 'Ecosystems & Food Webs', 'Living Organisms', 'Experiments & Laws'],
    sampleQuestion: 'Explain the law of conservation of energy with two real-world examples and mathematical expression.'
  },
  // 3. Physics
  {
    id: 'Physics',
    name: 'Physics',
    category: 'Sciences',
    icon: Zap,
    gradient: 'from-cyan-600 to-blue-700',
    badgeColor: 'bg-cyan-100 text-cyan-800',
    description: 'Motion, Force, Gravitation, Electricity, Optics, Magnetism, Heat, Sound, and rigorous numerical problem derivations.',
    topics: ['Laws of Motion & Speed', 'Gravitation & Planetary', 'Current Electricity & Circuits', 'Ray Optics & Lenses', 'Thermodynamics & Heat', 'Wave Mechanics'],
    sampleQuestion: 'A car accelerates uniformly from rest to 72 km/h in 10 seconds. Calculate its acceleration and the distance traveled.'
  },
  // 4. Chemistry
  {
    id: 'Chemistry',
    name: 'Chemistry',
    category: 'Sciences',
    icon: FlaskConical,
    gradient: 'from-amber-600 to-orange-700',
    badgeColor: 'bg-amber-100 text-amber-800',
    description: 'Chemical equation balancing, Periodic Table, Atomic Structure, Acids & Bases, Mole Concept, and Organic reaction mechanisms.',
    topics: ['Equation Balancing', 'Periodic Classification', 'Acids, Bases & Salts', 'Organic Reactions & IUPAC', 'Mole Concept & Stoichiometry', 'Chemical Bonding'],
    sampleQuestion: 'Balance the redox reaction: KMnO4 + HCl -> KCl + MnCl2 + H2O + Cl2 and explain the oxidation numbers.'
  },
  // 5. Biology
  {
    id: 'Biology',
    name: 'Biology',
    category: 'Sciences',
    icon: Dna,
    gradient: 'from-emerald-600 to-green-700',
    badgeColor: 'bg-green-100 text-green-800',
    description: 'Human Anatomy, Cell Biology, Genetics, Botany, Animal Physiology, Respiration, Nutrition, and labelled biological diagrams.',
    topics: ['Cell Structure & Organelles', 'Human Circulatory & Nervous', 'Genetics & Mendel Laws', 'Plant Photosynthesis & Xylem', 'Ecology & Biodiversity', 'Reproduction & Growth'],
    sampleQuestion: 'Draw and explain the step-by-step mechanism of double circulation in the human heart with labelled chambers.'
  },
  // 6. English
  {
    id: 'English',
    name: 'English & Literature',
    category: 'Languages',
    icon: BookOpen,
    gradient: 'from-indigo-600 to-violet-700',
    badgeColor: 'bg-indigo-100 text-indigo-800',
    description: 'Grammar rules, tenses, active/passive voice, direct/indirect speech, essay writing, comprehension passages, and literature analysis.',
    topics: ['Grammar & Parts of Speech', 'Active & Passive Voice', 'Direct & Indirect Speech', 'Essay & Formal Letter Writing', 'Unseen Comprehension', 'Poetry & Prose Analysis'],
    sampleQuestion: 'Rewrite in indirect speech: The teacher said to the students, "The earth revolves around the sun."'
  },
  // 7. Hindi
  {
    id: 'Hindi',
    name: 'हिंदी (Hindi)',
    category: 'Languages',
    icon: Languages,
    gradient: 'from-rose-600 to-pink-700',
    badgeColor: 'bg-rose-100 text-rose-800',
    description: 'हिंदी व्याकरण, संधि, समास, रस, छंद, अलंकार, मुहावरे, लोकोक्तियाँ, निबंध, पत्र लेखन एवं पाठ्यपुस्तक साहित्य सारांश।',
    topics: ['संधि व समास', 'रस, छंद व अलंकार', 'मुहावरे व लोकोक्तियाँ', 'निबंध व पत्र लेखन', 'अपठित गद्यांश', 'कविता भावार्थ व सारांश'],
    sampleQuestion: 'यमक अलंकार और श्लेष अलंकार में क्या अंतर है? दोनों के सुंदर उदाहरण देकर स्पष्ट कीजिए।'
  },
  // 8. Sanskrit
  {
    id: 'Sanskrit',
    name: 'संस्कृतम् (Sanskrit)',
    category: 'Languages',
    icon: Languages,
    gradient: 'from-orange-600 to-amber-700',
    badgeColor: 'bg-orange-100 text-orange-800',
    description: 'संस्कृत व्याकरण, शब्द रूप, धातु रूप (लट्, लङ्, लृट्), संधि, समास, कारक-विभक्ति, हिंदी-संस्कृत अनुवाद एवं श्लोक सप्रसंग भावार्थ।',
    topics: ['शब्द रूप व धातु रूप', 'संधि व समास विग्रह', 'कारक एवं उपपद विभक्ति', 'हिंदी-संस्कृत अनुवाद', 'श्लोक व्याख्या व अन्वय', 'प्रत्यय (क्त्वा, ल्यप्, तुमुन्)'],
    sampleQuestion: '"विद्या ददाति विनयं विनयाद्याति पात्रताम्" श्लोक का अन्वय, शब्दार्थ एवं सप्रसंग भावार्थ लिखिए।'
  },
  // 9. Social Science
  {
    id: 'Social Science',
    name: 'Social Science (General)',
    category: 'Social Studies',
    icon: Globe,
    gradient: 'from-amber-600 to-yellow-700',
    badgeColor: 'bg-amber-100 text-amber-800',
    description: 'Integrated humanities exploring society, civilizations, geographic environments, democratic structures, and financial institutions.',
    topics: ['Civilizations & Eras', 'Global Geographic Systems', 'Democracy & Rights', 'Development & Livelihood', 'Environmental Stewardship'],
    sampleQuestion: 'Examine the key differences between renewable and non-renewable energy resources with Indian geographical examples.'
  },
  // 10. History
  {
    id: 'History',
    name: 'History',
    category: 'Social Studies',
    icon: Landmark,
    gradient: 'from-stone-700 to-amber-900',
    badgeColor: 'bg-stone-100 text-stone-800',
    description: 'Indian freedom struggle, World History, Ancient & Medieval civilizations, chronological timelines, treaties, and significant personalities.',
    topics: ['Nationalism in Europe & India', 'Freedom Struggle & Gandhi', 'Ancient Harappa & Maurya', 'World War I & II', 'Industrial Revolution', 'Social Movements'],
    sampleQuestion: 'What were the major political, social, and economic causes that led to the Non-Cooperation Movement in 1920?'
  },
  // 11. Geography
  {
    id: 'Geography',
    name: 'Geography',
    category: 'Social Studies',
    icon: Compass,
    gradient: 'from-teal-600 to-cyan-800',
    badgeColor: 'bg-teal-100 text-teal-800',
    description: 'Physical geography, climate, monsoons, soil types, minerals, agriculture, industries, population demographics, and map skills.',
    topics: ['Monsoons & Climate Zones', 'Soil Classification & Erosion', 'Rivers & Drainage Systems', 'Agriculture & Cropping Seasons', 'Mineral & Energy Resources', 'Map-based Questions'],
    sampleQuestion: 'Explain the mechanism of the Indian Southwest Monsoon and describe the factors influencing the onset of rains.'
  },
  // 12. Political Science / Civics
  {
    id: 'Political Science',
    name: 'Political Science / Civics',
    category: 'Social Studies',
    icon: Scale,
    gradient: 'from-blue-700 to-indigo-900',
    badgeColor: 'bg-blue-100 text-blue-800',
    description: 'Indian Constitution, Parliament, Judiciary, Federalism, Fundamental Rights & Duties, Political Parties, and Democratic challenges.',
    topics: ['Constitution Preamble & Articles', 'Fundamental Rights & Duties', 'Parliament & President', 'Supreme Court & Judiciary', 'Federalism & Decentralization', 'Political Parties & Elections'],
    sampleQuestion: 'Explain the doctrine of "Basic Structure" of the Indian Constitution and its significance in preserving democracy.'
  },
  // 13. Economics
  {
    id: 'Economics',
    name: 'Economics',
    category: 'Social Studies',
    icon: TrendingUp,
    gradient: 'from-emerald-700 to-teal-900',
    badgeColor: 'bg-emerald-100 text-emerald-800',
    description: 'Micro & Macroeconomics, Money & Banking, National Income, Inflation, GDP, Markets, Poverty, and Sustainable Development.',
    topics: ['Demand & Supply Equilibrium', 'Money & Commercial Banking', 'National Income & GDP', 'Inflation, Fiscal & Monetary', 'Poverty & Unemployment', 'Foreign Trade & Globalization'],
    sampleQuestion: 'Explain the quantitative and qualitative credit control instruments utilized by the Reserve Bank of India (RBI).'
  },
  // 14. Computer Science
  {
    id: 'Computer Science',
    name: 'Computer Science',
    category: 'Tech & AI',
    icon: Terminal,
    gradient: 'from-violet-600 to-purple-800',
    badgeColor: 'bg-violet-100 text-violet-800',
    description: 'Algorithms, Data Structures, OOP concepts, Python, C++, Java, Computer Architecture, and time/space complexity analysis.',
    topics: ['Data Structures (Stacks, Queues, Trees)', 'Object-Oriented Programming (OOP)', 'Searching & Sorting Algorithms', 'Big-O Complexity Analysis', 'Computer Architecture & OS', 'Recursion & Dynamic Programming'],
    sampleQuestion: 'Implement an in-place QuickSort algorithm in Python and analyze its best, average, and worst-case time complexities.'
  },
  // 15. Information Technology
  {
    id: 'Information Technology',
    name: 'Information Technology (IT)',
    category: 'Tech & AI',
    icon: Cpu,
    gradient: 'from-cyan-600 to-teal-800',
    badgeColor: 'bg-cyan-100 text-cyan-800',
    description: 'Computer fundamentals, networking protocols, cybersecurity, DBMS, MS Office, cloud computing, and digital literacy skills.',
    topics: ['Network Protocols (TCP/IP, HTTP)', 'Relational DBMS & SQL Queries', 'Cybersecurity & Ethical Hacking', 'Cloud Computing Concepts', 'Digital Media & Office Productivity', 'Hardware & Software Interfacing'],
    sampleQuestion: 'Explain the differences between IPv4 and IPv6 addressing schemes and describe the functionality of DNS.'
  },
  // 16. Environmental Studies
  {
    id: 'Environmental Studies',
    name: 'Environmental Studies (EVS)',
    category: 'Sciences',
    icon: Leaf,
    gradient: 'from-green-600 to-emerald-800',
    badgeColor: 'bg-green-100 text-green-800',
    description: 'Ecology, global warming, conservation of biodiversity, pollution control, renewable resources, and sustainable ecosystems.',
    topics: ['Ecosystem Dynamics & Energy Flow', 'Biodiversity Hotspots & Conservation', 'Air, Water & Soil Pollution', 'Global Warming & Climate Change', 'Solid Waste Management', 'Renewable Energy Systems'],
    sampleQuestion: 'Describe the causes and ecological impacts of the greenhouse effect and ocean acidification.'
  },
  // 17. General Knowledge
  {
    id: 'General Knowledge',
    name: 'General Knowledge (GK)',
    category: 'Aptitude',
    icon: Sparkles,
    gradient: 'from-teal-600 to-blue-800',
    badgeColor: 'bg-teal-100 text-teal-800',
    description: 'Current affairs, Indian national heritage, world geography facts, major scientific discoveries, awards, and sports trivia.',
    topics: ['Current National & World Events', 'Indian Heritage & Monuments', 'Science Facts & Inventions', 'World Capitals & Currencies', 'Prestigious Honors & Awards', 'Sports Records & Tournaments'],
    sampleQuestion: 'Who was the first Indian scientist to be awarded the Nobel Prize, and in which year and discipline was it conferred?'
  },
  // 18. Reasoning
  {
    id: 'Reasoning',
    name: 'Reasoning & Aptitude',
    category: 'Aptitude',
    icon: Brain,
    gradient: 'from-purple-600 to-indigo-800',
    badgeColor: 'bg-purple-100 text-purple-800',
    description: 'Logical reasoning, number series, coding-decoding, blood relations, direction tests, syllogisms, and competitive exam puzzles.',
    topics: ['Number & Letter Series', 'Coding & Decoding Puzzles', 'Blood Relations Analysis', 'Direction Sense & Distances', 'Syllogism & Logical Deductions', 'Seating Arrangements & Puzzles'],
    sampleQuestion: 'Pointing to a photograph, a woman says, "He is the son of the only son of my grandfather." How is the man in the photo related to her?'
  },
  // 19. Artificial Intelligence
  {
    id: 'Artificial Intelligence',
    name: 'Artificial Intelligence (AI)',
    category: 'Tech & AI',
    icon: Bot,
    gradient: 'from-fuchsia-600 to-purple-800',
    badgeColor: 'bg-fuchsia-100 text-fuchsia-800',
    description: 'AI fundamentals, Machine Learning basics, neural networks, Generative AI, prompt engineering, NLP, computer vision, and ethics.',
    topics: ['Supervised & Unsupervised ML', 'Deep Learning & Neural Networks', 'Generative AI & LLMs', 'Natural Language Processing (NLP)', 'Computer Vision Basics', 'Ethics & Bias in AI'],
    sampleQuestion: 'Explain the fundamental differences between discriminative and generative AI models with mathematical loss examples.'
  },
  // 20. Coding and Programming
  {
    id: 'Coding and Programming',
    name: 'Coding & Programming',
    category: 'Tech & AI',
    icon: Code2,
    gradient: 'from-slate-800 to-indigo-950',
    badgeColor: 'bg-slate-100 text-slate-800',
    description: 'Hands-on programming in Python, JavaScript, C/C++, Java, SQL, React, web development, debugging, and software design.',
    topics: ['Python Scripting & Automation', 'JavaScript & Web Development', 'C/C++ Memory & Pointers', 'SQL Complex Joins & Queries', 'Code Debugging & Optimization', 'Algorithm Design & Flowcharts'],
    sampleQuestion: 'Write a complete SQL query using window functions (ROW_NUMBER / DENSE_RANK) to find the 2nd highest salary department-wise.'
  },
  // 21. Accountancy
  {
    id: 'Accountancy',
    name: 'Accountancy',
    category: 'Commerce',
    icon: Briefcase,
    gradient: 'from-blue-700 to-teal-800',
    badgeColor: 'bg-blue-100 text-blue-800',
    description: 'Double-entry bookkeeping, Journal Entries, Ledger posting, Trial Balance, Depreciation, Partnership, Company balance sheets, and GST.',
    topics: ['Double-Entry Journal Entries', 'Ledger & Trial Balance', 'Bank Reconciliation (BRS)', 'Depreciation (SLM & WDV)', 'Partnership Accounts (Goodwill)', 'Company Financial Statements & GST'],
    sampleQuestion: 'Pass necessary journal entries for forfeiture and re-issue of 500 equity shares of Rs. 10 each issued at a premium of Rs. 2.'
  },
  // 22. Business Studies
  {
    id: 'Business Studies',
    name: 'Business Studies',
    category: 'Commerce',
    icon: Building2,
    gradient: 'from-amber-700 to-red-800',
    badgeColor: 'bg-amber-100 text-amber-800',
    description: 'Principles of Management (Fayol & Taylor), Marketing Mix, Financial Management, Staffing, Directing, and Business Environment case studies.',
    topics: ['Principles of Management (Fayol/Taylor)', 'Business Environment & Policies', 'Planning, Organizing & Staffing', 'Financial Management & Capital Structure', 'Marketing Mix (4 Ps)', 'Consumer Protection & Rights'],
    sampleQuestion: 'Analyze Fayol\'s principles of "Unity of Command" versus "Unity of Direction" with appropriate organizational case studies.'
  },
  // 23. Statistics
  {
    id: 'Statistics',
    name: 'Statistics',
    category: 'Math & Stats',
    icon: BarChart3,
    gradient: 'from-indigo-600 to-sky-700',
    badgeColor: 'bg-indigo-100 text-indigo-800',
    description: 'Measures of Central Tendency (Mean, Median, Mode), Dispersion, Standard Deviation, Probability Distributions, and Regression.',
    topics: ['Mean, Median & Mode Calculations', 'Standard Deviation & Variance', 'Correlation (Karl Pearson & Spearman)', 'Linear Regression Models', 'Probability Distributions (Binomial, Normal)', 'Index Numbers & Time Series'],
    sampleQuestion: 'Calculate the Karl Pearson correlation coefficient between advertising expenditure and sales revenue for the given dataset.'
  }
];

interface AllSubjectsViewProps {
  user?: any;
  userProfile?: any;
  onSelectSubjectSolver: (subjectId: string, initialQuestion?: string) => void;
  onOpenPracticeTests?: (subjectId?: string) => void;
}

export const AllSubjectsView: React.FC<AllSubjectsViewProps> = ({
  user,
  userProfile,
  onSelectSubjectSolver,
  onOpenPracticeTests
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  // Student Personalization Preferences (Persisted in LocalStorage)
  const [selectedClass, setSelectedClass] = useState<string>(() => {
    return localStorage.getItem('study_top_pref_class') || userProfile?.grade || 'Class 10';
  });
  const [selectedBoard, setSelectedBoard] = useState<string>(() => {
    return localStorage.getItem('study_top_pref_board') || 'CBSE';
  });
  const [selectedMedium, setSelectedMedium] = useState<string>(() => {
    return localStorage.getItem('study_top_pref_medium') || 'English';
  });
  const [difficultyLevel, setDifficultyLevel] = useState<string>(() => {
    return localStorage.getItem('study_top_pref_difficulty') || 'Intermediate';
  });

  const handleUpdatePreference = (key: string, value: string) => {
    localStorage.setItem(`study_top_pref_${key}`, value);
    if (key === 'class') setSelectedClass(value);
    if (key === 'board') setSelectedBoard(value);
    if (key === 'medium') setSelectedMedium(value);
    if (key === 'difficulty') setDifficultyLevel(value);
  };

  const categories = ['All', 'Math & Stats', 'Sciences', 'Languages', 'Social Studies', 'Tech & AI', 'Commerce', 'Aptitude'];

  const filteredSubjects = useMemo(() => {
    return ALL_23_SUBJECTS.filter((sub) => {
      const matchesCategory = selectedCategory === 'All' || sub.category === selectedCategory;
      const matchesSearch = 
        sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.topics.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-7 pb-20 font-sans">
      {/* ========================================================================= */}
      {/* 1. TOP HERO BANNER: ALL SUBJECTS AI LEARNING SYSTEM                       */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Study Top • 23 Academic Subjects AI Suite</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight">
              All Subjects AI Learning &amp; Solver System
            </h1>
            <p className="text-blue-100 text-xs sm:text-sm font-medium leading-relaxed">
              Step-by-step problem solver, formula derivations, code debugging, essay writing, shloka translations, and exam preparation across every subject from Class 1 to 12 and beyond.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 shrink-0">
            <div className="bg-white/15 backdrop-blur-md p-3 rounded-2xl border border-white/20 text-center">
              <span className="block text-xl sm:text-2xl font-black">23</span>
              <span className="text-[11px] font-bold text-blue-100">Subjects</span>
            </div>
            <div className="bg-white/15 backdrop-blur-md p-3 rounded-2xl border border-white/20 text-center">
              <span className="block text-xl sm:text-2xl font-black">100%</span>
              <span className="text-[11px] font-bold text-blue-100">Free Access</span>
            </div>
            <div className="bg-white/15 backdrop-blur-md p-3 rounded-2xl border border-white/20 text-center col-span-2 sm:col-span-1">
              <span className="block text-xl sm:text-2xl font-black">9-Part</span>
              <span className="text-[11px] font-bold text-blue-100">Answers</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. STUDENT PERSONALIZATION BAR (Class, Board, Medium, Difficulty)         */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Student Academic Profile &amp; Preferences
            </span>
          </div>
          <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Explanations tailored to your grade</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Class Selector */}
          <div>
            <label className="block text-[11px] font-black uppercase text-slate-500 mb-1 ml-1">
              Class / Grade Level
            </label>
            <select
              value={selectedClass}
              onChange={(e) => handleUpdatePreference('class', e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(c => (
                <option key={c} value={`Class ${c}`}>Class {c}</option>
              ))}
              <option value="Undergraduate">College / Undergraduate</option>
              <option value="Competitive Exam">Competitive Exams (JEE / NEET / UPSC)</option>
            </select>
          </div>

          {/* Education Board Selector */}
          <div>
            <label className="block text-[11px] font-black uppercase text-slate-500 mb-1 ml-1">
              Education Board
            </label>
            <select
              value={selectedBoard}
              onChange={(e) => handleUpdatePreference('board', e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer"
            >
              <option value="CBSE">CBSE (Central Board)</option>
              <option value="ICSE">ICSE / ISC</option>
              <option value="State Board">State Board (Universal)</option>
              <option value="Maharashtra State Board">Maharashtra State Board</option>
              <option value="UP Board">UP Board (Uttar Pradesh)</option>
              <option value="Bihar Board">Bihar Board (BSEB)</option>
              <option value="Karnataka Board">Karnataka KSEEB</option>
              <option value="Tamil Nadu Board">Tamil Nadu State Board</option>
              <option value="Universal / International">Universal / International</option>
            </select>
          </div>

          {/* Medium of Instruction */}
          <div>
            <label className="block text-[11px] font-black uppercase text-slate-500 mb-1 ml-1">
              Medium of Education
            </label>
            <select
              value={selectedMedium}
              onChange={(e) => handleUpdatePreference('medium', e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer"
            >
              <option value="English">English Medium</option>
              <option value="Hindi">हिंदी माध्यम (Hindi Medium)</option>
              <option value="Bilingual / Hinglish">Bilingual (English + Hindi)</option>
              <option value="Sanskrit">संस्कृतम् (Sanskrit Medium)</option>
            </select>
          </div>

          {/* Difficulty Mode */}
          <div>
            <label className="block text-[11px] font-black uppercase text-slate-500 mb-1 ml-1">
              Explanation Mode
            </label>
            <select
              value={difficultyLevel}
              onChange={(e) => handleUpdatePreference('difficulty', e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer"
            >
              <option value="Beginner">Beginner (Simple &amp; Conceptual)</option>
              <option value="Intermediate">Intermediate (Board Exam Standard)</option>
              <option value="Advanced">Advanced (High-Scoring &amp; Competitive)</option>
              <option value="Exam Prep">Exam Prep (Point-wise &amp; Fast Revision)</option>
            </select>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. SEARCH & CATEGORY FILTER TABS                                          */}
      {/* ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Category Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-xs scale-102'
                  : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Instant Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search subjects, topics, or formulas..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-2xs"
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. 23 SUBJECT CARDS GRID                                                  */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredSubjects.map((sub) => {
          const Icon = sub.icon;
          return (
            <div
              key={sub.id}
              className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs hover:shadow-lg transition-all duration-200 p-6 flex flex-col justify-between group hover:-translate-y-0.5"
            >
              <div className="space-y-4">
                {/* Header with Icon & Category */}
                <div className="flex items-start justify-between gap-3">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${sub.gradient} text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${sub.badgeColor}`}>
                    {sub.category}
                  </span>
                </div>

                {/* Subject Title & Description */}
                <div>
                  <h3 className="text-base font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                    {sub.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">
                    {sub.description}
                  </p>
                </div>

                {/* Key Topics List */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {sub.topics.slice(0, 4).map((topic, i) => (
                    <span
                      key={i}
                      className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-lg"
                    >
                      {topic}
                    </span>
                  ))}
                  {sub.topics.length > 4 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-600 rounded-lg">
                      +{sub.topics.length - 4} more
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-5 mt-5 border-t border-slate-100 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onSelectSubjectSolver(sub.id, sub.sampleQuestion)}
                  className="flex-1 py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-98"
                >
                  <span>Open Solver</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                {onOpenPracticeTests && (
                  <button
                    type="button"
                    onClick={() => onOpenPracticeTests(sub.id)}
                    className="p-2.5 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-700 hover:text-blue-600 transition-all cursor-pointer"
                    title={`Take Practice Test in ${sub.name}`}
                  >
                    <Award className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredSubjects.length === 0 && (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 max-w-md mx-auto space-y-3">
          <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No subjects found</h3>
          <p className="text-xs text-slate-500">
            No academic subjects matched "{searchQuery}". Try selecting "All" or search for a specific topic like Algebra, Optics, or Grammar.
          </p>
          <button
            onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
};
