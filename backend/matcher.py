from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from skills_extractor import extract_skills
from database import get_jobs

def calculate_similarity_tfidf(text1, text2):
    if not text1.strip() or not text2.strip():
        return 0.0
    try:
        vectorizer = TfidfVectorizer(stop_words='english')
        tfidf = vectorizer.fit_transform([text1, text2])
        sim = cosine_similarity(tfidf[0:1], tfidf[1:2])[0][0]
        return float(sim)
    except Exception:
        return 0.0


def calculate_formatting_score(sections, page_count, word_count):
    score = 100
    
    # Section presence checks
    if not sections.get("contact", False):
        score -= 20
    if not sections.get("education", False):
        score -= 20
    if not sections.get("experience", False):
        score -= 25
    if not sections.get("skills", False):
        score -= 20
    if not sections.get("projects", False):
        score -= 15
        
    # Page count checks
    if page_count == 0:
        score -= 50
    elif page_count > 3:
        score -= 10  # Resumes should ideally be 1-3 pages
        
    # Word count checks
    if word_count < 100:
        score -= 30  # Too short to be a valid resume
    elif word_count > 1500:
        score -= 10  # Too wordy
        
    return max(0, score)

def calculate_match_v2(resume_structure, job_description):
    resume_text = resume_structure["text"]
    
    # 1. Semantic Similarity Score (50% weight)
    similarity = calculate_similarity_tfidf(resume_text, job_description)
    similarity_score = max(0.0, similarity * 100) # Ensure non-negative
    
    # 2. Skill Match Score (30% weight)
    resume_skills = set(extract_skills(resume_text))
    job_skills = set(extract_skills(job_description))
    
    matched_skills = list(resume_skills & job_skills)
    missing_skills = list(job_skills - resume_skills)
    
    if len(job_skills) == 0:
        skill_score = 100.0  # If job description lists no skills, default to 100%
    else:
        skill_score = (len(matched_skills) / len(job_skills)) * 100
        
    # 3. Formatting Score (20% weight)
    formatting_score = calculate_formatting_score(
        resume_structure["sections"],
        resume_structure["page_count"],
        resume_structure["word_count"]
    )
    
    # Weighted Final ATS Score
    final_score = (0.5 * similarity_score) + (0.3 * skill_score) + (0.2 * formatting_score)
    
    return {
        "ats_score": round(final_score, 2),
        "similarity_score": round(similarity_score, 2),
        "skill_score": round(skill_score, 2),
        "formatting_score": round(formatting_score, 2),
        "matched_skills": sorted(matched_skills),
        "missing_skills": sorted(missing_skills),
        "resume_skills": sorted(list(resume_skills))
    }

def recommend_jobs(resume_text, num_recommendations=3):
    jobs = get_jobs()
    if not jobs:
        return []
        
    recommendations = []
    for job in jobs:
        sim = calculate_similarity_tfidf(resume_text, job["description"])
        match_percentage = max(0.0, sim * 100)
        
        recommendations.append({
            "id": job["id"],
            "title": job["title"],
            "company": job["company"],
            "location": job["location"],
            "salary": job["salary"],
            "description": job["description"],
            "skills": job["skills"],
            "match_percentage": round(match_percentage, 1)
        })
        
    # Sort by match percentage in descending order
    recommendations.sort(key=lambda x: x["match_percentage"], reverse=True)
    return recommendations[:num_recommendations]

# Deprecated compatibility wrapper
def calculate_match(resume_text, job_description):
    # Mock structure for backward compatibility
    dummy_structure = {
        "text": resume_text,
        "page_count": 1,
        "word_count": len(resume_text.split()),
        "sections": {
            "contact": True,
            "education": True,
            "experience": True,
            "skills": True,
            "projects": True
        }
    }
    result = calculate_match_v2(dummy_structure, job_description)
    return result["ats_score"], result["missing_skills"]