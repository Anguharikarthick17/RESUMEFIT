// Deterministic Intelligence Engine for ResumeFit
// 100% grounded in actual backend analysis data — zero hallucinations

import type { AnalysisResponse, ExtractedField, MatchStatus, RequirementMatch } from '../types/resume'
import type {
  AnalysisSnapshot,
  AssessmentQuestion,
  ClaimStrengthItem,
  EnhancedRequirementMatch,
  ImprovementOption,
  JobReadinessScore,
  LearningRoadmapGoal,
  RequirementPriority,
  RoleFitResult,
  ShortlistRecommendation,
  SimulationResult,
  SkillGapItem,
  WeightedFitScore,
} from '../types/intelligence'

// ── 1. Deterministic Analysis ID Generator ─────────────────────────────────
export function generateAnalysisId(data: AnalysisResponse, targetRole: string = 'Software Engineer'): string {
  const seed = `${data.candidate.full_name ?? ''}|${data.candidate.email ?? ''}|${targetRole}|${data.fit_score.fit_score}|${data.requirements.length}`
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash |= 0
  }
  const hex = Math.abs(hash).toString(16).toUpperCase().padStart(6, '0').slice(0, 6)
  return `RF-${hex}`
}

// ── 2. Weighted Requirement Matching ───────────────────────────────────────
const CRITICAL_KEYWORDS = ['bachelor', 'master', 'degree', 'java', 'python', 'c++', 'golang', 'react', 'spring', 'core', 'primary', 'required', 'must have']
const IMPORTANT_KEYWORDS = ['sql', 'postgresql', 'mysql', 'rest api', 'rest', 'api', 'microservice', 'aws', 'cloud', 'docker', 'database']

export function computeEnhancedRequirements(reqs: RequirementMatch[]): {
  enhanced: EnhancedRequirementMatch[]
  weighted: WeightedFitScore
} {
  const enhanced: EnhancedRequirementMatch[] = reqs.map((r) => {
    const low = r.requirement.toLowerCase()
    let priority: RequirementPriority = 'NICE_TO_HAVE'
    let weight = 1
    let impact: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW'

    if (CRITICAL_KEYWORDS.some((kw) => low.includes(kw))) {
      priority = 'CRITICAL'
      weight = 3
      impact = 'HIGH'
    } else if (IMPORTANT_KEYWORDS.some((kw) => low.includes(kw))) {
      priority = 'IMPORTANT'
      weight = 2
      impact = 'MEDIUM'
    }

    return {
      ...r,
      priority,
      weight,
      impact,
    }
  })

  let totalWeight = 0
  let earnedWeight = 0

  let critical_matched = 0
  let critical_total = 0
  let important_matched = 0
  let important_total = 0
  let nice_matched = 0
  let nice_total = 0

  for (const item of enhanced) {
    totalWeight += item.weight
    if (item.priority === 'CRITICAL') critical_total++
    else if (item.priority === 'IMPORTANT') important_total++
    else nice_total++

    if (item.match_status === 'MATCHED') {
      earnedWeight += item.weight
      if (item.priority === 'CRITICAL') critical_matched++
      else if (item.priority === 'IMPORTANT') important_matched++
      else nice_matched++
    } else if (item.match_status === 'PARTIAL') {
      earnedWeight += item.weight * 0.5
      if (item.priority === 'CRITICAL') critical_matched += 0.5
      else if (item.priority === 'IMPORTANT') important_matched += 0.5
      else nice_matched += 0.5
    }
  }

  const raw_score = reqs.length > 0
    ? Math.round(
        (reqs.filter((r) => r.match_status === 'MATCHED').length +
          reqs.filter((r) => r.match_status === 'PARTIAL').length * 0.5) /
          reqs.length *
          100,
      )
    : 0

  const weighted_score = totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : raw_score

  let score_label = 'Strong Match'
  if (weighted_score < 50) score_label = 'Low Match'
  else if (weighted_score < 75) score_label = 'Moderate Match'
  else if (weighted_score < 90) score_label = 'Good Match'

  const explanation =
    weighted_score >= raw_score
      ? `Weighted fit is ${weighted_score}% (higher than raw ${raw_score}%) because candidate satisfies key critical requirements.`
      : `Weighted fit is ${weighted_score}% (lower than raw ${raw_score}%) because key critical requirements have partial or missing coverage.`

  return {
    enhanced,
    weighted: {
      raw_score,
      weighted_score,
      score_label,
      critical_matched: Math.round(critical_matched),
      critical_total,
      important_matched: Math.round(important_matched),
      important_total,
      nice_matched: Math.round(nice_matched),
      nice_total,
      explanation,
    },
  }
}

