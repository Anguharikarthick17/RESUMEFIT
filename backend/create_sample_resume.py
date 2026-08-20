#!/usr/bin/env python3
"""
Create a sample resume PDF for testing the ResumeFit pipeline.
Requires: pip install reportlab
"""
from pathlib import Path

RESUME_CONTENT = [
    ("title", "Jane Smith"),
    ("contact", "jane.smith@email.com  |  +1-555-123-4567  |  linkedin.com/in/janesmith"),
    ("contact", "San Francisco, CA"),
    ("blank", ""),
    ("header", "Summary"),
    ("body", "Results-driven software engineer with 4 years of experience building"),
    ("body", "scalable backend systems using Python, FastAPI, and PostgreSQL."),
    ("blank", ""),
    ("header", "Education"),
    ("body", "Bachelor of Science in Computer Science"),
    ("body", "University of California, Berkeley — May 2020"),
    ("blank", ""),
    ("header", "Experience"),
    ("body", "Senior Software Engineer — Acme Corp (2022 – Present)"),
    ("body", "- Developed backend microservices using Python and FastAPI"),
    ("body", "- Designed and optimised PostgreSQL schemas handling 10M+ records"),
    ("body", "- Built RESTful APIs consumed by mobile and web clients"),
    ("body", "- Collaborated with DevOps on Docker and Kubernetes deployments"),
    ("blank", ""),
    ("body", "Software Engineer — StartupXYZ (2020 – 2022)"),
    ("body", "- Implemented REST APIs using Flask and SQLAlchemy"),
    ("body", "- Wrote unit tests achieving 90% code coverage"),
    ("blank", ""),
    ("header", "Skills"),
    ("body", "Python, FastAPI, Flask, PostgreSQL, SQL, REST APIs, Docker, Kubernetes,"),
    ("body", "Git, Linux, SQLAlchemy, Pytest, Redis, JavaScript, TypeScript"),
    ("blank", ""),
    ("header", "Projects"),
    ("body", "ResumeParser — Open-source Python library for extracting structured data from PDFs"),
    ("body", "CloudMetrics — Real-time dashboard built with React, FastAPI, and PostgreSQL"),
    ("blank", ""),
    ("header", "Certifications"),
    ("body", "AWS Certified Developer – Associate (2023)"),
    ("body", "Python Institute PCEP (2021)"),
]


def create_pdf(output_path: str):
    try:
        from reportlab.lib.pagesizes import LETTER
        from reportlab.pdfgen import canvas
        from reportlab.lib.units import inch
    except ImportError:
        print("reportlab not installed. Install with: pip install reportlab")
        print("Falling back to text-based test...")
        return False

    c = canvas.Canvas(output_path, pagesize=LETTER)
    width, height = LETTER
    x = inch
    y = height - inch

    for kind, text in RESUME_CONTENT:
        if kind == "blank":
            y -= 12
            continue
        if kind == "title":
            c.setFont("Helvetica-Bold", 18)
            c.drawString(x, y, text)
            y -= 24
        elif kind == "contact":
            c.setFont("Helvetica", 10)
            c.drawString(x, y, text)
            y -= 14
        elif kind == "header":
            c.setFont("Helvetica-Bold", 12)
            c.line(x, y + 2, width - inch, y + 2)
            c.drawString(x, y - 10, text.upper())
            y -= 24
        elif kind == "body":
            c.setFont("Helvetica", 10)
            c.drawString(x + 10, y, text)
            y -= 14

        if y < inch:
            c.showPage()
            y = height - inch

    c.save()
    print(f"Created: {output_path}")
    return True


if __name__ == "__main__":
    out = Path(__file__).parent / "sample_resume.pdf"
    success = create_pdf(str(out))
    if not success:
        # Write as .txt fallback
        txt_out = Path(__file__).parent / "sample_resume.txt"
        lines = [text for kind, text in RESUME_CONTENT]
        txt_out.write_text("\n".join(lines))
        print(f"Fallback text file created: {txt_out}")
