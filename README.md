# LearnPath AI

LearnPath AI is an adaptive GenAI learning platform. A learner can enter any topic, take a diagnostic assessment, receive a personalised curriculum, study AI-generated lessons, ask a Socratic tutor questions, and track mastery on a dashboard.

The main idea is simple: the app does not give every learner the same fixed course. It first estimates what the learner already knows, then builds a learning path around weak areas, prerequisites, confidence, quiz results, and progress history.

## Project Objective

The goal of this project is to demonstrate a real-world AI tutoring workflow:

1. Diagnose a learner's current knowledge.
2. Identify strong and weak concepts inside a subject.
3. Generate a structured curriculum from the diagnosis.
4. Teach through personalised lessons with examples and practice.
5. Update mastery after every assessment and quiz.
6. Use a Socratic tutor that guides instead of directly giving answers.
7. Show progress, weak areas, quiz history, and next recommendations.

This makes the project more than a chatbot. It combines GenAI with a rule-based learner model, persistence, validation, and adaptive decision-making.

## Tech Stack

- **Frontend:** Next.js 15, React 19, TypeScript
- **Styling:** Tailwind CSS
- **AI provider:** Groq or Azure AI Foundry through `fetch`
- **Database:** SQLite using Node's built-in `node:sqlite`
- **Testing:** Node test runner through `tsx`
- **Icons/UI:** `lucide-react`

No SDK is required. The project calls OpenAI-compatible chat completions endpoints directly.

## Core Features

### 1. Knowledge Assessment

The learner starts by entering:

- name
- target subject
- learning goal
- self-rated level
- preferred learning style
- daily available time

After onboarding, the app creates or loads a subject domain. A subject domain means:

- concepts for the topic
- prerequisite relationships
- diagnostic questions for each concept

For example, if the learner enters `Photosynthesis`, the app can generate concepts such as foundations, terminology, process steps, examples, and common mistakes. If the learner enters `Linear Algebra`, the generated domain will be different.

The assessment is adaptive because it does not only ask a fixed list blindly. It:

- starts around medium difficulty
- updates mastery after every answer
- follows wrong answers with easier or prerequisite questions
- tries to cover the concept graph
- asks extra questions for uncertain concepts
- stops after a compact diagnostic limit

Important files:

- `src/lib/adaptive/subjectEngine.ts`
- `src/lib/adaptive/assessmentEngine.ts`
- `src/lib/adaptive/masteryEngine.ts`
- `src/app/api/assessment/start/route.ts`
- `src/app/api/assessment/answer/route.ts`

### 2. Dynamic Topic Generation

The app is not hardcoded only for Python.

Python Programming Fundamentals is only the default offline seed subject. When `LLM_PROVIDER` is set to `azure` or `groq` with valid credentials, the configured provider is used first to generate topic-specific concepts and questions. This includes the default Python topic too.

If the LLM fails, returns invalid JSON, or is unavailable, the app uses a safe generic fallback for learner-entered topics. That fallback still uses the learner's topic and does not reuse Python questions.

The subject generation flow is:

1. User enters a subject.
2. `ensureSubjectDomain()` checks whether concepts/questions already exist.
3. If not, the LLM generates a concept map and question bank.
4. The app validates the generated JSON.
5. Valid concepts and questions are stored in SQLite.
6. Assessment starts from that generated domain.

This makes the system robust: it works with AI, but it does not crash if AI output is invalid.

### 3. Mastery Model

The app maintains a learner model for every concept.

Each concept has:

- **mastery score:** how well the learner knows it
- **confidence:** how much evidence the app has
- **updated timestamp**

Assessment answers and lesson quiz attempts both update mastery.

For example:

- correct assessment answers increase mastery
- wrong answers decrease mastery
- repeated evidence increases confidence
- one lucky answer cannot immediately mark a concept as mastered
- quiz failure can trigger remedial lessons

The project also includes an anti-gaming cap. This prevents a learner from getting one answer correct and instantly being treated as an expert.

Important file:

- `src/lib/adaptive/masteryEngine.ts`

### 4. Curriculum Generation

After assessment, the app generates a personalised curriculum.

The curriculum is structured as:

- curriculum
- modules
- lessons
- exercises/quizzes

The curriculum generator considers:

- weak concepts
- strong concepts
- confidence level
- prerequisites
- self-rated level
- preferred style
- daily available time

If a concept is already mastered with high confidence, the app can skip it. If mastery is high but confidence is low, it can assign a challenge lesson instead of skipping. If mastery is weak, it adds review or remedial practice.

The app also explains why each lesson appears. This is important for viva because it shows explainability, not just generation.