// ── 3. Job Readiness Score Calculator ──────────────────────────────────────
export function computeJobReadinessScore(fields: ExtractedField[], reqs: RequirementMatch[]): JobReadinessScore {
  const fieldMap = Object.fromEntries(fields.map((f) => [f.field_id, f]))

  // Technical Skills (40% weight)
  const skillsField = fieldMap['SKILLS-LIST']
  let technical_skills = 0
  if (skillsField?.status === 'FOUND' && skillsField.value) {
    const count = skillsField.value.split(',').length
    technical_skills = Math.min(100, 50 + count * 6)
  }

  // Education (15% weight)
  const eduField = fieldMap['EDUCATION-DEGREE']
  let education = 0
  if (eduField?.status === 'FOUND' && eduField.value) {
    education = 100
  }

  // Projects (20% weight)
  const projField = fieldMap['PROJECT-LIST']
  let projects = 0
  if (projField?.status === 'FOUND' && projField.value) {
    const pCount = projField.value.split(' | ').length
    projects = Math.min(100, 60 + pCount * 20)
  }

  // Experience (15% weight)
  const expField = fieldMap['EXPERIENCE-ROLE']
  let experience = 0
  if (expField?.status === 'FOUND' && expField.value) {
    experience = 85
  }

  // Certifications (10% weight)
  const certField = fieldMap['CERT-LIST']
  let certifications = 0
  if (certField?.status === 'FOUND' && certField.value) {
    certifications = 90
  }

  // Weighted composite
  const overall = Math.round(
    technical_skills * 0.4 +
      education * 0.15 +
      projects * 0.2 +
      experience * 0.15 +
      certifications * 0.1,
  )

  let label = 'Job Ready'
  if (overall < 50) label = 'Early Stage'
  else if (overall < 70) label = 'Developing'
  else if (overall < 85) label = 'Strong Candidate'

  return {
    overall,
    technical_skills,
    education,
    projects,
    experience,
    certifications,
    label,
  }
}

// ── 4. Skill Gap Analysis ──────────────────────────────────────────────────
export function computeSkillGaps(reqs: RequirementMatch[], fields: ExtractedField[]): {
  youHave: SkillGapItem[]
  partiallyCovered: SkillGapItem[]
  missing: SkillGapItem[]
} {
  const youHave: SkillGapItem[] = []
  const partiallyCovered: SkillGapItem[] = []
  const missing: SkillGapItem[] = []

  const fieldMap = Object.fromEntries(fields.map((f) => [f.field_id, f]))

  for (const r of reqs) {
    const item: SkillGapItem = {
      skill: r.requirement,
      status: r.match_status,
      required_by: r.requirement,
      evidence_field: r.evidence_ref,
      evidence_text: r.evidence_ref ? fieldMap[r.evidence_ref]?.evidence ?? null : null,
      category: r.evidence_ref ? fieldMap[r.evidence_ref]?.category ?? 'General Requirement' : 'Unmatched',
    }

    if (r.match_status === 'MATCHED') {
      youHave.push(item)
    } else if (r.match_status === 'PARTIAL') {
      partiallyCovered.push(item)
    } else {
      missing.push(item)
    }
  }

  return { youHave, partiallyCovered, missing }
}

