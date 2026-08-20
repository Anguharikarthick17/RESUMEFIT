"""
ResumeFit — Scorer

Job Description requirement extraction + deterministic matching against
extracted resume fields.

Rules:
- Extracts only genuine atomic candidate requirements (skills, qualifications, education, experience, responsibilities).
- Filters section headings, company overview, metadata (duration, location, job type), benefits, and boilerplate.
- Every match/partial match must reference an existing field_id.
- Missing evidence → MISSING.
- Deterministic requirement ordering and scoring.
"""

from __future__ import annotations

import re
from typing import List, Dict, Tuple, Optional

from models import (
    ExtractedField,
    FieldStatus,
    RequirementMatch,
    MatchStatus,
    Confidence,
    FitScore,
)


# ─── Score labels ─────────────────────────────────────────────────────────────

def _score_label(score: int) -> str:
    if score >= 85:
        return "Strong Match"
    elif score >= 65:
        return "Good Match"
    elif score >= 45:
        return "Partial Match"
    elif score >= 25:
        return "Weak Match"
    else:
        return "Poor Match"


# ─── JD Parsing & Section Awareness ──────────────────────────────────────────

# Requirement section keywords (candidate-facing qualifications & duties)
_REQ_SECTION_RE = re.compile(
    r"^(?:requirements?|qualifications?|minimum requirements?|basic requirements?|"
    r"required qualifications?|basic qualifications?|minimum qualifications?|"
    r"key qualifications?|skills?|technical skills?|required skills?|"
    r"skills & competencies|core skills|key skills|technologies|tech stack|"
    r"competencies|must haves?|what we('re| are) looking for|who you are|"
    r"who we are looking for|profile|ideal candidate|candidate profile|"
    r"eligibility|preferred skills?|preferred qualifications?|desired skills?|"
    r"nice to haves?|bonus points?|plus|what you('ll| will) need|what you need|"
    r"education|experience|responsibilities|key responsibilities|"
    r"core responsibilities|duties|what you('ll| will) do|role & responsibilities|"
    r"job requirements)\b",
    re.IGNORECASE,
)

# Non-requirement section keywords (company overview, benefits, legal, application instructions)
_NON_REQ_SECTION_RE = re.compile(
    r"^(?:company overview|about (?:us|the company|our company|the team)|"
    r"who we are|our mission|our story|company description|what we offer|"
    r"benefits|perks|compensation|salary & benefits|what you('ll| will) get|"
    r"why join us|culture|life at .*|equal opportunity|eeo|diversity|"
    r"diversity & inclusion|diversity, equity & inclusion|legal notice|"
    r"affirmative action|disclaimer|application instructions|how to apply|"
    r"next steps|hiring process|to apply|contact us|contact|job overview|"
    r"role overview|job summary|about the role|position summary)\b",
    re.IGNORECASE,
)

# Metadata key-value lines (e.g. Duration: 3 - 6 months, Location: San Francisco, etc.)
_METADATA_LINE_RE = re.compile(
    r"^(?:duration|location|job type|employment type|experience level|"
    r"salary|stipend|compensation|department|team|function|work authorization|"
    r"visa|job id|requisition id|posted date|start date|end date|reports to|"
    r"reporting to|workplace type|work mode|schedule|shift|industry|"
    r"position type|work location|job location|contract length|working hours)\s*[:\-–—]\s*.*$",
    re.IGNORECASE,
)

# Standalone metadata tokens that should never be standalone requirements
_STANDALONE_METADATA_RE = re.compile(
    r"^(?:full[\s\-]?time|part[\s\-]?time|contract|internship|remote|hybrid|"
    r"on[\s\-]?site|fresher[\s\/]+student|entry level|mid[\s\-]?senior level|"
    r"junior|senior|\d+\s*(?:months?|years?))\s*$",
    re.IGNORECASE,
)

# Bullet marker regex
_BULLET_PREFIX_RE = re.compile(
    r"^\s*(?:[•\-*·–—\u2022\u25cf\u25cb\u25aa\u2713\u2714\u25b6\u25b8]|\d+[\.\)])\s*"
)

# Boilerplate phrases
_BOILERPLATE_TEXT_RE = re.compile(
    r"(?:equal opportunity employer|affirmative action|qualified applicants will receive|"
    r"submit your (?:resume|application)|to apply|click here to apply|all rights reserved)",
    re.IGNORECASE,
)


def _clean_text_artifacts(text: str) -> str:
    """Clean PDF font cid artifacts and unprintable control characters."""
    text = re.sub(r"\(cid:\d+\)", " ", text)
    text = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", text)
    return text


