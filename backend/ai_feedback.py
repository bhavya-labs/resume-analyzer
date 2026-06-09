import re

def generate_feedback_v2(resume_structure, analysis_results):
    text = resume_structure["text"]
    raw_text = resume_structure["raw_text"]
    missing_skills = analysis_results["missing_skills"]
    ats_score = analysis_results["ats_score"]
    sections = resume_structure["sections"]
    
    feedback = {
        "skills": [],
        "formatting": [],
        "content": []
    }
    
    # 1. Skills Feedback
    if missing_skills:
        limit_skills = missing_skills[:5]
        skills_str = ", ".join(limit_skills)
        if len(missing_skills) > 5:
            skills_str += f" and {len(missing_skills) - 5} more"
            
        feedback["skills"].append(
            f"Your resume is missing key technical skills highlighted in the job description: <strong>{skills_str}</strong>."
        )
        feedback["skills"].append(
            "Action Item: Dedicate time to learn these missing concepts. Integrate them into your personal projects, then explicitly list them in your Skills section."
        )
    else:
        feedback["skills"].append(
            "Excellent! Your resume covers all the primary technical skills identified in the job description."
        )
        
    # 2. Formatting & Structure Feedback
    missing_secs = [sec for sec, present in sections.items() if not present]
    
    if not sections.get("contact", False):
        feedback["formatting"].append(
            "❌ <strong>Contact Details Missing:</strong> We couldn't detect contact info. Ensure your name, email, phone number, and location are prominently placed at the top of your resume."
        )
    if not sections.get("education", False):
        feedback["formatting"].append(
            "❌ <strong>Education Section Missing:</strong> Add a dedicated section listing your academic degrees, university, graduation years, and relevant coursework."
        )
    if not sections.get("experience", False):
        feedback["formatting"].append(
            "❌ <strong>Work Experience Missing:</strong> Standard ATS expects a 'Work Experience' or 'Employment History' section. Add chronological details about your jobs, internships, or freelance work."
        )
    if not sections.get("skills", False):
        feedback["formatting"].append(
            "❌ <strong>Skills Section Missing:</strong> Create a clear 'Technical Skills' section. Bullet-point or categorize them by type (languages, databases, tools) so scanners can parse them quickly."
        )
    if not sections.get("projects", False):
        feedback["formatting"].append(
            "❌ <strong>Projects Section Missing:</strong> If you are a student or transitioning careers, adding a 'Projects' section with 2-3 entries is vital to prove your hand-on ability."
        )
        
    if not missing_secs:
        feedback["formatting"].append(
            "✅ <strong>Excellent Section Coverage:</strong> All standard ATS-required sections (Contact, Education, Experience, Skills, Projects) were successfully detected!"
        )
        
    # Page Count Check
    p_count = resume_structure["page_count"]
    if p_count > 3:
        feedback["formatting"].append(
            f"⚠️ <strong>Length Warning ({p_count} pages):</strong> Your resume is a bit too long. Try to condense your experience and project descriptions to fit on 1 or 2 pages."
        )
    elif p_count == 1:
        feedback["formatting"].append(
            "✅ <strong>Optimal Length (1 page):</strong> A single-page format is perfect for quick review and keeps the recruiter engaged."
        )
        
    # Word Count Check
    w_count = resume_structure["word_count"]
    if w_count < 150:
        feedback["formatting"].append(
            f"⚠️ <strong>Low Content Density ({w_count} words):</strong> Your resume has very little text. Recruiters and ATS bots need more context to evaluate your accomplishments."
        )
    elif w_count > 1200:
        feedback["formatting"].append(
            f"⚠️ <strong>High Verbosity ({w_count} words):</strong> Your resume is very text-heavy. Consider using shorter bullet points and weeding out outdated or irrelevant details."
        )
        
    # 3. Content & Impact Feedback
    # Action Verbs Check
    action_verbs = ["developed", "built", "designed", "implemented", "created", "led", "managed", "engineered", "collaborated", "optimized", "increased", "reduced", "delivered", "achieved"]
    found_verbs = [v for v in action_verbs if v in text]
    
    if len(found_verbs) < 3:
        feedback["content"].append(
            "💡 <strong>Use Action Verbs:</strong> Your resume has few strong action verbs. Start your experience and project bullets with words like <i>developed, built, designed, optimized, led</i> rather than 'responsible for' or 'helped with'."
        )
    else:
        feedback["content"].append(
            "✅ <strong>Good use of Action Verbs:</strong> Your resume utilizes strong action-oriented language to describe your responsibilities."
        )
        
    # Metrics / Numbers Check
    # Match percentage/numbers like "30%", "$10k", "5 users", etc.
    metrics_pattern = r'\b(\d+%\b|\d+\s*(?:percent|million|k|users|clients|developers|engineers|dollars|\$))\b'
    has_metrics = bool(re.search(metrics_pattern, text))
    
    if not has_metrics:
        feedback["content"].append(
            "💡 <strong>Quantify Achievements:</strong> Your bullets are descriptive but lack measurable results. Add numbers where possible, e.g., 'improved page load times by 35%' or 'managed database containing 10k+ records'."
        )
    else:
        feedback["content"].append(
            "✅ <strong>Metrics Present:</strong> You have included quantitative metrics in your resume, which makes your contributions much more impact-driven."
        )
        
    # Professional profiles checks
    if "github.com" not in text:
        feedback["content"].append(
            "💡 <strong>Add GitHub link:</strong> A GitHub link is highly recommended for tech roles. It allows recruiters to see your actual code repositories and commit history."
        )
    if "linkedin.com" not in text:
        feedback["content"].append(
            "💡 <strong>Add LinkedIn link:</strong> Including a LinkedIn profile URL is standard practice and allows hiring managers to verify your professional network and recommendations."
        )
        
    # Score summary
    if ats_score < 50:
        feedback["content"].append(
            "💡 <strong>Overall Strategy:</strong> Focus heavily on aligning your skills section with the specific job description requirements to bump your score past the initial ATS screening threshold."
        )
    elif ats_score < 75:
        feedback["content"].append(
            "💡 <strong>Overall Strategy:</strong> Your resume is in a good place. Fine-tune your vocabulary and explicitly mention any missing soft or hard skills to make it into the top-tier pile."
        )
        
    return feedback

# Compatibility fallback
def generate_feedback(resume_text, missing_skills, ats_score):
    dummy_structure = {
        "text": resume_text,
        "raw_text": resume_text,
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
    dummy_results = {
        "missing_skills": missing_skills,
        "ats_score": ats_score
    }
    structured = generate_feedback_v2(dummy_structure, dummy_results)
    # Combine back into a list of strings
    flat = []
    for cat, items in structured.items():
        flat.extend(items)
    return flat