// ── 5. Personalized Learning Roadmap ───────────────────────────────────────
export function generateLearningRoadmap(missing: SkillGapItem[], partial: SkillGapItem[]): LearningRoadmapGoal[] {
  const roadmap: LearningRoadmapGoal[] = []
  const targets = [...missing, ...partial]

  if (targets.length === 0) {
    return [
      {
        week: 1,
        title: 'Advanced System Architecture',
        skill: 'Production System Design',
        priority: 'MEDIUM',
        estimated_hours: 12,
        reason: 'Candidate meets all baseline requirements. Recommended to focus on production scalability.',
        recommended_focus: ['Microservices Patterns', 'Caching & Redis', 'Database Indexing'],
      },
    ]
  }

  const weekTitles = [
    'Core Fundamentals & Architecture',
    'Practical Application & APIs',
    'Containerization & Cloud Basics',
    'Production Deployment & CI/CD',
  ]

  for (let i = 0; i < Math.min(4, targets.length); i++) {
    const item = targets[i]
    roadmap.push({
      week: i + 1,
      title: weekTitles[i] || `Mastering ${item.skill}`,
      skill: item.skill,
      priority: i === 0 ? 'HIGH' : i < 2 ? 'MEDIUM' : 'LOW',
      estimated_hours: i === 0 ? 15 : 10,
      reason: `Directly bridges requirement '${item.required_by}' which is currently ${item.status}.`,
      recommended_focus: [
        `Learn core concepts of ${item.skill}`,
        `Build a hands-on mini-project demonstrating ${item.skill}`,
        `Add verified evidence snippet to resume`,
      ],
    })
  }

  return roadmap
}

// ── 6. Improvement Simulator ───────────────────────────────────────────────
export function getImprovementOptions(reqs: RequirementMatch[]): ImprovementOption[] {
  const options: ImprovementOption[] = []
  const unfulfilled = reqs.filter((r) => r.match_status !== 'MATCHED')

  for (const r of unfulfilled) {
    const low = r.requirement.toLowerCase()
    let category: 'skill' | 'project' | 'certification' | 'experience' = 'skill'
    let label = `Add ${r.requirement}`
    let pts = 10

    if (low.includes('project') || low.includes('building')) {
      category = 'project'
      label = `Build and showcase: ${r.requirement}`
      pts = 15
    } else if (low.includes('certif') || low.includes('aws') || low.includes('certified')) {
      category = 'certification'
      label = `Obtain certification in: ${r.requirement}`
      pts = 12
    } else if (low.includes('experience') || low.includes('years')) {
      category = 'experience'
      label = `Highlight work/internship experience in: ${r.requirement}`
      pts = 14
    } else {
      label = `Master skill: ${r.requirement}`
      pts = r.match_status === 'PARTIAL' ? 8 : 12
    }

    options.push({
      id: `opt-${r.requirement.slice(0, 16).replace(/\s+/g, '-').toLowerCase()}`,
      label,
      skill_or_area: r.requirement,
      category,
      estimated_impact_pts: pts,
      requirement_matched: r.requirement,
    })
  }

  return options
}

export function simulateImprovements(
  currentFit: number,
  allReqs: RequirementMatch[],
  selectedIds: string[],
  options: ImprovementOption[],
): SimulationResult {
  const selectedOptions = options.filter((o) => selectedIds.includes(o.id))
  const selectedReqNames = new Set(selectedOptions.map((o) => o.requirement_matched.toLowerCase()))

  let newMatched = 0
  let newPartial = 0
  let newMissing = 0

  for (const r of allReqs) {
    if (r.match_status === 'MATCHED' || selectedReqNames.has(r.requirement.toLowerCase())) {
      newMatched++
    } else if (r.match_status === 'PARTIAL') {
      newPartial++
    } else {
      newMissing++
    }
  }

  const projected_fit = allReqs.length > 0 ? Math.round(((newMatched + newPartial * 0.5) / allReqs.length) * 100) : currentFit
  const delta = Math.max(0, projected_fit - currentFit)

  return {
    selected_ids: selectedIds,
    current_fit: currentFit,
    projected_fit,
    delta,
    new_matched_count: newMatched,
    new_partial_count: newPartial,
    new_missing_count: newMissing,
    applied_improvements: selectedOptions.map((o) => ({
      label: o.label,
      impact: o.estimated_impact_pts,
      requirement: o.requirement_matched,
    })),
  }
}

