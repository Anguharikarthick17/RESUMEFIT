"""
ResumeFit — FastAPI Application

Endpoints:
- POST /api/screening                      → Full multi-resume screening + Supabase persistence & ranking
- POST /api/candidates/resume              → Candidate uploads resume (extracts fields, creates profile & resume)
- GET  /api/candidates/{id}                → Get candidate profile details
- GET  /api/candidates/{id}/matches        → Candidate calculates fit across all active jobs
- POST /api/jobs/{id}/apply                → Candidate applies to job (persists application & recruiter screening result)
- GET  /api/candidates/{id}/applications   → Candidate views their application status
- GET  /api/jobs                           → List all jobs with applicant statistics
- GET  /api/jobs/active                    → List active jobs for candidate marketplace
- GET  /api/jobs/{id}/results              → Get ranked candidates & evidence for a job
- POST /api/decisions                      → Update recruiter decision (shortlisted, review, rejected)
- GET  /api/health                         → Liveness & database status check
"""

from __future__ import annotations

import traceback
from typing import List, Optional, Dict, Any

from fastapi import FastAPI, File, Form, HTTPException, UploadFile, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from extractor import extract_text, ExtractionError
from segmenter import segment_sections
from parser import parse_fields
from scorer import score
from models import (
    AnalysisResponse,
    BatchAnalysisResponse,
    BatchCandidateItem,
    CandidateProfile,
    ExtractedField,
    FieldStatus,
    FitScore,
)
import supabase_client as db

# ─── App setup ────────────────────────────────────────────────────────────────

app = FastAPI(
    title="ResumeFit API",
    description="Two-Sided Evidence-Backed AI Recruitment & Career Platform with Supabase PostgreSQL & Storage.",
    version="2.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Helper ───────────────────────────────────────────────────────────────────

def _build_candidate_profile(fields: List[ExtractedField]) -> CandidateProfile:
    def get(field_id: str) -> str | None:
        for f in fields:
            if f.field_id == field_id and f.status == FieldStatus.FOUND:
                return f.value
        return None

    return CandidateProfile(
        full_name=get("CONTACT-NAME"),
        email=get("CONTACT-EMAIL"),
        phone=get("CONTACT-PHONE"),
        linkedin_url=get("CONTACT-URL"),
        highest_degree=get("EDUCATION-DEGREE"),
        most_recent_role=get("EXPERIENCE-ROLE"),
        location=get("CONTACT-LOCATION"),
    )


def _process_single_resume(filename: str, data: bytes, job_description: str) -> AnalysisResponse:
    errors: list[str] = []

    # 1. Extract
    raw_text, _ = extract_text(filename, data)

    # 2. Segment
    try:
        sections = segment_sections(raw_text)
        sections_found = sorted({s.label for s in sections})
    except Exception as exc:
        errors.append(f"Segmentation warning: {exc}")
        sections = []
        sections_found = []

    # 3. Parse
    try:
        fields = parse_fields(sections, raw_text)
    except Exception as exc:
        errors.append(f"Field parsing warning: {exc}")
        fields = []

    # 4. Score
    try:
        matches, fit_score = score(fields, job_description)
    except Exception as exc:
        errors.append(f"Scoring warning: {exc}")
        matches = []
        fit_score = FitScore(fit_score=0, score_label="Error", matched=0, partial=0, missing=0, total=0)

    candidate = _build_candidate_profile(fields)

    return AnalysisResponse(
        candidate=candidate,
        fields=fields,
        sections_found=sections_found,
        requirements=matches,
        fit_score=fit_score,
        errors=errors,
    )


# ─── Data Transfer Models ──────────────────────────────────────────────────────

class RecruiterDecisionRequest(BaseModel):
    screening_result_id: str
    decision: str  # 'undecided' | 'shortlisted' | 'review' | 'rejected'
    notes: Optional[str] = None


class CandidateApplyRequest(BaseModel):
    candidate_id: str
    resume_id: Optional[str] = None


# ─── General Routes ──────────────────────────────────────────────────────────

@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "service": "resumefit",
        "supabase_connected": db.is_supabase_enabled(),
    }


@app.post("/api/analyze", response_model=AnalysisResponse)
async def analyze(
    resume: UploadFile = File(..., description="Resume file — PDF or DOCX"),
    job_description: str = Form(..., description="Job description text"),
):
    try:
        data = await resume.read()
        return _process_single_resume(resume.filename or "resume", data, job_description)
    except ExtractionError as exc:
        raise HTTPException(
            status_code=422,
            detail={"code": exc.code, "message": exc.detail},
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail={"code": "INTERNAL_ERROR", "message": str(exc)},
        )


