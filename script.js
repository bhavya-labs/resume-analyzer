const API_BASE_URL = "http://127.0.0.1:5000";
let selectedFile = null;
let currentChartInstance = null;
let cachedJobsTemplates = [];

// ATS-friendly bullet point suggestions for missing skills
const REWRITER_BULLETS = {
    "python": "Designed and implemented robust backend APIs using Python and Flask, reducing response times by 35% and supporting 10k+ daily active users.",
    "django": "Architected and built web applications using Django and Django Rest Framework (DRF), improving query efficiency by 40% through optimized ORM queries and database indexing.",
    "flask": "Developed lightweight, containerized microservices using Flask and Docker, cutting resource usage by 25% and enhancing deployment scalability.",
    "react": "Developed highly responsive frontend components using React and Redux, boosting page load speeds by 45% and elevating user engagement metrics.",
    "angular": "Developed modular, enterprise-grade Single Page Applications (SPAs) with Angular, reducing bundle sizes by 30% and accelerating page loading by 1.5s.",
    "vue": "Designed and developed dynamic frontend dashboard interfaces using Vue.js and Pinia, improving UI response latency by 20%.",
    "javascript": "Authored clean, asynchronous, and ES6+ JavaScript code, creating interactive front-end components and cutting API call latencies by 30%.",
    "typescript": "Refactored legacy JavaScript applications into TypeScript, decreasing production runtime exceptions by 28% and streamlining developer onboarding.",
    "node.js": "Built scalable, asynchronous backend services using Node.js and Express, scaling platform throughput to handle 5,000 requests per second.",
    "aws": "Architected and deployed highly available cloud infrastructure on AWS (including EC2, S3, RDS, Lambda, and VPC), reducing monthly hosting expenses by 22%.",
    "docker": "Containerized legacy applications using Docker, establishing standard developer environments and accelerating code deployment pipelines by 40%.",
    "kubernetes": "Orchestrated containerized microservices using Kubernetes, streamlining deployments and maintaining a 99.99% system uptime across multi-region clusters.",
    "ci/cd": "Engineered robust automated CI/CD pipelines via GitHub Actions and Jenkins, cutting deployment cycle times by 65% and eliminating manual release errors.",
    "git": "Managed Git version control workflows (including branching, merge conflict resolution, and pull requests), ensuring code quality with strict PR review policies.",
    "sql": "Optimized complex SQL queries, views, and store procedures, reducing report generation times by 50% and enhancing database transaction speed.",
    "postgresql": "Designed and maintained scalable relational database schemas using PostgreSQL, resolving query bottlenecks to achieve a 3x speedup on heavy database joins.",
    "mysql": "Administered high-traffic MySQL databases, performing database indexing, schema migrations, and replication settings that boosted read performance by 35%.",
    "mongodb": "Designed flexible, high-throughput NoSQL database schemas using MongoDB, improving read/write latency by 45% for high-volume unstructured log files.",
    "redis": "Implemented distributed caching strategies using Redis, lowering primary database read overhead by 60% and reducing API response latency to sub-100ms.",
    "machine learning": "Developed and trained machine learning models (including regression, random forests, and gradient boosting), boosting predictive accuracy by 15% and driving $200k in cost savings.",
    "deep learning": "Built and deployed custom Deep Learning models (CNNs and RNNs) using PyTorch, achieving a 94% accuracy rate in complex pattern recognition.",
    "nlp": "Built natural language processing (NLP) pipelines using spaCy and NLTK to clean and classify text, improving sentiment analysis accuracy by 18%.",
    "pandas": "Conducted exploratory data analysis (EDA) and data wrangling on multi-million row datasets using Pandas, reducing data preparation times by 30%.",
    "numpy": "Implemented high-performance mathematical operations on multi-dimensional array structures using NumPy, accelerating vector search calculations by 4x.",
    "scikit-learn": "Engineered robust ML pipelines with scikit-learn for feature extraction, training, and cross-validation, standardizing model training procedures.",
    "tensorflow": "Trained and deployed deep neural networks using TensorFlow Serving, optimizing inference speed by 35% for real-time recommendations.",
    "pytorch": "Designed and optimized PyTorch-based neural networks, reducing model training time by 40% through custom CUDA integrations.",
    "c++": "Developed ultra-low latency system software in C++, optimization of memory footprints resulting in 20% performance gains.",
    "c#": "Developed secure, enterprise-grade backend APIs and MVC applications using C# and .NET Core, raising database access efficiency by 30%.",
    "project management": "Led cross-functional teams to deliver enterprise software releases on time, utilizing Agile methodologies to raise project velocity by 25%.",
    "agile": "Championed Agile methodologies across 3 development squads, reducing sprint cycle times by 15% and increasing on-time milestone delivery.",
    "scrum": "Facilitated daily Scrum stands, sprint planning, and retrospective sessions, accelerating team throughput and project visibility by 20%.",
    "communication": "Collaborated effectively with stakeholders to translate business requirements into technical specs, aligning engineering goals with executive vision.",
    "tailwind": "Built pixel-perfect, mobile-responsive UI layouts using Tailwind CSS, accelerating styling workflow speed by 50%.",
    "redux": "Designed structured client-side state management patterns using Redux Toolkit, eliminating state synchronization bugs across complex user dashboards.",
    "rest api": "Designed, documented, and integrated secure REST APIs (using OAuth2 and JWT), enabling seamless integrations with 3rd-party services.",
    "jenkins": "Configured distributed Jenkins automation servers to run automated testing suites, raising automated test coverage from 40% to 85%.",
    "linux": "Maintained and secured Linux-based servers (Ubuntu/CentOS), shell scripting tasks to automate routine administrative operations, saving 10 hours weekly.",
    "jira": "Managed product backlogs and sprint issue tracking workflows in Jira, improving resource utilization and sprint predictability by 18%.",
    "product roadmap": "Authored strategic product roadmaps based on detailed customer feedback loops, driving a 25% increase in feature adoption metrics.",
    "leadership": "Mentored junior engineers and led key design reviews, standardizing development guidelines and raising code quality metrics."
};