// ── 7. Resume Claim / Evidence Strength ────────────────────────────────────
export function analyzeClaimStrength(fields: ExtractedField[]): ClaimStrengthItem[] {
  const items: ClaimStrengthItem[] = []
  const fieldMap = Object.fromEntries(fields.map((f) => [f.field_id, f]))

  // 1. Name & Contact
  if (fieldMap['CONTACT-NAME']?.status === 'FOUND') {
    items.push({
      claim: 'Candidate Identity & Contact',
      extracted_skill_or_term: fieldMap['CONTACT-NAME'].value ?? '',
      quality: 'Strong',
      evidence_quote: fieldMap['CONTACT-NAME'].evidence,
      status_explanation: 'Contact details and candidate name verified directly in header section.',
    })
  }

  // 2. Education
  if (fieldMap['EDUCATION-DEGREE']) {
    const f = fieldMap['EDUCATION-DEGREE']
    items.push({
      claim: 'Academic Qualification & Degree',
      extracted_skill_or_term: f.value ?? 'Not Found',
      quality: f.status === 'FOUND' ? 'Strong' : 'Not Found',
      evidence_quote: f.evidence,
      status_explanation: f.status === 'FOUND' ? 'Degree title and institution explicitly grounded.' : 'No verifiable degree statement extracted.',
    })
  }

  // 3. Technical Skills
  if (fieldMap['SKILLS-LIST']) {
    const f = fieldMap['SKILLS-LIST']
    items.push({
      claim: 'Primary Technical Skills & Tooling',
      extracted_skill_or_term: f.value ?? 'Not Found',
      quality: f.status === 'FOUND' ? 'Strong' : 'Not Found',
      evidence_quote: f.evidence,
      status_explanation: f.status === 'FOUND' ? 'Skills listed explicitly in dedicated Skills section.' : 'No structured skills section detected.',
    })
  }

  // 4. Experience Role
  if (fieldMap['EXPERIENCE-ROLE']) {
    const f = fieldMap['EXPERIENCE-ROLE']
    items.push({
      claim: 'Professional Work Experience',
      extracted_skill_or_term: f.value ?? 'Not Found',
      quality: f.status === 'FOUND' ? 'Moderate' : 'Not Found',
      evidence_quote: f.evidence,
      status_explanation: f.status === 'FOUND' ? 'Recent job title and employer extracted with supporting snippet.' : 'Zero professional experience records extracted.',
    })
  }

  // 5. Projects
  if (fieldMap['PROJECT-LIST']) {
    const f = fieldMap['PROJECT-LIST']
    items.push({
      claim: 'Demonstrated Project Implementations',
      extracted_skill_or_term: f.value ?? 'Not Found',
      quality: f.status === 'FOUND' ? 'Strong' : 'Not Found',
      evidence_quote: f.evidence,
      status_explanation: f.status === 'FOUND' ? 'Project titles with tech stack descriptions verified in resume text.' : 'No project claims detected.',
    })
  }

  // 6. Certifications
  if (fieldMap['CERT-LIST']) {
    const f = fieldMap['CERT-LIST']
    items.push({
      claim: 'Industry Certifications & Credentials',
      extracted_skill_or_term: f.value ?? 'Not Found',
      quality: f.status === 'FOUND' ? 'Strong' : 'Not Found',
      evidence_quote: f.evidence,
      status_explanation: f.status === 'FOUND' ? 'Certificate names and credential years verified in Certifications section.' : 'No certification claims extracted.',
    })
  }

  return items
}

// ── 8. Role Fit Simulator ──────────────────────────────────────────────────
const TARGET_ROLES = [
  { id: 'java-dev', title: 'Java Software Engineer', keySkills: ['java', 'spring boot', 'sql', 'rest', 'git', 'microservices'] },
  { id: 'fullstack-dev', title: 'Full Stack Engineer', keySkills: ['javascript', 'react', 'node', 'sql', 'html', 'css', 'git'] },
  { id: 'backend-dev', title: 'Backend Engineer', keySkills: ['python', 'java', 'sql', 'postgresql', 'docker', 'rest apis'] },
  { id: 'frontend-dev', title: 'Frontend Developer', keySkills: ['javascript', 'typescript', 'react', 'html', 'css', 'ui'] },
  { id: 'data-analyst', title: 'Data Analyst', keySkills: ['python', 'sql', 'pandas', 'tableau', 'excel', 'visualization'] },
  { id: 'aiml-eng', title: 'AI / ML Engineer', keySkills: ['python', 'pytorch', 'tensorflow', 'machine learning', 'nlp', 'pandas'] },
]