def _tokenise_jd(job_description: str) -> List[str]:
    """
    Extract a clean, sorted, deduplicated list of genuine atomic candidate requirements from a JD.

    Strategy:
    1. Clean PDF/font encoding artifacts.
    2. Detect and skip job title / header metadata lines.
    3. Categorize sections: candidate requirement sections vs non-requirement sections.
    4. Extract atomic requirement sentences from bullets or requirement blocks.
    5. Filter section headings, metadata (duration, experience level labels), benefits, and boilerplate.
    6. Normalize and sort deterministically.
    """
    cleaned_jd = _clean_text_artifacts(job_description)
    lines = [line.strip() for line in cleaned_jd.splitlines()]

    # Detect job title on the first non-empty line
    title_line = ""
    for line in lines:
        if line:
            if not _BULLET_PREFIX_RE.match(line) and ":" not in line and len(line) <= 80:
                title_line = line.lower()
            break

    current_section = "UNKNOWN"  # "REQ", "NON_REQ", "UNKNOWN"
    raw_candidates: List[str] = []

    for line in lines:
        if not line:
            continue

        clean_line = line.strip()
        header_candidate = re.sub(r"[:\-–—\s]+$", "", clean_line).strip()

        # Check section headers
        if _NON_REQ_SECTION_RE.match(header_candidate) or (clean_line.endswith(":") and _NON_REQ_SECTION_RE.match(clean_line[:-1].strip())):
            current_section = "NON_REQ"
            continue

        if _REQ_SECTION_RE.match(header_candidate) or (clean_line.endswith(":") and _REQ_SECTION_RE.match(clean_line[:-1].strip())):
            current_section = "REQ"
            continue

        # Filter out standalone headings that end in colon with short length
        if clean_line.endswith(":") and len(clean_line) <= 45:
            continue

        # Filter metadata key-values and standalone metadata tokens
        if _METADATA_LINE_RE.match(clean_line) or _STANDALONE_METADATA_RE.match(clean_line):
            continue

        # Filter job title line
        if title_line and clean_line.lower() == title_line:
            continue

        # Filter boilerplate text
        if _BOILERPLATE_TEXT_RE.search(clean_line):
            continue

        # If inside a non-requirement section, skip content
        if current_section == "NON_REQ":
            continue

        is_bullet = bool(_BULLET_PREFIX_RE.match(clean_line))
        text_without_bullet = _BULLET_PREFIX_RE.sub("", clean_line).strip()

        if is_bullet:
            if len(text_without_bullet) >= 3 and not text_without_bullet.endswith(":"):
                raw_candidates.append(text_without_bullet)
        elif current_section == "REQ":
            # In an active requirement section
            if len(clean_line) >= 3 and not clean_line.endswith(":"):
                raw_candidates.append(clean_line)
        elif current_section == "UNKNOWN":
            # No explicit section header yet: accept bullet points or meaningful candidate qualification sentences
            if is_bullet:
                if len(text_without_bullet) >= 3 and not text_without_bullet.endswith(":"):
                    raw_candidates.append(text_without_bullet)
            elif len(clean_line) >= 4 and not clean_line.endswith(":"):
                # Avoid company intro sentences
                if not clean_line.lower().startswith(("we are a", "we are an", "our company", "founded in", "about us", "welcome to")):
                    raw_candidates.append(clean_line)

    # Clean, normalize, and deduplicate requirements
    cleaned_reqs: List[str] = []
    seen: set[str] = set()

    for req in raw_candidates:
        r = req.strip(";, \t")
        # Remove leading 'Requirements:' or 'Must have:' if attached
        r = re.sub(
            r"^(?:requirements?|qualifications?|must have|required|nice to have)\s*[:\-–—]\s*",
            "",
            r,
            flags=re.IGNORECASE,
        ).strip()

        if not r or len(r) < 3:
            continue

        # Skip metadata leftover
        if _METADATA_LINE_RE.match(r) or _STANDALONE_METADATA_RE.match(r):
            continue

        key = r.lower()
        if key not in seen:
            seen.add(key)
            cleaned_reqs.append(r)

    return sorted(cleaned_reqs, key=lambda s: s.lower())


# ─── Matching Logic ───────────────────────────────────────────────────────────

def _fields_index(fields: List[ExtractedField]) -> Dict[str, ExtractedField]:
    return {f.field_id: f for f in fields}


def _found_fields(fields: List[ExtractedField]) -> List[ExtractedField]:
    return [f for f in fields if f.status == FieldStatus.FOUND]


def _skills_set(fields: List[ExtractedField]) -> Tuple[str, List[str]]:
    """Return (evidence_ref, list_of_skill_tokens) if skills were found."""
    for f in fields:
        if f.field_id == "SKILLS-LIST" and f.status == FieldStatus.FOUND and f.value:
            tokens = [t.strip().lower() for t in re.split(r"[,|]+", f.value) if t.strip()]
            return f.field_id, tokens
    return "", []