@app.post("/api/analyze-batch", response_model=BatchAnalysisResponse)
async def analyze_batch(
    resumes: List[UploadFile] = File(..., description="Multiple candidate resume files"),
    job_description: str = Form(..., description="Target job description text"),
):
    results: List[BatchCandidateItem] = []
    successful = 0
    failed = 0

    for resume in resumes:
        fname = resume.filename or "resume"
        try:
            data = await resume.read()
            resp = _process_single_resume(fname, data, job_description)
            results.append(BatchCandidateItem(filename=fname, status="success", data=resp))
            successful += 1
        except ExtractionError as exc:
            results.append(
                BatchCandidateItem(
                    filename=fname,
                    status="error",
                    error={"code": exc.code, "message": exc.detail},
                )
            )
            failed += 1
        except Exception as exc:
            results.append(
                BatchCandidateItem(
                    filename=fname,
                    status="error",
                    error={"code": "INTERNAL_ERROR", "message": str(exc)},
                )
            )
            failed += 1

    return BatchAnalysisResponse(
        total=len(resumes),
        successful=successful,
        failed=failed,
        results=results,
    )


# ─── Candidate Portal Endpoints ───────────────────────────────────────────────

@app.post("/api/candidates/resume")
async def upload_candidate_resume(
    resume: UploadFile = File(..., description="Candidate resume file (PDF or DOCX)"),
):
    """
    Candidate uploads their master resume:
    - Extracts 10 structured fields with evidence
    - Deduplicates via SHA-256
    - Uploads file to Supabase Storage
    - Persists candidate profile & resume metadata in Supabase
    """
    fname = resume.filename or "candidate_resume.docx"
    file_bytes = await resume.read()

    try:
        raw_text, ext = extract_text(fname, file_bytes)
        sections = segment_sections(raw_text)
        fields = parse_fields(sections, raw_text)
        candidate_profile = _build_candidate_profile(fields)

        cand_name = candidate_profile.full_name or fname.replace(".docx", "").replace(".pdf", "")

        saved = db.upsert_candidate_and_resume(
            candidate_name=cand_name,
            email=candidate_profile.email,
            phone=candidate_profile.phone,
            location=candidate_profile.location,
            linkedin_url=candidate_profile.linkedin_url,
            highest_degree=candidate_profile.highest_degree,
            most_recent_role=candidate_profile.most_recent_role,
            fields_list=[f.model_dump() for f in fields],
            filename=fname,
            file_bytes=file_bytes,
            file_type=ext,
            extracted_text=raw_text,
        )

        return {
            "candidate": saved["candidate"],
            "resume_id": saved.get("resume_id"),
            "is_duplicate": saved.get("is_duplicate", False),
            "profile": candidate_profile.model_dump(),
            "fields": [f.model_dump() for f in fields],
            "raw_text_preview": raw_text[:500],
        }
    except ExtractionError as exc:
        raise HTTPException(status_code=422, detail={"code": exc.code, "message": exc.detail})
    except Exception as exc:
        raise HTTPException(status_code=500, detail={"code": "PARSE_ERROR", "message": str(exc)})


@app.get("/api/candidates/{candidate_id}")
async def get_candidate_details(candidate_id: str):
    cand = db.get_candidate(candidate_id)
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return cand


