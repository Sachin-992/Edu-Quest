# EDUCORE-OMEGA 🎓

> Next-Generation Educational Governance Platform

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18-green.svg)](https://nodejs.org)
[![React](https://img.shields.io/badge/react-18.x-61dafb.svg)](https://reactjs.org)

## Overview

EDUCORE-OMEGA is a comprehensive school management system designed with strict governance principles:

> **IDENTITY DEFINES ACCESS. DATA IS TRACEABLE. ADMIN IS SUPREME.**

### Key Features

- 🎓 **Role-Based Portals** - Student (VIEW-ONLY), Parent, Teacher, Admin
- 🔐 **RBAC System** - Fine-grained permission control
- 📊 **Analytics Dashboard** - Performance metrics and insights
- 🔔 **Notification System** - Real-time alerts and announcements
- 📋 **Report Export** - CSV/JSON export capabilities
- 🌓 **Dark Mode** - System-aware theme toggle
- 📱 **Responsive Design** - Works on all devices
- 📝 **Audit Logging** - Complete action traceability

---

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/ADITYA-D-CODE/eduverse-os.git
cd eduverse-os

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Gemini API key

# Start development server
npm run dev
```

### Demo Credentials

| Role        | Username      | Password |
|-------------|---------------|----------|
| Student     | `student`     | `demo`   |
| Teacher     | `teacher`     | `demo`   |
| Parent      | `parent`      | `demo`   |
| Admin       | `admin`       | `demo`   |
| Professional| `professional`| `demo`   |

---

## Architecture

```
eduverse-os/
├── components/           # React components
│   ├── admin/           # Admin portal modules
│   ├── student/         # Student dashboard
│   └── teacher/         # Teacher dashboard
├── services/            # Business logic
│   ├── auditService.ts  # Audit logging
│   ├── rbacService.ts   # Role-based access
│   ├── notificationService.ts
│   └── reportService.ts
├── contexts/            # React contexts
│   └── ThemeContext.tsx # Dark mode
├── types/               # TypeScript types
└── App.tsx              # Main application
```

---

## Portals

### Student Portal (VIEW-ONLY)
- Overview with motivational quotes
- Attendance tracking
- Marks and grades view
- Homework assignments
- Downloadable resources

### Parent Portal
- Child's academic overview
- Attendance and marks
- Teacher remarks
- Fee payment status
- Announcements

### Teacher Portal
- Assignment management
- Attendance marking
- Marks entry with auto-grading
- Student remarks (Academic/Behavior/Counselling)

### Admin Portal (7 Modules)
1. **Dashboard** - System overview, quick actions
2. **School Structure** - Classes, sections, subjects
3. **Student Profiles** - Enrollment management
4. **Teacher Management** - Staff assignments
5. **Finance & Fees** - Payment tracking
6. **Analytics** - Performance reports
7. **Compliance & Audit** - System logs

---

## Security

### RBAC Permission Matrix

| Resource          | Admin | Teacher | Student | Parent |
|-------------------|-------|---------|---------|--------|
| Student Marks     | CRUD  | CRU     | R       | R      |
| Attendance        | CRUD  | CRU     | R       | R      |
| Fee Records       | CRUD  | -       | -       | R      |
| System Settings   | RU    | -       | -       | -      |
| Audit Logs        | RE    | -       | -       | -      |

### Audit Logging

All actions are logged with:
- Timestamp
- User ID and role
- Action type
- Resource affected
- IP address
- Session ID

---

## Environment Variables

```env
VITE_GEMINI_API_KEY=your_api_key_here
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
```

---

## Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run test     # Run tests
```

---

## Tech Stack

- **Frontend**: React 18, TypeScript
- **Bundler**: Vite
- **Styling**: Tailwind CSS
- **AI**: Google Gemini API
- **Backend**: Supabase (optional)
- **Icons**: Lucide React

---

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

## Contact

**Developer**: ADITYA-D-CODE  
**Repository**: https://github.com/ADITYA-D-CODE/eduverse-os

---

<p align="center">
  <strong>EDUCORE-OMEGA</strong><br>
  <em>Governance. Intelligence. Excellence.</em>
</p>