// DOM Elements
const dropZone = document.getElementById("dropZone");
const fileInput = document.getElementById("resume");
const fileSelectedState = document.getElementById("fileSelectedState");
const selectedFileName = document.getElementById("selectedFileName");
const selectedFileSize = document.getElementById("selectedFileSize");
const btnRemoveFile = document.getElementById("btnRemoveFile");
const txtJobDescription = document.getElementById("job");
const btnAnalyze = document.getElementById("btnAnalyze");
const loadingSection = document.getElementById("loadingSection");
const resultsSection = document.getElementById("resultsSection");
const statusDot = document.getElementById("statusDot");
const statusText = document.getElementById("statusText");
const historyList = document.getElementById("historyList");
const templateButtons = document.getElementById("templateButtons");

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
    checkServerConnection();
    setupDragAndDrop();
    setupSkillsTabs();
    setupSidebarToggle();
    setupRewriterModal();
    fetchHistory();
});


function setupSidebarToggle() {
    const sidebar = document.querySelector(".sidebar");
    const btnToggleSidebar = document.getElementById("btnToggleSidebar");
    
    // Load preference
    const isCollapsed = localStorage.getItem("sidebarCollapsed") === "true";
    if (isCollapsed) {
        sidebar.classList.add("collapsed");
    }
    
    btnToggleSidebar.addEventListener("click", () => {
        sidebar.classList.toggle("collapsed");
        localStorage.setItem("sidebarCollapsed", sidebar.classList.contains("collapsed"));
    });
    
    // Force Chart.js resize once sidebar animation completes
    sidebar.addEventListener("transitionend", (e) => {
        if (e.propertyName === "width" && currentChartInstance) {
            currentChartInstance.resize();
        }
    });
}

// Check Flask server connection status
async function checkServerConnection() {
    try {
        const response = await fetch(`${API_BASE_URL}/`);
        if (response.ok) {
            statusDot.className = "status-dot online";
            statusText.textContent = "Engine Connected";
            fetchJobTemplates();
        } else {
            throw new Error();
        }
    } catch (e) {
        statusDot.className = "status-dot offline";
        statusText.textContent = "Engine Offline";
    }
}