@app.get("/api/candidates/{candidate_id}/matches")
async def get_candidate_matches(candidate_id: str):
    """
    Calculates deterministic fit score for this candidate against all active jobs in Supabase.
    """
    cand = db.get_candidate(candidate_id)
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found")

    # Reconstruct extracted fields
    fields: List[ExtractedField] = []
    if cand.get("skills"):
        fields.append(ExtractedField(field_id="SKILLS-LIST", category="Skills", status=FieldStatus.FOUND, value=", ".join(cand["skills"]), evidence=", ".join(cand["skills"])))
    if cand.get("education") and len(cand["education"]) > 0:
        deg = cand["education"][0].get("degree")
        ev = cand["education"][0].get("evidence")
        fields.append(ExtractedField(field_id="EDUCATION-DEGREE", category="Education", status=FieldStatus.FOUND, value=deg, evidence=ev or deg))
    if cand.get("experience") and len(cand["experience"]) > 0:
        role = cand["experience"][0].get("role")
        ev = cand["experience"][0].get("evidence")
        fields.append(ExtractedField(field_id="EXPERIENCE-ROLE", category="Experience", status=FieldStatus.FOUND, value=role, evidence=ev or role))
    if cand.get("projects") and len(cand["projects"]) > 0:
        proj_str = " | ".join([p.get("title", "") for p in cand["projects"]])
        fields.append(ExtractedField(field_id="PROJECT-LIST", category="Projects", status=FieldStatus.FOUND, value=proj_str, evidence=proj_str))
    if cand.get("certifications") and len(cand["certifications"]) > 0:
        cert_str = " | ".join([c.get("title", "") for c in cand["certifications"]])
        fields.append(ExtractedField(field_id="CERT-LIST", category="Certifications", status=FieldStatus.FOUND, value=cert_str, evidence=cert_str))

    jobs = db.get_all_jobs()
    matches = []

    for j in jobs:
        m, fit = score(fields, j["job_description"])
        status_label = "Strong Match" if fit.fit_score >= 80 else "Needs Review" if fit.fit_score >= 50 else "Low Fit"

        matched_reqs = [r.requirement for r in m if r.match_status == "MATCHED"]
        partial_reqs = [r.requirement for r in m if r.match_status == "PARTIAL"]
        missing_reqs = [r.requirement for r in m if r.match_status == "MISSING"]

        matches.append({
            "job_id": j["id"],
            "job_title": j["title"],
            "department": j.get("department"),
            "location": j.get("location"),
            "fit_score": fit.fit_score,
            "status_label": status_label,
            "matched_requirements": matched_reqs,
            "partial_requirements": partial_reqs,
            "missing_requirements": missing_reqs,
            "requirements": [r.model_dump() for r in m],
        })

    matches.sort(key=lambda x: -x["fit_score"])
    return matches


@app.post("/api/jobs/{job_id}/apply")
async def apply_to_job(job_id: str, req: CandidateApplyRequest):
    """
    Candidate applies to a job:
    - Calculates deterministic fit score
    - Saves application in Supabase job_applications
    - Saves screening_result so Recruiter sees it immediately
    - Enforces uniqueness (candidate cannot apply twice to same job)
    """
    cand = db.get_candidate(req.candidate_id)
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found")

    jobs = db.get_all_jobs()
    target_job = next((j for j in jobs if j["id"] == job_id), None)
    if not target_job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Build fields for scoring
    fields: List[ExtractedField] = []
    if cand.get("skills"):
        fields.append(ExtractedField(field_id="SKILLS-LIST", category="Skills", status=FieldStatus.FOUND, value=", ".join(cand["skills"]), evidence=", ".join(cand["skills"])))
    if cand.get("education") and len(cand["education"]) > 0:
        fields.append(ExtractedField(field_id="EDUCATION-DEGREE", category="Education", status=FieldStatus.FOUND, value=cand["education"][0].get("degree"), evidence=cand["education"][0].get("evidence") or cand["education"][0].get("degree")))
    if cand.get("experience") and len(cand["experience"]) > 0:
        fields.append(ExtractedField(field_id="EXPERIENCE-ROLE", category="Experience", status=FieldStatus.FOUND, value=cand["experience"][0].get("role"), evidence=cand["experience"][0].get("evidence") or cand["experience"][0].get("role")))
    if cand.get("projects") and len(cand["projects"]) > 0:
        fields.append(ExtractedField(field_id="PROJECT-LIST", category="Projects", status=FieldStatus.FOUND, value=" | ".join([p.get("title", "") for p in cand["projects"]]), evidence=" | ".join([p.get("title", "") for p in cand["projects"]])))

    m, fit = score(fields, target_job["job_description"])

    app_res = db.submit_job_application(
        job_id=job_id,
        candidate_id=req.candidate_id,
        resume_id=req.resume_id,
        fit_score=float(fit.fit_score),
        raw_score=float(fit.fit_score),
        evidence_list=[f.model_dump() for f in fields],
        requirements_list=[r.model_dump() for r in m],
    )

    return app_res


@app.get("/api/candidates/{candidate_id}/applications")
async def list_candidate_applications(candidate_id: str):
    return db.get_candidate_applications(candidate_id)


# ─── Recruiter Endpoints ───────────────────────────────────────────────────────

