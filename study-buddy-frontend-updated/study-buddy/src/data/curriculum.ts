// Branch + semester -> subject list used by the Filters panel and the upload form.
// This is a starter syllabus: edit the lists below to match your university's scheme.
// Subjects that students upload under a name not listed here still show up in the results.

export interface BranchInfo {
  short: string; // label on the filter button
  name: string;  // stored on resources / used for matching
}

export const BRANCHES: BranchInfo[] = [
  { short: 'CSE', name: 'Computer Science & Engineering' },
  { short: 'CSIT', name: 'Computer Science & Information Technology' },
  { short: 'IT', name: 'Information Technology' },
  { short: 'EC', name: 'Electronics & Communication Engineering' },
  { short: 'Cyber Security', name: 'Cyber Security' },
  { short: 'AI & ML', name: 'Artificial Intelligence & Machine Learning' },
];

export const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

export const branchShort = (name: string) => BRANCHES.find(b => b.name === name)?.short ?? name;

const FIRST_YEAR: Record<number, string[]> = {
  1: ['Engineering Mathematics-I', 'Engineering Physics', 'Engineering Chemistry', 'Basic Electrical Engineering', 'Communication Skills', 'Engineering Graphics'],
  2: ['Engineering Mathematics-II', 'Programming for Problem Solving', 'Basic Electronics', 'Engineering Mechanics', 'Environmental Science'],
};

const BY_BRANCH: Record<string, Record<number, string[]>> = {
  'Computer Science & Engineering': {
    3: ['Data Structures', 'Discrete Mathematics', 'Digital Logic Design', 'Object Oriented Programming', 'Computer Organization'],
    4: ['Algorithms', 'Theory of Computation', 'Computer Architecture', 'Software Engineering', 'Probability & Statistics'],
    5: ['Operating Systems', 'Computer Graphics', 'Web Technologies', 'Software Testing', 'Microprocessors'],
    6: ['Database Management Systems', 'Computer Networks', 'Compiler Design', 'Machine Learning', 'Cloud Computing'],
    7: ['Distributed Systems', 'Information Security', 'Data Mining', 'Big Data Analytics', 'Internet of Things'],
    8: ['Deep Learning', 'Blockchain Technology', 'Project Management', 'Major Project'],
  },
  'Computer Science & Information Technology': {
    3: ['Data Structures', 'Discrete Mathematics', 'Digital Logic Design', 'Object Oriented Programming', 'Computer Organization'],
    4: ['Algorithms', 'Theory of Computation', 'Database Management Systems', 'Software Engineering', 'Probability & Statistics'],
    5: ['Operating Systems', 'Computer Networks', 'Web Technologies', 'Software Testing', 'Python Programming'],
    6: ['Compiler Design', 'Machine Learning', 'Cloud Computing', 'Information Security', 'Mobile Application Development'],
    7: ['Data Mining', 'Big Data Analytics', 'Internet of Things', 'Distributed Systems', 'Human Computer Interaction'],
    8: ['Deep Learning', 'Blockchain Technology', 'Project Management', 'Major Project'],
  },
  'Information Technology': {
    3: ['Data Structures', 'Discrete Mathematics', 'Digital Electronics', 'Object Oriented Programming', 'Computer Organization'],
    4: ['Algorithms', 'Database Management Systems', 'Operating Systems', 'Software Engineering', 'Probability & Statistics'],
    5: ['Computer Networks', 'Web Technologies', 'Theory of Computation', 'Data Analytics', 'Software Testing'],
    6: ['Compiler Design', 'Cloud Computing', 'Information Security', 'Machine Learning', 'Mobile Application Development'],
    7: ['Big Data Analytics', 'Internet of Things', 'Distributed Systems', 'Data Mining', 'DevOps'],
    8: ['Blockchain Technology', 'Deep Learning', 'Project Management', 'Major Project'],
  },
  'Electronics & Communication Engineering': {
    3: ['Network Analysis', 'Analog Electronics', 'Digital Electronics', 'Signals & Systems', 'Electronic Measurements'],
    4: ['Analog Circuits', 'Electromagnetic Theory', 'Control Systems', 'Linear Integrated Circuits', 'Probability & Random Processes'],
    5: ['Analog Communication', 'Digital Signal Processing', 'Microprocessors & Microcontrollers', 'Antenna & Wave Propagation', 'Power Electronics'],
    6: ['Digital Communication', 'VLSI Design', 'Microwave Engineering', 'Embedded Systems', 'Information Theory & Coding'],
    7: ['Optical Communication', 'Wireless & Mobile Communication', 'Satellite Communication', 'Digital Image Processing', 'Internet of Things'],
    8: ['Radar Engineering', 'Advanced VLSI', 'Project Management', 'Major Project'],
  },
  'Cyber Security': {
    3: ['Data Structures', 'Discrete Mathematics', 'Digital Logic Design', 'Object Oriented Programming', 'Computer Organization'],
    4: ['Operating Systems', 'Database Management Systems', 'Algorithms', 'Introduction to Cyber Security', 'Probability & Statistics'],
    5: ['Computer Networks', 'Cryptography', 'Web Application Security', 'Linux Administration', 'Software Engineering'],
    6: ['Network Security', 'Ethical Hacking', 'Digital Forensics', 'Cloud Security', 'Secure Software Development'],
    7: ['Malware Analysis', 'Penetration Testing', 'Cyber Law & Ethics', 'Incident Response', 'Blockchain Security'],
    8: ['Security Operations & Monitoring', 'Risk Management', 'Project Management', 'Major Project'],
  },
  'Artificial Intelligence & Machine Learning': {
    3: ['Data Structures', 'Discrete Mathematics', 'Linear Algebra', 'Python for AI', 'Computer Organization'],
    4: ['Algorithms', 'Database Management Systems', 'Probability & Statistics', 'Operating Systems', 'Software Engineering'],
    5: ['Machine Learning', 'Artificial Intelligence', 'Computer Networks', 'Data Visualization', 'Optimization Techniques'],
    6: ['Deep Learning', 'Natural Language Processing', 'Computer Vision', 'Big Data Analytics', 'Cloud Computing'],
    7: ['Reinforcement Learning', 'Generative AI', 'Data Mining', 'Internet of Things', 'AI Ethics'],
    8: ['MLOps', 'Advanced Deep Learning', 'Project Management', 'Major Project'],
  },
};

export function subjectsFor(branchName: string, semester: number | string): string[] {
  const sem = Number(semester);
  if (sem === 1 || sem === 2) return FIRST_YEAR[sem] ?? [];
  return BY_BRANCH[branchName]?.[sem] ?? [];
}