Important files:

- `src/lib/adaptive/curriculumEngine.ts`
- `src/lib/adaptive/validationEngine.ts`
- `src/app/api/curriculum/generate/route.ts`

### 5. Prerequisite Ordering

The curriculum is not random. It tries to respect prerequisite order.

For example, in a programming topic, the learner should understand variables before functions or debugging. In a generated subject, the LLM can provide prerequisite IDs, and the app validates them.

The curriculum validation checks for:

- unknown concepts
- duplicate active lessons
- prerequisites appearing too late
- invalid ordering warnings

If validation finds a warning, the app records it as a learning event instead of silently hiding it.

### 6. Interactive Lessons

Lessons are generated for the learner's selected subject and concept.

Each lesson contains:

- title
- learning objective
- explanation
- analogy
- example
- code example or applied scenario
- common mistake
- practice question
- quiz questions

For programming subjects, the AI can include safe code examples. For non-programming subjects, the lesson uses examples or scenarios instead of forcing code.

The app validates AI lesson output before saving it. If the output is invalid, it uses a safe fallback lesson.

Important files:

- `src/lib/ai/AIService.ts`
- `src/lib/ai/provider.ts`
- `src/app/api/lessons/generate/route.ts`
- `src/app/lesson/[lessonId]/page.tsx`

### 7. Adaptive Progress

After every lesson quiz:

1. The quiz is graded.
2. The learner's concept mastery is updated.
3. A quiz attempt is stored.
4. Mastery evidence is recorded.
5. Review schedule is updated.
6. Lesson status changes to completed, mastered, or needs review.
7. If score is low, a remedial lesson can be inserted.
8. Dashboard recommendations update.

This means the path is not static after generation. It reacts to the learner's performance.

Important files:

- `src/app/api/quiz/submit/route.ts`
- `src/lib/adaptive/evidenceEngine.ts`
- `src/lib/adaptive/recommendationEngine.ts`
- `src/lib/adaptive/curriculumEngine.ts`

### 8. Socratic Tutor Chat

The tutor chat is designed to guide the learner instead of directly giving final answers.

The tutor:

- uses current lesson context
- uses concept mastery
- uses prior chat messages
- uses known misconceptions if available
- asks guiding questions first
- gives hints when the learner is stuck
- explains more directly only after attempts

This is important because the PRD asks for Socratic tutoring, not just answer generation.

The app validates tutor behavior with policy checks. For example, early tutor responses should not directly reveal the final answer.

Important files:

- `src/lib/ai/prompts.ts`
- `src/lib/ai/AIService.ts`
- `src/app/api/tutor/chat/route.ts`
- `src/components/TutorChat.tsx`

### 9. Progress Dashboard

The dashboard shows the learner's current state.

It includes:

- overall progress
- completed lessons
- mastery scores
- weak areas
- strong areas
- quiz history
- recommended next lesson
- time spent estimate
- mastery evidence history
- review due items

This helps demonstrate that the app stores session history and updates learner state over time.

Important files:

- `src/lib/adaptive/recommendationEngine.ts`
- `src/components/ProgressDashboard.tsx`
- `src/components/MasteryChart.tsx`
- `src/app/api/dashboard/[userId]/route.ts`

## Database Design

The project uses SQLite at:

```text
.data/learnpath.sqlite
```

The database stores real learner/session data locally.

Main tables:

- `users`: learner profile and preferences
- `concepts`: subject concepts
- `assessment_questions`: diagnostic questions
- `assessment_sessions`: one assessment attempt
- `assessment_answers`: answers submitted during assessment
- `learner_mastery`: mastery and confidence per concept
- `curricula`: generated paths and versions
- `modules`: curriculum modules
- `lessons`: generated lesson content and status
- `quiz_attempts`: lesson quiz results
- `tutor_messages`: tutor chat history
- `mastery_evidence`: evidence explaining mastery changes
- `review_schedule`: weak/review concepts
- `learning_events`: audit trail of important events

This is useful in viva because you can say the project is not only storing data in React state. It persists learner details, history, progress, and generated learning paths in a database.

Important files:

- `src/lib/db/store.ts`
- `src/lib/db/schema.ts`
- `src/lib/db/seed.ts`

## End-to-End Workflow

This is the best way to explain the project during viva:

1. **Learner onboarding**
   The user enters their subject, goal, level, style, and daily time.

2. **Subject domain creation**
   The app generates or loads concepts and assessment questions for that subject.

3. **Adaptive assessment**
   The learner answers diagnostic questions. Each answer updates mastery and confidence.

4. **Results page**
   The app shows weak areas, strong areas, and concept-level mastery.

