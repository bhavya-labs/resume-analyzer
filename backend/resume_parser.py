import fitz  # PyMuPDF
import re

def parse_resume_structure(file_path):
    doc = fitz.open(file_path)
    page_count = len(doc)
    
    raw_text = ""
    for page in doc:
        raw_text += page.get_text() + "\n"
        
    text = raw_text.lower()
    
    # Word count
    words = re.findall(r'\b\w+\b', text)
    word_count = len(words)
    
    # Section matching patterns
    sections_patterns = {
        "education": [r'\beducation\b', r'\bacademics?\b', r'\bqualifications?\b', r'\bacademic background\b', r'\bdegree\b'],
        "experience": [r'\bexperience\b', r'\bemployment\b', r'\bwork history\b', r'\bprofessional experience\b', r'\bcareer history\b', r'\bjobs?\b'],
        "projects": [r'\bprojects?\b', r'\bpersonal projects?\b', r'\bacademic projects?\b', r'\bkey projects?\b', r'\bportfolio projects?\b'],
        "skills": [r'\bskills?\b', r'\btechnical skills?\b', r'\btechnologies\b', r'\bkey skills?\b', r'\bexpertise\b', r'\btools\b'],
        "contact": [r'\bcontact\b', r'\bemail\b', r'\bphone\b', r'\blinkedin\b', r'\bgithub\b', r'\baddress\b']
    }
    
    found_sections = {}
    for section, patterns in sections_patterns.items():
        found = False
        for pattern in patterns:
            if re.search(pattern, text):
                found = True
                break
        found_sections[section] = found
        
    # Extra check for contact information (email & phone regex)
    email_pattern = r'[\w\.-]+@[\w\.-]+\.\w+'
    phone_pattern = r'\b\+?\d{1,4}?[-.\s]?\(?\d{1,3}?\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}\b'
    
    has_email = bool(re.search(email_pattern, text))
    has_phone = bool(re.search(phone_pattern, text))
    
    # If explicit contact section or email/phone is found, mark contact as True
    if has_email or has_phone:
        found_sections["contact"] = True
        
    return {
        "text": text,
        "raw_text": raw_text,
        "page_count": page_count,
        "word_count": word_count,
        "sections": found_sections,
        "has_email": has_email,
        "has_phone": has_phone
    }

# Keep original function as fallback / compatibility wrapper
def extract_text_from_pdf(file_path):
    structure = parse_resume_structure(file_path)
    return structure["text"]