// Fetch seeded mock job templates from backend for quick-fill buttons
async function fetchJobTemplates() {
    try {
        const response = await fetch(`${API_BASE_URL}/jobs`);
        if (response.ok) {
            cachedJobsTemplates = await response.json();
            renderTemplateButtons();
        }
    } catch (e) {
        console.error("Failed to load job templates", e);
        templateButtons.innerHTML = `<span class="loading-templates">Unavailable</span>`;
    }
}

function renderTemplateButtons() {
    templateButtons.innerHTML = "";
    cachedJobsTemplates.forEach(job => {
        const btn = document.createElement("span");
        btn.className = "template-btn";
        btn.textContent = job.title;
        btn.addEventListener("click", () => {
            txtJobDescription.value = job.description;
        });
        templateButtons.appendChild(btn);
    });
}

// Drag & Drop event bindings
function setupDragAndDrop() {
    // Click triggers hidden input dialog
    dropZone.addEventListener("click", () => {
        if (!selectedFile) fileInput.click();
    });

    fileInput.addEventListener("change", (e) => {
        handleFileSelect(e.target.files[0]);
    });

    // Drag events
    ["dragenter", "dragover"].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.add("drag-over");
        }, false);
    });

    ["dragleave", "drop"].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.remove("drag-over");
        }, false);
    });

    dropZone.addEventListener("drop", (e) => {
        const dt = e.dataTransfer;
        const file = dt.files[0];
        handleFileSelect(file);
    });

    btnRemoveFile.addEventListener("click", (e) => {
        e.stopPropagation();
        resetFileSelection();
    });
}

function handleFileSelect(file) {
    if (!file) return;

    if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
        alert("Please upload a valid PDF document.");
        return;
    }

    selectedFile = file;
    selectedFileName.textContent = file.name;
    selectedFileSize.textContent = formatBytes(file.size);
    
    // Toggle views
    dropZone.querySelector(".drop-zone-content").style.display = "none";
    fileSelectedState.style.display = "flex";
}

function resetFileSelection() {
    selectedFile = null;
    fileInput.value = "";
    dropZone.querySelector(".drop-zone-content").style.display = "flex";
    fileSelectedState.style.display = "none";
}

// Format bytes to readable size
function formatBytes(bytes, decimals = 1) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

// Tabs switcher for Skills analysis panel
function setupSkillsTabs() {
    const tabMissingBtn = document.getElementById("tabMissingBtn");
    const tabMatchedBtn = document.getElementById("tabMatchedBtn");
    const paneMissing = document.getElementById("paneMissing");
    const paneMatched = document.getElementById("paneMatched");

    tabMissingBtn.addEventListener("click", () => {
        tabMissingBtn.classList.add("active");
        tabMatchedBtn.classList.remove("active");
        paneMissing.classList.add("active");
        paneMatched.classList.remove("active");
    });

    tabMatchedBtn.addEventListener("click", () => {
        tabMatchedBtn.classList.add("active");
        tabMissingBtn.classList.remove("active");
        paneMatched.classList.add("active");
        paneMissing.classList.remove("active");
    });
}

// Accordion toggle helper
window.toggleAccordion = function(element) {
    const parent = element.parentElement;
    const isOpen = parent.classList.contains("open");
    
    // Close other items
    document.querySelectorAll(".accordion-item").forEach(item => {
        item.classList.remove("open");
    });
    
    // Toggle current
    if (!isOpen) {
        parent.classList.add("open");
    }
};