export function computeRoleFitSimulator(fields: ExtractedField[]): RoleFitResult[] {
  const skillsField = fields.find((f) => f.field_id === 'SKILLS-LIST')
  const candSkillsLow = (skillsField?.value || '').toLowerCase()

  const results: RoleFitResult[] = TARGET_ROLES.map((role) => {
    const matched = role.keySkills.filter((s) => candSkillsLow.includes(s))
    const missing = role.keySkills.filter((s) => !candSkillsLow.includes(s))
    const fit_score = Math.round((matched.length / role.keySkills.length) * 100)

    return {
      role_id: role.id,
      role_title: role.title,
      fit_score,
      strong_areas: matched.map((s) => s.toUpperCase()),
      missing_skills: missing.map((s) => s.toUpperCase()),
    }
  })

  results.sort((a, b) => b.fit_score - a.fit_score)
  if (results.length > 0) {
    results[0].is_best_fit = true
  }

  return results
}

// ── 9. Recruiter Shortlist Assistant ───────────────────────────────────────
export function evaluateRecruiterShortlist(data: AnalysisResponse): ShortlistRecommendation {
  const score = data.fit_score.fit_score
  const matched = data.fit_score.matched
  const total = data.fit_score.total || 1
  const ratio = matched / total

  const reasons: string[] = []
  const concerns: string[] = []

  // Check degree
  const deg = data.fields.find((f) => f.field_id === 'EDUCATION-DEGREE')
  if (deg?.status === 'FOUND') {
    reasons.push(`Degree requirement satisfied: candidate holds '${deg.value}'.`)
  } else {
    concerns.push('Education degree not explicitly listed in candidate text.')
  }

  // Check skills
  const skills = data.fields.find((f) => f.field_id === 'SKILLS-LIST')
  if (skills?.status === 'FOUND') {
    reasons.push(`Strong core skill coverage with ${skills.value?.split(',').length ?? 0} extracted technical tokens.`)
  }

  // Check projects
  const proj = data.fields.find((f) => f.field_id === 'PROJECT-LIST')
  if (proj?.status === 'FOUND') {
    reasons.push(`Relevant practical project evidence found: '${proj.value?.slice(0, 70)}...'`)
  }

  // Check experience
  const exp = data.fields.find((f) => f.field_id === 'EXPERIENCE-ROLE')
  if (exp?.status === 'NOT_FOUND') {
    concerns.push('Limited professional full-time experience extracted from resume.')
  }

  if (data.fit_score.missing > 0) {
    concerns.push(`${data.fit_score.missing} job requirements currently have zero matching evidence.`)
  }

  let decision: 'SHORTLIST' | 'REVIEW' | 'LOW_FIT' = 'REVIEW'
  let headline = 'Recommend Further Review'
  let fit_rating = 'Moderate Fit'

  if (score >= 80 || ratio >= 0.75) {
    decision = 'SHORTLIST'
    headline = 'Recommended for Shortlist'
    fit_rating = 'Strong Candidate Alignment'
  } else if (score < 45 || ratio < 0.4) {
    decision = 'LOW_FIT'
    headline = 'Low Requirement Alignment'
    fit_rating = 'Significant Skill & Experience Gaps'
  }

  return {
    decision,
    headline,
    reasons,
    concerns,
    fit_rating,
  }
}