5. **Curriculum generation**
   A personalised path is created using weak areas and prerequisite ordering.

6. **Lesson study**
   The learner opens lessons with explanations, analogies, examples, practice, and quiz questions.

7. **Tutor support**
   The learner can ask the Socratic tutor for help. The tutor guides through questions and hints.

8. **Quiz submission**
   Quiz score updates mastery, lesson status, review schedule, and recommendations.

9. **Dashboard**
   The dashboard reflects completed modules, mastery scores, time spent, quiz history, and next steps.

10. **Adaptive changes**
   If the learner struggles, remedial lessons are inserted. If the learner performs well, mastered areas can be skipped.

## API Routes

Key backend routes:

- `POST /api/users`: creates learner profile
- `POST /api/assessment/start`: starts assessment
- `POST /api/assessment/answer`: submits one assessment answer
- `POST /api/assessment/complete`: completes assessment
- `GET /api/results/[userId]`: returns mastery results
- `POST /api/curriculum/generate`: generates curriculum
- `GET /api/curriculum/[userId]`: fetches current curriculum
- `GET /api/lessons/[lessonId]`: fetches lesson details
- `POST /api/lessons/generate`: regenerates lesson content
- `POST /api/quiz/submit`: grades quiz and updates progress
- `POST /api/tutor/chat`: sends/receives tutor messages
- `GET /api/dashboard/[userId]`: fetches dashboard data
- `POST /api/auth/login`: signs in an existing learner
- `POST /api/auth/logout`: clears the learner session
- `GET /api/auth/me`: returns the signed-in learner
- `POST /api/users/[userId]/reset`: resets learner data

## LLM Integration

The app uses an LLM provider for three main tasks:

1. Generating subject concepts and assessment questions.
2. Generating lesson content.
3. Generating Socratic tutor responses.

Set `LLM_PROVIDER` to `azure`, `groq`, or leave it unset for offline fallback.

### Azure AI Foundry

```bash
LLM_PROVIDER=azure
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_API_KEY=your_key_here
AZURE_OPENAI_DEPLOYMENT=gpt-4o-mini
```

`AZURE_OPENAI_DEPLOYMENT` must match the deployment name you created in Foundry (not the raw model SKU).

### Groq

```bash
LLM_PROVIDER=groq
GROQ_API_KEY=your_key_here
GROQ_MODEL=llama-3.1-8b-instant
```

Copy `.env.example` to `.env.local` and fill in your credentials. `.env.local` is ignored by Git.

The app uses:

- JSON-only prompts
- schema validation
- retry logic
- timeout handling
- deterministic fallback content

This prevents the project from breaking if AI output is malformed.

## Authentication and Authorization

Learners create an account during onboarding with email and password. Passwords are hashed before storage, and a session cookie is set after signup or login.

Authorization checks protect user-specific APIs and pages. A signed-in learner can only access their own assessment sessions, results, curriculum, lessons, quiz attempts, tutor chat, and dashboard.

## How to Run

Install dependencies:

```bash
npm install
```

Start development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

Run tests:

```bash
npm test
```

Build for production:

```bash
npm run build
```

Start production server:

```bash
npm start
```

## Testing

The project includes tests for:

- mastery score updates
- mastery score clamping
- anti-gaming cap
- mostly correct assessment not marking every concept weak
- weak concepts appearing in curriculum
- mastered concepts being skipped
- prerequisite ordering
- remedial lesson insertion
- dashboard progress calculation
- Socratic tutor not revealing answer too early
- invalid AI JSON fallback
- non-Python typed subjects getting their own domain
- LLM provider replacing seeded Python assessment when enabled

This helps prove that the most important adaptive behavior is not just UI-level behavior. It is tested in the core logic.

## What Makes This Project Robust

- Uses SQLite persistence instead of temporary client state.
- Separates AI generation from deterministic learning logic.
- Validates AI-generated JSON before using it.
- Has fallback behavior if the LLM fails.
- Stores mastery evidence so updates are explainable.
- Tracks confidence separately from mastery.
- Prevents one answer from creating fake mastery.
- Supports dynamic learner-selected topics.
- Uses curriculum versioning when remedial lessons are inserted.
- Includes dashboard analytics and history.

## Final Summary

LearnPath AI fulfills the required GenAI education workflow:

- adaptive assessment
- dynamic topic support
- personalised curriculum generation
- structured modules and lessons
- AI-generated lesson content
- quiz-based mastery updates
- Socratic tutoring
- progress dashboard
- SQLite persistence
- robust fallback and validation logic

The project is designed to show both AI capability and engineering reliability.
