"""
ResumeFit — Field Parser

Extracts the 10 fixed structured fields from segmented resume sections.
Every extracted field carries an evidence snippet pointing back to actual
text in the resume. No LLM, no inference beyond deterministic regex/heuristics.

Fields:
  1. Full Name               → CONTACT-NAME
  2. Email                   → CONTACT-EMAIL
  3. Phone Number            → CONTACT-PHONE
  4. LinkedIn / Portfolio URL → CONTACT-URL
  5. Highest Degree           → EDUCATION-DEGREE
  6. Most Recent Job Title    → EXPERIENCE-ROLE
  7. Location / City          → CONTACT-LOCATION
  8. Skills                  → SKILLS-LIST
  9. Certifications           → CERT-LIST
 10. Projects                → PROJECT-LIST
"""

from __future__ import annotations

import re
from typing import List, Optional, Dict

from models import ExtractedField, FieldStatus, ResumeSection


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _first_line(text: str) -> str:
    for line in text.splitlines():
        s = line.strip()
        if s:
            return s
    return ""


def _make_found(field_id: str, category: str, value: str,
                evidence: str, source_section: str) -> ExtractedField:
    return ExtractedField(
        field_id=field_id,
        category=category,
        status=FieldStatus.FOUND,
        value=value,
        evidence=evidence,
        source_section=source_section,
        reason=None,
    )


def _make_not_found(field_id: str, category: str, reason: str) -> ExtractedField:
    return ExtractedField(
        field_id=field_id,
        category=category,
        status=FieldStatus.NOT_FOUND,
        value=None,
        evidence=None,
        source_section=None,
        reason=reason,
    )


# ─── Regex patterns ──────────────────────────────────────────────────────────

_EMAIL_RE = re.compile(
    r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}"
)

_PHONE_RE = re.compile(
    r"(?:\+?[\d\s\-().]{7,20})"
    r"(?=\s|$|[^\d])"
)
# Tighter phone: must contain at least 7 consecutive digits
_PHONE_DIGITS = re.compile(r"\d[\d\s\-().]{6,}\d")

# Ordered specificity: LinkedIn > GitHub > full URL > generic domain
_LINKEDIN_RE = re.compile(r"(?:https?://)?(?:www\.)?linkedin\.com/in/[\w\-]+")
_GITHUB_RE = re.compile(r"(?:https?://)?(?:www\.)?github\.com/[\w\-]+")
_FULL_URL_RE = re.compile(r"https?://[^\s]+")
_PORTFOLIO_RE = re.compile(r"(?:www\.)?[a-zA-Z0-9\-]+\.(?:io|dev|me)(?:/[^\s]*)?")  # .io/.dev/.me only

_DEGREE_KEYWORDS = [
    "ph.d", "phd", "doctor of philosophy",
    "m.sc", "msc", "m.s.", "master of science", "master of",
    "m.tech", "mtech", "m.e.", "m.eng",
    "m.b.a", "mba", "master of business",
    "b.sc", "bsc", "b.s.", "bachelor of science", "bachelor of",
    "b.tech", "btech", "b.e.", "b.eng", "bachelor of engineering",
    "b.a.", "ba", "bachelor of arts",
    "b.com", "bcom", "bachelor of commerce",
    "associate",
    "diploma",
    "high school",
]

_JOB_TITLE_KEYWORDS = [
    "engineer", "developer", "analyst", "manager", "director",
    "architect", "consultant", "designer", "scientist", "researcher",
    "intern", "associate", "specialist", "lead", "head", "vp",
    "officer", "coordinator", "administrator", "executive",
]

_CITY_KEYWORDS = re.compile(
    r"\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)?,\s*[A-Z]{2,}|"   # City, ST
    r"[A-Z][a-z]+(?:\s[A-Z][a-z]+)*)\b"
)


def _clean_str(text: str) -> str:
    if not text:
        return ""
    text = re.sub(r"\(cid:\d+\)", " ", text)
    text = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", text)
    text = re.sub(r"[\uf000-\uf8ff]", "•", text)
    return text.strip()


