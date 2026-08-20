"""
ResumeFit — Section Segmenter

Fixed, versioned allowlist of resume section names.
Maps common header variants to canonical section labels.

Rules:
- Do NOT invent sections that are absent from the resume.
- Do NOT let external input define section names.
- Returns only sections whose headers appear in the raw text.
"""

from __future__ import annotations

import re
from typing import List, Dict

from models import ResumeSection


# ─── Fixed allowlist (canonical → variants) ──────────────────────────────────
# VERSIONED: v1.0 — extend only here, never infer from LLM.

SECTION_ALLOWLIST: Dict[str, List[str]] = {
    "Contact": [
        "contact",
        "contact information",
        "contact details",
        "personal information",
        "personal details",
        "profile",
        "about me",
    ],
    "Education": [
        "education",
        "academic background",
        "academic qualifications",
        "academic history",
        "educational background",
        "qualifications",
    ],
    "Experience": [
        "experience",
        "work experience",
        "professional experience",
        "work history",
        "employment history",
        "employment",
        "career history",
    ],
    "Skills": [
        "skills",
        "technical skills",
        "technologies",
        "core competencies",
        "competencies",
        "key skills",
        "tools & technologies",
        "tools and technologies",
        "programming languages",
        "languages & technologies",
        "areas of expertise",
    ],
    "Projects": [
        "projects",
        "academic projects",
        "personal projects",
        "side projects",
        "key projects",
        "notable projects",
        "selected projects",
    ],
    "Certifications": [
        "certifications",
        "certificates",
        "professional certifications",
        "licenses & certifications",
        "licenses and certifications",
        "credentials",
        "awards & certifications",
    ],
    "Summary": [
        "summary",
        "professional summary",
        "executive summary",
        "objective",
        "career objective",
        "professional objective",
        "overview",
    ],
    "Achievements": [
        "achievements",
        "accomplishments",
        "awards",
        "honors",
        "honors & awards",
    ],
    "Languages": [
        "languages",
        "spoken languages",
        "language proficiency",
    ],
    "Volunteer": [
        "volunteer",
        "volunteer experience",
        "volunteering",
        "community service",
    ],
    "Publications": [
        "publications",
        "research",
        "papers",
        "research papers",
    ],
    "References": [
        "references",
        "referees",
    ],
}

# Reverse map: normalised variant → canonical name
_VARIANT_MAP: Dict[str, str] = {}
for _canonical, _variants in SECTION_ALLOWLIST.items():
    for _v in _variants:
        _VARIANT_MAP[_v.lower().strip()] = _canonical


def _normalise(text: str) -> str:
    """Lower-case and strip the text for comparison."""
    return re.sub(r"\s+", " ", text).lower().strip()


def _looks_like_header(line: str) -> bool:
    """
    Heuristic: a header line is typically short (≤ 60 chars),
    has no sentence-ending punctuation, and is not purely numeric.
    """
    stripped = line.strip()
    if not stripped or len(stripped) > 60:
        return False
    if stripped[-1] in ".,:;!?":
        return False
    if stripped.replace(" ", "").isdigit():
        return False
    return True


def segment_sections(raw_text: str) -> List[ResumeSection]:
    """
    Segment raw resume text into named sections using the fixed allowlist.

    Algorithm:
    1. Split text into lines.
    2. For each short line, check if its normalised form matches a known variant.
    3. Collect content until the next recognised header.

    Returns a list of ResumeSection objects in document order.
    """
    lines = raw_text.splitlines()
    sections: List[ResumeSection] = []

    current_canonical: str | None = None
    current_raw_header: str = ""
    current_content_lines: List[str] = []

    def flush():
        nonlocal current_canonical, current_raw_header, current_content_lines
        if current_canonical is not None:
            content = "\n".join(current_content_lines).strip()
            if content:
                sections.append(
                    ResumeSection(
                        label=current_canonical,
                        raw_header=current_raw_header,
                        content=content,
                    )
                )
        current_canonical = None
        current_raw_header = ""
        current_content_lines = []

    # Accumulate text before first recognised section as "Contact" candidate
    preamble_lines: List[str] = []

    for line in lines:
        norm = _normalise(line)

        if _looks_like_header(line) and norm in _VARIANT_MAP:
            if current_canonical is None and preamble_lines:
                # Treat preamble as Contact section if not already set
                preamble_content = "\n".join(preamble_lines).strip()
                if preamble_content:
                    sections.append(
                        ResumeSection(
                            label="Contact",
                            raw_header="[preamble]",
                            content=preamble_content,
                        )
                    )
                preamble_lines = []

            flush()
            current_canonical = _VARIANT_MAP[norm]
            current_raw_header = line.strip()
        else:
            if current_canonical is None:
                preamble_lines.append(line)
            else:
                current_content_lines.append(line)

    flush()

    # If nothing was found, wrap entire text as a single unnamed section
    if not sections and raw_text.strip():
        sections.append(
            ResumeSection(
                label="Contact",
                raw_header="[full-text]",
                content=raw_text.strip(),
            )
        )

    return sections
