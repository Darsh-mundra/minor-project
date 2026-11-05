-- ========================================================
-- STUDY BUDDY - SEED DEMO DATA FOR SPRING BOOT & MYSQL
-- ========================================================

-- Roles
INSERT IGNORE INTO roles (id, name) VALUES (1, 'ROLE_STUDENT'), (2, 'ROLE_ADMIN');

-- Passwords: BCrypt encoded 'student123' and 'admin123'
-- '$2a$10$7EqJtq98hPqEX7fNZaFWoO.8fG8s9DqvC/hF9i7gEa6eJp8uD.e.q' (BCrypt placeholder)
INSERT IGNORE INTO users (id, full_name, email, password_hash, college, branch, semester, points, is_disabled) VALUES
(1, 'Sarah Chen', 'sarah.chen@university.edu', '$2a$10$Dow1LhPq79Xo0OQdZ8mDFeV0ZpA077N9n7F1sR6V9v4O7V9x5J8O2', 'Massachusetts Institute of Technology', 'Computer Science & Engineering', 6, 480, FALSE),
(2, 'Rahul Sharma', 'rahul.sharma@university.edu', '$2a$10$Dow1LhPq79Xo0OQdZ8mDFeV0ZpA077N9n7F1sR6V9v4O7V9x5J8O2', 'Indian Institute of Technology', 'Computer Science & Engineering', 6, 310, FALSE),
(3, 'Prof. David Vance (Dean)', 'admin@studybuddy.edu', '$2a$10$Dow1LhPq79Xo0OQdZ8mDFeV0ZpA077N9n7F1sR6V9v4O7V9x5J8O2', 'University Academic Senate', 'Information Technology', 8, 1200, FALSE);

INSERT IGNORE INTO user_roles (user_id, role_id) VALUES (1, 1), (2, 1), (3, 2);

-- Badges
INSERT IGNORE INTO badges (id, name, description, icon_name) VALUES
(1, 'First Contributor', 'Uploaded first academic resource or answered a question', 'Award'),
(2, 'Resource Master', 'Achieved over 200 contribution points in academic uploads', 'Trophy'),
(3, 'Helpful Student', 'Received 10+ helpful peer upvotes on notes and answers', 'ThumbsUp'),
(4, 'Top Contributor', 'Ranked in the top 5 percentile on the university leaderboard', 'Star');

INSERT IGNORE INTO user_badges (user_id, badge_id) VALUES
(1, 1), (1, 2), (1, 3), (1, 4),
(2, 1), (2, 3),
(3, 2), (3, 4);

-- Academic Resources (with deterministic SHA-256 hashes)
INSERT IGNORE INTO resources (id, title, description, branch, semester, subject, unit, topic, resourceType, file_url, file_name, file_size, file_hash_sha256, uploader_id, rating, rating_count, download_count, helpful_votes) VALUES
(1, 'DBMS Unit 4: ACID Properties & Concurrency Control Protocols', 'Complete handwritten and typed notes covering Strict 2PL, Timestamp Ordering, and Serializability graphs.', 'Computer Science & Engineering', 6, 'Database Management Systems', 'Unit 4', 'Concurrency Control & Transactions', 'Notes', 'https://example.com/dbms_unit4.pdf', 'DBMS_Unit4_Concurrency_Complete.pdf', '4.8 MB', '7d55f9a1f2e8c4a6b3d1e0f9a8c7b6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9', 1, 4.9, 38, 214, 74),
(2, 'Operating Systems Virtual Memory & Page Replacement Lab Manual', 'C/C++ simulations of FIFO, LRU, and Optimal Page Replacement with frame fault metrics.', 'Computer Science & Engineering', 5, 'Operating Systems', 'Unit 3', 'Virtual Memory & Paging', 'Lab Manual', 'https://example.com/os_lab.pdf', 'OS_Lab_Page_Replacement.pdf', '3.2 MB', '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b', 2, 4.7, 19, 142, 41),
(3, 'Design & Analysis of Algorithms: Minimum Spanning Trees & Dijkstra', 'Proofs, asymptotic bounds, and trace tables for Prim, Kruskal, and Dijkstra algorithms.', 'Computer Science & Engineering', 4, 'Algorithms', 'Unit 3', 'Greedy Algorithms & Graphs', 'Notes', 'https://example.com/daa_mst.pdf', 'DAA_Graph_Algorithms_Reference.pdf', '5.1 MB', '9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e', 1, 5.0, 52, 380, 98);