def _extract_name(sections: List[ResumeSection]) -> ExtractedField:
    """
    Full name: extracts candidate's name from Contact / preamble section.
    Supports Title Case, ALL CAPS, middle initials, hyphenated and multi-part names.
    Rejects header words, emails, URLs, and phone numbers.
    """
    field_id = "CONTACT-NAME"
    category = "Full Name"

    contact_sections = [s for s in sections if s.label == "Contact"]
    candidates = contact_sections if contact_sections else sections

    # Blacklist of words that are headers, job roles, or resume metadata
    BLACKLIST = {
        "resume", "curriculum", "vitae", "cv", "profile", "contact", "summary",
        "education", "experience", "skills", "projects", "certifications", "about",
        "details", "information", "personal", "page", "email", "phone", "portfolio",
        "github", "linkedin", "address", "developer", "engineer", "analyst", "manager",
        "intern", "specialist", "consultant", "architect", "lead", "director"
    }

    def is_valid_name_token(t: str) -> bool:
        clean_t = t.strip(".,;:'\"")
        if not clean_t or len(clean_t) < 2:
            # allow single letter middle initial like 'A.' or 'M.'
            if len(t.strip(".,")) == 1 and t.strip(".,").isalpha():
                return True
            return False
        if clean_t.lower() in BLACKLIST:
            return False
        # Must be alphabetic, allowing hyphens/apostrophes (e.g. O'Connor, Mary-Jane)
        return bool(re.match(r"^[A-Za-z]+(?:['\-][A-Za-z]+)*\.?$", clean_t))

    for sec in candidates:
        for raw_line in sec.content.splitlines():
            line = _clean_str(raw_line).strip()
            if not line:
                continue

            # Strip leading bullets / prefixes
            line = re.sub(r"^\s*(?:[•\-*·–—\u2022\u25cf\u25cb\u25aa]|\d+[\.\)])\s*", "", line)
            line = re.sub(r"^(?:name|candidate name|full name)\s*[:\-–—]\s*", "", line, flags=re.IGNORECASE).strip()

            # If line has pipe or dash or comma separating name from contact/role/degree, take first segment
            segments = re.split(
                r"\s+[|•·]\s+|\s+[-–—]\s+|,\s*(?=(?:phd|b\.?tech|m\.?tech|m\.?s|b\.?s|bachelor|master|software|developer|engineer))",
                line,
                flags=re.IGNORECASE,
            )
            candidate_str = segments[0].strip()

            # Skip lines with email, urls, phone numbers
            if ("@" in candidate_str or "http" in candidate_str.lower() or "www." in candidate_str.lower()
                    or ".com" in candidate_str.lower() or re.search(r"\d{3,}", candidate_str)):
                continue

            words = candidate_str.split()
            if 2 <= len(words) <= 4:
                # Check if all words are valid name tokens
                if all(is_valid_name_token(w) for w in words):
                    is_title_case = all(w[0].isupper() for w in words if w[0].isalpha())
                    is_all_caps = candidate_str.isupper()
                    if is_title_case or is_all_caps:
                        formatted_name = candidate_str.title() if is_all_caps else candidate_str
                        return _make_found(field_id, category, formatted_name, raw_line.strip(), sec.label)

    return _make_not_found(field_id, category, "No name pattern found in Contact section.")


def _extract_email(full_text: str) -> ExtractedField:
    field_id = "CONTACT-EMAIL"
    category = "Email"
    m = _EMAIL_RE.search(full_text)
    if m:
        val = m.group(0)
        # Find the line containing it for evidence
        for line in full_text.splitlines():
            if val in line:
                return _make_found(field_id, category, val, line.strip(), "Contact")
        return _make_found(field_id, category, val, val, "Contact")
    return _make_not_found(field_id, category, "No email address found.")


def _extract_phone(full_text: str) -> ExtractedField:
    field_id = "CONTACT-PHONE"
    category = "Phone Number"
    # Also capture an optional leading + (international prefix)
    _PHONE_FULL = re.compile(r"\+?\d[\d\s\-().]{5,}\d")
    for line in full_text.splitlines():
        m = _PHONE_FULL.search(line)
        if m:
            val = m.group(0).strip()
            digit_count = len(re.sub(r"\D", "", val))
            # At least 7 digits, not a pure year (4 digits)
            if digit_count >= 7:
                return _make_found(field_id, category, val, line.strip(), "Contact")
    return _make_not_found(field_id, category, "No phone number found.")


