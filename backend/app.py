from flask import Flask, request, jsonify
from flask_cors import CORS
import os

# Import modules
from resume_parser import parse_resume_structure
from matcher import calculate_match_v2, recommend_jobs
from ai_feedback import generate_feedback_v2
from database import init_db, save_scan, get_scans, delete_scan, get_jobs

app = Flask(__name__)
# Enable CORS for frontend integration
CORS(app)

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Initialize database tables and seed mock jobs
init_db()

@app.route("/")
def home():
    return jsonify({
        "status": "online",
        "message": "AI Resume Analyzer Backend is Running 🚀"
    })

@app.route("/analyze", methods=["POST"])
def analyze():
    try:
        if "resume" not in request.files:
            return jsonify({"error": "No resume file uploaded"}), 400
            
        file = request.files["resume"]
        job_desc = request.form.get("job_description", "")

        if file.filename == "":
            return jsonify({"error": "No file selected"}), 400

        # Save uploaded file
        path = os.path.join(UPLOAD_FOLDER, file.filename)
        file.save(path)

        # 1. Parse resume structure
        structure = parse_resume_structure(path)

        # 2. Calculate score breakdown
        match_results = calculate_match_v2(structure, job_desc)

        # 3. Generate detailed, categorized AI feedback
        feedback = generate_feedback_v2(structure, match_results)

        # 4. Get recommended jobs
        recommended_jobs = recommend_jobs(structure["text"], num_recommendations=3)

        # 5. Save to history database
        scan_id = save_scan(
            filename=file.filename,
            job_description=job_desc,
            ats_score=match_results["ats_score"],
            similarity_score=match_results["similarity_score"],
            skill_score=match_results["skill_score"],
            formatting_score=match_results["formatting_score"],
            missing_skills=match_results["missing_skills"],
            matched_skills=match_results["matched_skills"],
            feedback=feedback,
            recommended_jobs=recommended_jobs
        )

        return jsonify({
            "scan_id": scan_id,
            "filename": file.filename,
            "ats_score": match_results["ats_score"],
            "similarity_score": match_results["similarity_score"],
            "skill_score": match_results["skill_score"],
            "formatting_score": match_results["formatting_score"],
            "matched_skills": match_results["matched_skills"],
            "missing_skills": match_results["missing_skills"],
            "resume_skills": match_results["resume_skills"],
            "feedback": feedback,
            "recommended_jobs": recommended_jobs,
            "metadata": {
                "page_count": structure["page_count"],
                "word_count": structure["word_count"],
                "has_email": structure["has_email"],
                "has_phone": structure["has_phone"],
                "sections": structure["sections"]
            }
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route("/history", methods=["GET"])
def history():
    try:
        scans = get_scans()
        return jsonify(scans)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/history/<int:scan_id>", methods=["DELETE"])
def delete_history_item(scan_id):
    try:
        delete_scan(scan_id)
        return jsonify({"success": True, "message": f"Scan {scan_id} deleted successfully."})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/jobs", methods=["GET"])
def get_mock_jobs():
    try:
        jobs = get_jobs()
        return jsonify(jobs)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    # In Windows, use host='127.0.0.1' and port=5000
    app.run(debug=True, port=5000)