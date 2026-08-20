"""
ResumeFit — Supabase Backend Client & Database Layer

Handles:
- Supabase PostgreSQL persistence (jobs, candidates, resumes, screening_sessions, screening_results, recruiter_decisions, job_applications)
- Supabase Storage file uploads to 'resume-files' bucket
- Candidate deduplication via SHA-256 file_hash
- Deterministic candidate ranking persistence
- Two-Sided Candidate ↔ Job Matching & Application Lifecycle
- Graceful in-memory fallback when credentials are not configured
"""

from __future__ import annotations

import hashlib
import os
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "").strip()
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip()

_supabase_client = None

if SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY and not SUPABASE_SERVICE_ROLE_KEY.startswith("your-"):
    try:
        from supabase import create_client, Client
        _supabase_client: Optional[Client] = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    except Exception as e:
        print(f"[Supabase] Warning: Failed to initialize Supabase client ({e}). Running in local fallback mode.")
        _supabase_client = None


def is_supabase_enabled() -> bool:
    return _supabase_client is not None


# ---------------------------------------------------------------------------
# In-Memory Store (Fallback when Supabase keys not set or tables pending)
# ---------------------------------------------------------------------------
_DEFAULT_SEEDED_JOBS = {
    "job-aiml-eng": {
        "id": "job-aiml-eng",
        "title": "AI / Machine Learning Engineer",
        "department": "Engineering & Data",
        "location": "San Francisco, CA (Hybrid)",
        "job_description": "AI/ML Engineer\n\nResponsibilities:\n- Build, train, and deploy machine learning models using Python.\n- Develop data pipelines and query structured relational databases using SQL.\n- Deploy scalable AI services using Docker and cloud infrastructure.\n\nRequirements:\n- Strong proficiency in Python and Machine Learning libraries.\n- Experience with SQL and relational database queries.\n- Minimum 2+ years experience building ML projects or production software.\n- Experience with AWS or cloud deployment is a plus.",
        "status": "active",
        "created_at": "2026-08-20T00:00:00Z",
        "updated_at": "2026-08-20T00:00:00Z",
    },
    "job-java-backend": {
        "id": "job-java-backend",
        "title": "Java Software Engineer",
        "department": "Backend Platform",
        "location": "Remote / US",
        "job_description": "Java Software Engineer\n\nResponsibilities:\n- Develop microservices and REST APIs using Java and Spring Boot.\n- Utilize Git and GitHub for collaborative version control.\n- Write clean unit tests and database queries.\n\nRequirements:\n- Bachelor's degree in Computer Science or related technical field.\n- Proficiency in Java and Spring Boot frameworks.\n- Experience building RESTful APIs and SQL databases.\n- Familiarity with Git version control.",
        "status": "active",
        "created_at": "2026-08-19T00:00:00Z",
        "updated_at": "2026-08-19T00:00:00Z",
    },
    "job-fullstack": {
        "id": "job-fullstack",
        "title": "Senior Full Stack Developer",
        "department": "Core Product",
        "location": "New York, NY",
        "job_description": "Senior Full Stack Developer\n\nRequirements:\n- 4+ years building production web applications with React and TypeScript.\n- Strong Node.js or Python backend service development.\n- PostgreSQL database design and query optimization.\n- Experience with Docker, Kubernetes, and CI/CD pipelines.",
        "status": "active",
        "created_at": "2026-08-18T00:00:00Z",
        "updated_at": "2026-08-18T00:00:00Z",
    },
    "job-data-analyst": {
        "id": "job-data-analyst",
        "title": "Data Analyst & Analytics Engineer",
        "department": "Business Intelligence",
        "location": "Austin, TX (Remote)",
        "job_description": "Data Analyst\n\nRequirements:\n- Strong knowledge of SQL, PostgreSQL, and data modeling.\n- Experience with Python data analytics (Pandas, NumPy).\n- Experience with Tableau, PowerBI, or dashboarding tools.",
        "status": "active",
        "created_at": "2026-08-17T00:00:00Z",
        "updated_at": "2026-08-17T00:00:00Z",
    },
}

_MEM_STORE = {
    "jobs": dict(_DEFAULT_SEEDED_JOBS),
    "candidates": {},
    "resumes": {},
    "screening_sessions": {},
    "screening_results": {},
    "recruiter_decisions": {},
    "job_applications": {},
}


# ---------------------------------------------------------------------------
# Helper: SHA-256 Hash
# ---------------------------------------------------------------------------
def compute_sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


