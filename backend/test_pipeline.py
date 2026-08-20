#!/usr/bin/env python3
"""
ResumeFit — End-to-end pipeline test

Usage:
    python test_pipeline.py                        # uses built-in sample resume
    python test_pipeline.py resume.pdf             # test with a real PDF
    python test_pipeline.py resume.pdf jd.txt      # test with a real JD file
"""

from __future__ import annotations

import json
import sys
import os
from pathlib import Path

# Ensure we can import from backend/
sys.path.insert(0, str(Path(__file__).parent))

from extractor import extract_text, ExtractionError
from segmenter import segment_sections
from parser import parse_fields
from scorer import score
from models import FieldStatus, MatchStatus


# ─── Sample data (used when no file is passed) ───────────────────────────────

SAMPLE_RESUME_TEXT = """\
Jane Smith
jane.smith@email.com | +1-555-123-4567 | linkedin.com/in/janesmith
San Francisco, CA

Summary
Results-driven software engineer with 4 years of experience building
scalable backend systems using Python, FastAPI, and PostgreSQL.

Education
Bachelor of Science in Computer Science
University of California, Berkeley — May 2020

Experience
Senior Software Engineer — Acme Corp (2022 – Present)
- Developed backend microservices using Python and FastAPI
- Designed and optimised PostgreSQL schemas handling 10M+ records
- Built RESTful APIs consumed by mobile and web clients
- Collaborated with DevOps on Docker and Kubernetes deployments

Software Engineer — StartupXYZ (2020 – 2022)
- Implemented REST APIs using Flask and SQLAlchemy
- Wrote unit tests achieving 90% code coverage

Skills
Python, FastAPI, Flask, PostgreSQL, SQL, REST APIs, Docker, Kubernetes,
Git, Linux, SQLAlchemy, Pytest, Redis, JavaScript, TypeScript

Projects
ResumeParser — Open-source Python library for extracting structured data from PDFs
CloudMetrics — Real-time dashboard built with React, FastAPI, and PostgreSQL

Certifications
AWS Certified Developer – Associate (2023)
Python Institute PCEP (2021)
"""

SAMPLE_JD = """\
Python Backend Developer

Requirements:
- Python
- FastAPI
- PostgreSQL
- SQL
- REST APIs
- Docker
- 2+ years of experience
- Bachelor's degree in Computer Science or related field
- Git
- Unit testing experience
"""


# ─── Pipeline runner ──────────────────────────────────────────────────────────

def run_pipeline(resume_text: str, job_description: str, source: str = "sample"):
    separator = "=" * 70

    print(f"\n{separator}")
    print(f"  ResumeFit — Pipeline Test  [{source}]")
    print(separator)

    # Step 1: already have text (or extracted upstream)
    print(f"\n[1] TEXT EXTRACTED — {len(resume_text)} characters")
    print(f"    Preview: {resume_text[:100].strip()!r}...")

    # Step 2: Segmentation
    sections = segment_sections(resume_text)
    print(f"\n[2] SECTIONS FOUND ({len(sections)})")
    for s in sections:
        preview = s.content[:60].replace("\n", " ")
        print(f"    • {s.label:<18} raw='{s.raw_header}'  content='{preview}...'")

    # Step 3: Field parsing
    fields = parse_fields(sections, resume_text)
    print(f"\n[3] FIELDS EXTRACTED ({len(fields)})")
    for f in fields:
        status_marker = "✓" if f.status == FieldStatus.FOUND else "✗"
        value_preview = (f.value or f.reason or "—")[:60]
        print(f"    {status_marker} [{f.field_id:<20}] {f.status:<10}  {value_preview}")

    # Step 4: Scoring
    matches, fit_score = score(fields, job_description)
    print(f"\n[4] REQUIREMENT MATCHING ({len(matches)} requirements)")
    for m in matches:
        marker = {"MATCHED": "✓", "PARTIAL": "~", "MISSING": "✗"}[m.match_status]
        print(f"    {marker} {m.match_status:<8} {m.requirement[:40]:<42} ref={m.evidence_ref or 'none'}")

    # Step 5: Fit score
    print(f"\n[5] FIT SCORE")
    print(f"    Score:   {fit_score.fit_score}/100")
    print(f"    Label:   {fit_score.score_label}")
    print(f"    Matched: {fit_score.matched} / Partial: {fit_score.partial} / Missing: {fit_score.missing} / Total: {fit_score.total}")

    # Full JSON output
    print(f"\n{separator}")
    print("  FULL JSON OUTPUT")
    print(separator)

    from models import AnalysisResponse, CandidateProfile, FieldStatus as FS

    def get_field(fid):
        for f in fields:
            if f.field_id == fid and f.status == FS.FOUND:
                return f.value
        return None

    candidate = CandidateProfile(
        full_name=get_field("CONTACT-NAME"),
        email=get_field("CONTACT-EMAIL"),
        phone=get_field("CONTACT-PHONE"),
        linkedin_url=get_field("CONTACT-URL"),
        highest_degree=get_field("EDUCATION-DEGREE"),
        most_recent_role=get_field("EXPERIENCE-ROLE"),
        location=get_field("CONTACT-LOCATION"),
    )

    response = AnalysisResponse(
        candidate=candidate,
        fields=fields,
        sections_found=sorted({s.label for s in sections}),
        requirements=matches,
        fit_score=fit_score,
        errors=[],
    )

    print(json.dumps(json.loads(response.model_dump_json()), indent=2))

    print(f"\n{separator}")
    passed = fit_score.total > 0
    print(f"  Pipeline status: {'PASS ✓' if passed else 'FAIL ✗'}")
    print(separator)
    return passed


# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    args = sys.argv[1:]

    if not args:
        # Use built-in sample
        print("\nNo file provided — using built-in sample resume.")
        success = run_pipeline(SAMPLE_RESUME_TEXT, SAMPLE_JD, source="built-in sample")
        sys.exit(0 if success else 1)

    resume_path = Path(args[0])
    if not resume_path.exists():
        print(f"ERROR: File not found: {resume_path}")
        sys.exit(1)

    jd_text = SAMPLE_JD
    if len(args) >= 2:
        jd_path = Path(args[1])
        if jd_path.exists():
            jd_text = jd_path.read_text()
        else:
            print(f"WARNING: JD file not found ({args[1]}), using built-in sample JD.")

    print(f"\nLoading resume: {resume_path}")
    data = resume_path.read_bytes()

    try:
        raw_text, file_type = extract_text(resume_path.name, data)
        print(f"File type detected: {file_type.upper()}")
    except ExtractionError as exc:
        print(f"\nEXTRACTION ERROR [{exc.code}]: {exc.detail}")
        sys.exit(1)

    success = run_pipeline(raw_text, jd_text, source=str(resume_path))
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