@app.post("/api/screening")
async def create_screening_session(
    job_title: str = Form(..., description="Job title"),
    job_description: str = Form(..., description="Job description requirements"),
    department: Optional[str] = Form(None, description="Department name"),
    location: Optional[str] = Form(None, description="Job location"),
    resumes: List[UploadFile] = File(..., description="List of resume files"),
):
    if not resumes:
        raise HTTPException(status_code=400, detail="No resume files uploaded")

    job = db.create_or_get_job(
        title=job_title.strip(),
        job_description=job_description.strip(),
        department=department,
        location=location,
    )
    job_id = job["id"]

    session = db.create_screening_session(job_id=job_id, total_candidates=len(resumes))
    session_id = session["id"]

    processed_results = []

    for idx, resume in enumerate(resumes):
        fname = resume.filename or f"candidate_{idx+1}.docx"
        file_bytes = await resume.read()

        try:
            analysis = _process_single_resume(fname, file_bytes, job_description)
            ext = "pdf" if fname.lower().endswith(".pdf") else "docx"
            raw_text = "\n".join([f.evidence or "" for f in analysis.fields if f.evidence])

            cand_res = db.upsert_candidate_and_resume(
                candidate_name=analysis.candidate.full_name or fname.replace(".docx", "").replace(".pdf", ""),
                email=analysis.candidate.email,
                phone=analysis.candidate.phone,
                location=analysis.candidate.location,
                linkedin_url=analysis.candidate.linkedin_url,
                highest_degree=analysis.candidate.highest_degree,
                most_recent_role=analysis.candidate.most_recent_role,
                fields_list=[f.model_dump() for f in analysis.fields],
                filename=fname,
                file_bytes=file_bytes,
                file_type=ext,
                extracted_text=raw_text,
                job_id=job_id,
                session_id=session_id,
            )
            candidate_id = cand_res["candidate"]["id"]

            critical_met = len([r for r in analysis.requirements if "bachelor" in r.requirement.lower() or "java" in r.requirement.lower() or "python" in r.requirement.lower()])
            critical_total = max(1, critical_met)

            fit_score_val = float(analysis.fit_score.fit_score)
            status_val = "strong_match" if fit_score_val >= 80 else "needs_review" if fit_score_val >= 50 else "low_fit"

            saved_result = db.save_screening_result(
                session_id=session_id,
                job_id=job_id,
                candidate_id=candidate_id,
                fit_score=fit_score_val,
                raw_score=fit_score_val,
                status=status_val,
                matched_count=analysis.fit_score.matched,
                partial_count=analysis.fit_score.partial,
                missing_count=analysis.fit_score.missing,
                critical_met=critical_met,
                critical_total=critical_total,
                evidence_list=[f.model_dump() for f in analysis.fields],
                requirements_list=[r.model_dump() for r in analysis.requirements],
            )

            processed_results.append({
                "id": saved_result["id"],
                "candidate_id": candidate_id,
                "candidate_name": analysis.candidate.full_name or fname,
                "fit_score": fit_score_val,
                "critical_met": critical_met,
                "matched_count": analysis.fit_score.matched,
                "data": analysis.model_dump(),
                "storage_path": cand_res.get("storage_path"),
            })
        except Exception as e:
            print(f"[Screening Error] Failed {fname}: {e}")

    processed_results.sort(
        key=lambda x: (
            -x["fit_score"],
            -x["critical_met"],
            -x["matched_count"],
            x["candidate_name"].lower(),
        )
    )

    ranked_items = []
    for rank_idx, item in enumerate(processed_results):
        rank = rank_idx + 1
        item["rank"] = rank
        ranked_items.append({"id": item["id"], "rank": rank})

    db.finalize_session_ranking(session_id, ranked_items)

    return {
        "job": job,
        "session_id": session_id,
        "total_processed": len(processed_results),
        "candidates": processed_results,
    }


@app.get("/api/jobs")
async def list_jobs():
    return db.get_all_jobs()


@app.get("/api/jobs/active")
async def list_active_jobs():
    jobs = db.get_all_jobs()
    return [j for j in jobs if j.get("status") == "active"]


@app.get("/api/jobs/{job_id}/results")
async def get_job_results(job_id: str):
    return db.get_job_screening_results(job_id)


@app.post("/api/decisions")
async def update_recruiter_decision(req: RecruiterDecisionRequest):
    return db.set_recruiter_decision(
        screening_result_id=req.screening_result_id,
        decision=req.decision,
        notes=req.notes,
    )