# ---------------------------------------------------------------------------
# 1. Job Management
# ---------------------------------------------------------------------------
def create_or_get_job(
    title: str,
    job_description: str,
    department: Optional[str] = None,
    location: Optional[str] = None,
) -> Dict[str, Any]:
    now = datetime.now(timezone.utc).isoformat()

    if is_supabase_enabled():
        try:
            res = _supabase_client.table("jobs").select("*").eq("title", title).eq("job_description", job_description).execute()
            if res.data and len(res.data) > 0:
                return res.data[0]

            job_id = str(uuid.uuid4())
            new_job = {
                "id": job_id,
                "title": title,
                "department": department or "Engineering",
                "location": location or "Remote",
                "job_description": job_description,
                "status": "active",
                "created_at": now,
                "updated_at": now,
            }
            insert_res = _supabase_client.table("jobs").insert(new_job).execute()
            return insert_res.data[0] if insert_res.data else new_job
        except Exception as e:
            print(f"[Supabase] Error creating job: {e}")

    # Fallback in-memory
    for j in _MEM_STORE["jobs"].values():
        if j["title"] == title and j["job_description"] == job_description:
            return j

    job_id = str(uuid.uuid4())
    job_data = {
        "id": job_id,
        "title": title,
        "department": department or "Engineering",
        "location": location or "Remote",
        "job_description": job_description,
        "status": "active",
        "created_at": now,
        "updated_at": now,
    }
    _MEM_STORE["jobs"][job_id] = job_data
    return job_data


def get_all_jobs() -> List[Dict[str, Any]]:
    if is_supabase_enabled():
        try:
            res = _supabase_client.table("jobs").select("*").order("created_at", desc=True).execute()
            jobs = res.data or []
            for j in jobs:
                res_count = _supabase_client.table("screening_results").select("id", count="exact").eq("job_id", j["id"]).execute()
                app_count = _supabase_client.table("job_applications").select("id", count="exact").eq("job_id", j["id"]).execute()
                j["candidates_count"] = max(res_count.count or 0, app_count.count or 0)
                
                strong_count = _supabase_client.table("screening_results").select("id", count="exact").eq("job_id", j["id"]).eq("status", "strong_match").execute()
                j["strong_matches_count"] = strong_count.count or 0

                shortlisted = _supabase_client.table("recruiter_decisions").select("id", count="exact").eq("decision", "shortlisted").execute()
                j["shortlisted_count"] = shortlisted.count or 0
            if jobs:
                return jobs
        except Exception as e:
            print(f"[Supabase] Error getting jobs: {e}")

    # Fallback in-memory
    jobs = list(_MEM_STORE["jobs"].values())
    for j in jobs:
        results = [r for r in _MEM_STORE["screening_results"].values() if r.get("job_id") == j["id"]]
        apps = [a for a in _MEM_STORE["job_applications"].values() if a.get("job_id") == j["id"]]
        j["candidates_count"] = max(len(results), len(apps))
        j["strong_matches_count"] = len([r for r in results if r.get("status") == "strong_match"])
        j["shortlisted_count"] = len([r for r in results if _MEM_STORE["recruiter_decisions"].get(r["id"], {}).get("decision") == "shortlisted"])
    return jobs