_STOP_WORDS = {
    "the", "and", "with", "for", "using", "from", "that", "this", "our", "all",
    "must", "have", "basic", "knowledge", "develop", "maintain", "experience",
    "ability", "required", "preferred", "strong", "good", "working", "building",
    "such", "into", "their", "will", "should", "plus", "years", "field", "related"
}


def _match_requirement(
    requirement: str,
    fields: List[ExtractedField],
    skills_ref: str,
    skills_tokens: List[str],
) -> RequirementMatch:
    req_low = requirement.lower()

    # ── 1. Check skills list with word boundary matching ───────────────────
    if skills_tokens:
        for sk in skills_tokens:
            if not sk or len(sk) < 1:
                continue
            # Exact skill match
            if req_low == sk:
                return RequirementMatch(
                    requirement=requirement,
                    match_status=MatchStatus.MATCHED,
                    explanation=f"'{sk.title()}' is listed in the candidate's extracted skills.",
                    evidence_ref=skills_ref,
                    confidence=Confidence.HIGH,
                )
            # Word boundary search: skill token inside requirement sentence
            pattern = r"\b" + re.escape(sk) + r"\b"
            if re.search(pattern, req_low, re.IGNORECASE):
                return RequirementMatch(
                    requirement=requirement,
                    match_status=MatchStatus.MATCHED,
                    explanation=f"Skill '{sk.title()}' matches requirement '{requirement}'.",
                    evidence_ref=skills_ref,
                    confidence=Confidence.HIGH,
                )

    # ── 2. Check Degree / Education field ──────────────────────────────────
    degree_terms = {
        "bachelor", "bachelors", "bachelor's", "master", "masters", "master's",
        "degree", "phd", "ph.d", "doctorate", "mba", "b.tech", "btech", "bsc",
        "b.s", "b.e", "m.tech", "msc", "diploma", "pursuing"
    }
    major_terms = [
        "computer science", "computer engineering", "information technology",
        "software engineering", "data science", "electrical engineering",
        "engineering", "mathematics"
    ]
    req_words_list = sorted(set(re.findall(r"\b[a-z0-9\.\'\-]{2,}\b", req_low)))
    req_words_set = set(req_words_list)

    if req_words_set & degree_terms:
        degree_field = next((f for f in fields if f.field_id == "EDUCATION-DEGREE"), None)
        if degree_field and degree_field.status == FieldStatus.FOUND and degree_field.value:
            cand_degree_low = (degree_field.value or "").lower()
            has_req_major = any(m in req_low for m in major_terms)
            major_match = any(m in req_low and m in cand_degree_low for m in major_terms)
            level_match = any(d in req_low and d in cand_degree_low for d in ("bachelor", "master", "phd", "b.tech", "bsc", "b.e", "associate"))

            if has_req_major:
                if major_match and level_match:
                    return RequirementMatch(
                        requirement=requirement,
                        match_status=MatchStatus.MATCHED,
                        explanation=f"Education matches degree and field: candidate has '{degree_field.value}'.",
                        evidence_ref="EDUCATION-DEGREE",
                        confidence=Confidence.HIGH,
                    )
                return RequirementMatch(
                    requirement=requirement,
                    match_status=MatchStatus.PARTIAL,
                    explanation=f"Degree level matches requirement: candidate has '{degree_field.value}'.",
                    evidence_ref="EDUCATION-DEGREE",
                    confidence=Confidence.MEDIUM,
                )
            else:
                if level_match:
                    return RequirementMatch(
                        requirement=requirement,
                        match_status=MatchStatus.MATCHED,
                        explanation=f"Education matches degree requirement: candidate has '{degree_field.value}'.",
                        evidence_ref="EDUCATION-DEGREE",
                        confidence=Confidence.HIGH,
                    )
                return RequirementMatch(
                    requirement=requirement,
                    match_status=MatchStatus.PARTIAL,
                    explanation=f"Degree requirement partially matched: candidate has '{degree_field.value}'.",
                    evidence_ref="EDUCATION-DEGREE",
                    confidence=Confidence.MEDIUM,
                )

    # ── 3. Check Projects / Certifications ─────────────────────────────────
    if "project" in req_low or "building" in req_low:
        proj_field = next((f for f in fields if f.field_id == "PROJECT-LIST"), None)
        if proj_field and proj_field.status == FieldStatus.FOUND and proj_field.value:
            proj_low = (proj_field.value or "").lower()
            key_words = [w for w in req_words_list if w not in _STOP_WORDS and len(w) >= 3]
            if any(w in proj_low for w in key_words):
                return RequirementMatch(
                    requirement=requirement,
                    match_status=MatchStatus.MATCHED,
                    explanation=f"Projects match requirement: '{proj_field.value}'.",
                    evidence_ref="PROJECT-LIST",
                    confidence=Confidence.HIGH,
                )

    if "certif" in req_low or "license" in req_low or "aws" in req_low:
        cert_field = next((f for f in fields if f.field_id == "CERT-LIST"), None)
        if cert_field and cert_field.status == FieldStatus.FOUND and cert_field.value:
            cert_low = (cert_field.value or "").lower()
            key_words = [w for w in req_words_list if w not in _STOP_WORDS and len(w) >= 3]
            if any(w in cert_low for w in key_words):
                return RequirementMatch(
                    requirement=requirement,
                    match_status=MatchStatus.MATCHED,
                    explanation=f"Certification matches requirement: '{cert_field.value}'.",
                    evidence_ref="CERT-LIST",
                    confidence=Confidence.HIGH,
                )

    # ── 4. Check Experience Role & Years ───────────────────────────────────
    exp_terms = {"experience", "years", "year", "work", "proficient", "proficiency"}
    if req_words_set & exp_terms:
        exp_field = next((f for f in fields if f.field_id == "EXPERIENCE-ROLE"), None)
        if exp_field and exp_field.status == FieldStatus.FOUND and exp_field.value:
            return RequirementMatch(
                requirement=requirement,
                match_status=MatchStatus.PARTIAL,
                explanation=f"Experience requirement partially matched: candidate has role '{exp_field.value}'.",
                evidence_ref="EXPERIENCE-ROLE",
                confidence=Confidence.MEDIUM,
            )

    # ── 5. Full-text search across all found fields ────────────────────────
    for f in _found_fields(fields):
        haystack = (f.value or "") + " " + (f.evidence or "")
        haystack_low = haystack.lower()
        if req_low in haystack_low:
            return RequirementMatch(
                requirement=requirement,
                match_status=MatchStatus.MATCHED,
                explanation=f"'{requirement}' found in {f.category} ({f.field_id}).",
                evidence_ref=f.field_id,
                confidence=Confidence.HIGH,
            )

    # ── 6. Partial / Keyword overlap across all field text ─────────────────
    content_words = [w for w in req_words_list if w not in _STOP_WORDS and len(w) >= 3]
    if content_words:
        best_overlap = 0
        best_field: Optional[ExtractedField] = None

        for f in _found_fields(fields):
            haystack_low = ((f.value or "") + " " + (f.evidence or "")).lower()
            field_words = set(re.findall(r"\b[a-z0-9\.\'\-]{2,}\b", haystack_low))
            overlap = sum(1 for w in content_words if w in field_words or any(w in fw for fw in field_words))
            if overlap > best_overlap:
                best_overlap = overlap
                best_field = f

        if best_field and best_overlap >= max(1, len(content_words) // 2):
            return RequirementMatch(
                requirement=requirement,
                match_status=MatchStatus.PARTIAL,
                explanation=(
                    f"Partial match: keywords from '{requirement}' appear "
                    f"in {best_field.category} ({best_field.field_id})."
                ),
                evidence_ref=best_field.field_id,
                confidence=Confidence.MEDIUM,
            )

    # ── 7. No match ────────────────────────────────────────────────────────
    return RequirementMatch(
        requirement=requirement,
        match_status=MatchStatus.MISSING,
        explanation=f"No evidence found in the resume for '{requirement}'.",
        evidence_ref=None,
        confidence=Confidence.HIGH,
    )


# ─── Main Entry ──────────────────────────────────────────────────────────────

def score(
    fields: List[ExtractedField],
    job_description: str,
) -> Tuple[List[RequirementMatch], FitScore]:
    """
    Match extracted resume fields against job description requirements.
    Returns (matches, fit_score).
    """
    requirements = _tokenise_jd(job_description)
    if not requirements:
        empty_score = FitScore(
            fit_score=0, score_label="No Requirements", matched=0, partial=0, missing=0, total=0
        )
        return [], empty_score

    skills_ref, skills_tokens = _skills_set(fields)
    matches: List[RequirementMatch] = []
    for req in requirements:
        m = _match_requirement(req, fields, skills_ref, skills_tokens)
        matches.append(m)

    # Deterministic counts
    matched_count = sum(1 for m in matches if m.match_status == MatchStatus.MATCHED)
    partial_count = sum(1 for m in matches if m.match_status == MatchStatus.PARTIAL)
    missing_count = sum(1 for m in matches if m.match_status == MatchStatus.MISSING)
    total = len(matches)

    # Score: MATCHED=1 point, PARTIAL=0.5 point
    raw_score = (matched_count + 0.5 * partial_count) / total * 100
    fit_score_val = int(round(raw_score))

    fit_score = FitScore(
        fit_score=fit_score_val,
        score_label=_score_label(fit_score_val),
        matched=matched_count,
        partial=partial_count,
        missing=missing_count,
        total=total,
    )
    return matches, fit_score
