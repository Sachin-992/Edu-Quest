import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  ArrowRight, Flame, Scroll, BookOpen, Printer, Laptop, 
  AlertTriangle, Clock, ChevronRight, Activity, Users, 
  Award, Calendar, Search, ShieldCheck, CheckCircle, 
  RefreshCw, Check, TrendingUp, Sparkles
} from 'lucide-react';

// ============================================
// TRANSLATION DICTIONARY FOR HIGH-IMPACT STORYTELLING
// ============================================
interface LocalizedText {
  en: string;
  ta: string;
}

const localTranslations: Record<string, Record<string, LocalizedText>> = {
  hero: {
    badge: {
      en: "⚡ The Evolution of Education",
      ta: "⚡ கல்வியின் பரிணாம வளர்ச்சி"
    },
    titleLine1: {
      en: "Education Changed Humanity.",
      ta: "கல்வி மனிதகுலத்தை மாற்றியது."
    },
    titleLine2: {
      en: "Now It's Time To Change How Schools Operate.",
      ta: "இப்போது பள்ளிகள் செயல்படும் முறையை மாற்ற வேண்டிய நேரம்."
    },
    subhead: {
      en: "For over 5000 years, education evolved from stories around a fire to AI-powered learning ecosystems. EDUCORE-OMEGA is the platform built for the next generation of schools.",
      ta: "5000 ஆண்டுகளுக்கும் மேலாக, கல்வி நெருப்பைச் சுற்றியுள்ள கதைகளிலிருந்து AI-ஆற்றல் கொண்ட கற்றல் சுற்றுச்சூழல் அமைப்புகளாக பரிணமித்துள்ளது. EDUCORE-OMEGA என்பது அடுத்த தலைமுறை பள்ளிகளுக்காக கட்டமைக்கப்பட்ட தளமாகும்."
    },
    ctaStart: {
      en: "Start Your Journey",
      ta: "உங்கள் பயணத்தைத் தொடங்குங்கள்"
    },
    ctaWatch: {
      en: "Watch The Evolution",
      ta: "பரிணாமத்தை உணருங்கள்"
    }
  },
  chapters: {
    secTitle: {
      en: "The Journey of Education",
      ta: "கல்வியின் நெடும் பயணம்"
    },
    secSubtitle: {
      en: "A story 5000 years in the making. Scroll or select a chapter to explore how human learning evolved.",
      ta: "5000 ஆண்டுகால வரலாறு. மனித கற்றல் எவ்வாறு பரிணமித்தது என்பதை அறிய ஒரு அத்தியாயத்தைத் தேர்ந்தெடுக்கவும்."
    },
    ch1Title: {
      en: "Stone Age: Before Schools, There Were Stories",
      ta: "கற்காலம்: பள்ளிகளுக்கு முன் கதைகள் இருந்தன"
    },
    ch1Desc: {
      en: "Knowledge was passed from generation to generation through storytelling around the fire, observation, and rock drawings.",
      ta: "அனுபவங்களும் அறிவும் நெருப்பைச் சுற்றியுள்ள கதைகள், அவதானிப்புகள் மற்றும் பாறை வரைபடங்கள் மூலம் தலைமுறையாகக் கடத்தப்பட்டன."
    },
    ch2Title: {
      en: "Ancient Tamil: Knowledge Became Wisdom",
      ta: "பண்டைய தமிழ்: அறிவு ஞானமாக மாறியது"
    },
    ch2Desc: {
      en: "Palm leaf manuscripts, traditional Gurukuls, and ancient learning structures preserved early culture and literature.",
      ta: "பனை ஓலைச் சுவடிகள், குருகுலக் கல்வி மற்றும் பண்டைய கற்றல் முறைகள் முற்கால பண்பாட்டையும் இலக்கியத்தையும் பாதுகாத்தன."
    },
    ch3Title: {
      en: "Ancient India: Learning Built Civilizations",
      ta: "பண்டைய இந்தியா: கற்றல் நாகரிகங்களை உருவாக்கியது"
    },
    ch3Desc: {
      en: "World-class learning centers like Nalanda fostered advanced studies in mathematics, astronomy, philosophy, and sciences.",
      ta: "நாளந்தா போன்ற உலகத்தரம் வாய்ந்த கற்றல் மையங்கள் கணிதம், வானியல், தத்துவம் மற்றும் அறிவியல் ஆகியவற்றில் மேம்பட்ட படிப்புகளை வளர்த்தன."
    },
    ch4Title: {
      en: "The Age of Books: Knowledge Became Accessible",
      ta: "புத்தகங்களின் காலம்: அறிவு அனைவருக்கும் எட்டியது"
    },
    ch4Desc: {
      en: "The invention of the printing press transformed education. Books and libraries democratized human learning globally.",
      ta: "அச்சு இயந்திரத்தின் கண்டுபிடிப்பு கல்வியை மாற்றியமைத்தது. புத்தகங்கள் மற்றும் நூலகங்கள் உலகளவில் மனித கற்றலை எளிமையாக்கின."
    },
    ch5Title: {
      en: "Industrial Education: Reaching Millions",
      ta: "தொழில்துறை கல்வி: மில்லியன்களைச் சென்றடைதல்"
    },
    ch5Desc: {
      en: "Classrooms scaled with blackboards, standardized timetables, and uniforms to prepare students for the industrial age.",
      ta: "தொழில்துறை யுகத்திற்கு மாணவர்களைத் தயார்படுத்த கரும்பலகைகள், தரப்படுத்தப்பட்ட கால அட்டவணைகள் மற்றும் சீருடைகள் மூலம் வகுப்பறைகள் உருவாக்கப்பட்டன."
    },
    ch6Title: {
      en: "Digital Revolution: Learning Connected",
      ta: "டிஜிட்டல் புரட்சி: கற்றல் ஒன்றிணைக்கப்பட்டது"
    },
    ch6Desc: {
      en: "Computers and the internet entered classrooms. Learning expanded beyond boundaries with immediate global access.",
      ta: "கணினிகளும் இணையமும் வகுப்பறைகளுக்குள் நுழைந்தன. உடனடி உலகளாவிய அணுகலுடன் கற்றல் எல்லைகளைத் தாண்டி விரிவடைந்தது."
    },
    ch7Title: {
      en: "The Present: Schools Evolved. Systems Didn't",
      ta: "தற்காலம்: பள்ளிகள் வளர்ந்தன, அமைப்புகள் வளரவில்லை"
    },
    ch7Desc: {
      en: "While teaching evolved, school administration fell behind—leaving teachers juggling paperwork, disconnected parents, and fragmented tools.",
      ta: "கற்பித்தல் வளர்ந்தாலும், பள்ளி நிர்வாகம் பின்தங்கியே இருந்தது-ஆசிரியர்கள் காகித வேலைகள் மற்றும் துண்டிக்கப்பட்ட கருவிகளுடன் போராட வேண்டியுள்ளது."
    }
  },
  problem: {
    title: {
      en: "Modern Schools Are Running On Yesterday's Systems",
      ta: "நவீன பள்ளிகள் நேற்றைய அமைப்புகளில் இயங்குகின்றன"
    },
    desc: {
      en: "Teachers are overwhelmed by attendance books and excel sheets. Parents feel disconnected. Administrative overhead wastes valuable academic time.",
      ta: "ஆசிரியர்கள் வருகைப்பதிவு புத்தகங்கள் மற்றும் விரிதாள்களால் சோர்ந்துபோகிறார்கள். பெற்றோர்கள் துண்டிக்கப்பட்டதாக உணர்கிறார்கள். நிர்வாக சுமை மதிப்புமிக்க கல்வி நேரத்தை வீணாக்குகிறது."
    },
    card1: {
      en: "Overwhelmed Teachers",
      ta: "அதிக பணிச்சுமையுள்ள ஆசிரியர்கள்"
    },
    card2: {
      en: "Manual Records & Errors",
      ta: "கையேடு பதிவுகள் மற்றும் பிழைகள்"
    },
    card3: {
      en: "Disconnected Parents",
      ta: "தொடர்பற்ற பெற்றோர்கள்"
    }
  },
  arrival: {
    title: {
      en: "Meet EDUCORE-OMEGA",
      ta: "EDUCORE-OMEGA-வைச் சந்தியுங்கள்"
    },
    subtitle: {
      en: "The Operating System for Modern Education.",
      ta: "நவீன கல்விக்கான இயக்க முறைமை."
    },
    desc: {
      en: "A unified, secure, and localized system built to eliminate paper-trails, secure student identity, and bring real-time intelligence to your campus.",
      ta: "காகித வேலைகளை ஒழிக்கவும், மாணவர் அடையாளத்தைப் பாதுகாக்கவும், உங்கள் வளாகத்திற்கு நிகழ்நேர உளவுத்துறையைக் கொண்டுவரவும் கட்டமைக்கப்பட்ட ஒரு ஒருங்கிணைந்த, பாதுகாப்பான மற்றும் உள்ளூர்மயமாக்கப்பட்ட அமைப்பு."
    }
  },
  dayLife: {
    title: {
      en: "A Day Re-Imagined with EDUCORE-OMEGA",
      ta: "EDUCORE-OMEGA-வுடன் மறுவடிவமைக்கப்பட்ட ஒரு நாள்"
    },
    morningTitle: {
      en: "08:30 AM — Automated Morning Starts",
      ta: "முற்பகல் 08:30 — தானியங்கி காலை தொடக்கம்"
    },
    morningDesc: {
      en: "Class teachers record attendance in seconds with automatic low-attendance triggers and real-time parent alerts.",
      ta: "ஆசிரியர்கள் வருகையை நொடிகளில் பதிவு செய்கிறார்கள், தானியங்கி குறைந்த வருகை எச்சரிக்கைகள் மற்றும் நிகழ்நேர பெற்றோர் அறிவிப்புகளுடன்."
    },
    middayTitle: {
      en: "12:00 PM — Live Parent Updates",
      ta: "நண்பகல் 12:00 — நேரடி பெற்றோர் புதுப்பிப்புகள்"
    },
    middayDesc: {
      en: "Parents access child reports, exam schedules, and academic tasks securely via their dedicated localized parent portal.",
      ta: "பெற்றோர்கள் தங்களின் பிரத்யேக உள்ளூர்மயமாக்கப்பட்ட பெற்றோர் போர்டல் மூலம் தங்கள் குழந்தையின் அறிக்கைகள், தேர்வு அட்டவணைகளை பாதுகாப்பாக அணுகலாம்."
    },
    afternoonTitle: {
      en: "03:00 PM — Examination Governance",
      ta: "பிற்பகல் 03:00 — தேர்வு நிர்வாகம்"
    },
    afternoonDesc: {
      en: "Teachers input subject marks, grade sheets are generated automatically, and averages are locked securely with audit logs.",
      ta: "ஆசிரியர்கள் பாட மதிப்பெண்களை உள்ளிடுகிறார்கள், மதிப்பெண் அட்டவணைகள் தானாக உருவாக்கப்பட்டு தணிக்கைப் பதிவுகளுடன் பாதுகாப்பாக பூட்டப்படுகின்றன."
    },
    eveningTitle: {
      en: "06:00 PM — Finance Control Center",
      ta: "மாலை 06:00 — நிதி கட்டுப்பாட்டு மையம்"
    },
    eveningDesc: {
      en: "The administration views automated Razorpay fee collection ledger reports, pending balances, and transaction logs.",
      ta: "நிர்வாகம் தானியங்கி ரேஸோர்பே கட்டண வசூல் அறிக்கைகள், நிலுவைத் தொகைகள் மற்றும் பரிவர்த்தனைப் பதிவுகளைப் பார்க்கிறது."
    },
    nightTitle: {
      en: "09:00 PM — Intelligent Insights",
      ta: "இரவு 09:00 — அறிவுசார் நுண்ணறிவுகள்"
    },
    nightDesc: {
      en: "The school principal reviews automated compliance audit logs, operational health index, and system integrity indicators.",
      ta: "பள்ளி முதல்வர் தானியங்கி இணக்க தணிக்கை பதிவுகள், செயல்பாட்டு ஆரோக்கிய குறியீடு மற்றும் கணினி ஒருமைப்பாடு குறிகாட்டிகளை மதிப்பாய்வு செய்கிறார்."
    }
  },
  campus: {
    title: {
      en: "Explore the Campus of the Future",
      ta: "எதிர்கால பள்ளி வளாகத்தை ஆராயுங்கள்"
    },
    subtitle: {
      en: "Click on the blueprint hotspots to see how EDUCORE-OMEGA operates behind the scenes.",
      ta: "EDUCORE-OMEGA எவ்வாறு பின்னணியில் செயல்படுகிறது என்பதைப் பார்க்க வரைபடத்தின் ஹாட்ஸ்பாட்களைக் கிளிக் செய்யவும்."
    },
    classroom: {
      en: "Modern Classroom",
      ta: "நவீன வகுப்பறை"
    },
    classroomDesc: {
      en: "Digital learning resources, period schedules, and student progress metrics connected directly to teachers.",
      ta: "டிஜிட்டல் கற்றல் வளங்கள், பாட கால அட்டவணைகள் மற்றும் மாணவர்களின் முன்னேற்ற அளவீடுகள் நேரடியாக ஆசிரியர்களுடன் இணைக்கப்பட்டுள்ளன."
    },
    teacher: {
      en: "Teacher Suite",
      ta: "ஆசிரியர் தளம்"
    },
    teacherDesc: {
      en: "Interactive dashboards to log grades, track attendance, and communicate with parents instantly.",
      ta: "மதிப்பெண்களைப் பதிவு செய்யவும், வருகையைக் கண்காணிக்கவும் மற்றும் பெற்றோருடன் உடனடியாகத் தொடர்பு கொள்ளவும் ஊடாடும் கட்டுப்பாட்டு பலகைகள்."
    },
    admin: {
      en: "Administration Hub",
      ta: "நிர்வாக மையம்"
    },
    adminDesc: {
      en: "Full institutional control: user access permissions, academic settings, and security audits.",
      ta: "முழு நிறுவனக் கட்டுப்பாடு: பயனர் அணுகல் அனுமதிகள், கல்வி அமைப்புகள் மற்றும் பாதுகாப்பு தணிக்கைகள்."
    },
    finance: {
      en: "Finance Division",
      ta: "நிதிப் பிரிவு"
    },
    financeDesc: {
      en: "Seamless Razorpay portal integration, automated invoices, payment receipts, and balance reports.",
      ta: "தடையற்ற ரேஸோர்பே போர்டல் ஒருங்கிணைப்பு, தானியங்கி விலைப்பட்டியல்கள், கட்டண ரசீதுகள் மற்றும் இருப்பு அறிக்கைகள்."
    },
    exams: {
      en: "Examination Cell",
      ta: "தேர்வு பிரிவு"
    },
    examsDesc: {
      en: "Secure grade book generation, exam scheduling, compliance records, and direct results publishing control.",
      ta: "பாதுகாப்பான மதிப்பெண் அட்டை உருவாக்கம், தேர்வு திட்டமிடல், இணக்க பதிவுகள் மற்றும் நேரடி தேர்வு முடிவுகள் வெளியீட்டுக் கட்டுப்பாடு."
    },
    ai: {
      en: "AI Analytics Node",
      ta: "AI பகுப்பாய்வு முனையம்"
    },
    aiDesc: {
      en: "Intelligent analytics for student attendance risks, class averages, and system integrity scorechecks.",
      ta: "மாணவர்களின் வருகை அபாயங்கள், வகுப்பு சராசரிகள் மற்றும் கணினி ஒருமைப்பாடு மதிப்பெண் சரிபார்ப்புகளுக்கான அறிவுசார் பகுப்பாய்வு."
    }
  },
  founder: {
    title: {
      en: "We Didn't Build Software. We Built the Future of School Management.",
      ta: "நாங்கள் மென்பொருளை உருவாக்கவில்லை. பள்ளி நிர்வாகத்தின் எதிர்காலத்தை உருவாக்கினோம்."
    },
    quote: {
      en: "\"Human knowledge has survived for thousands of years because we always improved how we recorded and protected it. EDUCORE-OMEGA is our contribution to preserving institutional integrity and modernizing the educational experience for the next century.\"",
      ta: "\"மனித அறிவு ஆயிரக்கணக்கான ஆண்டுகளாக தப்பிப்பிழைத்துள்ளது ஏனெனில் நாம் அதை பதிவுசெய்து பாதுகாக்கும் முறையை எப்போதும் மேம்படுத்தினோம். EDUCORE-OMEGA என்பது நிறுவன ஒருமைப்பாட்டைப் பாதுகாப்பதற்கும் அடுத்த நூற்றாண்டிற்கான கல்வி அனுபவத்தை நவீனப்படுத்துவதற்கும் எங்கள் பங்களிப்பாகும்.\""
    },
    sign: {
      en: "— The EDUCORE-OMEGA Architectural Team",
      ta: "— EDUCORE-OMEGA கட்டமைப்பு குழு"
    }
  },
  stats: {
    s1Num: { en: "5000+", ta: "5000+" },
    s1lbl: { en: "Years of Educational Evolution", ta: "கல்வி பரிணாம வளர்ச்சி ஆண்டுகள்" },
    s2Num: { en: "100+", ta: "100+" },
    s2lbl: { en: "Processes Automated", ta: "தானியங்கியாக்கப்பட்ட பள்ளி பணிகள்" },
    s3Num: { en: "95%", ta: "95%" },
    s3lbl: { en: "Administrative Time Saved", ta: "சேமிக்கப்பட்ட நிர்வாக நேரம்" },
    s4Num: { en: "99.9%", ta: "99.9%" },
    s4lbl: { en: "System Reliability Index", ta: "கணினி நம்பகத்தன்மை குறியீடு" }
  },
  testimonials: {
    title: {
      en: "Voices of the Educational Evolution",
      ta: "கல்வி பரிணாமத்தின் குரல்கள்"
    },
    principalName: { en: "Dr. A. Sundaram (Principal)", ta: "டாக்டர் அ. சுந்தரம் (முதல்வர்)" },
    principalText: {
      en: "EDUCORE-OMEGA has turned our administrative chaos into absolute harmony. The automated audit trails and real-time reports keep us completely compliant and optimized.",
      ta: "EDUCORE-OMEGA எங்களது நிர்வாகக் குழப்பங்களை முழுமையான ஒத்திசைவாக மாற்றியுள்ளது. தானியங்கி தணிக்கைப் பதிவுகள் மற்றும் நிகழ்நேர அறிக்கைகள் எங்களை முழுமையாக இணக்கத்துடன் வைத்திருக்க உதவுகின்றன."
    },
    teacherName: { en: "Mrs. Janaki R. (Senior Teacher)", ta: "திருமதி ஜானகி ரா. (முதுநிலை ஆசிரியர்)" },
    teacherText: {
      en: "I save hours every week on attendance and grade sheets. I can focus 100% on teaching, knowing the system handles the admin work flawlessly.",
      ta: "வருகைப்பதிவு மற்றும் மதிப்பெண் பட்டியல்களில் ஒவ்வொரு வாரமும் எனக்கு பல மணிநேரம் மிச்சமாகிறது. கணினி நிர்வாக வேலைகளை தடையின்றி கையாளுவதால் கற்பித்தலில் முழுமையாக கவனம் செலுத்த முடிகிறது."
    },
    parentName: { en: "M. Karthik (Parent)", ta: "மு. கார்த்திக் (பெற்றோர்)" },
    parentText: {
      en: "The dedicated parent portal keeps me aligned with my son's grades and attendance. Receiving direct alerts gives me complete peace of mind.",
      ta: "பிரத்யேக பெற்றோர் போர்டல் எனது மகனின் மதிப்பெண்கள் மற்றும் வருகைப்பதிவை உடனுக்குடன் அறிய உதவுகிறது. நேரடி விழிப்பூட்டல்கள் எனக்கு முழுமையான மன அமைதியைத் தருகின்றன."
    },
    studentName: { en: "Ananya S. (Grade 10 Student)", ta: "அனன்யா செ. (பத்தாம் வகுப்பு மாணவி)" },
    studentText: {
      en: "Seeing my timetable and performance chart makes it so easy to stay on track. The portal is incredibly fast and looks beautiful.",
      ta: "எனது கால அட்டவணை மற்றும் செயல்திறன் வரைபடத்தைப் பார்ப்பது எனது படிப்பை சீராக வைத்திருக்க உதவுகிறது. இந்த போர்டல் மிக வேகமாக இயங்குகிறது மற்றும் அழகாக இருக்கிறது."
    }
  },
  cta: {
    title: {
      en: "Education has evolved for 5000 years. Is your school ready for the next chapter?",
      ta: "கல்வி 5000 ஆண்டுகளாக பரிணமித்துள்ளது. உங்கள் பள்ளி அடுத்த அத்தியாயத்திற்கு தயாராக உள்ளதா?"
    },
    btnDemo: {
      en: "Book Private Demo",
      ta: "விளக்கக் காட்சிக்கு முன்பதிவு செய்"
    },
    btnTrial: {
      en: "Start Free Trial",
      ta: "இலவச சோதனையைத் தொடங்கு"
    },
    btnConsult: {
      en: "Schedule Consultation",
      ta: "ஆலோசனைக்கு திட்டமிடு"
    }
  }
};