// Handle Main Analysis Execution
btnAnalyze.addEventListener("click", async () => {
    if (!selectedFile) {
        alert("Please upload a resume (PDF file) first.");
        return;
    }
    
    const jobDescriptionVal = txtJobDescription.value.trim();
    if (!jobDescriptionVal) {
        alert("Please paste or load a Job Description.");
        return;
    }

    // Toggle button loader
    btnAnalyze.disabled = true;
    btnAnalyze.querySelector(".btn-text").style.display = "none";
    btnAnalyze.querySelector(".btn-loader").style.display = "flex";

    // Show scanning state
    resultsSection.style.display = "none";
    loadingSection.style.display = "flex";
    loadingSection.scrollIntoView({ behavior: "smooth" });

    // Animate status transitions
    const loadingStatusText = document.getElementById("loadingStatusText");
    const stages = [
        "Uploading document securely...",
        "Extracting raw PDF text structure...",
        "Identifying candidate skills profile...",
        "Running Sentence Transformer semantic mapping...",
        "Compiling Applicant Tracking System parameters..."
    ];
    let stageIdx = 0;
    const interval = setInterval(() => {
        if (stageIdx < stages.length) {
            loadingStatusText.textContent = stages[stageIdx++];
        }
    }, 1200);

    try {
        const formData = new FormData();
        formData.append("resume", selectedFile);
        formData.append("job_description", jobDescriptionVal);

        const response = await fetch(`${API_BASE_URL}/analyze`, {
            method: "POST",
            body: formData
        });

        clearInterval(interval);

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || "Analysis failed");
        }

        const data = await response.json();
        
        // Hide loader & Render Dashboard
        loadingSection.style.display = "none";
        renderAnalysisDashboard(data);
        fetchHistory(); // Refresh history panel

    } catch (e) {
        clearInterval(interval);
        loadingSection.style.display = "none";
        alert(`Error: ${e.message}`);
        console.error(e);
    } finally {
        btnAnalyze.disabled = false;
        btnAnalyze.querySelector(".btn-text").style.display = "inline-block";
        btnAnalyze.querySelector(".btn-loader").style.display = "none";
    }
});

