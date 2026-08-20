#!/usr/bin/env python3
"""
Generate 10 Professional Demo Candidate Resume PDFs for ResumeFit
Plus 1 Demo Guide README PDF.
"""

import os
import io
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, KeepTogether
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas
import pdfplumber

C_BLACK = colors.HexColor("#111111")
C_DARK = colors.HexColor("#222222")
C_MUTED = colors.HexColor("#555555")
C_LIGHT_BG = colors.HexColor("#F8F8F7")
C_BORDER = colors.HexColor("#E5E5E5")
C_LINE = colors.HexColor("#CCCCCC")

def get_resume_styles():
    styles = getSampleStyleSheet()
    
    name_style = ParagraphStyle(
        'ResumeName',
        fontName='Helvetica-Bold',
        fontSize=17,
        leading=20,
        textColor=C_BLACK,
        alignment=1, # Center
        spaceAfter=2,
    )
    title_style = ParagraphStyle(
        'ResumeTitle',
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=13,
        textColor=C_DARK,
        alignment=1,
        spaceAfter=3,
    )
    contact_style = ParagraphStyle(
        'ResumeContact',
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=C_MUTED,
        alignment=1,
        spaceAfter=6,
    )
    section_heading = ParagraphStyle(
        'SectionHead',
        fontName='Helvetica-Bold',
        fontSize=9.5,
        leading=12,
        textColor=C_BLACK,
        spaceBefore=5,
        spaceAfter=3,
    )
    item_header = ParagraphStyle(
        'ItemHeader',
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=C_BLACK,
    )
    item_sub = ParagraphStyle(
        'ItemSub',
        fontName='Helvetica-Oblique',
        fontSize=8,
        leading=10.5,
        textColor=C_MUTED,
    )
    body_text = ParagraphStyle(
        'ResumeBody',
        fontName='Helvetica',
        fontSize=8,
        leading=10.8,
        textColor=C_DARK,
        spaceAfter=3,
    )
    bullet_text = ParagraphStyle(
        'ResumeBullet',
        fontName='Helvetica',
        fontSize=8,
        leading=10.8,
        textColor=C_DARK,
        leftIndent=8,
        spaceAfter=1.5,
    )
    return {
        'name': name_style,
        'title': title_style,
        'contact': contact_style,
        'section': section_heading,
        'item_header': item_header,
        'item_sub': item_sub,
        'body': body_text,
        'bullet': bullet_text,
    }

def build_resume_pdf(filename, cand):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=40,
        rightMargin=40,
        topMargin=36,
        bottomMargin=36,
    )
    s = get_resume_styles()
    story = []

    # 1. Header
    story.append(Paragraph(cand['name'].upper(), s['name']))
    story.append(Paragraph(cand['title'], s['title']))
    contact_line = f"{cand['location']}  |  {cand['phone']}  |  {cand['email']}  |  {cand['linkedin']}"
    story.append(Paragraph(contact_line, s['contact']))
    story.append(HRFlowable(width="100%", thickness=1, color=C_BLACK, spaceAfter=5))

    # 2. Professional Summary
    story.append(Paragraph("PROFESSIONAL SUMMARY", s['section']))
    story.append(Paragraph(cand['summary'], s['body']))
    story.append(Spacer(1, 2))

    # 3. Technical Skills
    story.append(Paragraph("TECHNICAL SKILLS", s['section']))
    for cat, skl in cand['skills_categories'].items():
        skl_text = f"<b>{cat}:</b> {skl}"
        story.append(Paragraph(skl_text, s['bullet']))
    story.append(Spacer(1, 2))

    # 4. Work Experience
    story.append(Paragraph("WORK EXPERIENCE", s['section']))
    for exp in cand['experience']:
        header_table = Table(
            [[
                Paragraph(f"<b>{exp['role']}</b> — {exp['company']}", s['item_header']),
                Paragraph(f"<i>{exp['period']} | {exp['loc']}</i>", ParagraphStyle('RightSub', parent=s['item_sub'], alignment=2))
            ]],
            colWidths=[360, 172]
        )
        header_table.setStyle(TableStyle([
            ('PADDING', (0,0), (-1,-1), 0),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ]))
        story.append(header_table)
        story.append(Spacer(1, 1))
        for bullet in exp['bullets']:
            story.append(Paragraph(f"• {bullet}", s['bullet']))
        story.append(Spacer(1, 2))

    # 5. Projects
    if 'projects' in cand and cand['projects']:
        story.append(Paragraph("PROJECTS", s['section']))
        for prj in cand['projects']:
            story.append(Paragraph(f"<b>{prj['title']}</b>: {prj['desc']}", s['bullet']))
        story.append(Spacer(1, 2))

    # 6. Education
    story.append(Paragraph("EDUCATION", s['section']))
    for edu in cand['education']:
        edu_table = Table(
            [[
                Paragraph(f"<b>{edu['degree']}</b> — {edu['institution']}", s['item_header']),
                Paragraph(f"<i>Graduation: {edu['year']} | {edu['loc']}</i>", ParagraphStyle('RightSub2', parent=s['item_sub'], alignment=2))
            ]],
            colWidths=[370, 162]
        )
        edu_table.setStyle(TableStyle([
            ('PADDING', (0,0), (-1,-1), 0),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ]))
        story.append(edu_table)
        if 'details' in edu and edu['details']:
            story.append(Paragraph(f"• {edu['details']}", s['bullet']))
        story.append(Spacer(1, 2))

    # 7. Certifications
    if 'certifications' in cand and cand['certifications']:
        story.append(Paragraph("CERTIFICATIONS", s['section']))
        for cert in cand['certifications']:
            story.append(Paragraph(f"• <b>{cert['title']}</b> — {cert['issuer']} ({cert['year']})", s['bullet']))

    doc.build(story)
    print(f"Generated: {filename}")