-- Workspaces
INSERT IGNORE INTO workspaces (id, name, description, subject, exam_date, creator_id, max_members, start_date, expiry_date, join_code, cover_image) VALUES
(1, 'DBMS Mid-Sem Sprint 2026', 'Sprint study group covering relational algebra, B+ Trees, and transaction locking.', 'Database Management Systems', '2026-10-18', 1, 10, '2026-10-01', '2026-10-25', 'DBMS26', '/src/assets/images/cover_study_workspace_1791044529322.jpg'),
(2, 'Distributed Systems & Cloud Computing Prep', 'Consensus protocols (Raft, Paxos), CAP theorem, and distributed hashing.', 'Distributed Systems', '2026-11-05', 2, 8, '2026-10-01', '2026-11-15', 'DIST26', '/src/assets/images/campus_collaboration_1791044487396.jpg');

INSERT IGNORE INTO workspace_members (workspace_id, user_id, role) VALUES (1, 1, 'CREATOR'), (1, 2, 'MEMBER'), (2, 2, 'CREATOR'), (2, 1, 'MEMBER');

-- Quizzes
INSERT IGNORE INTO quizzes (id, title, subject, topic, difficulty, workspace_id, creator_id) VALUES
(1, 'DBMS Concurrency & Recovery Mastery Test', 'Database Management Systems', 'Transactions & Locking Protocols', 'Medium', 1, 1);

INSERT IGNORE INTO quiz_questions (id, quiz_id, question, option_a, option_b, option_c, option_d, correct_answer_index, explanation) VALUES
(1, 1, 'Which of the following schedules is guaranteed to be conflict serializable?', 'Precedence graph with a cycle', 'Acyclic directed precedence graph (DAG)', 'Any schedule under basic 2PL without shrinking phase', 'Non-recoverable schedules', 1, 'By the Conflict Serializability Theorem, a schedule is conflict serializable if and only if its precedence graph is acyclic.'),
(2, 1, 'Under Strict Two-Phase Locking (Strict 2PL), exclusive locks are held until:', 'Data item is written', 'Beginning of shrinking phase', 'Transaction commits or aborts', 'Buffer page is flushed to disk', 2, 'Strict 2PL prevents cascading aborts by holding all write locks until transaction completion.');

-- Flashcards
INSERT IGNORE INTO flashcards (id, front, back, difficulty, subject, topic, workspace_id, creator_id, is_known) VALUES
(1, 'What is the ACID property: Isolation?', 'Transactions execute independently without intermediate interference from other concurrent transactions.', 'Easy', 'Database Management Systems', 'Transactions', 1, 1, TRUE),
(2, 'How does MVCC eliminate read-write blocking?', 'Readers see a timestamped snapshot of tuples without acquiring exclusive locks; writers generate new tuple versions.', 'Medium', 'Database Management Systems', 'Concurrency Control', 1, 1, FALSE);

-- Doubts & Discussions
INSERT IGNORE INTO discussions (id, title, content, subject, author_id, upvotes, is_resolved) VALUES
(1, 'Why does Rigorous 2PL prevent cascading aborts but not deadlocks?', 'Rigorous 2PL holds all locks until commit. Does this prevent deadlocks during the growing phase?', 'Database Management Systems', 2, 14, TRUE);

INSERT IGNORE INTO discussion_answers (id, discussion_id, author_id, content, upvotes, is_accepted) VALUES
(1, 1, 1, 'Rigorous 2PL prevents cascading aborts, but deadlocks can still occur during lock upgrade contentions! Two transactions holding shared locks waiting for exclusive upgrades cause circular wait.', 18, TRUE);

-- Projects
INSERT IGNORE INTO projects (id, project_name, description, project_type, creator_id, status, github_url) VALUES
(1, 'Smart Campus AI Attendance & Lecture Companion', 'Edge computing biometric verification and automatic lecture audio transcription tool.', 'Academic', 1, 'RECRUITING', 'https://github.com/campus-ai-lab/smart-attendance-system');

INSERT IGNORE INTO project_members (project_id, user_id, role) VALUES (1, 1, 'Lead & ML Architect'), (1, 2, 'Full Stack Developer');

-- Opportunities
INSERT IGNORE INTO opportunities (id, title, organization, category, location, deadline, stipend_or_prize, description, apply_url) VALUES
(1, 'Google Summer of Code 2026', 'Google Open Source Programs', 'Internship', 'Remote', '2026-10-30', '$3,000 - $6,000 Stipend', 'Spend your break writing code for open source organizations. Open to college students.', 'https://summerofcode.withgoogle.com'),
(2, 'ACM Inter-Collegiate Algorithmic Championship 2026', 'ACM', 'Coding Competition', 'Regional Hubs', '2026-11-12', '$15,000 Prize Pool', '3-person teams solve competitive programming and graph theory problems under time pressure.', 'https://icpc.global');