export const PublicHome: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  const { i18n } = useTranslation();
  const currentLang = (i18n.language === 'ta' ? 'ta' : 'en') as 'en' | 'ta';

  // Helper to retrieve local localized text
  const l = (section: string, key: string): string => {
    return localTranslations[section]?.[key]?.[currentLang] || '';
  };

  // State for interactive mockup dashboard preview
  const [previewTab, setPreviewTab] = useState<'overview' | 'students' | 'teachers' | 'timetable' | 'exams'>('overview');

  // State for WhatsApp Demo/Trial Request Modal
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [demoRequestType, setDemoRequestType] = useState<'demo' | 'trial'>('demo');
  const [formData, setFormData] = useState({ name: '', school: '', email: '', phone: '' });
  const [formErrors, setFormErrors] = useState({ name: '', school: '', phone: '', email: '' });

  const handleOpenDemoModal = (type: 'demo' | 'trial') => {
    setDemoRequestType(type);
    setFormErrors({ name: '', school: '', phone: '', email: '' });
    setShowDemoModal(true);
  };

  // State for interactive Timeline/Journey of Education
  const [activeChapter, setActiveChapter] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isPaused) {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      return;
    }

    const duration = 5000; // 5 seconds per slide
    const tick = 40; // update progress every 40ms for smooth animation
    const increment = (tick / duration) * 100;

    progressIntervalRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) return 100;
        return prev + increment;
      });
    }, tick);

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [isPaused]);

  useEffect(() => {
    if (progress >= 100) {
      setProgress(0);
      setActiveChapter(curr => (curr + 1) % 7); // 7 chapters
    }
  }, [progress]);

  const handleSelectChapter = (idx: number) => {
    setActiveChapter(idx);
    setProgress(0);
  };



  // State for Live Demonstration metrics
  const [demoAttendance, setDemoAttendance] = useState<number>(92.4);
  const [demoFees, setDemoFees] = useState<number>(450000);
  const [demoAlerts, setDemoAlerts] = useState<number>(4);

  // Simulate dashboard metric updates in real-time
  useEffect(() => {
    const interval = setInterval(() => {
      setDemoAttendance(prev => {
        const delta = (Math.random() - 0.4) * 0.2;
        return parseFloat(Math.min(99.8, Math.max(90.1, prev + delta)).toFixed(1));
      });
      setDemoFees(prev => {
        const increment = Math.random() > 0.4 ? Math.floor(Math.random() * 800) + 100 : 0;
        return prev + increment;
      });
      setDemoAlerts(prev => {
        const change = Math.random() > 0.85 ? (Math.random() > 0.5 ? 1 : -1) : 0;
        return Math.max(1, Math.min(10, prev + change));
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const timelineChapters = [
    {
      id: 0,
      era: currentLang === 'ta' ? "கற்காலம்" : "Stone Age",
      icon: <Flame className="text-amber-500" size={24} />,
      title: l('chapters', 'ch1Title'),
      desc: l('chapters', 'ch1Desc'),
      image: "/story-stone-age.png",
      label: currentLang === 'ta' ? "கி.மு. 5000" : "5000 B.C."
    },
    {
      id: 1,
      era: currentLang === 'ta' ? "பண்டைய தமிழ்" : "Ancient Tamil",
      icon: <Scroll className="text-emerald-500" size={24} />,
      title: l('chapters', 'ch2Title'),
      desc: l('chapters', 'ch2Desc'),
      image: "/story-ancient-tamil.png",
      label: currentLang === 'ta' ? "சங்க காலம்" : "Sangam Era"
    },
    {
      id: 2,
      era: currentLang === 'ta' ? "பண்டைய இந்தியா" : "Ancient India",
      icon: <BookOpen className="text-blue-500" size={24} />,
      title: l('chapters', 'ch3Title'),
      desc: l('chapters', 'ch3Desc'),
      image: "/story-ancient-india.png",
      label: currentLang === 'ta' ? "நாளந்தா" : "Nalanda B.C. 500"
    },
    {
      id: 3,
      era: currentLang === 'ta' ? "அச்சு ஊடகம்" : "Age of Books",
      icon: <Printer className="text-indigo-500" size={24} />,
      title: l('chapters', 'ch4Title'),
      desc: l('chapters', 'ch4Desc'),
      image: "/story-age-of-books.png",
      label: currentLang === 'ta' ? "கி.பி. 1440" : "A.D. 1440"
    },
    {
      id: 4,
      era: currentLang === 'ta' ? "தொழில்துறை" : "Industrial Era",
      icon: <Clock className="text-violet-500" size={24} />,
      title: l('chapters', 'ch5Title'),
      desc: l('chapters', 'ch5Desc'),
      image: "/story-industrial-era.png",
      label: currentLang === 'ta' ? "கி.பி. 1800" : "A.D. 1800"
    },
    {
      id: 5,
      era: currentLang === 'ta' ? "டிஜிட்டல் யுகம்" : "Digital Age",
      icon: <Laptop className="text-pink-500" size={24} />,
      title: l('chapters', 'ch6Title'),
      desc: l('chapters', 'ch6Desc'),
      image: "/story-digital-age.png",
      label: currentLang === 'ta' ? "கி.பி. 2000" : "A.D. 2000"
    },
    {
      id: 6,
      era: currentLang === 'ta' ? "இன்றைய நிலை" : "The Present",
      icon: <AlertTriangle className="text-rose-500 animate-pulse" size={24} />,
      title: l('chapters', 'ch7Title'),
      desc: l('chapters', 'ch7Desc'),
      image: "/story-present-day.png",
      label: currentLang === 'ta' ? "தற்காலம்" : "Present Day"
    }
  ];



  return (
    <div className="bg-[#080c20] text-slate-100 font-sans overflow-x-hidden w-full selection:bg-indigo-600 selection:text-white">
      
      {/* ============================================
         SECTION 1: CINEMATIC HERO — SPLIT LAYOUT
         ============================================ */}
      <section className="relative min-h-[calc(100vh-60px)] flex flex-col justify-center bg-[#050814] overflow-hidden w-full">
        
        {/* Ambient background glows */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-20 -left-20 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[150px] animate-pulse-slow" />
          <div className="absolute -bottom-20 -right-20 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[150px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[120px]" />
        </div>

        {/* Main hero grid: text left, image right */}
        <div className="flex-1 w-full max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center relative z-10 py-16">
          
          {/* LEFT: Text content */}
          <div className="space-y-6 order-2 lg:order-1">
            {/* Badge */}
            <span className="inline-flex items-center space-x-2 px-4 py-1.5 bg-indigo-900/60 border border-indigo-500/40 text-indigo-300 text-xs font-black rounded-full uppercase tracking-widest">
              <span className="text-amber-400">⚡</span>
              <span>{currentLang === 'ta' ? 'கல்வியின் பரிணாம வளர்ச்சி' : 'The Evolution of Education'}</span>
            </span>

            {/* Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.1] tracking-tight font-poppins">
              {currentLang === 'ta' ? 'கல்வி மனிதகுலத்தை மாற்றியது.' : 'Education Changed Humanity.'}
              <span className="block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                {currentLang === 'ta' 
                  ? 'இப்போது பள்ளிகளை மாற்ற வேண்டிய நேரம்.' 
                  : "Now It's Time To Change How Schools Operate."}
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-slate-400 text-base sm:text-lg leading-relaxed max-w-lg font-open">
              {currentLang === 'ta' 
                ? 'பண்டைய ஞானம் முதல் AI கற்றல் சுற்றுச்சூழல் வரை, EDUCORE-OMEGA அடுத்த தலைமுறை பள்ளிகளுக்கு கட்டமைக்கப்பட்டுள்ளது.'
                : 'From ancient wisdom to AI-powered learning ecosystems, EDUCORE-OMEGA is the intelligent platform built for the next generation of schools.'}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <button
                onClick={() => onNavigate(`/${currentLang}/login`)}
                className="flex items-center justify-center space-x-2.5 px-7 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-900/50 transition-all hover:scale-105 hover:shadow-indigo-700/40 text-base"
              >
                <span>{currentLang === 'ta' ? 'பயணத்தைத் தொடங்குங்கள்' : 'Start Your Journey'}</span>
                <ArrowRight size={18} />
              </button>
              <a
                href="#journey"
                className="flex items-center justify-center space-x-2.5 px-7 py-3.5 border border-white/20 hover:border-white/40 bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white rounded-xl font-semibold transition-all text-base backdrop-blur-sm"
              >
                <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{currentLang === 'ta' ? 'பரிணாமத்தை உணருங்கள்' : 'Watch The Evolution'}</span>
              </a>
            </div>
          </div>

          {/* RIGHT: Cinematic winding road image */}
          <div className="relative order-1 lg:order-2 flex items-center justify-center min-w-0">
            {/* Glow behind image */}
            <div className="absolute inset-0 bg-indigo-600/10 rounded-3xl blur-3xl scale-105" />
            <img
              src="/hero-winding-road.png"
              alt="The Evolution of Education — Winding Road Through Time"
              loading="eager"
              className="relative w-full h-auto max-h-[60vh] lg:max-h-[70vh] object-contain drop-shadow-[0_0_40px_rgba(99,102,241,0.3)] rounded-2xl"
              style={{ filter: 'brightness(1.1) saturate(1.2) contrast(1.05)' }}
            />
          </div>
        </div>

        {/* BOTTOM FEATURE BAR */}
        <div className="relative z-10 border-t border-white/10 bg-[#0d1230]/80 backdrop-blur-sm w-full">
          <div className="max-w-screen-2xl mx-auto px-6 lg:px-16 py-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-6">
            {[
              { icon: '🏫', title: currentLang === 'ta' ? 'ஒருங்கிணைந்த தளம்' : 'All-in-One Platform', desc: currentLang === 'ta' ? 'ஒவ்வொரு பள்ளி செயல்பாட்டிற்கும்' : 'Unified solution for every school operation' },
              { icon: '📊', title: currentLang === 'ta' ? 'நிகழ்நேர நுண்ணறிவு' : 'Real-Time Insights', desc: currentLang === 'ta' ? 'சிறந்த முடிவுகளுக்கான அறிவு' : 'Smart analytics for better decisions' },
              { icon: '🔒', title: currentLang === 'ta' ? 'பாதுகாப்பான & நம்பகமான' : 'Secure & Reliable', desc: currentLang === 'ta' ? 'நிறுவன-தர பாதுகாப்பு' : 'Enterprise-grade security you can trust' },
              { icon: '👥', title: currentLang === 'ta' ? 'இணைக்கப்பட்ட சமூகம்' : 'Connected Community', desc: currentLang === 'ta' ? 'ஆசிரியர்கள், மாணவர்கள், பெற்றோர்' : 'Bringing teachers, students and parents together' },
              { icon: '🚀', title: currentLang === 'ta' ? 'எதிர்காலத்திற்கு தயார்' : 'Future Ready', desc: currentLang === 'ta' ? 'இன்றைக்காக, நாளைக்காக' : 'Built for today, designed for tomorrow' },
            ].map((feat, i) => (
              <div key={i} className="flex items-start space-x-3">
                <span className="text-2xl flex-shrink-0 mt-0.5">{feat.icon}</span>
                <div>
                  <p className="text-white font-semibold text-sm font-poppins">{feat.title}</p>
                  <p className="text-slate-500 text-xs mt-0.5 leading-snug font-open">{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </section>

      {/* ============================================
         SECTION 2: THE STORY OF LEARNING (TIMELINE SLIDER)
         ============================================ */}
      <section 
        id="journey" 
        className="py-24 px-6 max-w-7xl mx-auto relative bg-[#050814]"
      >
        <div className="text-center space-y-4 mb-16">
          <span className="text-sm font-black uppercase tracking-widest text-indigo-400 font-poppins">
            {currentLang === 'ta' ? 'கல்வியின் பரிணாம வரலாறு' : 'Chronicle of Educational Evolution'}
          </span>
          <h2 className="text-4xl sm:text-6xl font-poppins font-bold text-white tracking-tight">
            {l('chapters', 'secTitle')}
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-base sm:text-lg font-open">
            {l('chapters', 'secSubtitle')}
          </p>
        </div>

        {/* Full-Width Auto-Scrolling Cinematic Showcase */}
        <div className="max-w-6xl mx-auto">
          <div className="bg-slate-900 border border-slate-800 p-3 sm:p-4 rounded-[2rem] shadow-[0_0_50px_-12px_rgba(99,102,241,0.25)] relative overflow-hidden flex flex-col justify-between h-[70vh] min-h-[500px] group">
            
            {/* Glass reflection effect overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 pointer-events-none z-10" />

            {/* Graphic container with height lock */}
            <div className="relative w-full h-full rounded-2xl overflow-hidden bg-slate-950 shadow-inner">
              {/* Images Cross-Fade Loop */}
              {timelineChapters.map((ch, idx) => {
                const isActive = activeChapter === idx;
                return (
                  <img
                    key={ch.id}
                    src={ch.image}
                    alt={ch.era}
                    loading="lazy"
                    className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 ease-in-out ${
                      isActive
                        ? 'opacity-100 scale-100 blur-0 z-10'
                        : 'opacity-0 scale-105 blur-sm z-0 pointer-events-none'
                    }`}
                  />
                );
              })}

              {/* Progress Bar Top overlay */}
              <div className="absolute top-0 left-0 right-0 z-20 h-1.5 bg-slate-900/50 backdrop-blur-sm">
                <div 
                  className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-full transition-all duration-50" 
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Top right floating Badge */}
              <div className="absolute top-6 right-6 z-20 px-4 py-1.5 bg-slate-950/80 border border-slate-800 backdrop-blur-md text-xs font-bold text-indigo-400 uppercase tracking-widest rounded-full shadow-lg font-poppins">
                {timelineChapters[activeChapter].label}
              </div>

              {/* Subtle vignette gradient overlay to ensure perfect contrast for the text box */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent z-15 pointer-events-none" />

              {/* Bottom narrative text inside frame */}
              <div className="absolute bottom-0 left-0 right-0 z-20 p-6 sm:p-10 bg-gradient-to-t from-slate-950/95 via-slate-950/80 to-transparent">
                <div className="max-w-3xl">
                  <h3 className="text-3xl sm:text-4xl font-poppins font-bold text-white mb-3 drop-shadow-md">
                    {timelineChapters[activeChapter].era}
                  </h3>
                  <p className="text-base sm:text-xl text-slate-200 leading-relaxed font-open font-semibold drop-shadow-md">
                    {timelineChapters[activeChapter].desc}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer info box inside showcase card */}
            <div className="absolute top-6 left-6 z-20 px-4 py-1.5 bg-slate-950/80 border border-slate-800 rounded-full backdrop-blur-md flex items-center shadow-lg">
              <div className="flex items-center space-x-2 text-white font-poppins text-xs font-bold">
                <span className="text-indigo-400">{activeChapter + 1}</span>
                <span className="text-slate-500">/</span>
                <span className="text-slate-400">{timelineChapters.length}</span>
              </div>
            </div>

            {/* Navigation Dots Overlay */}
            <div className="absolute bottom-8 right-8 z-20 flex space-x-2">
              {timelineChapters.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectChapter(idx)}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                    activeChapter === idx ? 'bg-indigo-500 w-8' : 'bg-white/30 hover:bg-white/60'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* ============================================
         SECTION 3: THE PROBLEM
         ============================================ */}
      <section className="py-24 px-6 bg-slate-950/50 border-y border-white/5 relative backdrop-blur-sm">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <span className="text-xs font-black uppercase tracking-widest text-rose-500">
              {currentLang === 'ta' ? 'அமைப்பின் பலவீனம்' : 'The System Leak'}
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
              {l('problem', 'title')}
            </h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              {l('problem', 'desc')}
            </p>
            <div className="h-0.5 bg-gradient-to-r from-rose-500/40 to-transparent w-40" />
          </div>

          {/* Highlight items list */}
          <div className="space-y-4">
            <div className="flex gap-4 p-5 bg-rose-950/10 border border-rose-500/10 rounded-2xl">
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center flex-shrink-0 font-bold">!</div>
              <div>
                <h4 className="font-bold text-white text-base mb-1">{l('problem', 'card1')}</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {currentLang === 'ta' ? 'வருகைப்பதிவு மற்றும் மதிப்பெண்கள் போன்ற காகித வேலைகளில் நேரத்தை வீணடிப்பது.' : 'Juggling registers, period logs, and class records manually instead of teaching.'}
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-5 bg-rose-950/10 border border-rose-500/10 rounded-2xl">
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center flex-shrink-0 font-bold">!</div>
              <div>
                <h4 className="font-bold text-white text-base mb-1">{l('problem', 'card2')}</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {currentLang === 'ta' ? 'விரிதாள்கள் மற்றும் கையேடு கணக்கீடுகளில் ஏற்படும் கணக்கீட்டு பிழைகள்.' : 'Typing and computing grades across spreadsheets prone to calculation leaks.'}
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-5 bg-rose-950/10 border border-rose-500/10 rounded-2xl">
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center flex-shrink-0 font-bold">!</div>
              <div>
                <h4 className="font-bold text-white text-base mb-1">{l('problem', 'card3')}</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {currentLang === 'ta' ? 'பெற்றோர்களுடன் உடனடித் தொடர்புகளுக்கான எளிய போர்டல் இல்லாதது.' : 'No direct notification channel to keep families in sync with daily reports.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
         SECTION 4: ARRIVAL OF EDUCORE-OMEGA
         ============================================ */}
      <section className="py-28 px-6 text-center overflow-hidden relative bg-[#050814]">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-600/10 rounded-full blur-[150px] pointer-events-none" />
        
        <div className="max-w-4xl mx-auto space-y-6 relative z-10">
          <span className="text-xs font-black uppercase tracking-widest text-indigo-400">
            {currentLang === 'ta' ? 'தீர்வு வந்துவிட்டது' : 'The Solution has Arrived'}
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-white leading-tight">
            {l('arrival', 'title')}
          </h2>
          <h3 className="text-xl sm:text-2xl font-bold text-indigo-400">
            {l('arrival', 'subtitle')}
          </h3>
          <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            {l('arrival', 'desc')}
          </p>
        </div>

        {/* Dashboard Mockup Display */}
        <div className="max-w-5xl mx-auto mt-16 p-4 sm:p-6 bg-slate-950/80 border border-indigo-500/20 rounded-3xl shadow-[0_0_50px_rgba(99,102,241,0.15)] relative backdrop-blur-md">
          {/* Top Browser controls */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-rose-500/80 shadow-lg shadow-rose-500/20" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80 shadow-lg shadow-amber-500/20" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80 shadow-lg shadow-emerald-500/20" />
            </div>
            <div className="flex items-center space-x-2 px-4 py-1.5 bg-slate-900 border border-slate-800 rounded-xl max-w-sm sm:max-w-md w-full justify-center">
              <ShieldCheck size={12} className="text-emerald-400" />
              <span className="text-[10px] sm:text-xs text-slate-400 font-mono select-none overflow-hidden text-ellipsis whitespace-nowrap">
                https://www.educore-omega.com/dashboard/demo
              </span>
            </div>
            <div className="flex items-center text-slate-500 hover:text-slate-300 cursor-pointer">
              <RefreshCw size={14} className="animate-spin-slow" />
            </div>
          </div>

          {/* Horizontal Mobile Navigation Tabs */}
          <div className="flex md:hidden items-center space-x-2 overflow-x-auto py-3 border-b border-slate-800/60 scrollbar-hide">
            {[
              { id: 'overview', label: currentLang === 'ta' ? 'கண்ணோட்டம்' : 'Overview', icon: <Activity size={14} /> },
              { id: 'students', label: currentLang === 'ta' ? 'மாணவர்கள்' : 'Students', icon: <Users size={14} /> },
              { id: 'teachers', label: currentLang === 'ta' ? 'ஆசிரியர்கள்' : 'Teachers', icon: <Users size={14} /> },
              { id: 'timetable', label: currentLang === 'ta' ? 'அட்டவணை' : 'Timetable', icon: <Calendar size={14} /> },
              { id: 'exams', label: currentLang === 'ta' ? 'தேர்வுகள்' : 'Exams', icon: <Award size={14} /> },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setPreviewTab(tab.id as any)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap border transition-all ${
                  previewTab === tab.id
                    ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300'
                    : 'bg-transparent border-transparent text-slate-400'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-12 gap-5 pt-4 md:pt-6 text-left">
            {/* Sidebar Mock (Desktop only) */}
            <div className="col-span-3 border-r border-slate-800/80 pr-4 space-y-2 hidden md:block select-none">
              {[
                { id: 'overview', label: currentLang === 'ta' ? '⚡ கண்ணோட்டம்' : '⚡ Overview', desc: currentLang === 'ta' ? 'நிர்வாக கட்டுப்பாடுகள்' : 'Admin Controls' },
                { id: 'students', label: currentLang === 'ta' ? '👥 மாணவர்கள்' : '👥 Students', desc: currentLang === 'ta' ? 'வருகை & தரவரிசை' : 'Attendance & Ranks' },
                { id: 'teachers', label: currentLang === 'ta' ? '💼 ஆசிரியர்கள்' : '💼 Teachers', desc: currentLang === 'ta' ? 'ஆசிரியர் தளம்' : 'Faculty Registry' },
                { id: 'timetable', label: currentLang === 'ta' ? '📅 அட்டவணை' : '📅 Timetable', desc: currentLang === 'ta' ? 'வகுப்பு கால அட்டவணை' : 'Period Schedules' },
                { id: 'exams', label: currentLang === 'ta' ? '📜 தேர்வுகள்' : '📜 Examinations', desc: currentLang === 'ta' ? 'தேர்வு முடிவுகள்' : 'Grades & Locking' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setPreviewTab(tab.id as any)}
                  className={`w-full text-left p-2.5 rounded-xl transition-all border ${
                    previewTab === tab.id
                      ? 'bg-indigo-600/10 border-indigo-500/30 text-white shadow-md'
                      : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                  }`}
                >
                  <p className="text-xs font-bold">{tab.label}</p>
                  <p className="text-[9px] text-slate-500 mt-0.5">{tab.desc}</p>
                </button>
              ))}
            </div>

            {/* Content Mock */}
            <div className="col-span-12 md:col-span-9 min-h-[360px] flex flex-col justify-between">
              
              {/* Tab Content 1: Overview */}
              {previewTab === 'overview' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-extrabold text-white text-base font-poppins">{currentLang === 'ta' ? 'பள்ளி செயல்பாட்டு மேலோட்டம்' : 'EDUCORE-OMEGA System Insights'}</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">{currentLang === 'ta' ? 'உண்மையான தரவு பகுப்பாய்வு மற்றும் செயல்பாட்டு கண்காணிப்பு' : 'Live Campus Operations & Performance Metrics'}</p>
                    </div>
                    <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center space-x-1 shadow-inner animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>{currentLang === 'ta' ? 'அமைப்புகள் பாதுகாப்பானது' : 'System Secure'}</span>
                    </div>
                  </div>

                  {/* Stats widgets */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-slate-900/50 p-3.5 rounded-2xl border border-slate-800/80 hover:border-indigo-500/30 transition-all hover:scale-[1.02] shadow-md group">
                      <div className="flex items-center justify-between text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                        <span>{currentLang === 'ta' ? 'வருகை' : 'Attendance'}</span>
                        <Activity size={12} className="text-emerald-500" />
                      </div>
                      <div className="text-xl sm:text-2xl font-black text-white mt-1.5">{demoAttendance}%</div>
                      <div className="text-[9px] text-emerald-500 mt-1 font-semibold flex items-center">
                        <TrendingUp size={10} className="mr-0.5" /> +1.2% {currentLang === 'ta' ? 'இவ்வாரம்' : 'this week'}
                      </div>
                    </div>
                    
                    <div className="bg-slate-900/50 p-3.5 rounded-2xl border border-slate-800/80 hover:border-indigo-500/30 transition-all hover:scale-[1.02] shadow-md group">
                      <div className="flex items-center justify-between text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                        <span>{currentLang === 'ta' ? 'வசூலான கட்டணம்' : 'Fees Collected'}</span>
                        <TrendingUp size={12} className="text-indigo-400" />
                      </div>
                      <div className="text-xl sm:text-2xl font-black text-indigo-400 mt-1.5">₹{demoFees.toLocaleString()}</div>
                      <div className="text-[9px] text-indigo-400 mt-1 font-semibold flex items-center">
                        <span className="w-1 h-1 rounded-full bg-indigo-400 mr-1 animate-pulse" /> Razorpay Active
                      </div>
                    </div>

                    <div className="bg-slate-900/50 p-3.5 rounded-2xl border border-slate-800/80 hover:border-indigo-500/30 transition-all hover:scale-[1.02] shadow-md group">
                      <div className="flex items-center justify-between text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                        <span>{currentLang === 'ta' ? 'அறிவிப்புகள்' : 'Active Alerts'}</span>
                        <AlertTriangle size={12} className="text-rose-400" />
                      </div>
                      <div className="text-xl sm:text-2xl font-black text-rose-400 mt-1.5">{demoAlerts}</div>
                      <div className="text-[9px] text-rose-500 mt-1 font-semibold">
                        3 {currentLang === 'ta' ? 'முக்கியமானவை' : 'critical actions pending'}
                      </div>
                    </div>
                  </div>

                  {/* simulated Graph */}
                  <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-800/60 space-y-3 shadow-inner">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-bold text-[10px] sm:text-xs">{currentLang === 'ta' ? 'நிகழ்நேர செயல்பாட்டு பகுப்பாய்வு' : 'Real-time School Traffic & API Load Logs'}</span>
                      <span className="text-indigo-400 font-mono text-[9px] uppercase tracking-wider">active_session_stream</span>
                    </div>
                    <div className="h-20 flex items-end justify-between pt-2 space-x-1.5 sm:space-x-2">
                      <div className="w-full bg-slate-850 rounded-t-lg h-10 border border-slate-800/40" />
                      <div className="w-full bg-slate-850 rounded-t-lg h-16 border border-slate-800/40" />
                      <div className="w-full bg-indigo-500/60 rounded-t-lg h-12 border border-indigo-500/20" />
                      <div className="w-full bg-slate-850 rounded-t-lg.h-8 border border-slate-800/40" />
                      <div className="w-full bg-slate-850 rounded-t-lg h-14 border border-slate-800/40" />
                      <div className="w-full bg-indigo-500 rounded-t-lg h-20 shadow-[0_0_15px_rgba(99,102,241,0.5)] animate-pulse" />
                      <div className="w-full bg-slate-850 rounded-t-lg h-18 border border-slate-800/40" />
                    </div>
                  </div>
                </div>
              )}

              {/* Tab Content 2: Students */}
              {previewTab === 'students' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-extrabold text-white text-base font-poppins">{currentLang === 'ta' ? 'மாணவர் பதிவேடு & வருகை' : 'Student Registry & Activity'}</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">{currentLang === 'ta' ? 'தனிப்பட்ட வருகை வீதம் மற்றும் பள்ளி தகுதி பகுப்பாய்வு' : 'Individual attendance rates and performance trackers'}</p>
                    </div>
                    <div className="text-xs text-slate-400 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-xl font-semibold">
                      Total: 2,450
                    </div>
                  </div>

                  {/* Search bar mock */}
                  <div className="relative">
                    <Search size={12} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      disabled
                      type="text"
                      placeholder={currentLang === 'ta' ? 'மாணவர் பெயரைத் தேடுக...' : 'Search student profiles (e.g. Ananya)...'}
                      className="w-full pl-9 pr-4 py-2 bg-slate-900/60 border border-slate-800/80 rounded-xl text-xs text-slate-400"
                    />
                  </div>

                  {/* Student registry list */}
                  <div className="space-y-2 max-h-[190px] overflow-y-auto pr-1">
                    {[
                      { name: 'Ananya S.', class: 'Grade 10A', rank: '#1', att: '98.2%', status: 'success', progress: 98 },
                      { name: 'Manoj K.', class: 'Grade 10B', rank: '#42', att: '74.5%', status: 'warning', progress: 74 },
                      { name: 'Devi Prasad', class: 'Grade 9A', rank: '#12', att: '91.0%', status: 'success', progress: 91 },
                      { name: 'Rahul R.', class: 'Grade 10A', rank: '#25', att: '88.5%', status: 'info', progress: 88 }
                    ].map((student, i) => (
                      <div key={i} className="flex items-center justify-between p-2.5 bg-slate-900/40 border border-slate-900 rounded-xl">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                            student.status === 'success' ? 'bg-emerald-500/10 text-emerald-400' :
                            student.status === 'warning' ? 'bg-amber-500/10 text-amber-400' : 'bg-indigo-500/10 text-indigo-400'
                          }`}>
                            {student.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white">{student.name}</p>
                            <p className="text-[9px] text-slate-500">{student.class} • Rank: {student.rank}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="w-20 hidden sm:block bg-slate-850 h-1.5 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${
                              student.status === 'success' ? 'bg-emerald-500' :
                              student.status === 'warning' ? 'bg-amber-500' : 'bg-indigo-500'
                            }`} style={{ width: `${student.progress}%` }} />
                          </div>
                          <span className={`text-xs font-extrabold ${
                            student.status === 'success' ? 'text-emerald-400' :
                            student.status === 'warning' ? 'text-amber-400' : 'text-indigo-400'
                          }`}>
                            {student.att}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab Content 3: Teachers */}
              {previewTab === 'teachers' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                    <div>
                      <h4 className="font-extrabold text-white text-base font-poppins">{currentLang === 'ta' ? 'ஆசிரியர் விவரங்கள் & தளம்' : 'Faculty Registry & Logins'}</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">{currentLang === 'ta' ? 'பாடங்களை நிர்வகித்தல் மற்றும் நிகழ்நேர ஆசிரியர் நிலைமை' : 'Lesson allocations and live classroom logs'}</p>
                    </div>
                    <span className="text-[10px] text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full font-bold whitespace-nowrap">
                      {currentLang === 'ta' ? '48 ஆசிரியர்கள்' : '48 Faculty Active'}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {[
                      { name: 'Dr. Anand Kumar', subject: 'Physics (Grade 11, 12)', exp: '15 Yrs Exp', status: 'In Lesson 11A', color: 'emerald' },
                      { name: 'Mrs. Janaki R.', subject: 'Mathematics (Grade 9, 10)', exp: '12 Yrs Exp', status: 'In Lesson 10B', color: 'emerald' },
                      { name: 'Mr. Ramesh S.', subject: 'Chemistry (Grade 10, 11)', exp: '8 Yrs Exp', status: 'Prep Period', color: 'indigo' },
                    ].map((teacher, i) => (
                      <div key={i} className="p-3 bg-slate-900/50 border border-slate-900 hover:border-slate-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                        <div>
                          <p className="text-xs font-extrabold text-white">{teacher.name}</p>
                          <p className="text-[9px] text-slate-400 mt-0.5">{teacher.subject} • <span className="text-slate-500 font-medium">{teacher.exp}</span></p>
                        </div>
                        <div className="flex items-center space-x-2 bg-slate-950/50 sm:bg-transparent px-2 py-1 sm:p-0 rounded-lg">
                          <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                            teacher.color === 'emerald' ? 'bg-emerald-400' : 'bg-indigo-400'
                          }`} />
                          <span className={`text-[10px] font-bold whitespace-nowrap ${
                            teacher.color === 'emerald' ? 'text-emerald-400' : 'text-indigo-400'
                          }`}>
                            {teacher.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab Content 4: Timetable */}
              {previewTab === 'timetable' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-extrabold text-white text-base font-poppins">{currentLang === 'ta' ? 'வகுப்பு கால அட்டவணை மேலாளர்' : 'Period Planner & Scheduling'}</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">{currentLang === 'ta' ? 'வகுப்பு 10A - இன்றைய பாட அட்டவணை' : 'Class 10-A Scheduled Timetable Matrix'}</p>
                    </div>
                    <div className="px-2.5 py-1 bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-400 rounded-lg">
                      Wednesday
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { period: 'Period 1 (08:30 - 09:15)', subject: 'Mathematics', teacher: 'Mrs. Janaki R.', room: 'Room 102', active: true },
                      { period: 'Period 2 (09:15 - 10:00)', subject: 'Physics', teacher: 'Dr. Anand Kumar', room: 'Room 204', active: false },
                      { period: 'Break (10:00 - 10:15)', subject: 'Snack Break & Recreation', teacher: 'Campus', room: 'Playground', active: false, break: true },
                      { period: 'Period 3 (10:15 - 11:00)', subject: 'English Literature', teacher: 'Mrs. Sarah J.', room: 'Room 105', active: false }
                    ].map((p, i) => (
                      <div key={i} className={`p-2.5 rounded-xl border flex items-center justify-between ${
                        p.active ? 'bg-indigo-600/10 border-indigo-500/30' : 
                        p.break ? 'bg-slate-950 border-slate-900/60 opacity-60' : 'bg-slate-900/40 border-slate-900'
                      }`}>
                        <div className="flex items-center space-x-3">
                          <span className="text-xs font-bold text-slate-500 font-mono">{p.period.split(' ')[1] || 'Break'}</span>
                          <div>
                            <p className="text-xs font-bold text-white">{p.subject}</p>
                            <p className="text-[9px] text-slate-500">{p.teacher} • <span className="font-semibold">{p.room}</span></p>
                          </div>
                        </div>
                        {p.active && (
                          <span className="text-[8px] bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider animate-pulse">
                            {currentLang === 'ta' ? 'தற்போது நடப்பது' : 'Live Now'}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab Content 5: Exams */}
              {previewTab === 'exams' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-extrabold text-white text-base font-poppins">{currentLang === 'ta' ? 'தேர்வு முடிவுகள் & இணக்கம்' : 'Grade Book & Results Governance'}</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">{currentLang === 'ta' ? 'முடிவுகளை பூட்டுதல் மற்றும் வகுப்பு செயல்திறன் பகுப்பாய்வு' : 'Locked grade sheets & compliance control'}</p>
                    </div>
                    <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-[9px] font-bold">
                      <Check size={10} />
                      <span>{currentLang === 'ta' ? 'அனைத்து மதிப்பெண்களும் தணிக்கை செய்யப்பட்டன' : 'Audited & Verified'}</span>
                    </div>
                  </div>

                  <div className="bg-slate-900/40 p-3 rounded-2xl border border-slate-900 space-y-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{currentLang === 'ta' ? 'வகுப்பு சராசரி செயல்திறன் (Grade 10)' : 'Subject Wise Averages (Grade 10)'}</p>
                    <div className="space-y-2">
                      {[
                        { subject: 'Mathematics', avg: '82%', color: 'bg-indigo-500', width: '82%' },
                        { subject: 'Physics', avg: '78%', color: 'bg-purple-500', width: '78%' },
                        { subject: 'Chemistry', avg: '85%', color: 'bg-pink-500', width: '85%' },
                        { subject: 'English', avg: '91%', color: 'bg-emerald-500', width: '91%' }
                      ].map((item, i) => (
                        <div key={i} className="space-y-1">
                          <div className="flex justify-between text-[10px] font-semibold">
                            <span className="text-slate-300">{item.subject}</span>
                            <span className="text-white">{item.avg}</span>
                          </div>
                          <div className="w-full bg-slate-850 h-1.5 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${item.color}`} style={{ width: item.width }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Simulated Action Panel */}
                  <div className="p-3 bg-slate-900/60 border border-slate-850 rounded-xl flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-bold text-white">{currentLang === 'ta' ? 'மதிப்பெண் அட்டை அச்சிடுதல்' : 'Publish Report Cards'}</p>
                      <p className="text-[8px] text-slate-500">{currentLang === 'ta' ? 'தணிக்கை பதிவில் மாற்றங்கள் பூட்டப்பட்டுள்ளன' : 'All grade inputs locked securely in audit log.'}</p>
                    </div>
                    <button
                      disabled
                      className="px-3 py-1.5 bg-indigo-600/30 border border-indigo-500/20 text-indigo-400 font-bold rounded-lg text-[10px] select-none"
                    >
                      {currentLang === 'ta' ? 'வெளியிடு' : 'Publish to Portals'}
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-4 pt-3 border-t border-slate-900 flex items-center justify-between text-[8px] sm:text-[9px] text-slate-500 font-mono">
                <div className="flex items-start sm:items-center space-x-2">
                  <div className="mt-1 sm:mt-0 flex-shrink-0">
                    <span className="block w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-1.5">
                    <span className="font-bold text-slate-400 whitespace-nowrap">DEMO_LOG:</span>
                    <span className="opacity-80">
                      {previewTab === 'overview' && '08:30 AM - Attendance computed for 24 classes (93.8% rate)'}
                      {previewTab === 'students' && '09:45 AM - Student Devi Prasad added to Grade 9A roster'}
                      {previewTab === 'teachers' && '10:30 AM - Mrs. Janaki R. allocated 10 hours for Mathematics'}
                      {previewTab === 'timetable' && '11:15 AM - Automated clash-detection checks completed'}
                      {previewTab === 'exams' && '02:15 PM - Exam Midterm-1 average calculations finalized & signed'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-1 text-slate-600 hidden sm:flex">
                  <RefreshCw size={8} className="animate-spin" />
                  <span>syncing telemetry</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ============================================
         SECTION 12: FINAL CALL TO ACTION
         ============================================ */}
      <section className="py-32 px-6 bg-gradient-to-b from-[#050814] to-[#0a0f26] border-t border-white/5 text-center relative overflow-hidden">
        {/* Evolutionary flowchart line graphic mock */}
        <div className="max-w-3xl mx-auto space-y-12 relative z-10">
          <div className="flex flex-wrap justify-center items-center gap-3 text-[10px] sm:text-xs font-mono text-slate-500 mb-4 uppercase tracking-wider">
            <span>Stone Age</span>
            <ChevronRight size={12} />
            <span>Gurukuls</span>
            <ChevronRight size={12} />
            <span>Books</span>
            <ChevronRight size={12} />
            <span>Computers</span>
            <ChevronRight size={12} />
            <span>AI</span>
            <ChevronRight size={12} />
            <span className="text-indigo-400 font-bold">EDUCORE-OMEGA</span>
          </div>

          <h2 className="text-2xl sm:text-5xl font-black text-white leading-tight">
            {l('cta', 'title')}
          </h2>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
            <button
              onClick={() => handleOpenDemoModal('demo')}
              className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-900/40 transition-all hover:scale-105"
            >
              {l('cta', 'btnDemo')}
            </button>
            <button
              onClick={() => handleOpenDemoModal('trial')}
              className="w-full sm:w-auto px-8 py-4 border border-slate-800 bg-slate-900/60 hover:bg-slate-900 text-slate-300 hover:text-white rounded-xl font-bold transition-all"
            >
              {l('cta', 'btnTrial')}
            </button>
          </div>
        </div>
      </section>

      {/* WhatsApp Demo/Trial Request Modal */}
      {showDemoModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-[#0a0f26] border border-indigo-500/30 p-6 sm:p-8 rounded-[2rem] w-full max-w-md shadow-[0_0_50px_rgba(99,102,241,0.25)] text-left relative animate-scale-in">
            {/* Close Button */}
            <button 
              onClick={() => setShowDemoModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Modal Header */}
            <div className="space-y-2 mb-6">
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black rounded-full uppercase tracking-widest">
                <Sparkles size={10} className="text-amber-400" />
                <span>{currentLang === 'ta' ? 'விளக்கக் காட்சி & சோதனை' : 'Demo & Trial Portal'}</span>
              </span>
              <h3 className="text-xl sm:text-2xl font-poppins font-black text-white">
                {demoRequestType === 'demo' 
                  ? (currentLang === 'ta' ? 'விளக்கக் காட்சிக்கு முன்பதிவு செய்' : 'Book a Private Demo') 
                  : (currentLang === 'ta' ? 'இலவச சோதனையைத் தொடங்கு' : 'Start Your Free Trial')}
              </h3>
              <p className="text-xs text-slate-400">
                {currentLang === 'ta' 
                  ? 'உங்கள் விவரங்களை உள்ளிட்டு வாட்ஸ்அப் மூலம் கோரிக்கையை அனுப்பவும்.' 
                  : 'Enter your details below to generate your personalized setup request on WhatsApp.'}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={(e) => {
              e.preventDefault();
              
              // Validate fields
              const errors = { name: '', school: '', phone: '', email: '' };
              let hasErrors = false;

              if (!formData.name.trim() || formData.name.trim().length < 2) {
                errors.name = currentLang === 'ta' ? 'முறையான பெயரை உள்ளிடவும்.' : 'Please enter a valid name (min 2 chars).';
                hasErrors = true;
              }

              if (!formData.school.trim() || formData.school.trim().length < 3) {
                errors.school = currentLang === 'ta' ? 'முறையான பள்ளி பெயரை உள்ளிடவும்.' : 'Please enter school name (min 3 chars).';
                hasErrors = true;
              }

              // Phone check: digits only, optional +, min 10 max 15 digits
              const phoneClean = formData.phone.replace(/[\s\-\(\)\+]/g, '');
              const isPhoneValid = /^[0-9]{10,15}$/.test(phoneClean);
              if (!formData.phone.trim() || !isPhoneValid) {
                errors.phone = currentLang === 'ta' ? 'முறையான மொபைல் எண்ணை உள்ளிடவும் (10-15 எண்கள்).' : 'Please enter a valid WhatsApp number (10-15 digits).';
                hasErrors = true;
              }

              // Email check: if present, must be formatted correctly
              if (formData.email.trim()) {
                const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim());
                if (!isEmailValid) {
                  errors.email = currentLang === 'ta' ? 'முறையான மின்னஞ்சல் முகவரியை உள்ளிடவும்.' : 'Please enter a valid email address.';
                  hasErrors = true;
                }
              }

              if (hasErrors) {
                setFormErrors(errors);
                return;
              }

              setFormErrors({ name: '', school: '', phone: '', email: '' });

              const messageText = `Hello EDUCORE-OMEGA Team,

I'm interested in booking a *${demoRequestType === 'demo' ? 'Free Demo' : 'Free Trial'}* for our school.

Here are my details:
• *Name:* ${formData.name.trim()}
• *School:* ${formData.school.trim()}
• *Email:* ${formData.email.trim() || 'N/A'}
• *Phone:* ${formData.phone.trim()}
• *Request Type:* ${demoRequestType === 'demo' ? 'Platform Demo Presentation' : '14-Day Sandbox Trial Setup'}

Please contact me to schedule the session.

Thank you!`;

              const waUrl = `https://wa.me/919042315859?text=${encodeURIComponent(messageText)}`;
              window.open(waUrl, '_blank');
              setShowDemoModal(false);
            }} className="space-y-4">
              
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                  {currentLang === 'ta' ? 'முழு பெயர் *' : 'Full Name *'}
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData(p => ({ ...p, name: e.target.value }));
                    if (formErrors.name) setFormErrors(p => ({ ...p, name: '' }));
                  }}
                  placeholder={currentLang === 'ta' ? 'எ.கா. ஆனந்த் குமார்' : 'e.g. Anand Kumar'}
                  className={`w-full px-4 py-3 bg-slate-900 border rounded-xl text-xs text-white focus:outline-none transition-colors ${
                    formErrors.name ? 'border-rose-500/85 focus:border-rose-500' : 'border-slate-800 focus:border-indigo-500/50'
                  }`}
                />
                {formErrors.name && (
                  <p className="text-[10px] text-rose-400 font-semibold mt-1">{formErrors.name}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                  {currentLang === 'ta' ? 'பள்ளி / நிறுவனத்தின் பெயர் *' : 'School / Institution Name *'}
                </label>
                <input
                  type="text"
                  name="school"
                  value={formData.school}
                  onChange={(e) => {
                    setFormData(p => ({ ...p, school: e.target.value }));
                    if (formErrors.school) setFormErrors(p => ({ ...p, school: '' }));
                  }}
                  placeholder={currentLang === 'ta' ? 'எ.கா. மெட்ரிக் மேல்நிலைப்பள்ளி' : 'e.g. St. Marys Academy'}
                  className={`w-full px-4 py-3 bg-slate-900 border rounded-xl text-xs text-white focus:outline-none transition-colors ${
                    formErrors.school ? 'border-rose-500/85 focus:border-rose-500' : 'border-slate-800 focus:border-indigo-500/50'
                  }`}
                />
                {formErrors.school && (
                  <p className="text-[10px] text-rose-400 font-semibold mt-1">{formErrors.school}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                  {currentLang === 'ta' ? 'வாட்ஸ்அப் எண் *' : 'WhatsApp Number *'}
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={(e) => {
                    setFormData(p => ({ ...p, phone: e.target.value }));
                    if (formErrors.phone) setFormErrors(p => ({ ...p, phone: '' }));
                  }}
                  placeholder="e.g. +91 90423 15859"
                  className={`w-full px-4 py-3 bg-slate-900 border rounded-xl text-xs text-white focus:outline-none transition-colors ${
                    formErrors.phone ? 'border-rose-500/85 focus:border-rose-500' : 'border-slate-800 focus:border-indigo-500/50'
                  }`}
                />
                {formErrors.phone && (
                  <p className="text-[10px] text-rose-400 font-semibold mt-1">{formErrors.phone}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                  {currentLang === 'ta' ? 'மின்னஞ்சல் முகவரி (விரும்பினால்)' : 'Email Address (Optional)'}
                </label>
                <input
                  type="text"
                  name="email"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData(p => ({ ...p, email: e.target.value }));
                    if (formErrors.email) setFormErrors(p => ({ ...p, email: '' }));
                  }}
                  placeholder="e.g. anand@school.edu"
                  className={`w-full px-4 py-3 bg-slate-900 border rounded-xl text-xs text-white focus:outline-none transition-colors ${
                    formErrors.email ? 'border-rose-500/85 focus:border-rose-500' : 'border-slate-800 focus:border-indigo-500/50'
                  }`}
                />
                {formErrors.email && (
                  <p className="text-[10px] text-rose-400 font-semibold mt-1">{formErrors.email}</p>
                )}
              </div>

              {/* Segmented control to switch within the modal */}
              <div className="pt-2">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider block mb-2">
                  {currentLang === 'ta' ? 'கோரிக்கை வகை' : 'Request Type'}
                </label>
                <div className="grid grid-cols-2 gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => setDemoRequestType('demo')}
                    className={`py-2 text-[10px] font-bold rounded-lg transition-all ${
                      demoRequestType === 'demo'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {currentLang === 'ta' ? 'விளக்கக்காட்சி' : 'Private Demo'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDemoRequestType('trial')}
                    className={`py-2 text-[10px] font-bold rounded-lg transition-all ${
                      demoRequestType === 'trial'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {currentLang === 'ta' ? 'இலவச சோதனை' : 'Sandbox Trial'}
                  </button>
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                className="w-full mt-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-900/50 flex items-center justify-center space-x-2.5"
              >
                <span>{currentLang === 'ta' ? 'வாட்ஸ்அப் மூலம் கோரு' : 'Send Request via WhatsApp'}</span>
                <ArrowRight size={14} />
              </button>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