# ---------------------------------------------------------------------------
# 2. Candidate & Resume Management (with Deduplication)
# ---------------------------------------------------------------------------
def upsert_candidate_and_resume(
    candidate_name: str,
    email: Optional[str],
    phone: Optional[str],
    location: Optional[str],
    linkedin_url: Optional[str],
    highest_degree: Optional[str],
    most_recent_role: Optional[str],
    fields_list: List[Dict[str, Any]],
    filename: str,
    file_bytes: bytes,
    file_type: str,
    extracted_text: str,
    job_id: Optional[str] = None,
    session_id: Optional[str] = None,
) -> Dict[str, Any]:
    file_hash = compute_sha256(file_bytes)
    now = datetime.now(timezone.utc).isoformat()
    candidate_id = str(uuid.uuid4())

    skills_val = []
    education_val = []
    projects_val = []
    certs_val = []
    experience_val = []

    for f in fields_list:
        fid = f.get("field_id")
        val = f.get("value")
        if fid == "SKILLS-LIST" and val:
            skills_val = [s.strip() for s in val.split(",") if s.strip()]
        elif fid == "EDUCATION-DEGREE" and val:
            education_val.append({"degree": val, "evidence": f.get("evidence")})
        elif fid == "PROJECT-LIST" and val:
            projects_val = [{"title": p.strip()} for p in val.split("|") if p.strip()]
        elif fid == "CERT-LIST" and val:
            certs_val = [{"title": c.strip()} for c in val.split("|") if c.strip()]
        elif fid == "EXPERIENCE-ROLE" and val:
            experience_val.append({"role": val, "evidence": f.get("evidence")})

    storage_path = f"{job_id or 'profiles'}/{session_id or 'direct'}/{candidate_id}/{filename}"

    if is_supabase_enabled():
        try:
            # 1. Storage Upload
            try:
                content_type = "application/pdf" if file_type == "pdf" else "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                _supabase_client.storage.from_("resume-files").upload(
                    path=storage_path,
                    file=file_bytes,
                    file_options={"content-type": content_type, "upsert": "true"},
                )
            except Exception as st_err:
                print(f"[Supabase Storage] Notice: {st_err}")

            # 2. Deduplication check
            res_exist = _supabase_client.table("resumes").select("candidate_id, id").eq("file_hash", file_hash).execute()
            if res_exist.data and len(res_exist.data) > 0:
                existing_cid = res_exist.data[0]["candidate_id"]
                existing_rid = res_exist.data[0]["id"]
                cand_res = _supabase_client.table("candidates").select("*").eq("id", existing_cid).execute()
                if cand_res.data and len(cand_res.data) > 0:
                    return {
                        "candidate": cand_res.data[0],
                        "resume_id": existing_rid,
                        "storage_path": storage_path,
                        "file_hash": file_hash,
                        "is_duplicate": True,
                    }

            # 3. Insert candidate
            cand_data = {
                "id": candidate_id,
                "name": candidate_name or "Candidate",
                "email": email,
                "phone": phone,
                "location": location,
                "linkedin_url": linkedin_url,
                "education": education_val,
                "experience": experience_val,
                "skills": skills_val,
                "certifications": certs_val,
                "projects": projects_val,
                "summary": most_recent_role or highest_degree,
                "created_at": now,
                "updated_at": now,
            }
            cand_insert = _supabase_client.table("candidates").insert(cand_data).execute()
            created_cand = cand_insert.data[0] if cand_insert.data else cand_data

            # 4. Insert resume
            resume_id = str(uuid.uuid4())
            resume_data = {
                "id": resume_id,
                "candidate_id": candidate_id,
                "original_filename": filename,
                "storage_path": storage_path,
                "file_type": file_type,
                "file_size": len(file_bytes),
                "file_hash": file_hash,
                "extracted_text": extracted_text[:10000],
                "created_at": now,
            }
            _supabase_client.table("resumes").insert(resume_data).execute()

            return {
                "candidate": created_cand,
                "resume_id": resume_id,
                "storage_path": storage_path,
                "file_hash": file_hash,
                "is_duplicate": False,
            }
        except Exception as e:
            print(f"[Supabase] Error saving candidate/resume: {e}")

    # Fallback in-memory
    for r in _MEM_STORE["resumes"].values():
        if r["file_hash"] == file_hash:
            existing_cid = r["candidate_id"]
            return {
                "candidate": _MEM_STORE["candidates"].get(existing_cid, {"id": existing_cid, "name": candidate_name}),
                "resume_id": r["id"],
                "storage_path": storage_path,
                "file_hash": file_hash,
                "is_duplicate": True,
            }

    cand_data = {
        "id": candidate_id,
        "name": candidate_name or "Candidate",
        "email": email,
        "phone": phone,
        "location": location,
        "linkedin_url": linkedin_url,
        "education": education_val,
        "experience": experience_val,
        "skills": skills_val,
        "certifications": certs_val,
        "projects": projects_val,
        "summary": most_recent_role or highest_degree,
        "created_at": now,
        "updated_at": now,
    }
    _MEM_STORE["candidates"][candidate_id] = cand_data

    resume_id = str(uuid.uuid4())
    _MEM_STORE["resumes"][resume_id] = {
        "id": resume_id,
        "candidate_id": candidate_id,
        "original_filename": filename,
        "storage_path": storage_path,
        "file_type": file_type,
        "file_size": len(file_bytes),
        "file_hash": file_hash,
        "extracted_text": extracted_text[:10000],
        "created_at": now,
    }

    return {
        "candidate": cand_data,
        "resume_id": resume_id,
        "storage_path": storage_path,
        "file_hash": file_hash,
        "is_duplicate": False,
    }


