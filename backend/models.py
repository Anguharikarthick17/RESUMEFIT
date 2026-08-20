"""
ResumeFit — Data Models

All structured data types used across the pipeline.
"""

from enum import Enum
from typing import Optional, List, Dict, Any
from pydantic import BaseModel


# ---------------------------------------------------------------------------
# Field status
# ---------------------------------------------------------------------------

class FieldStatus(str, Enum):
    FOUND = "FOUND"
    NOT_FOUND = "NOT_FOUND"
    AMBIGUOUS = "AMBIGUOUS"


# ---------------------------------------------------------------------------
# Match status
# ---------------------------------------------------------------------------

class MatchStatus(str, Enum):
    MATCHED = "MATCHED"
    PARTIAL = "PARTIAL"
    MISSING = "MISSING"


# ---------------------------------------------------------------------------
# Confidence
# ---------------------------------------------------------------------------

class Confidence(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


# ---------------------------------------------------------------------------
# Extracted field
# ---------------------------------------------------------------------------

class ExtractedField(BaseModel):
    field_id: str
    category: str
    status: FieldStatus
    value: Optional[str] = None
    evidence: Optional[str] = None
    source_section: Optional[str] = None
    reason: Optional[str] = None


# ---------------------------------------------------------------------------
# Requirement match
# ---------------------------------------------------------------------------

class RequirementMatch(BaseModel):
    requirement: str
    match_status: MatchStatus
    explanation: str
    evidence_ref: Optional[str] = None
    confidence: Confidence


# ---------------------------------------------------------------------------
# Fit score
# ---------------------------------------------------------------------------

class FitScore(BaseModel):
    fit_score: int
    score_label: str
    matched: int
    partial: int
    missing: int
    total: int


# ---------------------------------------------------------------------------
# Candidate profile (top-level summary from extracted fields)
# ---------------------------------------------------------------------------

class CandidateProfile(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    linkedin_url: Optional[str] = None
    highest_degree: Optional[str] = None
    most_recent_role: Optional[str] = None
    location: Optional[str] = None


# ---------------------------------------------------------------------------
# Segmented sections
# ---------------------------------------------------------------------------

class ResumeSection(BaseModel):
    label: str          # canonical section name
    raw_header: str     # exactly as it appeared in the resume
    content: str        # text content of the section


# ---------------------------------------------------------------------------
# Full analysis response
# ---------------------------------------------------------------------------

class AnalysisResponse(BaseModel):
    candidate: CandidateProfile
    fields: List[ExtractedField]
    sections_found: List[str]
    requirements: List[RequirementMatch]
    fit_score: FitScore
    errors: List[str]


# ---------------------------------------------------------------------------
# Batch Analysis Models (For Bulk Resume Screening)
# ---------------------------------------------------------------------------

class BatchCandidateItem(BaseModel):
    filename: str
    status: str                         # "success" | "error"
    error: Optional[Dict[str, Any]] = None
    data: Optional[AnalysisResponse] = None


class BatchAnalysisResponse(BaseModel):
    total: int
    successful: int
    failed: int
    results: List[BatchCandidateItem]
