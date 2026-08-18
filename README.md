# Vriddhi — Academic Management System for Colleges

Vriddhi is a full-featured, role-based academic management platform for colleges. It brings
students, faculty, college administration, and platform operators onto a single system covering
attendance, assessments and tests, curriculum, question banks, AI-assisted paper generation,
fees, timetables, and more — powered by Firebase and modern React.

---

## Table of contents

- [Highlights](#highlights)
- [Roles](#roles)
- [Tech stack](#tech-stack)
- [Repository structure](#repository-structure)
- [Getting started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment variables](#environment-variables)
  - [Run locally](#run-locally)
- [Firebase setup](#firebase-setup)
- [Cloud Functions (backend API)](#cloud-functions-backend-api)
- [AI / LLM providers](#ai--llm-providers)
- [Available scripts](#available-scripts)
- [Deployment](#deployment)
- [Data model](#data-model)
- [Notes](#notes)

---

## Highlights

- **Role-based dashboards** for students, faculty/HOD/mentors, college admins/principals, and
  platform superadmins.
- **Attendance** marking and viewing for both faculty and students.
- **Assessments & tests** with a full test-taking flow (instructions → active test → results),
  MCQ rendering, and step-by-step solutions.
- **Question bank** with manual, bulk-imported, and **AI-generated** aptitude questions.
- **AI paper generator** producing question papers from the question bank via Gemini / OpenAI / DeepSeek.
- **Curriculum management** — standardized curriculum upload, syllabus parsing, and mapping.
- **Fees** management and a student fee portal.
- **Timetable / scheduling** for classes and tests, with rescheduling for faculty.
- **Analytics & "View 360"** student insights, plus a superadmin multi-college comparison.
- **Multi-college / multi-university** support managed at the superadmin level, including
  subscription billing and a system health monitor.

## Roles

| Role        | Area                    | Landing route            |
| ----------- | ----------------------- | ------------------------ |
| `superadmin`| Platform operations     | `/superadmin/dashboard`  |
| `admin`     | College administration  | `/admin/dashboard`       |
| `principal` | College leadership      | `/admin/dashboard`       |
| `hod`       | Head of department      | `/faculty/dashboard`     |
| `mentor`    | Faculty mentoring       | `/faculty/dashboard`     |
| `faculty`   | Teaching staff          | `/faculty/dashboard`     |
| `student`   | Student self-service    | `/student/dashboard`     |
| `parent`    | (defined, not yet a full module) | —                |

Role-based route protection is handled by `RoleRoute` / `RoleGuard` under `src/modules/auth/`,
and the root redirect maps each role to its dashboard in `src/routes/index.tsx`.

## Tech stack

**Frontend**

- [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) + [Vite 5](https://vitejs.dev/)
- [React Router 7](https://reactrouter.com/) (declarative routes via `useRoutes`)
- [Material UI v9](https://mui.com/) + [Tailwind CSS](https://tailwindcss.com/) + Emotion
- [TanStack React Query](https://tanstack.com/query) for server state
- [Recharts](https://recharts.org/) for charts, [Framer Motion](https://www.framer.com/motion/) for animation
- [KaTeX](https://katex.org/) for math rendering; `mammoth` / `xlsx` / `papaparse` for document & spreadsheet imports
- `jspdf` / `html2pdf.js` / `html2canvas` for PDF export

**Backend & platform**

- [Firebase](https://firebase.google.com/): Authentication, Firestore, Realtime Database, Cloud Storage, Hosting
- [Cloud Functions for Firebase v2](https://firebase.google.com/docs/functions) with an Express API (region `asia-south1`)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup), [Zod](https://zod.dev/) validation,
  rate limiting, and per-tier request checks
- LLM providers: [Gemini](https://ai.google.dev/), [OpenAI](https://openai.com/), and [DeepSeek](https://www.deepseek.com/)

## Repository structure

```
Vriddhi/
├── src/                        # Frontend application
│   ├── App.tsx                 # Root component + route rendering
│   ├── main.tsx                # Entry point (providers + router)
│   ├── Firebase/config.ts      # Firebase SDK initialization & service exports
│   ├── routes/                 # Route composition + role guards
│   ├── modules/
│   │   ├── auth/               # Login pages, AuthContext, guards
│   │   ├── student/            # Student dashboard, tests, fees, timetable, library…
│   │   ├── faculty/            # Attendance marking, schedule, question bank, papers…
│   │   ├── admin/              # College admin dashboard, analytics, curriculum, AI agent…
│   │   └── superadmin/         # Colleges, universities, imports, billing, health…
│   ├── shared/                 # Shared contexts, providers, types, utilities
│   ├── components/             # Cross-cutting UI components
│   ├── hooks/                  # Shared hooks
│   ├── api/ and services/      # Shared API/service helpers
│   └── Docs/                   # Internal docs (Firebase schema, agent rules)
├── functions/                  # Cloud Functions (Express backend)
│   └── src/
│       ├── index.ts            # App entry: Express app + callable exports
│       ├── routes/             # /api/ai-questions, /api/questions, /api/papers, /api/config
│       ├── middleware/         # Auth, rate limiting, tier checks
│       ├── services/           # Question generation, prompt building
│       ├── validation/         # Zod request schemas
│       └── studentAuth.ts      # Student auth sync / bulk account creation
├── firebase.json               # Firebase Hosting, Firestore, RTDB, Functions config
├── current-firestore.rules     # Firestore security rules
├── database.rules.json         # Realtime Database security rules
├── vite.config.ts              # Vite config, @/ alias, manual chunking
├── tailwind.config.js          # Tailwind configuration
└── package.json                # Frontend dependencies & scripts
```

Each module follows a consistent feature-based layout (`pages/`, `components/`, `hooks/`,
`api/` or `services/`, `types/`, `routes.tsx`), which keeps related code together.

## Getting started

### Prerequisites

- **Node.js 18+** (Node 20 is required for Cloud Functions — see `functions/package.json`)
- **npm**
- A **Firebase project** (for Auth, Firestore, Storage, Hosting, Functions)
- The **Firebase CLI** (`npm install -g firebase-tools`) for emulators and deployment

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/smanoj1813-collab/Vriddhi.git
cd Vriddhi

# 2. Install frontend dependencies
npm install

# 3. Install Cloud Functions dependencies
cd functions
npm install
cd ..
```

### Environment variables

Create a `.env` file in the repository root (see `.gitignore` — it is intentionally ignored)
with your Firebase web app configuration:

```bash
# Firebase web config (from Firebase Console → Project settings → Your apps)
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.asia-south1.firebasedatabase.app
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Backend API base URL (optional for local dev; used in production)
VITE_API_BASE_URL=http://localhost:5001/your-project/asia-south1/api
```

The frontend reads these via `import.meta.env.VITE_*` in `src/Firebase/config.ts`.

### Run locally

```bash
npm run dev
```

Vite serves the app at `http://localhost:5173`. The backend functions can be run locally with
the Firebase emulator suite (see below).

## Firebase setup

1. Enable **Authentication → Email/Password** sign-in.
2. Enable **Firestore** and **Realtime Database**.
3. Deploy the security rules:

   ```bash
   firebase deploy --only firestore:rules,database:rules
   ```

   Rules files: `current-firestore.rules` (Firestore) and `database.rules.json` (Realtime DB).

4. Run emulators locally:

   ```bash
   firebase emulators:start
   ```

   Or serve just the functions from the `functions/` directory with `npm run serve`.

## Cloud Functions (backend API)

The backend is an Express app exported as a Firebase **v2 HTTPS function** named `api`
(`functions/src/index.ts`), plus a few callable functions for student auth.

**REST endpoints** (all under the `api` function):

| Method | Path               | Purpose                                  |
| ------ | ------------------ | ---------------------------------------- |
| GET    | `/api/health`      | Health check + provider availability     |
| POST   | `/api/ai-questions`| Generate AI aptitude questions           |
| POST   | `/api/ai/*`        | AI generation aliases                    |
| *      | `/api/questions`   | Question CRUD                            |
| *      | `/api/papers`      | Paper generation                         |
| GET    | `/api/config`      | Runtime configuration                    |

**Callable functions:** `syncStudentsToAuth`, `createStudentAuth`, `bulkCreateStudentAccounts`.

The API is protected by authentication middleware, rate limiting, and tier checks, with request
bodies validated by Zod schemas in `functions/src/validation/`.

## AI / LLM providers

AI question and paper generation supports three providers, selected at runtime:

| Provider | Environment variable   |
| -------- | ---------------------- |
| Gemini   | `GEMINI_API_KEY`       |
| OpenAI   | `OPENAI_API_KEY`       |
| DeepSeek | `DEEPSEEK_API_KEY`     |

Set these in the `functions/` environment (e.g. `functions/.env` for local dev, or via
`firebase functions:config:set` / Secret Manager for production). Provider availability is
reported by `/api/health`.

## Available scripts

**Root (`package.json`)**

| Command            | Description                          |
| ------------------ | ------------------------------------ |
| `npm run dev`      | Start the Vite dev server            |
| `npm run build`    | Type-check (`tsc`) + production build|
| `npm run preview`  | Preview the production build locally |

**`functions/` (`functions/package.json`)**

| Command            | Description                              |
| ------------------ | ---------------------------------------- |
| `npm run build`    | Compile TypeScript                       |
| `npm run serve`    | Build + start functions emulator         |
| `npm run deploy`   | Deploy functions to Firebase             |
| `npm run logs`     | Stream function logs                     |

## Deployment

```bash
# 1. Build the frontend
npm run build

# 2. Deploy everything (hosting, functions, rules)
firebase deploy

# Or deploy individual pieces
firebase deploy --only hosting
firebase deploy --only functions
```

`firebase.json` is configured to host the `dist/` folder with SPA rewrites to `index.html`, and
runs `npm --prefix "$RESOURCE_DIR" run build` before deploying functions.

## Data model

- **Users** — `users/{uid}` with role, college, department, and profile fields (see
  `src/modules/auth/context/auth.ts`).
- **Colleges** — `colleges/{collegeId}` with per-college subcollections such as
  `questionBank/{questionId}` (see `src/Docs/firbase/agent/Vriddhi_Agent_Rules.md` for the
  question-bank schema and ID format).
- The Firestore schema doc lives at `src/Docs/firbase/Vriddhi_Firebase_Schema.md`.

## Notes

- The frontend uses the `@/` path alias → `src/` (configured in both `tsconfig.json` and
  `vite.config.ts`).
- `src/Docs/` contains internal agent rules and the (currently empty) Firebase schema
  placeholder — useful context when extending AI question generation.
- Several one-off migration scripts live in the repository root (`fix-*.mjs`, `debug_*.mjs`,
  etc.). They are not part of the application build; a cleanup into a `scripts/` directory is a
  good follow-up task.
```