def get_candidate(candidate_id: str) -> Optional[Dict[str, Any]]:
    if is_supabase_enabled():
        try:
            res = _supabase_client.table("candidates").select("*, resumes(*)").eq("id", candidate_id).execute()
            if res.data and len(res.data) > 0:
                return res.data[0]
        except Exception as e:
            print(f"[Supabase] Error getting candidate: {e}")

    cand = _MEM_STORE["candidates"].get(candidate_id)
    if cand:
        cand["resumes"] = [r for r in _MEM_STORE["resumes"].values() if r["candidate_id"] == candidate_id]
    return cand


# ---------------------------------------------------------------------------
# 3. Screening Sessions & Results
# ---------------------------------------------------------------------------
def create_screening_session(job_id: str, total_candidates: int) -> Dict[str, Any]:
    now = datetime.now(timezone.utc).isoformat()
    session_id = str(uuid.uuid4())

    session_data = {
        "id": session_id,
        "job_id": job_id,
        "status": "processing",
        "total_candidates": total_candidates,
        "processed_candidates": 0,
        "created_at": now,
        "completed_at": None,
    }

    if is_supabase_enabled():
        try:
            res = _supabase_client.table("screening_sessions").insert(session_data).execute()
            return res.data[0] if res.data else session_data
        except Exception as e:
            print(f"[Supabase] Error creating session: {e}")

    _MEM_STORE["screening_sessions"][session_id] = session_data
    return session_data


def save_screening_result(
    session_id: str,
    job_id: str,
    candidate_id: str,
    fit_score: float,
    raw_score: float,
    status: str,
    matched_count: int,
    partial_count: int,
    missing_count: int,
    critical_met: int,
    critical_total: int,
    evidence_list: List[Dict[str, Any]],
    requirements_list: List[Dict[str, Any]],
) -> Dict[str, Any]:
    now = datetime.now(timezone.utc).isoformat()
    result_id = str(uuid.uuid4())

    result_data = {
        "id": result_id,
        "screening_session_id": session_id,
        "job_id": job_id,
        "candidate_id": candidate_id,
        "fit_score": fit_score,
        "raw_score": raw_score,
        "status": status,
        "rank": None,
        "matched_count": matched_count,
        "partial_count": partial_count,
        "missing_count": missing_count,
        "critical_requirements_met": critical_met,
        "critical_requirements_total": critical_total,
        "evidence": evidence_list,
        "requirements": requirements_list,
        "created_at": now,
        "updated_at": now,
    }

    if is_supabase_enabled():
        try:
            res = _supabase_client.table("screening_results").insert(result_data).execute()
            dec_id = str(uuid.uuid4())
            _supabase_client.table("recruiter_decisions").insert({
                "id": dec_id,
                "screening_result_id": result_id,
                "decision": "undecided",
                "notes": None,
                "decided_at": now,
            }).execute()
            return res.data[0] if res.data else result_data
        except Exception as e:
            print(f"[Supabase] Error saving screening result: {e}")

    _MEM_STORE["screening_results"][result_id] = result_data
    _MEM_STORE["recruiter_decisions"][result_id] = {
        "id": str(uuid.uuid4()),
        "screening_result_id": result_id,
        "decision": "undecided",
        "notes": None,
        "decided_at": now,
    }
    return result_data


def finalize_session_ranking(session_id: str, ranked_items: List[Dict[str, Any]]) -> None:
    now = datetime.now(timezone.utc).isoformat()

    if is_supabase_enabled():
        try:
            for item in ranked_items:
                _supabase_client.table("screening_results").update({"rank": item["rank"]}).eq("id", item["id"]).execute()
            _supabase_client.table("screening_sessions").update({
                "status": "completed",
                "processed_candidates": len(ranked_items),
                "completed_at": now,
            }).eq("id", session_id).execute()
            return
        except Exception as e:
            print(f"[Supabase] Error updating ranks: {e}")

    for item in ranked_items:
        if item["id"] in _MEM_STORE["screening_results"]:
            _MEM_STORE["screening_results"][item["id"]]["rank"] = item["rank"]
    if session_id in _MEM_STORE["screening_sessions"]:
        _MEM_STORE["screening_sessions"][session_id]["status"] = "completed"
        _MEM_STORE["screening_sessions"][session_id]["processed_candidates"] = len(ranked_items)
        _MEM_STORE["screening_sessions"][session_id]["completed_at"] = now


