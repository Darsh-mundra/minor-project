# Study Buddy — College Student Collaboration & Learning Platform

A centralized, full-stack, AI-powered platform tailored for college students that combines academic resource management with exact duplicate detection, collaborative study sprint workspaces, AI-generated quizzes & active recall flashcards, doubt discussions with accepted solutions, project teammate discovery, skill endorsement portfolios, and opportunities tracking.

---

## 1. Project Overview & Architecture

Study Buddy addresses the fragmentation in university student collaboration. Instead of scattering class notes across WhatsApp groups, Google Drive links, and discord servers, students have a unified academic command center.

### High-Level Architecture Flow

```
+-------------------------------------------------------------+
|                      React Frontend                         |
|  (Plus Jakarta Sans, Tailwind CSS, Lucide Icons, Context)   |
+------------------------------+------------------------------+
                               | REST APIs (JSON + JWT)
                               v
+-------------------------------------------------------------+
|               Backend Application Layer                     |
|  - In AI Studio Dev: Full-Featured Express + Vite Engine    |
|  - Production: Java 17 + Spring Boot 3 + Spring Security    |
+--------------+------------------------------+---------------+
               |                              |
               v                              v
+-----------------------------+  +----------------------------+
|        MySQL Database       |  |      AI service            |
|   (28 Normalized Tables)    |  |  (Text generation)        |
| - ACID Transactions         |  | - MCQ Quiz Generator       |
| - Duplicate Detection       |  | - Study Flashcards         |
| - Role-Based Authorization  |  | - Context-Aware Tutor      |
+-----------------------------+  +----------------------------+
```

---

## 2. Complete Module Feature Set

1. **Student Authentication & RBAC**:
   - Email + password sign-in. **Register here** lets you register as a **Student** (name, email, password) or as an **Admin** (same fields plus two verification codes: one emailed to you, one emailed to the developer).
   - JWT access tokens with rotating refresh tokens.
   - Multi-role support (`ROLE_STUDENT`, `ROLE_ADMIN`).
   - Profile management.

2. **Module 1 — Academic Resource Hub**:
   - Upload & download notes, PDFs, PYQs, assignments, lab manuals, question banks, and presentations.
   - Keyword search plus a **Filters** section: choose a branch (CSE, CSIT, IT, EC, Cyber Security, AI & ML), then a semester, and every subject of that semester is listed with its notes and resources. The subject list lives in `src/data/curriculum.ts` and is easy to edit.
   - 5-star rating system, bookmarking, and "Helpful" upvoting.
   - Moderation reporting pipeline.

3. **Module 2 — Exact Duplicate Detection**:
   - On document upload, the backend computes a cryptographic fingerprint of the file content.
   - Compares the fingerprint against existing resources.
   - If an exact match is detected, the system immediately rejects the upload and informs the user with a conflict modal showing the existing document, uploader, and date.

4. **Module 3 — Resource Requests**:
   - Students post requests for specific syllabus chapters or exam papers (e.g., "Need DBMS Unit 4 notes").
   - Classmates can fulfill requests by linking or uploading the matching material (+30 contribution points).

5. **Module 4 — Contribution System & Leaderboards**:
   - Earn points for verified uploads (+25), fulfilling requests (+30), helpful upvotes (+10), and answering doubts (+15).
   - Earn badges: `First Contributor`, `Resource Master`, `Helpful Student`, `Top Contributor`.
   - Dynamic leaderboards with Weekly, Monthly, and Semester timeframes.

6. **Module 5 — Collaborative Study Workspaces (10 Sections)**:
   - Temporary collaborative exam sprint rooms with 6-character alphanumeric join codes.
   - **Section 1: Overview** — Target exam countdown, syllabus scope, and join code sharing.
   - **Section 2: Resources** — Course materials pinned to the workspace subject.
   - **Section 3: Quiz Sprint** — Practice MCQ tests for the group.
   - **Section 4: Flashcards** — Active recall revision deck.
   - **Section 5: Mind Map** — Hierarchical concept tree with parent-child nodes and notes.
   - **Section 6: Discussion** — Real-time peer message stream.
   - **Section 7: Tasks** — Collaborative exam checklist with due dates and assignee tracking.
   - **Section 8: Members** — Team roster and contribution points.
   - **Section 9: Progress** — Exam readiness meter and milestone completion percentages.
   - **Section 10: AI Assistant** — AI tutor with context from the workspace's subject and scope.
   - **Workspace Expiration**: When the expiry date passes, the workspace enters a read-only archived state.

7. **Module 6 — AI Quiz Generator**:
   - Generates MCQs with options, correct answer indexes, and detailed explanations using the AI service.
   - Timed testing arena with instant scoring and previous attempt tracking.

8. **Module 7 — AI Flashcard Generator**:
   - Generates active recall flashcards from course subjects and topics.
   - Interactive 3D flip card animation, progress tracking, and "I Know This" / "Needs Practice" mastery filters.

9. **Module 8 — AI Study Assistant**:
   - Dedicated chat interface for step-by-step mathematical proofs, code explanations, syllabus summaries, and 5-day personalized exam revision plans.
   - Zero frontend exposure of the AI API key.

10. **Module 9 — Doubt Discussion Forum**:
    - Threaded academic Q&A.
    - Question -> Answers -> Peer Upvotes -> Accepted Answer.
    - Question authors can accept solutions (+25 points awarded to the responder).

11. **Module 10 — Project Collaboration**:
    - Discover academic capstones, hackathon teams, and open source initiatives.
    - Project fields: Name, description, required skills, project type, GitHub URL, and member roster.
    - Join request approval workflow and built-in Kanban sprint task board (TODO, IN_PROGRESS, DONE).