# ─────────────────────────────────────────────────────────────────────────────
# 10 DIVERSE CANDIDATE DEFINITIONS
# ─────────────────────────────────────────────────────────────────────────────

CANDIDATES = [
    # ── Candidate 1: Very Strong Match (90-100%) ──
    {
        'file': '01_Aarav_Menon_Resume.pdf',
        'name': 'Aarav Menon',
        'title': 'Senior AI / Machine Learning Engineer',
        'email': 'aarav.menon.ml@example.com',
        'phone': '+91 98450 11223',
        'location': 'Bangalore, Karnataka, India',
        'linkedin': 'linkedin.com/in/aarav-menon-ai-example',
        'summary': 'Senior AI/ML Engineer with 4+ years of hands-on industry experience building, optimizing, and deploying production machine learning models and end-to-end data pipelines. Specialized in deep learning with PyTorch, distributed SQL analytics, data preprocessing, and containerized REST API microservices on cloud infrastructure.',
        'skills_categories': {
            'Programming & Core': 'Python (Advanced), SQL, C++, Bash',
            'ML & Deep Learning': 'PyTorch, TensorFlow, Scikit-learn, XGBoost, Model Evaluation, Cross-Validation',
            'Data Processing': 'Pandas, NumPy, Feature Engineering, Data Preprocessing, ETL Pipelines',
            'Deployment & DevOps': 'FastAPI, Flask, Docker, REST APIs, Git, AWS (SageMaker, S3, EC2), CI/CD'
        },
        'experience': [
            {
                'role': 'Senior Machine Learning Engineer',
                'company': 'Nexus AI Systems Ltd',
                'period': 'July 2022 – Present (2+ yrs)',
                'loc': 'Bangalore, India',
                'bullets': [
                    'Architected and deployed deep learning classification and regression pipelines using Python, PyTorch, and Scikit-learn, improving prediction accuracy by 28%.',
                    'Engineered automated data preprocessing and feature extraction modules processing 5M+ daily records using Pandas and NumPy.',
                    'Optimized complex PostgreSQL and SQL queries, reducing database latency by 45% for high-throughput model inference endpoints.',
                    'Built and containerized scalable REST APIs with FastAPI and Docker, maintaining 99.9% uptime on AWS cloud infrastructure.',
                    'Conducted rigorous model evaluation using ROC-AUC, F1-score, and SHAP values for explainable AI governance; managed Git version control.'
                ]
            },
            {
                'role': 'Machine Learning Engineer',
                'company': 'Cognitive Solutions Pvt Ltd',
                'period': 'August 2020 – June 2022 (2 yrs)',
                'loc': 'Hyderabad, India',
                'bullets': [
                    'Developed predictive analytics pipelines using Python, Pandas, NumPy, and Scikit-learn for enterprise customer churn modeling.',
                    'Created database schemas and automated SQL ETL scripts to ingest unstructured operational data.',
                    'Collaborated on REST API integration and Git CI/CD deployment workflows.'
                ]
            }
        ],
        'projects': [
            {
                'title': 'Autonomous Customer Retention Engine',
                'desc': 'Built an end-to-end ML pipeline with PyTorch and Scikit-learn deployed as a Dockerized FastAPI REST service on AWS.'
            },
            {
                'title': 'High-Throughput SQL Feature Store',
                'desc': 'Designed an automated feature engineering pipeline with Pandas, NumPy, and PostgreSQL managing 100+ model variables.'
            }
        ],
        'education': [
            {
                'degree': 'B.Tech in Computer Science & Engineering',
                'institution': 'National Institute of Technology (NIT), Surathkal',
                'year': '2020',
                'loc': 'Karnataka, India',
                'details': 'First Class with Distinction. Specialization in Intelligent Systems and Distributed Computing.'
            }
        ],
        'certifications': [
            {'title': 'AWS Certified Machine Learning – Specialty', 'issuer': 'Amazon Web Services', 'year': '2023'},
            {'title': 'Deep Learning Specialization (PyTorch & TensorFlow)', 'issuer': 'DeepLearning.AI', 'year': '2021'}
        ]
    },

    # ── Candidate 2: Strong Match (85-95%) ──
    {
        'file': '02_Priya_Nair_Resume.pdf',
        'name': 'Priya Nair',
        'title': 'Machine Learning Engineer',
        'email': 'priya.nair.eng@example.com',
        'phone': '+91 97401 22334',
        'location': 'Kochi, Kerala, India',
        'linkedin': 'linkedin.com/in/priya-nair-ml-example',
        'summary': 'Machine Learning Engineer with 3 years of experience developing machine learning models and data preprocessing pipelines in Python. Highly proficient in TensorFlow, Scikit-learn, SQL database queries, and containerized REST API model deployment using Git version control.',
        'skills_categories': {
            'Core Skills': 'Python, SQL, R, Linux Shell Scripting',
            'Machine Learning': 'TensorFlow, Keras, Scikit-learn, Model Evaluation, Hyperparameter Tuning',
            'Data Analysis': 'Pandas, NumPy, Data Preprocessing, Data Cleaning, Matplotlib, Seaborn',
            'Deployment & Tools': 'REST APIs, FastAPI, Docker, Git, GitHub, MySQL, PostgreSQL'
        },
        'experience': [
            {
                'role': 'Machine Learning Engineer',
                'company': 'Synthetix Data Labs',
                'period': 'September 2021 – Present (3 yrs)',
                'loc': 'Kochi, India',
                'bullets': [
                    'Trained and evaluated deep neural networks using Python and TensorFlow for multi-class image classification and structured tabular prediction.',
                    'Constructed robust data preprocessing pipelines with Pandas and NumPy, handling missing data imputation and categorical encoding.',
                    'Wrote optimized SQL queries and stored procedures across relational databases to feed training datasets to ML models.',
                    'Built lightweight REST API services with FastAPI to serve predictions with sub-80ms response times; tracked codebase via Git.',
                    'Implemented comprehensive model evaluation metrics including precision-recall curves, confusion matrices, and cross-validation.'
                ]
            }
        ],
        'projects': [
            {
                'title': 'Real-Time Fraud Detection System',
                'desc': 'Implemented a TensorFlow anomaly detection model integrated with a PostgreSQL relational database and FastAPI REST endpoints.'
            },
            {
                'title': 'Predictive Health Diagnostics Pipeline',
                'desc': 'Developed an automated data cleaning and Scikit-learn model evaluation suite versioned with Git.'
            }
        ],
        'education': [
            {
                'degree': 'B.Tech in Artificial Intelligence & Data Science',
                'institution': 'Government Engineering College, Thrissur',
                'year': '2021',
                'loc': 'Kerala, India',
                'details': 'CGPA: 8.9/10. Dean’s Honors List for Academic Excellence in Machine Learning.'
            }
        ],
        'certifications': [
            {'title': 'TensorFlow Developer Certificate', 'issuer': 'Google Cloud', 'year': '2022'},
            {'title': 'Applied Data Science with Python', 'issuer': 'Coursera', 'year': '2021'}
        ]
    },

    # ── Candidate 3: Strong Match (80-90%) ──
    {
        'file': '03_Rohan_Kapoor_Resume.pdf',
        'name': 'Rohan Kapoor',
        'title': 'Data Scientist & ML Practitioner',
        'email': 'rohan.kapoor.ds@example.com',
        'phone': '+91 98110 33445',
        'location': 'New Delhi, India',
        'linkedin': 'linkedin.com/in/rohan-kapoor-ds-example',
        'summary': 'Data Scientist with 3 years of experience applying statistical modeling, machine learning, and data analytics. Expert in Python, Scikit-learn, SQL database queries, Pandas data preprocessing, and model evaluation metrics with experience exposing insights via REST APIs and Git.',
        'skills_categories': {
            'Languages': 'Python, SQL, R',
            'ML & Modeling': 'Scikit-learn, XGBoost, Random Forest, Model Evaluation, Statistical Modeling',
            'Data Wrangling': 'Pandas, NumPy, Data Preprocessing, Feature Selection, Statistical Analysis',
            'Software & Tools': 'Flask, REST APIs, Git, PostgreSQL, Tableau, Jupyter'
        },
        'experience': [
            {
                'role': 'Data Scientist',
                'company': 'Vanguard Analytics Corp',
                'period': 'October 2021 – Present (3 yrs)',
                'loc': 'Gurgaon, India',
                'bullets': [
                    'Built statistical and machine learning models using Python and Scikit-learn for demand forecasting and price elasticity.',
                    'Performed extensive data preprocessing, outlier removal, and normalization on large datasets with Pandas and NumPy.',
                    'Extracted complex training features from PostgreSQL databases using advanced SQL joins, indexing, and aggregations.',
                    'Evaluated model performance via k-fold cross-validation, RMSE, and F1-score; documented versioned experiments in Git.',
                    'Developed Flask REST API endpoints to deliver real-time model inference scores to downstream enterprise web apps.'
                ]
            }
        ],
        'projects': [
            {
                'title': 'Enterprise Supply Chain Demand Forecaster',
                'desc': 'Engineered a Scikit-learn regression model using Pandas feature preprocessing and SQL database integration.'
            },
            {
                'title': 'Customer Segmentation Engine',
                'desc': 'Applied unsupervised clustering algorithms with NumPy and Scikit-learn, visualized with Python Matplotlib.'
            }
        ],
        'education': [
            {
                'degree': 'M.Tech in Data Science & Machine Learning',
                'institution': 'Delhi Technological University (DTU)',
                'year': '2021',
                'loc': 'Delhi, India',
                'details': 'Master’s Thesis: Scalable Machine Learning Pipelines for Relational Structured Datasets.'
            },
            {
                'degree': 'B.Tech in Computer Science',
                'institution': 'Indraprastha University',
                'year': '2019',
                'loc': 'Delhi, India',
                'details': 'Graduated with First Class Honors.'
            }
        ],
        'certifications': [
            {'title': 'IBM Certified Data Science Professional', 'issuer': 'IBM', 'year': '2021'}
        ]
    },

    # ── Candidate 4: Good Match (70-85%) ──
    {
        'file': '04_Ananya_Iyer_Resume.pdf',
        'name': 'Ananya Iyer',
        'title': 'Software Engineer — ML & Data Specialist',
        'email': 'ananya.iyer.tech@example.com',
        'phone': '+91 98200 44556',
        'location': 'Chennai, Tamil Nadu, India',
        'linkedin': 'linkedin.com/in/ananya-iyer-tech-example',
        'summary': 'Software Engineer with 2.5 years of industry experience transitioning into Machine Learning. Strong background in Python software development, SQL databases, data preprocessing with Pandas/NumPy, and foundational ML with Scikit-learn. Adept with Git collaboration and REST API development.',
        'skills_categories': {
            'Programming': 'Python, SQL, JavaScript, HTML/CSS',
            'Machine Learning': 'Scikit-learn, Linear Regression, Decision Trees, Model Evaluation',
            'Data Analysis': 'Pandas, NumPy, Data Preprocessing, Data Cleaning',
            'Web & Tools': 'REST APIs, FastAPI, Git, GitHub, MySQL, PostgreSQL'
        },
        'experience': [
            {
                'role': 'Software Development Engineer',
                'company': 'Photon Interactive Solutions',
                'period': 'April 2022 – Present (2.5 yrs)',
                'loc': 'Chennai, India',
                'bullets': [
                    'Developed Python backend microservices and REST APIs integrated with relational PostgreSQL databases.',
                    'Implemented machine learning modules using Python and Scikit-learn for automated text classification and sentiment tagging.',
                    'Performed data preprocessing, schema validation, and data cleaning routines using Pandas and NumPy.',
                    'Collaborated within an Agile engineering team using Git for branch management, code reviews, and version control.',
                    'Measured model evaluation metrics including accuracy and recall during weekly quality verification cycles.'
                ]
            }
        ],
        'projects': [
            {
                'title': 'Automated Ticket Classifier',
                'desc': 'Built a Scikit-learn classification pipeline with Python and Pandas to categorize inbound IT helpdesk tickets.'
            }
        ],
        'education': [
            {
                'degree': 'B.E. in Computer Science and Engineering',
                'institution': 'Anna University, College of Engineering Guindy',
                'year': '2022',
                'loc': 'Chennai, India',
                'details': 'Graduated with Distinction. Coursework in Data Structures, Algorithms, DBMS, and Machine Learning.'
            }
        ],
        'certifications': [
            {'title': 'Machine Learning Specialization with Python', 'issuer': 'Stanford Online / Coursera', 'year': '2023'}
        ]
    },

    # ── Candidate 5: Moderate Match (60-75%) ──
    {
        'file': '05_Arjun_Reddy_Resume.pdf',
        'name': 'Arjun Reddy',
        'title': 'Data Analyst & Python Developer',
        'email': 'arjun.reddy.data@example.com',
        'phone': '+91 99490 55667',
        'location': 'Hyderabad, Telangana, India',
        'linkedin': 'linkedin.com/in/arjun-reddy-data-example',
        'summary': 'Data Analyst with 2 years of experience specializing in Python data wrangling, advanced SQL database querying, and reporting. Proficient in Pandas and NumPy for data preprocessing, with baseline knowledge of Scikit-learn and model evaluation techniques.',
        'skills_categories': {
            'Core Skills': 'Python, SQL, PostgreSQL, MySQL',
            'Data Processing': 'Pandas, NumPy, Data Preprocessing, Data Cleaning, Data Modeling',
            'Basic ML': 'Scikit-learn (Basic regression and clustering), Model Evaluation',
            'Tools & BI': 'Git, PowerBI, Tableau, Excel, Jupyter Notebooks'
        },
        'experience': [
            {
                'role': 'Data Analyst',
                'company': 'Quantiva Analytics Pvt Ltd',
                'period': 'July 2022 – Present (2 yrs)',
                'loc': 'Hyderabad, India',
                'bullets': [
                    'Authored complex SQL queries, window functions, and CTEs to extract business metrics from relational databases.',
                    'Engineered data preprocessing and transformation pipelines using Python, Pandas, and NumPy.',
                    'Built baseline regression models using Scikit-learn to forecast monthly revenue trends.',
                    'Maintained analytics scripts and SQL schemas in Git repositories with standard branching workflows.',
                    'Conducted exploratory data analysis and validated data quality across multi-table databases.'
                ]
            }
        ],
        'projects': [
            {
                'title': 'Financial Metrics Transformation Pipeline',
                'desc': 'Automated monthly financial reconciliation using Python, Pandas, and SQL queries with Git versioning.'
            }
        ],
        'education': [
            {
                'degree': 'B.Tech in Information Technology',
                'institution': 'Jawaharlal Nehru Technological University (JNTU)',
                'year': '2022',
                'loc': 'Hyderabad, India',
                'details': 'Focus on Database Management Systems, Statistics, and Python Programming.'
            }
        ],
        'certifications': [
            {'title': 'SQL for Data Science Professional Certificate', 'issuer': 'Coursera / UC Davis', 'year': '2022'}
        ]
    },

    # ── Candidate 6: Moderate / Needs Review (50-65%) ──
    {
        'file': '06_Maya_Sharma_Resume.pdf',
        'name': 'Maya Sharma',
        'title': 'Associate Machine Learning Engineer',
        'email': 'maya.sharma.ml@example.com',
        'phone': '+91 98710 66778',
        'location': 'Pune, Maharashtra, India',
        'linkedin': 'linkedin.com/in/maya-sharma-ml-example',
        'summary': 'Junior ML Engineer with 1.5 years of industry experience. Strong academic foundation in Machine Learning algorithms, Python programming, and Scikit-learn. Eager to expand production deployment and advanced deep learning capabilities.',
        'skills_categories': {
            'Programming': 'Python, C++, SQL (Basic)',
            'Machine Learning': 'Scikit-learn, PyTorch (Foundational), Model Evaluation',
            'Data Tools': 'Pandas, NumPy, Data Preprocessing, Matplotlib',
            'Tools': 'Git, GitHub, Jupyter Notebook, Linux'
        },
        'experience': [
            {
                'role': 'Associate Machine Learning Engineer',
                'company': 'AlgoScale Technologies',
                'period': 'January 2023 – Present (1.5 yrs)',
                'loc': 'Pune, India',
                'bullets': [
                    'Implemented machine learning feature extraction and data preprocessing scripts using Python and Pandas.',
                    'Trained baseline classification algorithms using Scikit-learn and performed model evaluation with accuracy and F1 metrics.',
                    'Assisted in querying MySQL databases using SQL scripts to generate training and testing splits.',
                    'Utilized Git for daily version control and issue tracking in an Agile team setup.'
                ]
            }
        ],
        'projects': [
            {
                'title': 'Predictive Housing Price Model',
                'desc': 'Implemented linear regression and random forest models using Python, Pandas, and Scikit-learn.'
            }
        ],
        'education': [
            {
                'degree': 'B.E. in Computer Science',
                'institution': 'Pune Institute of Computer Technology (PICT)',
                'year': '2022',
                'loc': 'Pune, India',
                'details': 'Final year project in Machine Learning. Graduated with First Class.'
            }
        ],
        'certifications': [
            {'title': 'Python for Data Science and Machine Learning', 'issuer': 'Udemy', 'year': '2022'}
        ]
    },

    # ── Candidate 7: Partial Match (40-55%) ──
    {
        'file': '07_Karthik_Varma_Resume.pdf',
        'name': 'Karthik Varma',
        'title': 'Backend Python Developer',
        'email': 'karthik.varma.dev@example.com',
        'phone': '+91 98480 77889',
        'location': 'Visakhapatnam, Andhra Pradesh, India',
        'linkedin': 'linkedin.com/in/karthik-varma-dev-example',
        'summary': 'Backend Software Developer with 3 years of experience specializing in Python API development and SQL databases. Strong in REST APIs, Django, PostgreSQL, and Git version control, with basic exposure to data processing.',
        'skills_categories': {
            'Backend & Web': 'Python, Django, FastAPI, REST APIs, Microservices',
            'Databases': 'SQL, PostgreSQL, MySQL, Redis',
            'DevOps & Tools': 'Git, Docker, GitHub, Linux, Postman',
            'Data/Other': 'Basic Pandas, Data Preprocessing (Lightweight)'
        },
        'experience': [
            {
                'role': 'Backend Developer',
                'company': 'CloudStream Digital Solutions',
                'period': 'August 2021 – Present (3 yrs)',
                'loc': 'Hyderabad, India',
                'bullets': [
                    'Engineered scalable REST APIs and backend services using Python and FastAPI.',
                    'Designed relational database schemas, optimized SQL queries, and implemented PostgreSQL connection pooling.',
                    'Managed multi-environment Git code repositories and automated CI/CD pipelines.',
                    'Created basic data preprocessing scripts for API payload ingestion and validation.'
                ]
            }
        ],
        'projects': [
            {
                'title': 'Enterprise RESTful Inventory API',
                'desc': 'Designed a high-performance Python FastAPI service with PostgreSQL database integration.'
            }
        ],
        'education': [
            {
                'degree': 'B.Tech in Information Technology',
                'institution': 'Andhra University College of Engineering',
                'year': '2021',
                'loc': 'Visakhapatnam, India',
                'details': 'Graduated with First Class Honors.'
            }
        ],
        'certifications': [
            {'title': 'Certified Python Developer', 'issuer': 'Python Institute', 'year': '2021'}
        ]
    },

    # ── Candidate 8: Low Match (30-45%) ──
    {
        'file': '08_Nisha_Patel_Resume.pdf',
        'name': 'Nisha Patel',
        'title': 'Frontend Web Developer',
        'email': 'nisha.patel.ui@example.com',
        'phone': '+91 98250 88990',
        'location': 'Ahmedabad, Gujarat, India',
        'linkedin': 'linkedin.com/in/nisha-patel-ui-example',
        'summary': 'Frontend Web Developer with 3 years of experience building modern user interfaces with React, JavaScript, and TypeScript. Experienced in UI component design, REST API consumption, and Git collaboration. Basic academic exposure to Python and SQL.',
        'skills_categories': {
            'Frontend Core': 'JavaScript (ES6+), TypeScript, React.js, Next.js, HTML5, CSS3, TailwindCSS',
            'State & Tools': 'Redux Toolkit, REST APIs, Git, Webpack, Vite, Figma',
            'Other': 'Basic Python, Basic SQL (Querying)'
        },
        'experience': [
            {
                'role': 'Frontend Developer',
                'company': 'PixelCraft Web Studio',
                'period': 'July 2021 – Present (3 yrs)',
                'loc': 'Ahmedabad, India',
                'bullets': [
                    'Developed responsive web interfaces using React.js and TypeScript.',
                    'Integrated backend REST APIs and handled asynchronous state management with Redux.',
                    'Utilized Git for version control, pull requests, and continuous integration.',
                    'Conducted UI testing and improved Core Web Vitals performance by 35%.'
                ]
            }
        ],
        'projects': [
            {
                'title': 'E-Commerce Dashboard Web App',
                'desc': 'Built a React and TailwindCSS dashboard consuming RESTful microservices.'
            }
        ],
        'education': [
            {
                'degree': 'B.E. in Information Technology',
                'institution': 'Gujarat Technological University (GTU)',
                'year': '2021',
                'loc': 'Ahmedabad, India',
                'details': 'First Class. Coursework in Web Technologies and Software Engineering.'
            }
        ],
        'certifications': [
            {'title': 'Meta Front-End Developer Professional Certificate', 'issuer': 'Meta / Coursera', 'year': '2022'}
        ]
    },

    # ── Candidate 9: Very Low Match (15-35%) ──
    {
        'file': '09_Vikram_Singh_Resume.pdf',
        'name': 'Vikram Singh',
        'title': 'Enterprise Java Developer',
        'email': 'vikram.singh.java@example.com',
        'phone': '+91 98100 99001',
        'location': 'Chandigarh, Punjab, India',
        'linkedin': 'linkedin.com/in/vikram-singh-java-example',
        'summary': 'Enterprise Software Developer with 2 years of experience specializing in Java, Spring Boot, and enterprise SQL databases. Experienced in backend microservices, JUnit testing, and Git version control.',
        'skills_categories': {
            'Backend & Core': 'Java 17, Spring Boot, Spring Data JPA, Hibernate, Maven',
            'Databases': 'SQL, Oracle DB, PostgreSQL, MySQL',
            'Tools & Methods': 'Git, Jenkins, JUnit, Mockito, REST APIs, Agile'
        },
        'experience': [
            {
                'role': 'Java Software Developer',
                'company': 'Infotech Global Systems',
                'period': 'June 2022 – Present (2 yrs)',
                'loc': 'Chandigarh, India',
                'bullets': [
                    'Developed enterprise banking backend services using Java and Spring Boot microservices.',
                    'Wrote SQL procedures and queries for Oracle Database persistence layers.',
                    'Created unit and integration tests using JUnit and Mockito.',
                    'Collaborated with teams using Git for code reviews and repository management.'
                ]
            }
        ],
        'projects': [
            {
                'title': 'Banking Transaction Processing Engine',
                'desc': 'Built a scalable Java Spring Boot backend service with relational SQL persistence.'
            }
        ],
        'education': [
            {
                'degree': 'B.Tech in Computer Science & Engineering',
                'institution': 'Punjab Engineering College (PEC)',
                'year': '2022',
                'loc': 'Chandigarh, India',
                'details': 'First Class Honors.'
            }
        ],
        'certifications': [
            {'title': 'Oracle Certified Professional: Java SE 11 Developer', 'issuer': 'Oracle', 'year': '2022'}
        ]
    },

    # ── Candidate 10: Poor Match (0-25%) ──
    {
        'file': '10_Sneha_Krishnan_Resume.pdf',
        'name': 'Sneha Krishnan',
        'title': 'Entry Level Graduate — Computer Applications',
        'email': 'sneha.krishnan.grad@example.com',
        'phone': '+91 97110 00112',
        'location': 'Madurai, Tamil Nadu, India',
        'linkedin': 'linkedin.com/in/sneha-krishnan-grad-example',
        'summary': 'Recent Computer Science graduate with foundational academic knowledge in C++ and basic Java. Seeking an entry-level software programming role. Familiar with basic Git concepts and theoretical computer science fundamentals.',
        'skills_categories': {
            'Programming': 'C++, Basic Java, HTML, CSS',
            'Core Concepts': 'Data Structures, OOP, Basic SQL',
            'Tools': 'Git (Basic), VS Code, MS Office'
        },
        'experience': [
            {
                'role': 'Computer Science Academic Intern',
                'company': 'Academic Project / College Lab',
                'period': 'January 2024 – May 2024 (5 months)',
                'loc': 'Madurai, India',
                'bullets': [
                    'Assisted in developing simple C++ and Java academic assignment programs.',
                    'Practiced basic SQL SELECT queries on sample student database tables.',
                    'Used Git to upload and manage student laboratory assignments.'
                ]
            }
        ],
        'projects': [
            {
                'title': 'Student Record Management System',
                'desc': 'Simple C++ desktop application with console interface and file storage.'
            }
        ],
        'education': [
            {
                'degree': 'B.Sc in Computer Science',
                'institution': 'Madurai Kamaraj University',
                'year': '2024',
                'loc': 'Madurai, India',
                'details': 'Graduated with First Class (74%).'
            }
        ],
        'certifications': [
            {'title': 'Certificate in C++ Programming', 'issuer': 'NIIT', 'year': '2023'}
        ]
    }
]


