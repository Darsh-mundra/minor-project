// Generates starter study material for every branch -> semester -> subject -> unit,
// so no unit shows "0" on a fresh install. Real uploads from students sit alongside these.
// The data is deterministic (same output on every start) and lives in memory like the rest of the seed data.
import crypto from 'crypto';
import { BRANCHES, SEMESTERS, subjectsFor } from './curriculum';

type RType = 'Notes' | 'PDF' | 'PYQ' | 'Assignment' | 'Lab Manual' | 'Question Bank' | 'Presentation';

const UPLOADERS = [
  { id: 'user-std-1', name: 'Sarah Chen' },
  { id: 'user-std-2', name: 'Rahul Sharma' },
];

// Real topic names for some popular subjects; everything else falls back to GENERIC.
const TOPICS: Record<string, string[]> = {
  'Data Structures': ['Arrays, Linked Lists & Complexity', 'Stacks & Queues', 'Trees & Binary Search Trees', 'Graphs & Traversals', 'Hashing, Heaps & Sorting'],
  'Database Management Systems': ['ER Model & Relational Algebra', 'SQL & Normalization', 'Indexing & Query Processing', 'Transactions & Concurrency Control', 'Recovery & NoSQL'],
  'Operating Systems': ['Process Management & Scheduling', 'Synchronization & Deadlocks', 'Memory Management', 'Virtual Memory & Page Replacement', 'File Systems & Disk Scheduling'],
  'Computer Networks': ['Network Models & Physical Layer', 'Data Link Layer & MAC', 'Network Layer & Routing', 'Transport Layer: TCP & UDP', 'Application Layer & Security'],
  'Algorithms': ['Asymptotic Analysis & Recurrences', 'Divide & Conquer, Greedy', 'Dynamic Programming', 'Graph Algorithms', 'NP-Completeness & Approximation'],
  'Machine Learning': ['Introduction & Linear Regression', 'Classification & Decision Trees', 'SVM & Kernel Methods', 'Neural Networks Basics', 'Clustering & Dimensionality Reduction'],
  'Software Engineering': ['SDLC & Process Models', 'Requirements Engineering', 'Design & Architecture', 'Testing Strategies', 'Maintenance & Project Management'],
  'Object Oriented Programming': ['Classes & Objects', 'Inheritance', 'Polymorphism', 'Exceptions & Templates', 'File Handling & STL / Collections'],
  'Engineering Mathematics-I': ['Differential Calculus', 'Integral Calculus', 'Sequences & Series', 'Multivariable Calculus', 'Vector Calculus'],
  'Engineering Physics': ['Wave Optics', 'Laser & Fibre Optics', 'Quantum Mechanics', 'Semiconductor Physics', 'Superconductivity & Nanomaterials'],
};
const GENERIC = ['Introduction & Fundamentals', 'Core Concepts & Principles', 'Methods & Techniques', 'Applications & Case Studies', 'Advanced Topics & Revision'];

