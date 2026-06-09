import sqlite3
import json
import os

DATABASE_PATH = os.path.join(os.path.dirname(__file__), "database.db")

def get_db_connection():
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check if scans table exists and has recommended_jobs column. If not, recreate.
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='scans'")
    table_exists = cursor.fetchone()
    if table_exists:
        cursor.execute("PRAGMA table_info(scans)")
        columns = [col[1] for col in cursor.fetchall()]
        if "recommended_jobs" not in columns:
            cursor.execute("DROP TABLE scans")
            
    # Create scans table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS scans (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT NOT NULL,
            job_description TEXT NOT NULL,
            ats_score REAL NOT NULL,
            similarity_score REAL NOT NULL,
            skill_score REAL NOT NULL,
            formatting_score REAL NOT NULL,
            missing_skills TEXT NOT NULL,
            matched_skills TEXT NOT NULL,
            feedback TEXT NOT NULL,
            recommended_jobs TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Create mock jobs table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS jobs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            company TEXT NOT NULL,
            location TEXT NOT NULL,
            description TEXT NOT NULL,
            skills TEXT NOT NULL,
            salary TEXT NOT NULL
        )
    """)
    
    # Seed mock jobs if the table is empty
    cursor.execute("SELECT COUNT(*) FROM jobs")
    if cursor.fetchone()[0] == 0:
        mock_jobs = [
            {
                "title": "Python Backend Developer",
                "company": "PyNexus Solutions",
                "location": "San Francisco, CA (Hybrid)",
                "description": "We are looking for a Python Backend Developer experienced in Flask, Django, and SQL. You will build scalable REST APIs, integrate machine learning models, and handle cloud deployments.",
                "skills": ["python", "flask", "django", "sql", "rest api", "git", "docker", "postgresql"],
                "salary": "$110,000 - $140,000"
            },
            {
                "title": "React Frontend Engineer",
                "company": "PixelCraft Studio",
                "location": "Remote (US/Canada)",
                "description": "Join our frontend engineering team to design and build stunning, responsive user interfaces. Must be proficient in modern JavaScript, HTML5, CSS3, React, Tailwind CSS, Redux, and REST API integration.",
                "skills": ["react", "javascript", "html", "css", "tailwind", "redux", "git", "rest api", "typescript"],
                "salary": "$100,000 - $130,000"
            },
            {
                "title": "Data Scientist / ML Engineer",
                "company": "Apex AI Research",
                "location": "Boston, MA (On-site)",
                "description": "Seeking a Data Scientist with a passion for NLP and machine learning. You will train sentence transformers, run deep learning models, analyze big datasets using pandas and numpy, and develop AI features.",
                "skills": ["python", "machine learning", "deep learning", "nlp", "pandas", "numpy", "tensorflow", "pytorch", "scikit-learn", "sql"],
                "salary": "$130,000 - $165,000"
            },
            {
                "title": "Full Stack Developer",
                "company": "LaunchPad SaaS",
                "location": "Austin, TX (Hybrid)",
                "description": "Looking for a versatile Full Stack Developer. You will work on Python backend servers and modern React frontends. Knowledge of relational databases, AWS, and Git version control is essential.",
                "skills": ["python", "react", "javascript", "flask", "sql", "git", "html", "css", "aws", "postgresql"],
                "salary": "$115,000 - $145,000"
            },
            {
                "title": "DevOps & Cloud Engineer",
                "company": "CloudShield Security",
                "location": "Remote",
                "description": "Manage our cloud infrastructure and deployment pipelines. Requirements include extensive experience with AWS, Docker, Kubernetes, CI/CD with Jenkins or GitHub Actions, Linux administration, and scripting.",
                "skills": ["aws", "docker", "kubernetes", "git", "linux", "ci/cd", "jenkins", "python"],
                "salary": "$125,000 - $155,000"
            },
            {
                "title": "Product Manager (Technical)",
                "company": "Innovate Labs",
                "location": "New York, NY (Hybrid)",
                "description": "Lead the product vision for our AI developer tools. Collaborate with engineering on Python and React integrations, conduct market research, manage the sprint backlog using Agile and Scrum frameworks.",
                "skills": ["project management", "agile", "scrum", "communication", "leadership", "jira", "product roadmap"],
                "salary": "$120,000 - $150,000"
            }
        ]
        
        for job in mock_jobs:
            cursor.execute("""
                INSERT INTO jobs (title, company, location, description, skills, salary)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (
                job["title"],
                job["company"],
                job["location"],
                job["description"],
                json.dumps(job["skills"]),
                job["salary"]
            ))
            
    conn.commit()
    conn.close()

def save_scan(filename, job_description, ats_score, similarity_score, skill_score, formatting_score, missing_skills, matched_skills, feedback, recommended_jobs):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO scans (filename, job_description, ats_score, similarity_score, skill_score, formatting_score, missing_skills, matched_skills, feedback, recommended_jobs)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        filename,
        job_description,
        ats_score,
        similarity_score,
        skill_score,
        formatting_score,
        json.dumps(missing_skills),
        json.dumps(matched_skills),
        json.dumps(feedback),
        json.dumps(recommended_jobs)
    ))
    scan_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return scan_id

def get_scans():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM scans ORDER BY created_at DESC")
    rows = cursor.fetchall()
    
    scans = []
    for r in rows:
        scans.append({
            "id": r["id"],
            "filename": r["filename"],
            "job_description": r["job_description"],
            "ats_score": r["ats_score"],
            "similarity_score": r["similarity_score"],
            "skill_score": r["skill_score"],
            "formatting_score": r["formatting_score"],
            "missing_skills": json.loads(r["missing_skills"]),
            "matched_skills": json.loads(r["matched_skills"]),
            "feedback": json.loads(r["feedback"]),
            "recommended_jobs": json.loads(r["recommended_jobs"]) if r["recommended_jobs"] else [],
            "created_at": r["created_at"]
        })
    conn.close()
    return scans

def delete_scan(scan_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM scans WHERE id = ?", (scan_id,))
    conn.commit()
    conn.close()

def get_jobs():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM jobs")
    rows = cursor.fetchall()
    
    jobs = []
    for r in rows:
        jobs.append({
            "id": r["id"],
            "title": r["title"],
            "company": r["company"],
            "location": r["location"],
            "description": r["description"],
            "skills": json.loads(r["skills"]),
            "salary": r["salary"]
        })
    conn.close()
    return jobs