# ─────────────────────────────────────────────────────────────────────────────
# GENERATE DEMO GUIDE README PDF
# ─────────────────────────────────────────────────────────────────────────────

def build_demo_readme_pdf(filename="ResumeFit_Demo_Candidates_README.pdf"):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=45,
        rightMargin=45,
        topMargin=45,
        bottomMargin=45,
    )
    styles = getSampleStyleSheet()

    t_title = ParagraphStyle('RTitle', fontName='Helvetica-Bold', fontSize=18, leading=22, textColor=C_BLACK, spaceAfter=3)
    t_sub = ParagraphStyle('RSub', fontName='Helvetica-Bold', fontSize=10, leading=13, textColor=C_DARK, spaceAfter=8)
    t_body = ParagraphStyle('RBody', fontName='Helvetica', fontSize=8.5, leading=11.5, textColor=C_DARK, spaceAfter=6)
    t_cell = ParagraphStyle('RCell', fontName='Helvetica', fontSize=8, leading=10, textColor=C_DARK)
    t_cell_bold = ParagraphStyle('RCellB', fontName='Helvetica-Bold', fontSize=8, leading=10, textColor=C_BLACK)
    t_cell_head = ParagraphStyle('RCellH', fontName='Helvetica-Bold', fontSize=8.5, leading=11, textColor=colors.white)

    story = []

    story.append(Paragraph("RESUMEFIT DEMO CANDIDATES SUITE", t_title))
    story.append(Paragraph("10 Standardized Demo Resumes for Job Screening & Deterministic Ranking Verification", t_sub))
    story.append(HRFlowable(width="100%", thickness=1.5, color=C_BLACK, spaceAfter=10))

    story.append(Paragraph(
        "This guide outlines the 10 fictional candidate resumes generated for testing ResumeFit's deterministic parsing, "
        "evidence grounding, and fit scoring engine against the <b>AI / Machine Learning Engineer</b> target job opening.",
        t_body
    ))
    story.append(Paragraph(
        "<b>Target Job Requirements:</b> Python, Machine Learning, SQL, Pandas, NumPy, Scikit-learn, PyTorch/TensorFlow, "
        "Data Preprocessing, Model Evaluation, REST APIs, Git, and 2+ years experience.",
        t_body
    ))
    story.append(Spacer(1, 4))

    table_data = [
        [
            Paragraph("Candidate File & Name", t_cell_head),
            Paragraph("Intended Match Tier", t_cell_head),
            Paragraph("Main Strengths", t_cell_head),
            Paragraph("Main Gaps / Gating Factor", t_cell_head)
        ],
        [
            Paragraph("<b>01_Aarav_Menon</b><br/>Senior AI/ML Engineer", t_cell_bold),
            Paragraph("<b>VERY STRONG</b><br/>(90–100%)", t_cell_bold),
            Paragraph("4 yrs exp, PyTorch, Python, SQL, Pandas, NumPy, Scikit-learn, REST APIs, Docker, AWS, Git", t_cell),
            Paragraph("None (Fully qualified ideal profile)", t_cell)
        ],
        [
            Paragraph("<b>02_Priya_Nair</b><br/>ML Engineer", t_cell_bold),
            Paragraph("<b>STRONG MATCH</b><br/>(85–95%)", t_cell_bold),
            Paragraph("3 yrs exp, TensorFlow, Python, Scikit-learn, SQL, Pandas, NumPy, FastAPI REST APIs, Git", t_cell),
            Paragraph("Minor (TensorFlow rather than PyTorch focus)", t_cell)
        ],
        [
            Paragraph("<b>03_Rohan_Kapoor</b><br/>Data Scientist", t_cell_bold),
            Paragraph("<b>STRONG MATCH</b><br/>(80–90%)", t_cell_bold),
            Paragraph("3 yrs exp, Scikit-learn, ML, SQL, Pandas, NumPy, Model Evaluation, M.Tech Data Science", t_cell),
            Paragraph("Lighter on deep learning framework specifics", t_cell)
        ],
        [
            Paragraph("<b>04_Ananya_Iyer</b><br/>Software Engineer → ML", t_cell_bold),
            Paragraph("<b>GOOD MATCH</b><br/>(70–85%)", t_cell_bold),
            Paragraph("2.5 yrs exp, Python, SQL, Scikit-learn, Pandas, NumPy, REST APIs, Git", t_cell),
            Paragraph("Less dedicated deep learning production history", t_cell)
        ],
        [
            Paragraph("<b>05_Arjun_Reddy</b><br/>Data Analyst", t_cell_bold),
            Paragraph("<b>MODERATE MATCH</b><br/>(60–75%)", t_cell_bold),
            Paragraph("2 yrs exp, Strong Python, SQL, Pandas, NumPy data preprocessing", t_cell),
            Paragraph("Lacks deep learning and advanced model deployment", t_cell)
        ],
        [
            Paragraph("<b>06_Maya_Sharma</b><br/>Junior ML Engineer", t_cell_bold),
            Paragraph("<b>NEEDS REVIEW</b><br/>(50–65%)", t_cell_bold),
            Paragraph("Python, Scikit-learn, Pandas, NumPy, ML fundamentals", t_cell),
            Paragraph("1.5 yrs exp (below 2+ years requirement), basic SQL", t_cell)
        ],
        [
            Paragraph("<b>07_Karthik_Varma</b><br/>Backend Developer", t_cell_bold),
            Paragraph("<b>PARTIAL MATCH</b><br/>(40–55%)", t_cell_bold),
            Paragraph("3 yrs exp, Advanced Python, SQL, REST APIs, Git, PostgreSQL", t_cell),
            Paragraph("No Machine Learning / Scikit-learn / Model Eval", t_cell)
        ],
        [
            Paragraph("<b>08_Nisha_Patel</b><br/>Frontend Developer", t_cell_bold),
            Paragraph("<b>LOW MATCH</b><br/>(30–45%)", t_cell_bold),
            Paragraph("3 yrs exp, REST APIs, Git, Basic Python/SQL syntax", t_cell),
            Paragraph("Core stack is React/TypeScript; no ML experience", t_cell)
        ],
        [
            Paragraph("<b>09_Vikram_Singh</b><br/>Java Developer", t_cell_bold),
            Paragraph("<b>VERY LOW MATCH</b><br/>(15–35%)", t_cell_bold),
            Paragraph("2 yrs exp, Enterprise SQL, REST APIs, Git", t_cell),
            Paragraph("Java/Spring focused; zero Python or ML background", t_cell)
        ],
        [
            Paragraph("<b>10_Sneha_Krishnan</b><br/>Fresh Graduate CS", t_cell_bold),
            Paragraph("<b>POOR MATCH</b><br/>(0–25%)", t_cell_bold),
            Paragraph("Basic programming concepts, academic CS degree", t_cell),
            Paragraph("0 yrs prof experience; lacks ML, SQL, and Python stack", t_cell)
        ],
    ]

    t = Table(table_data, colWidths=[130, 95, 160, 137])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), C_BLACK),
        ('BOX', (0, 0), (-1, -1), 1, C_BORDER),
        ('GRID', (0, 0), (-1, -1), 0.5, C_BORDER),
        ('PADDING', (0, 0), (-1, -1), 4),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, C_LIGHT_BG]),
    ]))
    story.append(t)
    story.append(Spacer(1, 10))

    story.append(Paragraph(
        "<b>Important Note:</b> These target tiers were used to design realistic, distinct resumes. "
        "The actual fit scores, rankings, and evidence citations are dynamically computed by the ResumeFit backend engine.",
        t_body
    ))

    doc.build(story)
    print(f"Generated: {filename}")


if __name__ == "__main__":
    demo_dir = "demo_resumes"
    os.makedirs(demo_dir, exist_ok=True)

    for cand in CANDIDATES:
        root_path = cand['file']
        folder_path = os.path.join(demo_dir, cand['file'])
        build_resume_pdf(root_path, cand)
        build_resume_pdf(folder_path, cand)

    build_demo_readme_pdf("ResumeFit_Demo_Candidates_README.pdf")
    build_demo_readme_pdf(os.path.join(demo_dir, "ResumeFit_Demo_Candidates_README.pdf"))
    print("All 10 Demo Resumes and README PDF generated successfully.")
