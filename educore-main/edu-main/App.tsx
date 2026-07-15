/**
 * EDUCORE-OMEGA Main Application
 * 
 * AUTH PERSISTENCE ENGINE: Uses AuthContext for session rehydration.
 * Session survives page refresh via Supabase session storage.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Eraser, Info, LogOut } from 'lucide-react';
import { UserRole } from './types';
import CurriculumSelector, { CURRICULA } from './components/CurriculumSelector';
import ClassSelector, { CLASSES, SECTIONS } from './components/ClassSelector';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import FileUpload from './components/FileUpload';
import LoginScreen from './components/LoginScreen';
import ParentDashboard from './components/ParentDashboard';
import { logSession } from './services/analyticsService';
import { isAnalyticsEnabled } from './services/supabaseClient';
import { AdminLayout, AdminTab } from './components/admin/AdminLayout';
import { TeacherDashboard } from './components/teacher/TeacherDashboard';
import { StudentDashboard } from './components/student/StudentDashboard';
import {
  OverviewDashboard,
  SchoolStructure,
  StudentProfiles,
  TeacherManagement,
  FinanceFees,
  AnalyticsDashboard as AdminAnalytics,
  AuditCompliance,
  ParentManagement,
  UserManagement as UserMgmt,
  ClassAssignments,
  TimetableManagement,
  ExamManagement,
  AlertsNotificationsPanel,
  FeedbackManagement,
  AttendanceCommandCenter,
  ResultPublishing
} from './components/admin/modules';
import { ToastContainer } from './components/ToastNotification';
import { auditService } from './services/auditService';
import { rbacService } from './services/rbacService';
import { useAuth } from './contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { SEO } from './components/SEO';
import { NotFound } from './components/public/NotFound';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import QuizPage from './pages/QuizPage';
import {
  PublicHeader,
  PublicFooter,
  PublicHome,
  PublicFeatures,
  PublicAbout,
  PublicContact
} from './components/public/PublicPages';

// ============================================
// LOADING SPINNER COMPONENT
// ============================================
const LoadingSpinner: React.FC = () => (
  <div className="flex h-screen items-center justify-center bg-gradient-to-br from-indigo-50 to-slate-100">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-slate-600 font-medium">Loading EDUCORE-OMEGA...</p>
      <p className="text-slate-400 text-sm mt-1">Restoring your session</p>
    </div>
  </div>
);

// ============================================
// MAIN APP COMPONENT
// ============================================
const MainAppContent: React.FC = () => {
  // ========================================
  // AUTH FROM CONTEXT (SESSION PERSISTS!)
  // ========================================
  const { user, loading, isAuthenticated, signIn, signOut } = useAuth();

  // Local UI state (not auth-related)
  const [loginError, setLoginError] = useState<string | null>(null);
  const [curriculum, setCurriculum] = useState<string>(CURRICULA[0]);
  const [messages, setMessages] = useState<any[]>([]);
  const [showInfo, setShowInfo] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [studentClass, setStudentClass] = useState<string>(CLASSES[5]);
  const [studentSection, setStudentSection] = useState<string>(SECTIONS[0]);
  const [adminTab, setAdminTab] = useState<AdminTab>('overview');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sessionRoleRef = useRef<UserRole>(user?.role || UserRole.STUDENT);
  const sessionCurriculumRef = useRef<string>(curriculum);

  // Sync refs when user changes
  useEffect(() => {
    if (user?.role) {
      sessionRoleRef.current = user.role;
      // Set RBAC context when user is available
      rbacService.setCurrentUser(user.id, user.email, user.role);
    }
  }, [user]);

  useEffect(() => {
    sessionCurriculumRef.current = curriculum;
  }, [curriculum]);

  // Log session data before clearing
  const logCurrentSession = useCallback(async (messageCount: number) => {
    if (messageCount > 0 && isAnalyticsEnabled) {
      await logSession({
        role: sessionRoleRef.current,
        curriculum: sessionCurriculumRef.current,
        message_count: messageCount,
      });
    }
  }, []);

  // ========================================
  const handleLogin = async (email: string, password: string, expectedRole: UserRole) => {
    setLoginError(null);

    let loginIdentifier = email.trim();
    if (expectedRole === UserRole.STUDENT && !loginIdentifier.includes('@')) {
        loginIdentifier = `${loginIdentifier.toLowerCase().replace(/\s+/g, '')}@student.eduquest.local`;
    } else if (expectedRole === UserRole.TEACHER && !loginIdentifier.includes('@')) {
        loginIdentifier = `${loginIdentifier.toLowerCase().replace(/\s+/g, '')}@teacher.educore.local`;
    } else if (expectedRole === UserRole.PARENT && !loginIdentifier.includes('@')) {
        loginIdentifier = `${loginIdentifier.toLowerCase().replace(/\s+/g, '')}@parent.educore.local`;
    }

    const result = await signIn(loginIdentifier, password);


    if (!result.success) {
      setLoginError(result.error || 'Invalid credentials.');
    }
  };

  // ========================================
  // HANDLE LOGOUT (uses AuthContext)
  // ========================================
  const handleLogout = async () => {
    if (user) {
      auditService.logLogout(user.email.toLowerCase(), user.email, user.role);
    }
    rbacService.clearCurrentUser();
    await logCurrentSession(messages.length);
    await signOut();
    setMessages([]);
    setLoginError(null);
  };

  const handleCurriculumChange = (newCurriculum: string) => {
    setCurriculum(newCurriculum);
  };

  const handleClear = async () => {
    if (confirm("Are you sure you want to clear the conversation?")) {
      await logCurrentSession(messages.length);
      setMessages([]);
    }
  };

  // ========================================
  // SEO & CUSTOM ROUTING LOGIC
  // ========================================
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  // Parse path excluding prefix
  const getSubPath = (path: string) => {
    const parts = path.split('/').filter(Boolean);
    if (parts[0] === 'en' || parts[0] === 'ta') {
      return '/' + parts.slice(1).join('/');
    }
    return path === '/' ? '/' : path;
  };

  const activeSubPath = getSubPath(currentPath);

  // Navigation helper
  const navigateTo = (path: string) => {
    navigate(path);
  };

  // Sync routes and language prefixes
  useEffect(() => {
    const path = location.pathname;
    const parts = path.split('/').filter(Boolean);
    const prefix = parts[0];
    if (prefix === 'ta') {
      if (i18n.language !== 'ta') {
        i18n.changeLanguage('ta');
        localStorage.setItem('educore_language', 'ta');
      }
    } else if (prefix === 'en') {
      if (i18n.language !== 'en') {
        i18n.changeLanguage('en');
        localStorage.setItem('educore_language', 'en');
      }
    } else {
      // Redirect if no prefix, default to /en + path
      const currentLang = i18n.language === 'ta' ? 'ta' : 'en';
      navigate(`/${currentLang}${path === '/' ? '' : path}`, { replace: true });
    }
  }, [location.pathname, i18n, navigate]);

  // Manage body scroll locking: active for authenticated dashboard views, disabled for public pages
  useEffect(() => {
    const isDashboardPath = activeSubPath === '/' || activeSubPath === '';
    const shouldLockScroll = isAuthenticated && isDashboardPath;
    
    if (shouldLockScroll) {
      document.body.classList.add('h-screen', 'overflow-hidden');
    } else {
      document.body.classList.remove('h-screen', 'overflow-hidden');
      document.documentElement.style.overflow = '';
    }

    return () => {
      document.body.classList.remove('h-screen', 'overflow-hidden');
      document.documentElement.style.overflow = '';
    };
  }, [isAuthenticated, activeSubPath]);

  const getSEOMetadata = () => {
    const lang = i18n.language === 'ta' ? 'ta' : 'en';
    const isTa = lang === 'ta';

    // Public pages
    if (activeSubPath === '/features') {
      return {
        title: isTa ? 'அம்சங்கள் | EDUCORE-OMEGA பள்ளி ஈஆர்பி' : 'Features | EDUCORE-OMEGA School ERP',
        description: isTa ? 'EDUCORE-OMEGA இன் வருகைப்பதிவு, பகுப்பாய்வு, தேர்வு தொகுதிகள் மற்றும் கட்டண ஒருங்கிணைப்பு உள்ளிட்ட நவீன அம்சங்களை ஆராயுங்கள்.' : 'Explore the next-gen features of EDUCORE-OMEGA including automated attendance, interactive dashboards, examination modules, and Razorpay integration.',
        noindex: false
      };
    }

    if (activeSubPath === '/about') {
      return {
        title: isTa ? 'எங்களைப் பற்றி | EDUCORE-OMEGA பார்வை' : 'About Us | The Vision of EDUCORE-OMEGA',
        description: isTa ? 'அடுத்த தலைமுறை பள்ளிகளுக்கான கல்வி அறிவு இயக்க முறைமையை உருவாக்கும் EDUCORE-OMEGA-வின் நோக்கம் மற்றும் பார்வையைப் பற்றி அறியுங்கள்.' : 'Learn about the mission, vision, and team behind EDUCORE-OMEGA, building the academic intelligence operating system for next-gen schools.',
        noindex: false
      };
    }
    if (activeSubPath === '/contact') {
      return {
        title: isTa ? 'எங்களைத் தொடர்பு கொள்ளுங்கள் | EDUCORE-OMEGA' : 'Contact Us | EDUCORE-OMEGA Support',
        description: isTa ? 'அறிமுகக்காட்சிகள், விற்பனை வினவல்கள் மற்றும் தொழில்நுட்ப ஆதரவுக்காக எங்களைத் தொடர்பு கொள்ளுங்கள்.' : 'Get in touch with the EDUCORE-OMEGA team for demos, onboarding assistance, sales queries, and technical support.',
        noindex: false
      };
    }
    if (activeSubPath === '/login') {
      return {
        title: isTa ? 'உள்நுழைக | EDUCORE-OMEGA போர்டல்' : 'Sign In | EDUCORE-OMEGA Portal',
        description: isTa ? 'உங்கள் EDUCORE-OMEGA கணக்கில் உள்நுழையவும்.' : 'Access your secure EDUCORE-OMEGA portal. Enter your credentials to log in as admin, teacher, student, or parent.',
        noindex: true
      };
    }
    if (activeSubPath === '/reset-password') {
      return {
        title: isTa ? 'கடவுச்சொல்லை மீட்டமை | EDUCORE-OMEGA' : 'Reset Password | EDUCORE-OMEGA',
        description: isTa ? 'உங்கள் கணக்கு கடவுச்சொல்லை மீட்டமைக்கவும்.' : 'Reset your secure password for the EDUCORE-OMEGA portal.',
        noindex: true
      };
    }

    // Authenticated portals
    if (isAuthenticated && user) {
      const { role } = user;
      if (role === UserRole.ADMIN) {
        if (adminTab === 'finance') {
          return {
            title: isTa ? 'பள்ளிக் கட்டண மேலாண்மை | EDUCORE-OMEGA' : 'School Fee Management | EDUCORE-OMEGA',
            description: isTa ? 'Razorpay ஒருங்கிணைப்புடன் பள்ளிக் கட்டணங்களை நிர்வகிக்கவும்.' : 'Manage school fees, online payments, dues, receipts, and Razorpay integration with EDUCORE-OMEGA finance management.',
            noindex: true
          };
        }
        if (adminTab === 'attendance') {
          return {
            title: isTa ? 'வருகைப்பதிவு பகுப்பாய்வு | EDUCORE-OMEGA' : 'Attendance Analytics | EDUCORE-OMEGA',
            description: isTa ? 'வருகைப்பதிவு பகுப்பாய்வு மற்றும் நுண்ணறிவுத் தரவு.' : 'View daily, monthly, class-wise, and student-wise attendance analytics with smart insights and percentage tracking.',
            noindex: true
          };
        }
        if (adminTab === 'exams') {
          return {
            title: isTa ? 'தேர்வு மற்றும் முடிவு மேலாண்மை | EDUCORE-OMEGA' : 'Examination & Result Management | EDUCORE-OMEGA',
            description: isTa ? 'தேர்வுகளை நடத்தவும் மற்றும் முடிவுகளை வெளியிடவும்.' : 'Conduct exams, enter marks, publish results, generate marksheets, and analyze student performance with EDUCORE-OMEGA.',
            noindex: true
          };
        }
        return {
          title: isTa ? 'நிர்வாகி டாஷ்போர்டு | EDUCORE-OMEGA' : 'Admin Dashboard | EDUCORE-OMEGA',
          description: isTa ? 'EDUCORE-OMEGA நிர்வாகி டாஷ்போர்டு பள்ளி செயல்பாடுகள்.' : 'Manage students, teachers, attendance, exams, fees, analytics, and school operations from the EDUCORE-OMEGA admin dashboard.',
          noindex: true
        };
      }
      if (role === UserRole.TEACHER) {
        return {
          title: isTa ? 'ஆசிரியர் போர்டல் | EDUCORE-OMEGA' : 'Teacher Portal | EDUCORE-OMEGA',
          description: isTa ? 'வருகைப்பதிவை குறிக்கவும் மற்றும் மதிப்பெண்களை உள்ளிடவும்.' : 'Mark attendance, enter marks, manage classes, assignments, and student performance in the EDUCORE-OMEGA teacher portal.',
          noindex: true
        };
      }
      if (role === UserRole.STUDENT) {
        return {
          title: isTa ? 'மாணவர் போர்டல் | EDUCORE-OMEGA' : 'Student Portal | EDUCORE-OMEGA',
          description: isTa ? 'உங்கள் வருகைப்பதிவு, மதிப்பெண்கள் மற்றும் பணிகளை அணுகவும்.' : 'Access attendance, marks, assignments, study materials, and exam results through the EDUCORE-OMEGA student portal.',
          noindex: true
        };
      }
      if (role === UserRole.PARENT) {
        return {
          title: isTa ? 'பெற்றோர் போர்டல் | EDUCORE-OMEGA' : 'Parent Portal | EDUCORE-OMEGA',
          description: isTa ? 'உங்கள் குழந்தையின் வருகைப்பதிவு மற்றும் கட்டணங்களைக் கண்காணிக்கவும்.' : 'Track your child’s attendance, fees, marks, announcements, and school updates using the EDUCORE-OMEGA parent portal.',
          noindex: true
        };
      }
    }

    // Default Homepage (unauthenticated)
    return {
      title: isTa ? 'EDUCORE-OMEGA | ஸ்மார்ட் பள்ளி ஈஆர்பி தளம்' : 'EDUCORE-OMEGA | Smart School ERP Platform',
      description: isTa ? 'EDUCORE-OMEGA என்பது வருகைப்பதிவு, தேர்வுகள், கட்டணங்கள், பகுப்பாய்வு மற்றும் பெற்றோர் போர்டல் ஆகியவற்றிற்கான அடுத்த தலைமுறை பள்ளி மேலாண்மை தளமாகும்.' : 'EDUCORE-OMEGA is a next-generation school ERP platform for attendance, exams, fees, analytics, parent portal, and AI-powered education management.',
      noindex: false
    };
  };

  const getSEOSchema = () => {
    const lang = i18n.language === 'ta' ? 'ta' : 'en';
    const isTa = lang === 'ta';

    if (activeSubPath === '/' || activeSubPath === '') {
      return {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "Organization",
            "name": "EDUCORE-OMEGA",
            "url": "https://www.educore-omega.com",
            "logo": "https://www.educore-omega.com/apple-touch-icon.png",
            "sameAs": [
              "https://twitter.com/educore_omega",
              "https://github.com/scrollkurai-ace/educore"
            ],
            "contactPoint": {
              "@type": "ContactPoint",
              "telephone": "+91-9876543210",
              "contactType": "customer service",
              "availableLanguage": ["English", "Tamil"]
            }
          },
          {
            "@type": "SoftwareApplication",
            "name": "EDUCORE-OMEGA",
            "operatingSystem": "All",
            "applicationCategory": "EducationalApplication",
            "offers": {
              "@type": "Offer",
              "price": "0.00",
              "priceCurrency": "INR"
            }
          }
        ]
      };
    }

    if (activeSubPath === '/contact') {
      return {
        "@context": "https://schema.org",
        "@type": "ContactPage",
        "name": isTa ? "எங்களைத் தொடர்பு கொள்ளுங்கள்" : "Contact Us",
        "description": isTa ? "EDUCORE-OMEGA ஆதரவு மற்றும் விற்பனைத் தொடர்பு." : "Contact EDUCORE-OMEGA support and sales team.",
        "url": `https://www.educore-omega.com/${lang}/contact`
      };
    }

    return undefined;
  };

  const seoMeta = getSEOMetadata();
  const seoSchema = getSEOSchema();

  const renderPublicPage = (content: React.ReactNode) => (
    <div className="flex flex-col min-h-screen bg-[#080c20] overflow-x-hidden w-full">
      <SEO 
        title={seoMeta.title} 
        description={seoMeta.description} 
        noindex={seoMeta.noindex} 
        canonicalPath={activeSubPath} 
        language={i18n.language as 'en' | 'ta'} 
        schemaMarkup={seoSchema}
      />
      <PublicHeader 
        currentPath={currentPath} 
        onNavigate={navigateTo} 
        isAuthenticated={isAuthenticated} 
        onGoToDashboard={() => navigateTo(`/${i18n.language}/`)} 
      />
      <main className="flex-1 w-full overflow-x-hidden">
        {content}
      </main>
    </div>
  );

  // 1. PUBLIC ROUTING MATCHERS
  if (activeSubPath === '/features') {
    return renderPublicPage(<PublicFeatures />);
  }

  if (activeSubPath === '/about') {
    return renderPublicPage(<PublicAbout />);
  }
  if (activeSubPath === '/contact') {
    return renderPublicPage(<PublicContact />);
  }

  // 2. CRITICAL: LOADING STATE (PREVENT PREMATURE REDIRECT)
  if (loading) {
    return <LoadingSpinner />;
  }

  // 3. NOT AUTHENTICATED: SHOW LOGIN OR PUBLIC HOME
  if (!isAuthenticated || !user) {
    if (activeSubPath === '/login') {
      return (
        <div className="flex flex-col min-h-screen bg-slate-50">
          <SEO 
            title={seoMeta.title} 
            description={seoMeta.description} 
            noindex={seoMeta.noindex} 
            canonicalPath={activeSubPath} 
            language={i18n.language as 'en' | 'ta'} 
            schemaMarkup={seoSchema}
          />
          <LoginScreen onLogin={handleLogin} error={loginError} />
        </div>
      );
    }
    if (activeSubPath === '' || activeSubPath === '/') {
      return renderPublicPage(<PublicHome onNavigate={navigateTo} />);
    }
    return renderPublicPage(<NotFound onNavigate={navigateTo} />);
  }

  // If logged in and on login path, redirect to home
  if (activeSubPath === '/login') {
    setTimeout(() => navigateTo(`/${i18n.language}/`), 0);
    return <LoadingSpinner />;
  }

  // 4. AUTHENTICATED: RENDER BASED ON ROLE
  const { role, email: userName } = user;

  // ----------------------------------------------------------------------
  // RENDER: ADMIN PORTAL
  // ----------------------------------------------------------------------
  if (role === UserRole.ADMIN) {
    return (
      <>
        <SEO 
          title={seoMeta.title} 
          description={seoMeta.description} 
          noindex={seoMeta.noindex} 
          canonicalPath={activeSubPath} 
          language={i18n.language as 'en' | 'ta'} 
        />
        <ToastContainer />
        <AdminLayout
          activeTab={adminTab}
          onTabChange={setAdminTab}
          onLogout={handleLogout}
          userName={userName}
        >
          {adminTab === 'overview' && <OverviewDashboard onNavigate={setAdminTab} />}
          {adminTab === 'users' && <UserMgmt />}
          {adminTab === 'school' && <SchoolStructure />}
          {adminTab === 'students' && <StudentProfiles />}
          {adminTab === 'teachers' && <TeacherManagement />}
          {adminTab === 'assignments' && <ClassAssignments />}
          {adminTab === 'exams' && <ExamManagement />}
          {adminTab === 'results_publishing' && <ResultPublishing />}
          {adminTab === 'timetable' && <TimetableManagement />}
          {adminTab === 'parents' && <ParentManagement />}
          {adminTab === 'finance' && <FinanceFees />}
          {adminTab === 'analytics' && <AdminAnalytics />}
          {adminTab === 'audit' && <AuditCompliance />}
          {adminTab === 'notifications' && <AlertsNotificationsPanel />}
          {adminTab === 'feedback' && <FeedbackManagement />}
          {adminTab === 'attendance' && <AttendanceCommandCenter />}
        </AdminLayout>
      </>
    );
  }

  // ----------------------------------------------------------------------
  // RENDER: TEACHER PORTAL
  // ----------------------------------------------------------------------
  if (role === UserRole.TEACHER) {
    return (
      <>
        <SEO 
          title={seoMeta.title} 
          description={seoMeta.description} 
          noindex={seoMeta.noindex} 
          canonicalPath={activeSubPath} 
          language={i18n.language as 'en' | 'ta'} 
        />
        <TeacherDashboard
          userName={userName}
          role={role}
          onLogout={handleLogout}
        />
      </>
    );
  }

  // ----------------------------------------------------------------------
  // RENDER: STUDENT PORTAL
  // ----------------------------------------------------------------------
  if (role === UserRole.STUDENT) {
    return (
      <>
        <SEO 
          title={seoMeta.title} 
          description={seoMeta.description} 
          noindex={seoMeta.noindex} 
          canonicalPath={activeSubPath} 
          language={i18n.language as 'en' | 'ta'} 
        />
        <StudentDashboard
          userName={userName}
          role={role}
          onLogout={handleLogout}
        />
      </>
    );
  }

  // ----------------------------------------------------------------------
  // RENDER: PARENT PORTAL
  // ----------------------------------------------------------------------
  if (role === UserRole.PARENT) {
    return (
      <>
        <SEO 
          title={seoMeta.title} 
          description={seoMeta.description} 
          noindex={seoMeta.noindex} 
          canonicalPath={activeSubPath} 
          language={i18n.language as 'en' | 'ta'} 
        />
        <ParentDashboard
          userName={userName}
          studentName="Demo Student"
          studentClass={`${studentClass}-${studentSection}`}
          onLogout={handleLogout}
        />
      </>
    );
  }

  // ----------------------------------------------------------------------
  // RENDER: FALLBACK
  // ----------------------------------------------------------------------
  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <SEO 
        title={seoMeta.title} 
        description={seoMeta.description} 
        noindex={seoMeta.noindex} 
        canonicalPath={activeSubPath} 
        language={i18n.language as 'en' | 'ta'} 
      />
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
            <span className="text-white font-bold text-xl tracking-tighter">Ω</span>
          </div>
          <div>
            <h1 className="font-bold text-xl text-slate-800 tracking-tight">EDUCORE-OMEGA</h1>
            <p className="text-xs text-slate-500 font-medium">{userName} • {role}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="text-slate-400 hover:text-indigo-600 transition-colors"
          >
            <Info size={24} />
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
            title="Sign Out"
          >
            <LogOut size={16} />
            <span className="hidden md:inline">Sign Out</span>
          </button>
        </div>
      </header>

      <div className="bg-indigo-50 px-4 md:px-6 py-2 border-b border-indigo-100 flex flex-col md:flex-row justify-between items-center text-xs md:text-sm text-indigo-800 gap-2">
        <div className="flex items-center space-x-2 md:space-x-4 w-full md:w-auto overflow-x-auto">
          <span className="whitespace-nowrap"><span className="font-semibold">Context:</span> {role}</span>
          <span className="text-indigo-300">|</span>
          <ClassSelector
            currentClass={studentClass}
            currentSection={studentSection}
            onClassSelect={setStudentClass}
            onSectionSelect={setStudentSection}
          />
          <span className="text-indigo-300">|</span>
          <CurriculumSelector currentCurriculum={curriculum} onCurriculumSelect={handleCurriculumChange} />
        </div>

        {messages.length > 0 && (
          <button onClick={handleClear} className="flex items-center space-x-1 text-indigo-600 hover:text-indigo-800 font-medium whitespace-nowrap">
            <Eraser size={14} />
            <span>Reset</span>
          </button>
        )}
      </div>

      <div className="flex-1 flex items-center justify-center text-slate-400">
        <div className="text-center">
          <p className="text-lg font-medium">Welcome, {userName}</p>
          <p className="text-sm mt-2">Role: {role}</p>
          <p className="text-xs mt-4">Portal for this role is under development.</p>
        </div>
      </div>

      {showInfo && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h2 className="text-xl font-bold mb-4 text-indigo-900">About EDUCORE-OMEGA</h2>
            <p className="text-sm text-slate-600 mb-4">
              Next-generation Education AI Operating System. Governed, curriculum-bound, institution-ready, human-centered.
            </p>
            <div className="space-y-3 mb-6 text-sm">
              <div className="flex items-start">
                <span className="text-indigo-600 font-bold mr-2">School:</span>
                <span className="text-slate-700">Sri Aurobindo International Senior Secondary School</span>
              </div>
              <div className="flex items-start">
                <span className="text-green-600 font-bold mr-2">✓</span>
                <span className="text-slate-700">Learning Mastery & Academic Integrity</span>
              </div>
              <div className="flex items-start">
                <span className="text-green-600 font-bold mr-2">✓</span>
                <span className="text-slate-700">Institutional Governance & Analytics</span>
              </div>
            </div>
            <button
              onClick={() => setShowInfo(false)}
              className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {showDashboard && (
        <AnalyticsDashboard onClose={() => setShowDashboard(false)} />
      )}

      {showFileUpload && (
        <FileUpload
          userRole={role}
          onClose={() => setShowFileUpload(false)}
          onFileSelect={(file) => {
            setAttachedFile(file);
            setShowFileUpload(false);
          }}
        />
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/:lang/quiz/:quizId" element={<QuizPage />} />
      <Route path="/quiz/:quizId" element={<QuizPage />} />
      <Route path="*" element={<MainAppContent />} />
    </Routes>
  );
};

export default App;