12. **Module 11 — Student Skill Profile**:
    - Skill matrix with peer endorsements (Java, Python, C++, React, SQL, DSA, Docker, etc.).
    - Portfolio project showcases, certifications, badges, and quiz performance metrics.

13. **Module 12 — Opportunities Hub**:
    - Search and filter internships, hackathons, coding competitions, workshops, and scholarships.
    - Personal status tracking (`Interested`, `Applied`, `Shortlisted`, `Selected`, `Rejected`).

14. **Module 13 — Notifications**:
    - Notification triggers for join requests, fulfilled requests, discussion replies, and quiz completions.
    - Unread count badges and "Mark all as read" capability.

15. **Module 14 — University Admin Dashboard**:
    - Platform analytics: Total students, resources, workspaces, quizzes, and projects.
    - User account management (enable/disable students).
    - Content moderation: Review and permanently delete reported resources and discussions.

---

## 3. Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons, Motion.
- **Backend (AI Studio Dev)**: Node.js, Express, TypeScript, Vite Middlewares.
- **Backend (Production Reference)**: Java 17, Spring Boot 3.2, Spring Security, Spring Data JPA, Hibernate, JJWT.
- **Database**: MySQL 8.0 with InnoDB (28 normalized tables).
- **AI Engine**: server-side AI text generation (`@google/genai` SDK on the Node server, `AiGeminiService` in the Spring Boot reference backend).
- **File Storage**: Cloudinary / Cloud Object Storage metadata with content-fingerprint integrity checks.

---

## 4. Signing In

There are no built-in accounts. The first page is **Sign In** (email + password). Click **Register here** to create an account:

- **Student** — full name, email address and password (min. 8 characters).
- **Admin** — the same three fields, then **two verification codes**: one emailed to the address you entered and one emailed to `DEVELOPER_EMAIL`. The admin asks the developer for the second code.

Admin powers: view platform stats and recent activity, disable/enable student accounts (admins can't be disabled), delete any resource or discussion post, post opportunities, and see every workspace and project.

Set these in `.env` (see `.env.example`):

| Variable | Purpose |
| :--- | :--- |
| `DEVELOPER_EMAIL` | **Required for admin registration.** Receives the second approval code. Admin registration is refused if unset. |
| `ADMIN_EMAILS` | Optional comma-separated allow-list of emails that may register as admin. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` | Real email delivery (run `npm i nodemailer`). Without SMTP in development, codes are printed in the server console and your own code is also shown on the page. The developer code is never sent to the browser. In production (`NODE_ENV=production`) SMTP is required. |

--- | :--- |
| `ADMIN_EMAILS` | Comma-separated emails that become administrators when they register. Leave empty for student-only sign-up. |

--- | :--- |
| `DEVELOPER_EMAIL` | **Required for admin sign-in.** Receives the second approval code. Admin sign-in is refused if unset. |
| `ADMIN_EMAILS` | Optional comma-separated allow-list of emails that may request admin access. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` | Real email delivery (run `npm i nodemailer`). Without SMTP in development, codes are printed in the server console; your own code is also shown on the sign-in page. The developer code is only ever printed in the console, never sent to the browser. In production (`NODE_ENV=production`) SMTP is required for anyone to receive codes. |

---

## 5. Setup & Running Instructions

### Running in Current Environment (Port 3000)

The application is fully runnable directly in the current workspace on port 3000:

```bash
# 1. Install dependencies
npm install

# 2. Start full-stack dev server
npm run dev
```

### Running with Spring Boot & MySQL

To run the decoupled Java Spring Boot backend locally:

#### Step 1: Database Setup
Create the MySQL database:
```sql
CREATE DATABASE studybuddy_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

#### Step 2: Configure Environment Variables
Copy `.env.example` to `.env` or set the environment variables:
```bash
export DATABASE_URL="jdbc:mysql://localhost:3306/studybuddy_db?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true"
export DATABASE_USERNAME="root"
export DATABASE_PASSWORD="your_mysql_password"
export JWT_SECRET="your_secure_32_character_jwt_secret"
export GEMINI_API_KEY="your_ai_api_key"
```

#### Step 3: Run Spring Boot Backend
```bash
cd backend-spring
mvn clean spring-boot:run
```
The Spring Boot server will initialize `schema.sql` and `data.sql` and listen on port `8080`.

#### Step 4: Run Spring Boot Tests
```bash
cd backend-spring
mvn test
```

---

## 6. Environment Variables Reference

| Variable | Description |
| :--- | :--- |
| `GEMINI_API_KEY` | AI service API key (kept strictly server-side). |
| `JWT_SECRET` | Secret key for signing and verifying JSON Web Tokens. |
| `DATABASE_URL` | JDBC URL for MySQL database connection. |
| `DATABASE_USERNAME`| Username for MySQL database access. |
| `DATABASE_PASSWORD`| Password for MySQL database access. |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud identifier for file uploads. |
| `CLOUDINARY_API_KEY` | Cloudinary access key. |
| `CLOUDINARY_API_SECRET` | Cloudinary access secret. |

---

## 7. Known Limitations & Future Enhancements

- **Real-time WebSockets**: In production, workspace chats and collaborative mind maps can be enhanced with STOMP/WebSocket brokers for multi-cursor synchronization.
- **Semantic Vector Search**: Future versions can combine exact duplicate detection with embedding-based similarity to detect similar or plagiarized submissions.