# ---------------------------------------------------------------------------
# 4. Two-Sided Job Applications (Candidate ↔ Recruiter Sync)
# ---------------------------------------------------------------------------
def submit_job_application(
    job_id: str,
    candidate_id: str,
    resume_id: Optional[str],
    fit_score: float,
    raw_score: float,
    evidence_list: List[Dict[str, Any]],
    requirements_list: List[Dict[str, Any]],
) -> Dict[str, Any]:
    now = datetime.now(timezone.utc).isoformat()
    app_id = str(uuid.uuid4())

    # Calculate matched stats
    matched_count = len([r for r in requirements_list if r.get("match_status") == "MATCHED"])
    partial_count = len([r for r in requirements_list if r.get("match_status") == "PARTIAL"])
    missing_count = len([r for r in requirements_list if r.get("match_status") == "MISSING"])
    critical_met = len([r for r in requirements_list if "bachelor" in r.get("requirement", "").lower() or "python" in r.get("requirement", "").lower() or "java" in r.get("requirement", "").lower()])
    critical_total = max(1, critical_met)
    status_val = "strong_match" if fit_score >= 80 else "needs_review" if fit_score >= 50 else "low_fit"

    if is_supabase_enabled():
        try:
            # Check duplicate application
            exist_app = _supabase_client.table("job_applications").select("*").eq("job_id", job_id).eq("candidate_id", candidate_id).execute()
            if exist_app.data and len(exist_app.data) > 0:
                return {
                    "application": exist_app.data[0],
                    "already_applied": True,
                }

            # 1. Create job_application record
            app_data = {
                "id": app_id,
                "job_id": job_id,
                "candidate_id": candidate_id,
                "resume_id": resume_id,
                "screening_session_id": None,
                "fit_score": fit_score,
                "raw_score": raw_score,
                "status": "applied",
                "applied_at": now,
                "updated_at": now,
            }
            app_res = _supabase_client.table("job_applications").insert(app_data).execute()
            created_app = app_res.data[0] if app_res.data else app_data

            # 2. Also ensure screening_results entry exists so Recruiter sees it immediately
            sr_id = str(uuid.uuid4())
            sr_data = {
                "id": sr_id,
                "screening_session_id": None,
                "job_id": job_id,
                "candidate_id": candidate_id,
                "fit_score": fit_score,
                "raw_score": raw_score,
                "status": status_val,
                "rank": None,
                "matched_count": matched_count,
                "partial_count": partial_count,
                "missing_count": missing_count,
                "critical_requirements_met": critical_met,
                "critical_requirements_total": critical_total,
                "evidence": evidence_list,
                "requirements": requirements_list,
                "created_at": now,
                "updated_at": now,
            }
            _supabase_client.table("screening_results").insert(sr_data).execute()

            # Recruiter decision record
            _supabase_client.table("recruiter_decisions").insert({
                "id": str(uuid.uuid4()),
                "screening_result_id": sr_id,
                "decision": "undecided",
                "notes": "Direct candidate application",
                "decided_at": now,
            }).execute()

            return {
                "application": created_app,
                "already_applied": False,
            }
        except Exception as e:
            print(f"[Supabase] Error submitting application: {e}")

    # Fallback in-memory
    app_key = f"{job_id}_{candidate_id}"
    if app_key in _MEM_STORE["job_applications"]:
        return {
            "application": _MEM_STORE["job_applications"][app_key],
            "already_applied": True,
        }

    app_data = {
        "id": app_id,
        "job_id": job_id,
        "candidate_id": candidate_id,
        "resume_id": resume_id,
        "screening_session_id": None,
        "fit_score": fit_score,
        "raw_score": raw_score,
        "status": "applied",
        "applied_at": now,
        "updated_at": now,
    }
    _MEM_STORE["job_applications"][app_key] = app_data

    # Add to screening_results for recruiter
    sr_id = str(uuid.uuid4())
    _MEM_STORE["screening_results"][sr_id] = {
        "id": sr_id,
        "job_id": job_id,
        "candidate_id": candidate_id,
        "fit_score": fit_score,
        "raw_score": raw_score,
        "status": status_val,
        "rank": len(_MEM_STORE["screening_results"]) + 1,
        "matched_count": matched_count,
        "partial_count": partial_count,
        "missing_count": missing_count,
        "critical_requirements_met": critical_met,
        "critical_requirements_total": critical_total,
        "evidence": evidence_list,
        "requirements": requirements_list,
        "created_at": now,
    }
    _MEM_STORE["recruiter_decisions"][sr_id] = {
        "id": str(uuid.uuid4()),
        "screening_result_id": sr_id,
        "decision": "undecided",
        "notes": "Direct candidate application",
        "decided_at": now,
    }

    return {
        "application": app_data,
        "already_applied": False,
    }


