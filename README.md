<div align="center">

<br/>

```
██╗     ███████╗ █████╗ ██████╗ ███╗   ██╗██████╗  █████╗ ████████╗██╗  ██╗     █████╗ ██╗
██║     ██╔════╝██╔══██╗██╔══██╗████╗  ██║██╔══██╗██╔══██╗╚══██╔══╝██║  ██║    ██╔══██╗██║
██║     █████╗  ███████║██████╔╝██╔██╗ ██║██████╔╝███████║   ██║   ███████║    ███████║██║
██║     ██╔══╝  ██╔══██║██╔══██╗██║╚██╗██║██╔═══╝ ██╔══██║   ██║   ██╔══██║    ██╔══██║██║
███████╗███████╗██║  ██║██║  ██║██║ ╚████║██║     ██║  ██║   ██║   ██║  ██║    ██║  ██║██║
╚══════╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝     ╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝    ╚═╝  ╚═╝╚═╝
```

# 🎓 LearnPath AI

### *AI tutoring that knows what you know, what you need to learn, and how you learn best.*

<br/>

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![SQLite](https://img.shields.io/badge/SQLite-Built--in-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![Node.js](https://img.shields.io/badge/Node.js-≥22.5-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)

<br/>

> **Assignment 4 of 15 · EdTech AI Category · Group of 5 Students · 15 + 3 Bonus Marks**

<br/>

---

</div>

## 📋 Table of Contents

- [🎯 Problem Statement](#-problem-statement)
- [🚀 What We Built](#-what-we-built)
- [✨ Core Features](#-core-features)
- [🏗️ Architecture Overview](#️-architecture-overview)
- [⚙️ Tech Stack](#️-tech-stack)
- [🗄️ Database Design](#️-database-design)
- [🤖 LLM Integration](#-llm-integration)
- [🔐 Authentication & Authorization](#-authentication--authorization)
- [🛣️ API Reference](#️-api-reference)
- [🔄 End-to-End User Journey](#-end-to-end-user-journey)
- [🧪 Testing](#-testing)
- [📁 Project Structure](#-project-structure)
- [🚦 Getting Started](#-getting-started)
- [💪 What Makes This Robust](#-what-makes-this-robust)
- [✅ Success Metrics](#-success-metrics)
- [👥 Team](#-team)

---

## 🎯 Problem Statement

> *Students move at different speeds, have different knowledge gaps, and learn through different modalities. A fixed syllabus fails most students. The system should generate and adapt the curriculum dynamically for each individual learner.*

Traditional learning platforms give every student the same content, in the same order, at the same pace. **LearnPath AI** solves this by:

- 🔍 **Diagnosing** what a learner already knows before starting
- 🧠 **Generating** a subject-specific curriculum tailored to their gaps
- 📚 **Teaching** through AI-generated lessons, examples, and analogies
- 🤖 **Guiding** with a Socratic tutor that leads toward answers — never just gives them
- 📊 **Adapting** the path after every quiz and lesson performance

---

## 🚀 What We Built

**LearnPath AI** is a full-stack adaptive learning platform built with Next.js 15, React 19, TypeScript, and SQLite. It combines **generative AI** with a **deterministic learner model** to create an experience that is both intelligent and reliable.

```
User enters any topic
       ↓
Adaptive diagnostic assessment
       ↓
Concept-level mastery map generated
       ↓
Personalised curriculum (modules → lessons → exercises)
       ↓
AI-generated interactive lessons
       ↓
Socratic tutor available for questions
       ↓
Quiz updates mastery, path adapts in real-time
       ↓
Dashboard shows progress, weak areas, and what to do next
```

---

## ✨ Core Features

### 1. 🔍 Knowledge Assessment — *Adaptive Diagnostic*

The assessment is **not a static quiz**. It adapts to the learner mid-session.

When a learner enters their subject, the app:

1. Generates or loads a **subject domain** (concepts + prerequisite graph + diagnostic questions)
2. Starts the assessment at **medium difficulty**
3. **Updates mastery** after every single answer
4. Follows **wrong answers** with easier or prerequisite questions
5. Follows **correct answers** with harder or dependent concepts
6. **Stops early** once enough evidence is collected per concept
7. Asks **extra questions** for uncertain or borderline concepts

This means two learners studying the same topic will get **completely different question sequences** based on their performance.

**Key insight:** The system uses *adaptive questioning that narrows to the boundary* of what the learner knows vs. doesn't know.

**Relevant files:**
```
src/lib/adaptive/subjectEngine.ts       → Subject domain generation
src/lib/adaptive/assessmentEngine.ts    → Adaptive question selection
src/lib/adaptive/masteryEngine.ts       → Real-time mastery updates
src/app/api/assessment/start/route.ts   → Starts the assessment session
src/app/api/assessment/answer/route.ts  → Handles each answer submission
```

---

### 2. 🌐 Dynamic Topic Generation — *Any Subject, Not Just Python*

The app is **not hardcoded for a single topic**. When a learner enters any subject — `Photosynthesis`, `Linear Algebra`, `Machine Learning`, `World War II`, `Organic Chemistry` — the system:

1. Calls the configured **LLM provider** (Groq or Azure)
2. Generates topic-specific **concepts** and **prerequisite relationships**
3. Generates a **question bank** for that domain
4. **Validates** the AI output against a JSON schema
5. Stores everything in **SQLite** for the session

If the LLM fails, returns invalid JSON, or is unavailable, the app **gracefully falls back** to a safe generic domain — without crashing and without reusing irrelevant Python questions.

```
User input: "Photosynthesis"
       ↓
LLM generates: Light reactions, Calvin cycle, Chlorophyll,
               Stomata, ATP synthesis, Electron transport chain ...
       ↓
Validated → Stored in SQLite → Assessment begins
```

---

### 3. 🧠 Mastery Model — *Evidence-Based Learning State*

Every learner has a **real-time mastery model** stored in the database.

Per concept, the system tracks:

| Field | Description |
|-------|-------------|
| `mastery_score` | How well the learner knows this concept (0.0 – 1.0) |
| `confidence` | How much evidence has been collected (prevents false certainty) |
| `updated_at` | When mastery was last revised |

**Anti-gaming cap** — One correct answer **cannot** instantly mark a concept as mastered. Multiple pieces of evidence are required before confidence rises. This prevents lucky guesses from skipping important content.

**Mastery update rules:**
- ✅ Correct answer → mastery increases, confidence grows
- ❌ Wrong answer → mastery decreases, confidence grows
- 🔁 Repeated evidence → confidence increases, mastery settles
- 🏆 High mastery + high confidence → concept can be skipped in curriculum

**Relevant file:**
```
src/lib/adaptive/masteryEngine.ts
```

---

### 4. 📐 Curriculum Generation — *Personalised Learning Path*

After the assessment, a **personalised curriculum** is built from the mastery model.

Structure:
```
Curriculum
├── Module 1: Foundations
│   ├── Lesson 1.1: Variables and Data Types
│   ├── Lesson 1.2: Operators
│   └── Exercise 1.3: Practice Quiz
├── Module 2: Control Flow
│   ├── Lesson 2.1: Conditionals
│   └── Lesson 2.2: Loops
└── ...
```

The generator considers:

| Factor | How it influences the path |
|--------|---------------------------|
| Weak concepts | Assigned lessons with deeper explanations |
| Strong concepts | Skipped or assigned challenge-level content |
| High mastery + low confidence | Challenge lesson instead of skipping |
| Low mastery + any confidence | Remedial or review lesson |
| Prerequisites | Earlier concepts always scheduled first |
| Learning style | Content framing adjusted to style |
| Daily available time | Pacing and module density adjusted |
| Self-rated level | Depth and example complexity adjusted |

Each lesson also has an **explainability note** — the curriculum tells the learner *why* this lesson was included.

**Relevant files:**
```
src/lib/adaptive/curriculumEngine.ts     → Core curriculum building logic
src/lib/adaptive/validationEngine.ts     → Validates ordering and prerequisites
src/app/api/curriculum/generate/route.ts → Curriculum generation endpoint
```

---

### 5. 🔗 Prerequisite Ordering — *Logical Sequencing*

The curriculum **respects prerequisite relationships** between concepts.

For example:
- In a programming topic: `Variables` → `Functions` → `Debugging`
- In mathematics: `Algebra` → `Functions` → `Calculus`
- In biology: `Cell Structure` → `Metabolism` → `Photosynthesis`

The validation engine checks for:
- ❌ Unknown concept references
- ❌ Duplicate active lessons
- ⚠️ Prerequisites appearing too late in the sequence
- ⚠️ Invalid ordering warnings

All validation warnings are **stored as learning events** (audit trail) — they are never silently ignored.

---

### 6. 📖 Interactive Lessons — *AI-Generated, Structured Content*

Every lesson is **generated by the LLM** and **validated** before being shown to the learner.

Each lesson contains:

| Section | Description |
|---------|-------------|
| 🎯 Learning Objective | What the learner will be able to do |
| 📝 Explanation | Clear, detailed explanation of the concept |
| 🔮 Analogy | Real-world comparison to build intuition |
| 📌 Example | Concrete worked example |
| 💻 Code / Applied Scenario | Code for programming topics; real scenarios for others |
| ⚠️ Common Mistake | What learners typically get wrong |
| ❓ Practice Question | Embedded inline practice |
| 🧩 Quiz Questions | End-of-lesson quiz for mastery update |

For **non-programming subjects**, code blocks are replaced with domain-appropriate examples and scenarios. The system does not force-inject code into lessons about history or biology.

If the AI returns invalid output, the app **falls back to a safe pre-validated lesson** without crashing.

**Relevant files:**
```
src/lib/ai/AIService.ts                     → AI generation orchestration
src/lib/ai/provider.ts                      → LLM provider abstraction
src/app/api/lessons/generate/route.ts       → Lesson generation endpoint
src/app/lesson/[lessonId]/page.tsx          → Lesson page UI
src/components/LessonExperience.tsx         → Lesson content component
```

---

### 7. 📈 Adaptive Progress — *The Path Changes With You*

After every lesson quiz:

```
Quiz submitted
     ↓
Graded (score calculated)
     ↓
Concept mastery updated in database
     ↓
Quiz attempt stored (attempt number, score, timestamp)
     ↓
Mastery evidence recorded (explainable audit trail)
     ↓
Review schedule updated (spaced repetition triggers)
     ↓
Lesson status updated: completed / mastered / needs_review
     ↓
If score < threshold → Remedial lesson inserted into curriculum
     ↓
Dashboard recommendations refreshed
```

This means the **curriculum is not static** after it is generated. It reacts to every quiz result. A struggling learner gets remedial content; an advanced learner can skip mastered content.

**Relevant files:**
```
src/app/api/quiz/submit/route.ts              → Quiz grading and mastery update
src/lib/adaptive/evidenceEngine.ts            → Mastery evidence recording
src/lib/adaptive/recommendationEngine.ts      → Next lesson recommendations
src/lib/adaptive/curriculumEngine.ts          → Remedial lesson insertion
```

---

### 8. 🤖 Socratic Tutor Chat — *Guide, Don't Give Answers*

The tutor **never directly answers** the learner's question in the first message.

Instead, it:
1. 🔍 **Analyses** the question in the context of the current lesson
2. ❓ **Asks a guiding question** to help the learner think
3. 💡 **Gives hints** if the learner is still stuck
4. 📖 **Explains more directly** only after multiple failed attempts

The tutor uses:
- Current lesson context
- The learner's concept mastery level
- Prior chat messages in the session
- Known misconceptions for the concept

The app includes **policy validation** on tutor responses — early responses are checked to ensure they do not directly reveal the answer. This is not just a prompt; it is enforced programmatically.

**Relevant files:**
```
src/lib/ai/prompts.ts           → Socratic system prompts
src/lib/ai/AIService.ts         → Tutor response generation
src/app/api/tutor/chat/route.ts → Tutor chat endpoint
src/components/TutorChat.tsx    → Chat UI component
```

---

### 9. 📊 Progress Dashboard — *Complete Learning Analytics*

The dashboard gives a **full picture** of the learner's progress across their entire session.

| Dashboard Section | What it shows |
|-------------------|---------------|
| 📈 Overall Progress | Percentage of curriculum completed |
| ✅ Completed Lessons | List with timestamps |
| 🧠 Mastery Scores | Per-concept mastery visualization |
| ⚠️ Weak Areas | Concepts needing review |
| 💪 Strong Areas | Concepts with high mastery |
| 📋 Quiz History | Attempt count, scores, timestamps |
| 🔜 Next Recommended | What to study next |
| ⏱️ Time Spent | Estimated session duration |
| 📚 Mastery Evidence | Audit trail of mastery changes |
| 🔄 Review Due | Spaced repetition review items |

**Relevant files:**
```
src/lib/adaptive/recommendationEngine.ts   → Recommendation logic
src/components/ProgressDashboard.tsx       → Dashboard UI
src/components/MasteryChart.tsx            → Mastery visualization chart
src/app/api/dashboard/[userId]/route.ts    → Dashboard data API
```

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js 15)                    │
│                                                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────────┐  │
│  │Onboarding│  │Assessment│  │ Lesson   │  │   Dashboard    │  │
│  │  Page    │  │  Flow    │  │Experience│  │  & Progress    │  │
│  └──────────┘  └──────────┘  └──────────┘  └────────────────┘  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              React Components (TypeScript)                │   │
│  │  TutorChat · MasteryChart · CurriculumMap · ProgressDash │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────────────┬──────────────────────────────────┘
                               │ Next.js API Routes
┌──────────────────────────────▼──────────────────────────────────┐
│                        BACKEND (Next.js API)                     │
│                                                                   │
│  ┌──────────────────┐   ┌──────────────────┐                    │
│  │  Adaptive Engines │   │   AI Service     │                    │
│  │                  │   │                  │                    │
│  │ subjectEngine    │   │ AIService.ts     │                    │
│  │ assessmentEngine │   │ provider.ts      │                    │
│  │ masteryEngine    │   │ prompts.ts       │                    │
│  │ curriculumEngine │   │                  │                    │
│  │ evidenceEngine   │   └────────┬─────────┘                    │
│  │ recommendEngine  │            │                               │
│  │ validationEngine │            │ fetch (OpenAI-compatible)     │
│  └──────────┬───────┘            │                               │
│             │             ┌──────▼──────────────────────┐       │
└─────────────┼─────────────┤  LLM Provider (Groq/Azure)  │───────┘
              │             └─────────────────────────────┘
┌─────────────▼──────────────────────────────────────────────────┐
│                      SQLite Database                            │
│            (.data/learnpath.sqlite — node:sqlite)               │
│                                                                  │
│  users · concepts · assessment_questions · assessment_sessions  │
│  learner_mastery · curricula · modules · lessons · quiz_attempts│
│  tutor_messages · mastery_evidence · review_schedule · events   │
└─────────────────────────────────────────────────────────────────┘
```

---

## ⚙️ Tech Stack

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| **Framework** | Next.js | 15 | Full-stack React framework with App Router |
| **UI Library** | React | 19 | Component-based frontend |
| **Language** | TypeScript | 5.7 | Type-safe development across all layers |
| **Styling** | Tailwind CSS | 3.4 | Utility-first styling |
| **Database** | SQLite (node:sqlite) | Built-in | Local persistent storage, no external DB server |
| **AI Provider** | Groq / Azure AI Foundry | — | LLM-powered generation via OpenAI-compatible API |
| **Icons** | lucide-react | 0.468 | Consistent icon system |
| **Testing** | Node test runner + tsx | Built-in | Core logic unit tests |
| **Runtime** | Node.js | ≥ 22.5 | Required for `node:sqlite` support |

> **No external SDKs are required.** All LLM calls are made via native `fetch` to OpenAI-compatible endpoints. This keeps the project lightweight and dependency-free.

---

## 🗄️ Database Design

The database file is stored at:

```
.data/learnpath.sqlite
```

All learner data, session history, generated content, and mastery state are persisted locally. The app does **not** rely on React state for anything that should survive a page refresh.

### Tables

| Table | Description |
|-------|-------------|
| `users` | Learner profile: name, email, subject, goal, level, style, daily time |
| `concepts` | Subject concepts with prerequisite relationships |
| `assessment_questions` | Diagnostic questions per concept |
| `assessment_sessions` | One assessment attempt per session |
| `assessment_answers` | Every answer submitted during assessment |
| `learner_mastery` | Mastery score + confidence per concept |
| `curricula` | Generated learning paths with versioning |
| `modules` | Curriculum modules |
| `lessons` | Generated lesson content, status, quiz questions |
| `quiz_attempts` | Lesson quiz results: attempt number, score, timestamp |
| `tutor_messages` | Full tutor chat history per lesson |
| `mastery_evidence` | Audit trail explaining every mastery change |
| `review_schedule` | Concepts due for spaced repetition review |
| `learning_events` | System-level audit log of all important events |

**Relevant files:**
```
src/lib/db/schema.ts   → Table definitions
src/lib/db/store.ts    → All database operations
src/lib/db/seed.ts     → Default Python seed data (offline fallback)
```

---

## 🤖 LLM Integration

The app uses the LLM for **three distinct tasks**:

| Task | What the LLM generates |
|------|----------------------|
| 1. Subject domain | Concept list, prerequisite graph, diagnostic questions |
| 2. Lesson content | Title, objective, explanation, analogy, example, code, mistakes, quiz |
| 3. Tutor responses | Socratic guiding questions and hints |

All LLM calls use:
- ✅ **JSON-only prompts** (strict output format)
- ✅ **Schema validation** (invalid JSON is caught and rejected)
- ✅ **Retry logic** (transient failures are retried)
- ✅ **Timeout handling** (hung requests don't block the app)
- ✅ **Deterministic fallback** (app always works, even without AI)

### Configure Azure AI Foundry

```bash
LLM_PROVIDER=azure
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_API_KEY=your_key_here
AZURE_OPENAI_DEPLOYMENT=gpt-4o-mini
```

> `AZURE_OPENAI_DEPLOYMENT` must match the deployment name created in Foundry — not the raw model SKU.

### Configure Groq

```bash
LLM_PROVIDER=groq
GROQ_API_KEY=your_key_here
GROQ_MODEL=llama-3.1-8b-instant
```

### Offline / No LLM

```bash
# Leave LLM_PROVIDER unset
# The app uses the built-in SQLite seed data for Python Fundamentals
# And safe generic fallbacks for any other topic
```

Copy `.env.example` to `.env.local` and fill in your credentials. `.env.local` is **never committed** to Git.

---

## 🔐 Authentication & Authorization

Learners create an account during onboarding with **email and password**. Passwords are hashed before storage. A **session cookie** is set after signup or login.

All user-specific APIs are **protected by authorization checks**:

- A signed-in learner can only access their **own** assessment, results, curriculum, lessons, quiz attempts, tutor chat, and dashboard.
- Cross-user data access is blocked at the API layer.

**Relevant file:**
```
src/lib/auth.ts
```

---

## 🛣️ API Reference

### Authentication

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/api/users` | Create learner profile and start session |
| `POST` | `/api/auth/login` | Sign in an existing learner |
| `POST` | `/api/auth/logout` | Clear learner session cookie |
| `GET` | `/api/auth/me` | Return currently signed-in learner |

### Assessment

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/api/assessment/start` | Start adaptive assessment for user |
| `POST` | `/api/assessment/answer` | Submit one assessment answer |
| `POST` | `/api/assessment/complete` | Mark assessment complete, compute results |

### Results & Curriculum

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/api/results/[userId]` | Return mastery results after assessment |
| `POST` | `/api/curriculum/generate` | Generate personalised curriculum |
| `GET` | `/api/curriculum/[userId]` | Fetch current curriculum |

### Lessons & Quiz

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/api/lessons/[lessonId]` | Fetch lesson details and content |
| `POST` | `/api/lessons/generate` | Regenerate lesson content |
| `POST` | `/api/quiz/submit` | Grade quiz, update mastery and path |

### Tutor & Dashboard

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/api/tutor/chat` | Send message to / receive from Socratic tutor |
| `GET` | `/api/dashboard/[userId]` | Fetch full dashboard data |
| `POST` | `/api/users/[userId]/reset` | Reset all learner data |

---

## 🔄 End-to-End User Journey

```
Step 1 — Learner Onboarding
  Enter: name · subject · learning goal · self-rated level
         preferred learning style · daily available time
         email · password
              │
              ▼
Step 2 — Subject Domain Creation
  If topic is new → LLM generates concept map + question bank
  If topic exists → Load from SQLite
              │
              ▼
Step 3 — Adaptive Assessment
  Questions adapt based on every answer
  Mastery updates in real-time
  Stops when sufficient evidence per concept
              │
              ▼
Step 4 — Results Page
  View weak areas, strong areas, concept-level mastery map
              │
              ▼
Step 5 — Curriculum Generation
  Personalised path built from mastery + prerequisites + style
  Each lesson has an explainability note
              │
              ▼
Step 6 — Lesson Study
  Open any lesson: explanation · analogy · example · practice
  Inline code (programming) or scenarios (other subjects)
              │
              ▼
Step 7 — Tutor Support (any time during lesson)
  Ask a question → Tutor guides with Socratic questions
  Tutor gives hints → Full explanation only after attempts
              │
              ▼
Step 8 — Quiz Submission
  Score computed → Mastery updated → Evidence stored
  Low score → Remedial lesson inserted into curriculum
  High score → Mastered concepts can be skipped
              │
              ▼
Step 9 — Dashboard
  View progress, mastery chart, quiz history, weak areas,
  time spent, and recommended next lesson
              │
              ▼
Step 10 — Adaptive Changes (ongoing)
  Path adjusts continuously with every quiz result
  Review schedule triggers spaced repetition
  Curriculum versioned when structure changes
```

---

## 🧪 Testing

Tests live in `tests/core.test.ts` and cover the **core adaptive logic** — not just UI behavior.

```bash
npm test
```

### Test Coverage

| Test | What it verifies |
|------|-----------------|
| ✅ Mastery score updates | Correct/wrong answers change mastery correctly |
| ✅ Mastery score clamping | Score stays within [0.0, 1.0] bounds |
| ✅ Anti-gaming cap | One correct answer cannot instantly max mastery |
| ✅ Mostly correct assessment | Not all concepts marked weak after one wrong answer |
| ✅ Weak concepts in curriculum | Low-mastery concepts always appear in path |
| ✅ Mastered concepts skipped | High-confidence mastery removes concept from curriculum |
| ✅ Prerequisite ordering | Prerequisites always appear before dependents |
| ✅ Remedial lesson insertion | Low quiz score inserts remedial content |
| ✅ Dashboard progress calculation | Completion percentages calculated correctly |
| ✅ Socratic tutor policy | Tutor does not reveal answer in first response |
| ✅ Invalid AI JSON fallback | Malformed LLM output triggers safe fallback |
| ✅ Non-Python typed subjects | Learner-entered topics get their own domain |
| ✅ LLM replaces seed data | When enabled, LLM overrides the Python seed assessment |

These tests prove that the most critical adaptive behavior is **unit-tested at the logic level** — not assumed to work just because the UI renders.

---

## 📁 Project Structure

```
Study-Path/
├── 📁 src/
│   ├── 📁 app/
│   │   ├── 📁 api/
│   │   │   ├── assessment/start, answer, complete
│   │   │   ├── auth/login, logout, me
│   │   │   ├── curriculum/generate, [userId]
│   │   │   ├── dashboard/[userId]
│   │   │   ├── lessons/generate, [lessonId]
│   │   │   ├── quiz/submit
│   │   │   ├── results/[userId]
│   │   │   ├── tutor/chat
│   │   │   └── users/ (create + reset)
│   │   ├── 📁 assessment/          → Assessment flow pages
│   │   ├── 📁 curriculum/          → Curriculum view page
│   │   ├── 📁 dashboard/           → Progress dashboard page
│   │   ├── 📁 lesson/[lessonId]/   → Lesson study page
│   │   ├── 📁 login/               → Login page
│   │   ├── 📁 onboarding/          → Learner onboarding page
│   │   ├── 📁 register/            → Registration page
│   │   ├── 📁 results/             → Assessment results page
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx                → Landing page
│   │
│   ├── 📁 components/
│   │   ├── AIGeneratingDots.tsx    → AI loading indicator
│   │   ├── AuroraBackground.tsx    → Animated background
│   │   ├── CountUp.tsx             → Animated number counter
│   │   ├── CurriculumLessonList.tsx
│   │   ├── CurriculumMap.tsx       → Visual curriculum map
│   │   ├── Dropdown.tsx
│   │   ├── GenerateCurriculumButton.tsx
│   │   ├── LessonExperience.tsx    → Full lesson UI
│   │   ├── MasteryChart.tsx        → Mastery visualization
│   │   ├── NeuralOrbs.tsx          → Animated visual element
│   │   ├── PageTransition.tsx
│   │   ├── ProgressDashboard.tsx   → Full dashboard UI
│   │   ├── ResetLearnerButton.tsx
│   │   ├── ShimmerText.tsx
│   │   ├── StatusBadge.tsx
│   │   ├── ThemeProvider.tsx
│   │   ├── ThemeToggle.tsx
│   │   ├── TutorChat.tsx           → Socratic tutor chat UI
│   │   └── TypewriterText.tsx
│   │
│   └── 📁 lib/
│       ├── 📁 adaptive/
│       │   ├── subjectEngine.ts    → Subject domain generation
│       │   ├── assessmentEngine.ts → Adaptive question selection
│       │   ├── masteryEngine.ts    → Mastery + confidence model
│       │   ├── curriculumEngine.ts → Curriculum building + remedial
│       │   ├── evidenceEngine.ts   → Mastery evidence recording
│       │   ├── recommendationEngine.ts → Next lesson recommendations
│       │   └── validationEngine.ts → Curriculum structure validation
│       ├── 📁 ai/
│       │   ├── AIService.ts        → AI generation orchestration
│       │   ├── provider.ts         → LLM provider abstraction
│       │   └── prompts.ts          → Socratic + generation prompts
│       ├── 📁 db/
│       │   ├── schema.ts           → SQLite table definitions
│       │   ├── store.ts            → All database operations
│       │   └── seed.ts             → Default Python seed data
│       ├── 📁 types/               → Shared TypeScript types
│       ├── auth.ts                 → Session + password hashing
│       └── http.ts                 → Fetch utilities
│
├── 📁 tests/
│   └── core.test.ts                → Unit tests for adaptive logic
│
├── 📁 .data/
│   └── learnpath.sqlite            → SQLite database (auto-created)
│
├── .env.example                    → Environment variable template
├── .gitignore
├── next.config.ts
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

---

## 🚦 Getting Started

### Prerequisites

- **Node.js ≥ 22.5.0** (required for built-in `node:sqlite`)
- An LLM API key (optional — the app works offline without one)

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Study-Path
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local` with your LLM credentials:

```bash
# Choose one provider — or leave both unset for offline mode
LLM_PROVIDER=groq   # or "azure"

# Groq
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.1-8b-instant

# Azure AI Foundry
# AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
# AZURE_OPENAI_API_KEY=your_azure_key_here
# AZURE_OPENAI_DEPLOYMENT=gpt-4o-mini
```

### 4. Start the Development Server

```bash
npm run dev
```

Open your browser at:

```
http://localhost:3000
```

### 5. Run Tests

```bash
npm test
```

### 6. Build for Production

```bash
npm run build
npm start
```

---

## 💪 What Makes This Robust

| Robustness Feature | Why it matters |
|--------------------|---------------|
| **SQLite persistence** | Data survives page refresh and server restart |
| **AI / logic separation** | AI generates content; deterministic engines handle decisions |
| **JSON schema validation** | Invalid AI output is caught, logged, and replaced with fallback |
| **Graceful LLM fallback** | The app never crashes if the LLM is unavailable |
| **Mastery evidence trail** | Every mastery change is explainable — not a black box |
| **Confidence tracking** | Separate from mastery — prevents false certainty |
| **Anti-gaming cap** | One correct answer cannot fake expertise |
| **Dynamic topic support** | Works for any subject, not just hardcoded Python |
| **Curriculum versioning** | Remedial insertions create a new curriculum version |
| **Prerequisite validation** | Ordering is checked and warnings are logged |
| **Socratic policy enforcement** | Tutor behavior is validated programmatically, not just prompted |
| **Authorization on all routes** | Learner data is isolated and protected |

---

## ✅ Success Metrics

The assignment defined these success criteria — all are satisfied:

| Metric | How we meet it |
|--------|---------------|
| ✅ Assessment identifies gaps and addresses them in the path | `masteryEngine` + `curriculumEngine` build path from mastery results |
| ✅ Two learners get demonstrably different curricula | Mastery-driven path generation guarantees unique sequences |
| ✅ Socratic tutor guides without directly stating the answer | Prompts + policy validation enforced in `AIService` + `TutorChat` |
| ✅ Progress updates correctly after quiz and adjusts remaining path | `quiz/submit` route triggers mastery update + remedial insertion |
| ✅ Dashboard reflects session history and mastery scores | `ProgressDashboard` reads from all persisted tables |

---

## 👥 Team

Built by a team of **5 students** as Assignment #4 of 15 in the EdTech AI category.

> **Assignment:** Personalised Learning Path Generator  
> **Marks:** 15 + 3 Bonus  
> **Category:** EdTech AI  

---

<div align="center">

<br/>

*Built with ❤️ using Next.js 15, React 19, TypeScript, SQLite, and GenAI*

<br/>

**LearnPath AI** — *Because every learner deserves a path built just for them.*

</div>