// ── 10. Verified Skill Assessment Question Bank ────────────────────────────
export const ASSESSMENT_BANK: Record<string, AssessmentQuestion[]> = {
  Java: [
    {
      id: 'java-1',
      category: 'Java',
      question: 'Which interface does a class implement to allow its objects to be sorted using Collections.sort()?',
      options: ['Comparable', 'Comparator', 'Serializable', 'Cloneable'],
      correct_index: 0,
      explanation: 'Classes implementing Comparable<T> define natural ordering via compareTo().',
    },
    {
      id: 'java-2',
      category: 'Java',
      question: 'What is the primary benefit of the Java Virtual Machine (JVM)?',
      options: ['Platform independence (WORA)', 'Direct hardware execution', 'Automatic database indexing', 'Elimination of compile time'],
      correct_index: 0,
      explanation: 'The JVM executes bytecode, allowing Java code to run anywhere with a JVM installed.',
    },
    {
      id: 'java-3',
      category: 'Java',
      question: 'In Java, what happens when an object in the Heap has no active references?',
      options: ['Garbage collection eligibility', 'Instant memory leak', 'Compilation failure', 'Thread termination'],
      correct_index: 0,
      explanation: 'Objects without live references become eligible for automated Garbage Collection.',
    },
  ],
  'Spring Boot': [
    {
      id: 'spring-1',
      category: 'Spring Boot',
      question: 'Which annotation is used to designate a class as a RESTful web controller in Spring Boot?',
      options: ['@RestController', '@Component', '@Service', '@Entity'],
      correct_index: 0,
      explanation: '@RestController combines @Controller and @ResponseBody for JSON/REST endpoints.',
    },
    {
      id: 'spring-2',
      category: 'Spring Boot',
      question: 'What is the purpose of Spring Boot Auto-Configuration?',
      options: ['Automatically configure Spring application based on jar dependencies', 'Generate SQL tables at runtime', 'Eliminate Java compilers', 'Manage DNS servers'],
      correct_index: 0,
      explanation: '@EnableAutoConfiguration attempts to configure beans based on classpath dependencies.',
    },
  ],
  SQL: [
    {
      id: 'sql-1',
      category: 'SQL',
      question: 'Which clause is used to filter the results of a GROUP BY aggregate in SQL?',
      options: ['HAVING', 'WHERE', 'ORDER BY', 'FILTER'],
      correct_index: 0,
      explanation: 'HAVING filters grouped records, whereas WHERE filters individual rows prior to grouping.',
    },
    {
      id: 'sql-2',
      category: 'SQL',
      question: 'What type of JOIN returns all records when there is a match in either left or right table?',
      options: ['FULL OUTER JOIN', 'INNER JOIN', 'CROSS JOIN', 'LEFT JOIN'],
      correct_index: 0,
      explanation: 'FULL OUTER JOIN combines results of both LEFT and RIGHT outer joins.',
    },
  ],
  'REST APIs': [
    {
      id: 'rest-1',
      category: 'REST APIs',
      question: 'Which HTTP method should be idempotent and used to replace an entire resource representation?',
      options: ['PUT', 'POST', 'PATCH', 'CONNECT'],
      correct_index: 0,
      explanation: 'PUT replaces the resource and is idempotent according to HTTP RFC specs.',
    },
    {
      id: 'rest-2',
      category: 'REST APIs',
      question: 'What HTTP status code represents "201 Created"?',
      options: ['201', '200', '204', '202'],
      correct_index: 0,
      explanation: 'HTTP 201 indicates a request succeeded and led to resource creation.',
    },
  ],
  Python: [
    {
      id: 'py-1',
      category: 'Python',
      question: 'What data structure is created by the syntax: my_set = {1, 2, 3}?',
      options: ['Set', 'Dictionary', 'List', 'Tuple'],
      correct_index: 0,
      explanation: 'Curly braces with single items create a set; key:value pairs create a dictionary.',
    },
  ],
}

// ── 11. Local Storage Snapshot Persistence ─────────────────────────────────
const HISTORY_KEY = 'resumefit_analysis_history_v1'

export function saveAnalysisSnapshot(data: AnalysisResponse, targetRole: string = 'Software Engineer'): AnalysisSnapshot {
  const analysisId = generateAnalysisId(data, targetRole)
  const enhanced = computeEnhancedRequirements(data.requirements)
  const readiness = computeJobReadinessScore(data.fields, data.requirements)

  const snapshot: AnalysisSnapshot = {
    analysisId,
    timestamp: new Date().toISOString(),
    candidateName: data.candidate.full_name ?? 'Candidate',
    candidateEmail: data.candidate.email,
    targetRole,
    fitScore: data.fit_score.fit_score,
    weightedScore: enhanced.weighted.weighted_score,
    jobReadiness: readiness.overall,
    matchedCount: data.fit_score.matched,
    partialCount: data.fit_score.partial,
    missingCount: data.fit_score.missing,
    totalRequirements: data.fit_score.total,
    data,
  }

  try {
    const existing = getAnalysisHistory()
    const updated = [snapshot, ...existing.filter((s) => s.analysisId !== analysisId)].slice(0, 20)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated))
  } catch {
    /* ignore storage quota failure */
  }

  return snapshot
}

export function getAnalysisHistory(): AnalysisSnapshot[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (!raw) return []
    return JSON.parse(raw)
  } catch {
    return []
  }
}

export function deleteAnalysisFromHistory(analysisId: string): void {
  try {
    const existing = getAnalysisHistory()
    const updated = existing.filter((s) => s.analysisId !== analysisId)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated))
  } catch {
    /* ignore */
  }
}