const TEMPLATES: { type: RType; title: (s: string, u: number, t: string) => string; desc: (s: string, u: number, t: string) => string; file: string; size: [number, number] }[] = [
  { type: 'Notes', file: 'Notes', size: [2, 7],
    title: (s, u, t) => `${s} Unit ${u}: ${t} (Handwritten Notes)`,
    desc: (s, u, t) => `Clean handwritten notes for Unit ${u} of ${s} covering ${t.toLowerCase()}, with solved examples and exam-oriented summaries.` },
  { type: 'PYQ', file: 'PYQ', size: [1, 3],
    title: (s, u) => `${s} Unit ${u}: Previous Year Questions with Solutions`,
    desc: (s, u, t) => `Last 5 years of university questions on ${t.toLowerCase()}, with worked answers and marking hints.` },
  { type: 'Question Bank', file: 'QuestionBank', size: [1, 3],
    title: (s, u) => `${s} Unit ${u}: Important Question Bank`,
    desc: (s, u, t) => `Short and long answer questions on ${t.toLowerCase()}, grouped by difficulty and frequency of appearance.` },
  { type: 'Assignment', file: 'Assignment', size: [1, 4],
    title: (s, u) => `${s} Unit ${u}: Assignment Solutions`,
    desc: (s, u, t) => `Step-by-step solutions to the Unit ${u} assignment problems on ${t.toLowerCase()}.` },
  { type: 'PDF', file: 'Reference', size: [4, 14],
    title: (s, u, t) => `${s}: ${t} (Reference Chapter PDF)`,
    desc: (s, u, t) => `Textbook chapter reference for ${t.toLowerCase()} with diagrams and practice problems.` },
  { type: 'Presentation', file: 'Slides', size: [2, 9],
    title: (s, u, t) => `${s} Unit ${u}: ${t} (Lecture Slides)`,
    desc: (s, u, t) => `Lecture slide deck summarising ${t.toLowerCase()}, useful for quick revision before exams.` },
];

// small deterministic PRNG so every start produces the same data
const rng = (seed: string) => {
  let h = crypto.createHash('sha256').update(seed).digest().readUInt32LE(0);
  return () => { h = (Math.imul(h, 1664525) + 1013904223) >>> 0; return h / 4294967296; };
};

export function buildSampleResources(): any[] {
  const out: any[] = [];
  const seen = new Set<string>();

  for (const branch of BRANCHES) {
    for (const sem of SEMESTERS) {
      for (const subject of subjectsFor(branch.name, sem)) {
        const key = `${branch.name}|${sem}|${subject}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const topics = TOPICS[subject] ?? GENERIC;

        for (let u = 1; u <= 5; u++) {
          const topic = topics[u - 1] ?? GENERIC[u - 1];
          const rand = rng(`${key}|${u}`);
          // every unit gets Notes + 1-3 other types, so counts vary between units (graph sizes/colours differ)
          const extra = TEMPLATES.slice(1).filter(() => rand() < 0.45);
          if (extra.length === 0) extra.push(TEMPLATES[1 + Math.floor(rand() * 5)]);
          const chosen = [TEMPLATES[0], ...extra];

          chosen.forEach((tpl, idx) => {
            const up = UPLOADERS[Math.floor(rand() * UPLOADERS.length)];
            const id = `sample-${crypto.createHash('md5').update(`${key}|${u}|${tpl.type}`).digest('hex').slice(0, 10)}`;
            const size = tpl.size[0] + rand() * (tpl.size[1] - tpl.size[0]);
            const ratingCount = 4 + Math.floor(rand() * 40);
            out.push({
              id,
              title: tpl.title(subject, u, topic),
              description: tpl.desc(subject, u, topic),
              branch: branch.name,
              semester: sem,
              subject,
              unit: `Unit ${u}`,
              topic,
              resourceType: tpl.type,
              fileUrl: 'https://raw.githubusercontent.com/mdn/learning-area/master/javascript/oojs/json/superheroes.json',
              fileName: `${subject.replace(/[^A-Za-z0-9]+/g, '_')}_Unit${u}_${tpl.file}.pdf`,
              fileSize: `${size.toFixed(1)} MB`,
              fileHash: crypto.createHash('sha256').update(`SAMPLE|${key}|${u}|${tpl.type}`).digest('hex'),
              uploaderId: up.id,
              uploaderName: up.name,
              uploadDate: new Date(Date.now() - Math.floor(2 + rand() * 90 + idx) * 86400000).toISOString(),
              rating: Math.round((3.6 + rand() * 1.4) * 10) / 10,
              ratingCount,
              downloadCount: 12 + Math.floor(rand() * 260),
              helpfulVotes: Math.floor(rand() * 60),
              reportsCount: 0,
              isReported: false,
              bookmarkedBy: [],
              votedHelpfulBy: [],
            });
          });
        }
      }
    }
  }
  return out;
}
