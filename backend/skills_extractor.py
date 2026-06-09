import re

# Comprehensive list of common skills (130+)
SKILLS_DB = [
    # Programming Languages
    "python", "javascript", "java", "c++", "c#", "c", "ruby", "php", "swift", "go", "rust", "scala", "kotlin", "typescript", "r", "sql", "html", "css", "bash", "shell",
    # Web Frameworks & Frontend
    "react", "angular", "vue", "node.js", "node", "express", "django", "flask", "spring boot", "laravel", "next.js", "bootstrap", "tailwind", "jquery", "redux", "graphql", "fastapi", "vuex", "sass", "less",
    # Databases & Storage
    "mysql", "postgresql", "mongodb", "sqlite", "redis", "elasticsearch", "oracle", "mariadb", "firebase", "cassandra", "dynamodb", "neo4j",
    # Data Science, AI & Machine Learning
    "machine learning", "deep learning", "nlp", "pandas", "numpy", "tensorflow", "pytorch", "scikit-learn", "keras", "matplotlib", "seaborn", "data science", "computer vision", "statistics", "tableau", "power bi", "natural language processing", "data analysis", "data engineering", "spark", "hadoop",
    # Cloud, DevOps & Infrastructure
    "aws", "azure", "gcp", "docker", "kubernetes", "jenkins", "git", "github", "gitlab", "ci/cd", "linux", "terraform", "ansible", "nginx", "apache", "prometheus", "grafana", "devops", "circleci", "heroku",
    # Software Engineering & Methodologies
    "agile", "scrum", "project management", "rest api", "microservices", "testing", "unit testing", "tdd", "ui/ux", "wireframing", "product management", "system design", "data structures", "algorithms", "software engineering", "sdlc",
    # Soft Skills & Business
    "communication", "teamwork", "leadership", "problem solving", "critical thinking", "negotiation", "time management", "marketing", "seo", "sales", "finance", "excel", "analytical skills"
]

def extract_skills(text):
    text = text.lower()
    found_skills = set()
    
    for skill in SKILLS_DB:
        if skill == 'c':
            # Negative lookahead to prevent matching 'c' in 'c++' or 'c#'
            pattern = r'\bc(?![+#])\b'
        elif skill == 'node':
            # Prevent matching 'node' inside 'node.js'
            pattern = r'\bnode(?!\.js)\b'
        else:
            escaped = re.escape(skill)
            # Check character boundaries safely
            prefix = r'\b' if (skill[0].isalnum() or skill[0] == '_') else ''
            suffix = r'\b' if (skill[-1].isalnum() or skill[-1] == '_') else ''
            pattern = prefix + escaped + suffix
            
        if re.search(pattern, text):
            found_skills.add(skill)
            
    # Post-processing: normalize 'node' and 'node.js' if both exist
    if "node.js" in found_skills and "node" in found_skills:
        found_skills.remove("node")
        
    return sorted(list(found_skills))