def _extract_url(full_text: str) -> ExtractedField:
    field_id = "CONTACT-URL"
    category = "LinkedIn / Portfolio URL"

    for pattern in (_LINKEDIN_RE, _GITHUB_RE, _FULL_URL_RE, _PORTFOLIO_RE):
        m = pattern.search(full_text)
        if m:
            val = m.group(0).rstrip(".,;)")
            for line in full_text.splitlines():
                if val in line:
                    return _make_found(field_id, category, val, line.strip(), "Contact")
            return _make_found(field_id, category, val, val, "Contact")
    return _make_not_found(field_id, category, "No LinkedIn or portfolio URL found.")


def _extract_degree(sections: List[ResumeSection]) -> ExtractedField:
    field_id = "EDUCATION-DEGREE"
    category = "Highest Degree + Institution + Graduation Year"

    edu_sections = [s for s in sections if s.label == "Education"]
    if not edu_sections:
        return _make_not_found(field_id, category, "No Education section found.")

    # Priority order: PhD > Master > Bachelor > Associate > Diploma
    priority = ["ph.d", "phd", "doctor", "m.sc", "msc", "m.s", "master", "m.tech",
                "mtech", "m.b.a", "mba", "b.sc", "bsc", "b.s", "b.tech", "btech",
                "b.e", "bachelor", "b.a", "b.com", "associate", "diploma"]

    best_line: Optional[str] = None
    best_priority: int = 9999
    best_section: str = "Education"

    for sec in edu_sections:
        for line in sec.content.splitlines():
            low = line.lower()
            for idx, kw in enumerate(priority):
                if kw in low and idx < best_priority:
                    best_priority = idx
                    best_line = line.strip()
                    best_section = sec.label

    if best_line:
        return _make_found(field_id, category, best_line, best_line, best_section)
    return _make_not_found(field_id, category, "No degree keyword found in Education section.")


def _extract_recent_role(sections: List[ResumeSection]) -> ExtractedField:
    field_id = "EXPERIENCE-ROLE"
    category = "Most Recent Job Title + Company"

    exp_sections = [s for s in sections if s.label == "Experience"]
    if not exp_sections:
        return _make_not_found(field_id, category, "No Experience section found.")

    # The first meaningful line of the first experience section is typically the most recent role
    for sec in exp_sections:
        for line in sec.content.splitlines():
            stripped = line.strip()
            if not stripped:
                continue
            low = stripped.lower()
            if any(kw in low for kw in _JOB_TITLE_KEYWORDS):
                return _make_found(field_id, category, stripped, stripped, sec.label)
        # Fall back to first non-empty line if no keyword matched
        first = _first_line(sec.content)
        if first:
            return _make_found(field_id, category, first, first, sec.label)

    return _make_not_found(field_id, category, "No job title found in Experience section.")


def _extract_location(sections: List[ResumeSection], full_text: str) -> ExtractedField:
    field_id = "CONTACT-LOCATION"
    category = "Location / City"

    contact_sections = [s for s in sections if s.label == "Contact"]
    search_text = "\n".join(s.content for s in contact_sections) if contact_sections else full_text[:500]

    # Look for "City, ST" or "City, Country" patterns
    city_re = re.compile(
        r"\b([A-Z][a-z]+(?:[\s\-][A-Z][a-z]+)*,\s*(?:[A-Z]{2,}|[A-Z][a-z]+))\b"
    )
    m = city_re.search(search_text)
    if m:
        val = m.group(1).strip()
        for line in search_text.splitlines():
            if val in line:
                return _make_found(field_id, category, val, line.strip(), "Contact")
        return _make_found(field_id, category, val, val, "Contact")
    return _make_not_found(field_id, category, "No location/city pattern found.")