// Render results
function renderAnalysisDashboard(data) {
    resultsSection.style.display = "flex";
    resultsSection.scrollIntoView({ behavior: "smooth" });

    // 1. Set circular ATS Gauge Score
    const atsScoreValue = document.getElementById("atsScoreValue");
    const atsRatingLabel = document.getElementById("atsRatingLabel");
    const gaugeProgressPath = document.getElementById("gaugeProgressPath");
    
    const score = data.ats_score;
    atsScoreValue.textContent = `${Math.round(score)}%`;
    
    // Set dash offset (radius = 40, circumference = 2 * PI * 40 ≈ 251.2)
    const circumference = 251.2;
    const offset = circumference - (circumference * score) / 100;
    gaugeProgressPath.style.strokeDashoffset = offset;

    // Apply color styling & text
    atsRatingLabel.className = "gauge-rating";
    if (score >= 75) {
        atsRatingLabel.textContent = "Strong Match";
        atsRatingLabel.classList.add("rating-high");
        gaugeProgressPath.style.stroke = "#10b981";
    } else if (score >= 50) {
        atsRatingLabel.textContent = "Good Match";
        atsRatingLabel.classList.add("rating-mid");
        gaugeProgressPath.style.stroke = "#f59e0b";
    } else {
        atsRatingLabel.textContent = "Weak Match";
        atsRatingLabel.classList.add("rating-low");
        gaugeProgressPath.style.stroke = "#ef4444";
    }

    // 2. Score Breakdown Chart.js (Destroy previous instance first)
    if (currentChartInstance) {
        currentChartInstance.destroy();
    }
    
    const ctx = document.getElementById("breakdownChart").getContext("2d");
    currentChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Semantic Fit', 'Skill Match', 'Formatting Quality'],
            datasets: [{
                data: [data.similarity_score, data.skill_score, data.formatting_score],
                backgroundColor: [
                    'rgba(59, 130, 246, 0.4)',  // Blue
                    'rgba(16, 185, 129, 0.4)',  // Green
                    'rgba(129, 140, 248, 0.4)'  // Purple
                ],
                borderColor: [
                    '#3b82f6',
                    '#10b981',
                    '#818cf8'
                ],
                borderWidth: 1.5,
                borderRadius: 6
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: {
                    min: 0,
                    max: 100,
                    grid: { color: 'rgba(15, 23, 42, 0.06)' },
                    ticks: { color: '#475569', font: { family: 'Plus Jakarta Sans' } }
                },
                y: {
                    grid: { display: false },
                    ticks: { color: '#0f172a', font: { family: 'Outfit', weight: '500' } }
                }
            }
        }
    });

    // 3. Render Skills tags and badge counters
    const missingBadgeCount = document.getElementById("missingBadgeCount");
    const matchedBadgeCount = document.getElementById("matchedBadgeCount");
    const missingSkillsContainer = document.getElementById("missingSkillsContainer");
    const matchedSkillsContainer = document.getElementById("matchedSkillsContainer");

    missingBadgeCount.textContent = data.missing_skills.length;
    matchedBadgeCount.textContent = data.matched_skills.length;

    // Render Missing
    missingSkillsContainer.innerHTML = "";
    if (data.missing_skills.length === 0) {
        missingSkillsContainer.innerHTML = `<span class="pane-description">No missing skills detected!</span>`;
    } else {
        data.missing_skills.forEach(skill => {
            const tag = document.createElement("span");
            tag.className = "skill-tag missing";
            tag.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> ${skill}`;
            tag.addEventListener("click", () => {
                openRewriterModal(skill);
            });
            missingSkillsContainer.appendChild(tag);
        });
    }


    // Render Matched
    matchedSkillsContainer.innerHTML = "";
    if (data.matched_skills.length === 0) {
        matchedSkillsContainer.innerHTML = `<span class="pane-description">No overlapping skills found. Check your profile.</span>`;
    } else {
        data.matched_skills.forEach(skill => {
            const tag = document.createElement("span");
            tag.className = "skill-tag matched";
            tag.innerHTML = `<i class="fa-solid fa-circle-check"></i> ${skill}`;
            matchedSkillsContainer.appendChild(tag);
        });
    }

    // 4. Update formatting checklist
    const sections = data.metadata.sections;
    updateChecklistItem("checkContact", sections.contact);
    updateChecklistItem("checkEducation", sections.education);
    updateChecklistItem("checkExperience", sections.experience);
    updateChecklistItem("checkSkills", sections.skills);
    updateChecklistItem("checkProjects", sections.projects);

    // Set page/word statistics
    document.getElementById("statPages").textContent = data.metadata.page_count;
    document.getElementById("statWords").textContent = data.metadata.word_count;

    // 5. Render Categorized AI Feedback Suggestions
    const fbSkills = document.getElementById("feedbackSkillsList");
    const fbFormatting = document.getElementById("feedbackFormattingList");
    const fbContent = document.getElementById("feedbackContentList");

    fbSkills.innerHTML = renderFeedbackList(data.feedback.skills);
    fbFormatting.innerHTML = renderFeedbackList(data.feedback.formatting);
    fbContent.innerHTML = renderFeedbackList(data.feedback.content);

    // 6. Render Recommended Jobs
    const recommendedJobsContainer = document.getElementById("recommendedJobsContainer");
    recommendedJobsContainer.innerHTML = "";
    if (!data.recommended_jobs || data.recommended_jobs.length === 0) {
        recommendedJobsContainer.innerHTML = `<p class="pane-description">No recommendations found matching your profile.</p>`;
    } else {
        data.recommended_jobs.forEach(job => {
            const div = document.createElement("div");
            div.className = "job-card";
            div.innerHTML = `
                <div class="job-card-header">
                    <span class="job-title">${job.title}</span>
                    <span class="job-match-badge">${job.match_percentage}% Match</span>
                </div>
                <div class="job-meta">
                    <span><i class="fa-solid fa-building"></i> ${job.company}</span>
                    <span><i class="fa-solid fa-location-dot"></i> ${job.location}</span>
                </div>
                <div class="job-meta" style="margin-top: -2px;">
                    <span><i class="fa-solid fa-wallet"></i> ${job.salary}</span>
                </div>
                <p class="job-description">${job.description}</p>
            `;
            // Trigger pre-fill JD on click for test flow
            div.addEventListener("click", () => {
                txtJobDescription.value = job.description;
                alert(`Loaded Job Description for: ${job.title} at ${job.company}`);
            });
            recommendedJobsContainer.appendChild(div);
        });
    }
}

// Checklist rendering helper
function updateChecklistItem(elemId, isChecked) {
    const item = document.getElementById(elemId);
    const icon = item.querySelector(".icon-status");
    if (isChecked) {
        item.className = "checklist-item checked";
        icon.className = "fa-solid fa-circle-check icon-status";
    } else {
        item.className = "checklist-item unchecked";
        icon.className = "fa-solid fa-circle-xmark icon-status";
    }
}

// List feedback list renderer
function renderFeedbackList(list) {
    if (!list || list.length === 0) {
        return "<ul><li>No feedback warnings generated for this category.</li></ul>";
    }
    return `<ul>${list.map(item => `<li>${item}</li>`).join("")}</ul>`;
}

// Fetch and display history sidebar scans
async function fetchHistory() {
    try {
        const response = await fetch(`${API_BASE_URL}/history`);
        if (!response.ok) throw new Error();
        const scans = await response.json();
        renderHistoryList(scans);
    } catch (e) {
        console.error("Failed to load history list", e);
        historyList.innerHTML = `
            <div class="empty-history">
                <i class="fa-solid fa-triangle-exclamation"></i>
                <p>History loading error</p>
            </div>
        `;
    }
}

function renderHistoryList(scans) {
    if (!scans || scans.length === 0) {
        historyList.innerHTML = `
            <div class="empty-history">
                <i class="fa-regular fa-folder-open"></i>
                <p>No previous scans found</p>
            </div>
        `;
        return;
    }

    historyList.innerHTML = "";
    scans.forEach(scan => {
        const item = document.createElement("div");
        item.className = "history-item";
        
        let scoreClass = "score-low";
        if (scan.ats_score >= 75) scoreClass = "score-high";
        else if (scan.ats_score >= 50) scoreClass = "score-mid";
        
        // Clean timestamp
        const date = new Date(scan.created_at);
        const formattedDate = date.toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        item.innerHTML = `
            <div class="history-item-header">
                <span class="history-name" title="${scan.filename}">${scan.filename}</span>
                <span class="history-score ${scoreClass}">${Math.round(scan.ats_score)}%</span>
            </div>
            <span class="history-date">${formattedDate}</span>
            <button class="btn-delete-history" title="Delete scan record">
                <i class="fa-solid fa-trash-can"></i>
            </button>
        `;

        // Click to view history details
        item.addEventListener("click", (e) => {
            // If they clicked the trash can, ignore loading
            if (e.target.closest(".btn-delete-history")) return;
            
            // Set active state styling
            document.querySelectorAll(".history-item").forEach(i => i.classList.remove("active"));
            item.classList.add("active");
            
            // Format mock data structure for reloading results
            const cachedResults = {
                ats_score: scan.ats_score,
                similarity_score: scan.similarity_score,
                skill_score: scan.skill_score,
                formatting_score: scan.formatting_score,
                matched_skills: scan.matched_skills,
                missing_skills: scan.missing_skills,
                feedback: scan.feedback,
                recommended_jobs: scan.recommended_jobs,
                // Add default stats if not fully saved
                metadata: {
                    page_count: scan.formatting_score >= 90 ? 1 : 2, // approximation
                    word_count: 450, // approximation
                    sections: {
                        contact: scan.formatting_score > 30,
                        education: scan.formatting_score > 40,
                        experience: scan.formatting_score > 50,
                        skills: scan.formatting_score > 20,
                        projects: scan.formatting_score > 10
                    }
                }
            };
            
            // Try to map correct metadata stats from description word count & feedback length
            try {
                // If we can extract details, do it
                const wordsApprox = scan.job_description.split(" ").length;
                cachedResults.metadata.word_count = Math.max(120, wordsApprox * 2);
            } catch (err) {}

            renderAnalysisDashboard(cachedResults);
            txtJobDescription.value = scan.job_description;
        });

        // Click to delete item
        const btnDelete = item.querySelector(".btn-delete-history");
        btnDelete.addEventListener("click", async (e) => {
            e.stopPropagation();
            if (confirm(`Delete the scan record for "${scan.filename}"?`)) {
                try {
                    const res = await fetch(`${API_BASE_URL}/history/${scan.id}`, {
                        method: "DELETE"
                    });
                    if (res.ok) {
                        fetchHistory();
                        // Hide results if we deleted the current active scan
                        if (item.classList.contains("active")) {
                            resultsSection.style.display = "none";
                        }
                    }
                } catch (err) {
                    alert("Failed to delete history item.");
                }
            }
        });

        historyList.appendChild(item);
    });
}

// ==========================================
// Resume Rewriter Modal Event Handling
// ==========================================

function getBulletForSkill(skillName) {
    const normalized = skillName.trim().toLowerCase();
    
    // Look up directly
    if (REWRITER_BULLETS[normalized]) {
        return REWRITER_BULLETS[normalized];
    }
    
    // If not exact match, try matching substrings (e.g., "python backend" matches "python")
    for (const key in REWRITER_BULLETS) {
        if (normalized.includes(key) || key.includes(normalized)) {
            return REWRITER_BULLETS[key];
        }
    }
    
    // Dynamic Fallback template
    return `Leveraged ${skillName} capabilities to design, test, and deploy crucial project modules, collaborating with engineering partners to optimize stability, performance, and cross-platform compatibility by 15%.`;
}

function openRewriterModal(skill) {
    const rewriterModal = document.getElementById("rewriterModal");
    const modalSkillName = document.getElementById("modalSkillName");
    const modalBulletText = document.getElementById("modalBulletText");
    const copySuccessBadge = document.getElementById("copySuccessBadge");
    
    if (!rewriterModal || !modalSkillName || !modalBulletText || !copySuccessBadge) return;
    
    modalSkillName.textContent = skill;
    modalBulletText.textContent = getBulletForSkill(skill);
    
    // Hide success badge
    copySuccessBadge.style.display = "none";
    
    // Reset copy button styling
    const btnCopyBullet = document.getElementById("btnCopyBullet");
    if (btnCopyBullet) {
        btnCopyBullet.innerHTML = `<i class="fa-regular fa-copy"></i> Copy`;
    }
    
    // Display modal
    rewriterModal.style.display = "flex";
}

function setupRewriterModal() {
    const rewriterModal = document.getElementById("rewriterModal");
    const btnCloseModal = document.getElementById("btnCloseModal");
    const btnCopyBullet = document.getElementById("btnCopyBullet");
    const modalBulletText = document.getElementById("modalBulletText");
    const copySuccessBadge = document.getElementById("copySuccessBadge");

    if (!rewriterModal || !btnCloseModal || !btnCopyBullet || !modalBulletText || !copySuccessBadge) {
        console.warn("Rewriter modal elements not found in the DOM.");
        return;
    }

    // Close button click
    btnCloseModal.addEventListener("click", () => {
        rewriterModal.style.display = "none";
    });

    // Backdrop click
    rewriterModal.addEventListener("click", (e) => {
        if (e.target === rewriterModal) {
            rewriterModal.style.display = "none";
        }
    });

    // Escape key press to close
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && rewriterModal.style.display === "flex") {
            rewriterModal.style.display = "none";
        }
    });

    // Copy to clipboard
    btnCopyBullet.addEventListener("click", async () => {
        const textToCopy = modalBulletText.textContent;
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(textToCopy);
            } else {
                // Fallback select and copy
                const textArea = document.createElement("textarea");
                textArea.value = textToCopy;
                textArea.style.position = "fixed";
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
            }
            
            // Show success animation badge
            copySuccessBadge.style.display = "flex";
            btnCopyBullet.innerHTML = `<i class="fa-solid fa-check"></i> Copied`;
            
            setTimeout(() => {
                copySuccessBadge.style.display = "none";
                btnCopyBullet.innerHTML = `<i class="fa-regular fa-copy"></i> Copy`;
            }, 2000);
            
        } catch (err) {
            console.error("Failed to copy text: ", err);
            alert("Could not copy text automatically. Please select it manually.");
        }
    });
}