def get_candidate_applications(candidate_id: str) -> List[Dict[str, Any]]:
    if is_supabase_enabled():
        try:
            res = _supabase_client.table("job_applications").select("*, jobs(*)").eq("candidate_id", candidate_id).order("applied_at", desc=True).execute()
            return res.data or []
        except Exception as e:
            print(f"[Supabase] Error getting candidate applications: {e}")

    # Fallback in-memory
    apps = [a for a in _MEM_STORE["job_applications"].values() if a["candidate_id"] == candidate_id]
    for a in apps:
        a["jobs"] = _MEM_STORE["jobs"].get(a["job_id"], {"title": "Job Opportunity"})
    return apps


# ---------------------------------------------------------------------------
# 5. Recruiter Decisions
# ---------------------------------------------------------------------------
def set_recruiter_decision(screening_result_id: str, decision: str, notes: Optional[str] = None) -> Dict[str, Any]:
    now = datetime.now(timezone.utc).isoformat()
    app_status_map = {
        "shortlisted": "shortlisted",
        "review": "under_review",
        "rejected": "rejected",
        "undecided": "applied",
    }

    if is_supabase_enabled():
        try:
            exist = _supabase_client.table("recruiter_decisions").select("id, screening_results(job_id, candidate_id)").eq("screening_result_id", screening_result_id).execute()
            if exist.data and len(exist.data) > 0:
                res = _supabase_client.table("recruiter_decisions").update({
                    "decision": decision,
                    "notes": notes,
                    "decided_at": now,
                }).eq("screening_result_id", screening_result_id).execute()

                # Sync with job_applications table
                sr = exist.data[0].get("screening_results")
                if sr and sr.get("job_id") and sr.get("candidate_id"):
                    _supabase_client.table("job_applications").update({
                        "status": app_status_map.get(decision, "under_review"),
                        "updated_at": now,
                    }).eq("job_id", sr["job_id"]).eq("candidate_id", sr["candidate_id"]).execute()

                return res.data[0] if res.data else {"decision": decision}
            else:
                res = _supabase_client.table("recruiter_decisions").insert({
                    "id": str(uuid.uuid4()),
                    "screening_result_id": screening_result_id,
                    "decision": decision,
                    "notes": notes,
                    "decided_at": now,
                }).execute()
                return res.data[0] if res.data else {"decision": decision}
        except Exception as e:
            print(f"[Supabase] Error updating recruiter decision: {e}")

    # Fallback in-memory
    _MEM_STORE["recruiter_decisions"][screening_result_id] = {
        "screening_result_id": screening_result_id,
        "decision": decision,
        "notes": notes,
        "decided_at": now,
    }

    # Sync memory job applications
    sr = _MEM_STORE["screening_results"].get(screening_result_id)
    if sr:
        app_key = f"{sr.get('job_id')}_{sr.get('candidate_id')}"
        if app_key in _MEM_STORE["job_applications"]:
            _MEM_STORE["job_applications"][app_key]["status"] = app_status_map.get(decision, "under_review")

    return _MEM_STORE["recruiter_decisions"][screening_result_id]


def get_job_screening_results(job_id: str) -> List[Dict[str, Any]]:
    results = []
    if is_supabase_enabled():
        try:
            res = _supabase_client.table("screening_results").select("*, candidates(*), recruiter_decisions(*)").eq("job_id", job_id).order("fit_score", desc=True).execute()
            if res.data and len(res.data) > 0:
                results = res.data
        except Exception as e:
            print(f"[Supabase] Error fetching screening results for job: {e}")

    if not results:
        # Fallback in-memory
        results = [r for r in _MEM_STORE["screening_results"].values() if r.get("job_id") == job_id]

    for r in results:
        if not r.get("candidates") or not isinstance(r.get("candidates"), dict):
            cid = r.get("candidate_id")
            cand = _MEM_STORE["candidates"].get(cid, {"id": cid, "name": "Candidate"})
            r["candidates"] = cand
        if not r.get("recruiter_decisions") or not isinstance(r.get("recruiter_decisions"), dict):
            r["recruiter_decisions"] = _MEM_STORE["recruiter_decisions"].get(r["id"], {"decision": "undecided"})

    results.sort(key=lambda x: (x.get("rank") or 9999, -x.get("fit_score", 0)))
    return results
