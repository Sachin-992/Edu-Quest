# EduSpark Quest

Gamified learning platform for Classes 1–8. Master Math, Science, English, and தமிழ் through quizzes, games, XP, badges, and leaderboards.

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **Backend**: Supabase (Auth, Database, Edge Functions)
- **Animation**: Framer Motion

## Getting Started

```bash
# Install dependencies
npm install

# Create .env file with your Supabase credentials
VITE_SUPABASE_URL="your-supabase-url"
VITE_SUPABASE_PUBLISHABLE_KEY="your-anon-key"
VITE_SUPABASE_PROJECT_ID="your-project-id"

# Start development server
npm run dev

# Build for production
npm run build
```

## Project Structure

```
src/
├── components/     # Reusable UI components (shadcn/ui)
├── contexts/       # React context providers (Auth)
├── hooks/          # Custom React hooks
├── integrations/   # Supabase client & types
├── lib/            # Utility functions
├── pages/          # Route pages
├── test/           # Test files
└── types/          # TypeScript type definitions
```
