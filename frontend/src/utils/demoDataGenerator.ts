// Demo Candidate Generator for Hackathon Testing
// Generates realistic candidate DOCX buffers for genuine bulk screening via /api/analyze-batch

export interface DemoCandidateSpec {
  name: string
  email: string
  phone: string
  degree: string
  role: string
  skills: string
  projects: string
  certs: string
}

export const SAMPLE_CANDIDATES: DemoCandidateSpec[] = [
  {
    name: 'Aravind Kumar',
    email: 'aravind.k@email.com',
    phone: '+1-555-0192',
    degree: 'Master of Science in Artificial Intelligence — Stanford University (2023)',
    role: 'Senior Machine Learning Engineer — NeuroTech Labs (2023–Present)',
    skills: 'Python, Machine Learning, PyTorch, TensorFlow, SQL, PostgreSQL, Docker, AWS, Scikit-Learn',
    projects: 'Real-Time Neural Inference Engine — PyTorch and Docker cloud deployment | Automated SQL Data Pipeline',
    certs: 'AWS Certified Machine Learning Specialist (2024)',
  },
  {
    name: 'Priya Sharma',
    email: 'priya.s@email.com',
    phone: '+1-555-0283',
    degree: 'Bachelor of Technology in Computer Science — IIT Madras (2024)',
    role: 'AI Research Intern — VisionAI Corp (2023–2024)',
    skills: 'Python, Machine Learning, Deep Learning, SQL, Pandas, NumPy, Git, GitHub',
    projects: 'Computer Vision Defect Classifier — Python and OpenCV | SQL Query Optimization Benchmark',
    certs: 'Deep Learning Specialization Certificate (2023)',
  },
  {
    name: 'Marcus Chen',
    email: 'marcus.c@email.com',
    phone: '+1-555-0374',
    degree: 'Bachelor of Science in Data Science — UC Berkeley (2023)',
    role: 'Data Engineer — DataWave Systems (2023–2024)',
    skills: 'Python, SQL, PostgreSQL, BigQuery, Pandas, Docker, Git',
    projects: 'Enterprise ETL Data Pipeline — Python, SQL and PostgreSQL | Tableau Analytics Dashboard',
    certs: 'PostgreSQL Database Associate (2023)',
  },
  {
    name: 'Elena Rostova',
    email: 'elena.r@email.com',
    phone: '+1-555-0465',
    degree: 'Bachelor of Engineering in Information Technology (2024)',
    role: 'Software Developer Intern — CloudBase Inc (2024)',
    skills: 'Java, Spring Boot, Python, SQL, REST APIs, Git, GitHub',
    projects: 'Banking Microservice API — Java Spring Boot and PostgreSQL | Python Web Scraper',
    certs: 'Oracle Certified Java Associate (2023)',
  },
  {
    name: 'Devin Robinson',
    email: 'devin.r@email.com',
    phone: '+1-555-0556',
    degree: 'Bachelor of Arts in Design & Web Development (2023)',
    role: 'Frontend Developer — PixelCraft Studios (2023–2024)',
    skills: 'JavaScript, TypeScript, React, HTML, CSS, TailwindCSS, Figma, Git',
    projects: 'Responsive SaaS Design System — React and TypeScript | E-Commerce Web App',
    certs: 'Meta Frontend Developer Certificate (2023)',
  },
  {
    name: 'Karthik Raman',
    email: 'karthik.r@email.com',
    phone: '+1-555-0647',
    degree: 'Master of Technology in Computer Science — NIT Trichy (2023)',
    role: 'Machine Learning Specialist — Apex Intelligence (2023–Present)',
    skills: 'Python, Machine Learning, NLP, LLMs, SQL, Docker, AWS, LangChain, PyTorch',
    projects: 'Conversational LLM Platform — Python, PyTorch and AWS | Multi-Tenant Database Engine',
    certs: 'AWS Certified Solutions Architect (2024)',
  },
]