def _extract_skills(sections: List[ResumeSection]) -> ExtractedField:
    field_id = "SKILLS-LIST"
    category = "Skills"

    skill_sections = [s for s in sections if s.label == "Skills"]
    if not skill_sections:
        return _make_not_found(field_id, category, "No Skills section found.")

    # Collect all tokens from the skills section
    all_text = _clean_str("\n".join(s.content for s in skill_sections))
    # Split by common delimiters
    tokens = re.split(r"[,|•\n·/\\]+", all_text)
    skills = [re.sub(r"^\s*[-•*·–—]\s*", "", t).strip() for t in tokens if t.strip() and len(t.strip()) > 1]
    # Deduplicate preserving order
    seen: set[str] = set()
    unique_skills: list[str] = []
    for sk in skills:
        if not sk or len(sk) < 2:
            continue
        low = sk.lower()
        if low not in seen:
            seen.add(low)
            unique_skills.append(sk)

    if unique_skills:
        value = ", ".join(unique_skills)
        evidence = all_text.strip()[:300]  # cap evidence length
        return _make_found(field_id, category, value, evidence, "Skills")

    return _make_not_found(field_id, category, "Skills section found but no parseable skills extracted.")


def _extract_certifications(sections: List[ResumeSection]) -> ExtractedField:
    field_id = "CERT-LIST"
    category = "Certifications"

    cert_sections = [s for s in sections if s.label == "Certifications"]
    if not cert_sections:
        return _make_not_found(field_id, category, "No Certifications section found.")

    all_text = _clean_str("\n".join(s.content for s in cert_sections))
    raw_lines = [l.strip() for l in all_text.splitlines() if l.strip()]
    # Strip bullet artifacts from individual lines
    cleaned_lines = [re.sub(r"^\s*(?:[•\-*·–—\u2022\u25cf\u25cb\u25aa]|\d+[\.\)])\s*", "", l).strip() for l in raw_lines]
    cleaned_lines = [l for l in cleaned_lines if l and len(l) > 2]
    if cleaned_lines:
        value = " | ".join(cleaned_lines)
        return _make_found(field_id, category, value, all_text.strip()[:300], "Certifications")

    return _make_not_found(field_id, category, "Certifications section found but no items extracted.")


def _extract_projects(sections: List[ResumeSection]) -> ExtractedField:
    field_id = "PROJECT-LIST"
    category = "Projects"

    proj_sections = [s for s in sections if s.label == "Projects"]
    if not proj_sections:
        return _make_not_found(field_id, category, "No Projects section found.")

    all_text = _clean_str("\n".join(s.content for s in proj_sections))
    # Extract project names: lines that look like titles
    raw_lines = [l.strip() for l in all_text.splitlines() if l.strip()]
    cleaned_lines = [re.sub(r"^\s*(?:[•\-*·–—\u2022\u25cf\u25cb\u25aa]|\d+[\.\)])\s*", "", l).strip() for l in raw_lines]
    cleaned_lines = [l for l in cleaned_lines if l and len(l) > 2]
    if cleaned_lines:
        value = " | ".join(cleaned_lines[:10])  # cap at 10 project entries
        return _make_found(field_id, category, value, all_text.strip()[:400], "Projects")

    return _make_not_found(field_id, category, "Projects section found but no items extracted.")


# ─── Main entry ──────────────────────────────────────────────────────────────

# Fixed field ordering — deterministic, matches spec
_FIELD_ORDER = [
    "CONTACT-NAME",
    "CONTACT-EMAIL",
    "CONTACT-PHONE",
    "CONTACT-URL",
    "EDUCATION-DEGREE",
    "EXPERIENCE-ROLE",
    "CONTACT-LOCATION",
    "SKILLS-LIST",
    "CERT-LIST",
    "PROJECT-LIST",
]


def parse_fields(sections: List[ResumeSection], full_text: str) -> List[ExtractedField]:
    """
    Extract the 10 fixed structured fields from segmented resume sections.
    Returns fields in deterministic order defined by _FIELD_ORDER.
    """
    results: Dict[str, ExtractedField] = {
        "CONTACT-NAME":     _extract_name(sections),
        "CONTACT-EMAIL":    _extract_email(full_text),
        "CONTACT-PHONE":    _extract_phone(full_text),
        "CONTACT-URL":      _extract_url(full_text),
        "EDUCATION-DEGREE": _extract_degree(sections),
        "EXPERIENCE-ROLE":  _extract_recent_role(sections),
        "CONTACT-LOCATION": _extract_location(sections, full_text),
        "SKILLS-LIST":      _extract_skills(sections),
        "CERT-LIST":        _extract_certifications(sections),
        "PROJECT-LIST":     _extract_projects(sections),
    }
    return [results[fid] for fid in _FIELD_ORDER]
