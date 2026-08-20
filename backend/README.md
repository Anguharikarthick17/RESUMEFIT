# ResumeFit — Backend

Evidence-backed AI resume analysis system.

## Pipeline

```
PDF / DOCX → Text Extraction → Section Segmentation → 10 Fields + Evidence → JD Matching → Fit Score → JSON
```

## Quick Start

```bash
cd backend
pip install -r requirements.txt

# Run end-to-end test (built-in sample resume)
python test_pipeline.py

# Test with your own files
python test_pipeline.py your_resume.pdf
python test_pipeline.py your_resume.pdf job_description.txt

# Start the API server
uvicorn main:app --reload --port 8000
```

## API

### `GET /api/health`
```json
{"status": "ok", "service": "resumefit"}
```

### `POST /api/analyze`

Multipart form data:
- `resume` — PDF or DOCX file
- `job_description` — plain text string

```bash
curl -X POST http://localhost:8000/api/analyze \
  -F "resume=@resume.pdf" \
  -F "job_description=Python Developer Requirements: - Python - SQL - Docker"
```

Response:
```json
{
  "candidate": {
    "full_name": "Jane Smith",
    "email": "jane.smith@email.com",
    "phone": "+1-555-123-4567",
    "linkedin_url": "linkedin.com/in/janesmith",
    "highest_degree": "Bachelor of Science in Computer Science",
    "most_recent_role": "Senior Software Engineer — Acme Corp",
    "location": "San Francisco, CA"
  },
  "fields": [
    {
      "field_id": "SKILLS-LIST",
      "category": "Skills",
      "status": "FOUND",
      "value": "Python, SQL, PostgreSQL",
      "evidence": "Skills: Python, SQL, PostgreSQL",
      "source_section": "Skills",
      "reason": null
    }
  ],
  "sections_found": ["Certifications", "Contact", "Education", "Experience", "Projects", "Skills"],
  "requirements": [
    {
      "requirement": "Python",
      "match_status": "MATCHED",
      "explanation": "'Python' is listed in the candidate's extracted skills.",
      "evidence_ref": "SKILLS-LIST",
      "confidence": "high"
    }
  ],
  "fit_score": {
    "fit_score": 85,
    "score_label": "Strong Match",
    "matched": 7,
    "partial": 3,
    "missing": 0,
    "total": 10
  },
  "errors": []
}
```

## Architecture

| File | Responsibility |
|------|---------------|
| `extractor.py` | PDF (pdfplumber) + DOCX (python-docx) text extraction |
| `segmenter.py` | Fixed allowlist section segmentation (v1.0, 12 canonical sections) |
| `parser.py` | 10 structured field extraction with real-text evidence snippets |
| `scorer.py` | JD tokenisation, multi-layer requirement matching, fit score |
| `models.py` | Pydantic data models |
| `main.py` | FastAPI app |

## Error Codes

| Code | Meaning |
|------|---------|
| `NO_TEXT_LAYER` | PDF has no extractable text (scanned/image-only) |
| `EMPTY_FILE` | File is empty |
| `PARSE_ERROR` | File could not be parsed |
| `UNSUPPORTED_TYPE` | Not PDF or DOCX |

## Field IDs

| Field ID | Description |
|----------|-------------|
| `CONTACT-NAME` | Full name |
| `CONTACT-EMAIL` | Email address |
| `CONTACT-PHONE` | Phone number |
| `CONTACT-URL` | LinkedIn / portfolio URL |
| `EDUCATION-DEGREE` | Highest degree + institution |
| `EXPERIENCE-ROLE` | Most recent job title + company |
| `CONTACT-LOCATION` | City / location |
| `SKILLS-LIST` | Comma-separated skill tokens |
| `CERT-LIST` | Certifications |
| `PROJECT-LIST` | Projects |
