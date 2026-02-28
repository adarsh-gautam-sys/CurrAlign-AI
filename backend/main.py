import os
import shutil
from pathlib import Path
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Upload directories (created on startup) ---
UPLOAD_BASE = Path(__file__).parent / "uploads"
SYLLABUS_DIR = UPLOAD_BASE / "syllabus"
JOBS_DIR = UPLOAD_BASE / "jobs"

# --- Processed text output directory ---
PROCESSED_DIR = Path(__file__).parent / "processed_text"

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt"}


@app.on_event("startup")
def create_upload_dirs():
    """Ensure upload and output directories exist when the server starts."""
    SYLLABUS_DIR.mkdir(parents=True, exist_ok=True)
    JOBS_DIR.mkdir(parents=True, exist_ok=True)
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)


def _validate_extension(filename: str) -> None:
    """Raise 400 if the file extension is not in the allowed set."""
    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Allowed: {', '.join(ALLOWED_EXTENSIONS)}",
        )


# ─── Health ───────────────────────────────────────────────
@app.get("/health")
def health_check():
    return {"status": "ok", "message": "Backend is running"}


# ─── Upload syllabus (single file) ───────────────────────
@app.post("/upload/syllabus")
async def upload_syllabus(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="Empty upload")

    _validate_extension(file.filename)

    dest = SYLLABUS_DIR / file.filename
    with open(dest, "wb") as buf:
        shutil.copyfileobj(file.file, buf)

    return {"filename": file.filename, "status": "uploaded"}


# ─── Upload job descriptions (multiple files) ────────────
@app.post("/upload/jobs")
async def upload_jobs(files: list[UploadFile] = File(...)):
    if not files:
        raise HTTPException(status_code=400, detail="No files provided")

    for f in files:
        if not f.filename:
            raise HTTPException(status_code=400, detail="One of the files has no name")
        _validate_extension(f.filename)

    # Save all validated files
    for f in files:
        dest = JOBS_DIR / f.filename
        with open(dest, "wb") as buf:
            shutil.copyfileobj(f.file, buf)

    return {"count": len(files), "status": "uploaded"}


# ─── Text extraction (Steps 1 & 2 of the pipeline) ───────
@app.post("/analyze/extract-text")
async def extract_text():
    """
    Extract text from all uploaded files.
    - Reads syllabus from uploads/syllabus/
    - Reads job descriptions from uploads/jobs/
    - Saves extracted text to processed_text/syllabus.txt and jobs.txt
    - Returns pipeline step statuses
    """
    from text_extractor import extract_text_from_file

    # ── Step 1: Document Parsing — check files exist ──────
    syllabus_files = list(SYLLABUS_DIR.glob("*"))
    job_files = list(JOBS_DIR.glob("*"))

    if not syllabus_files:
        raise HTTPException(status_code=400, detail="No syllabus file found. Please upload a syllabus first.")
    if not job_files:
        raise HTTPException(status_code=400, detail="No job description files found. Please upload job descriptions first.")

    # ── Step 2: Text Extraction ───────────────────────────
    try:
        # Extract syllabus text (use the first/latest file)
        syllabus_text = extract_text_from_file(syllabus_files[0])
        (PROCESSED_DIR / "syllabus.txt").write_text(syllabus_text, encoding="utf-8")

        # Extract and concatenate all job description texts
        job_texts = []
        for jf in job_files:
            job_texts.append(extract_text_from_file(jf))
        combined_jobs = "\n\n--- NEXT JOB DESCRIPTION ---\n\n".join(job_texts)
        (PROCESSED_DIR / "jobs.txt").write_text(combined_jobs, encoding="utf-8")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Text extraction failed: {str(e)}")

    return {
        "status": "success",
        "steps": {
            "document_parsing": "completed",
            "text_extraction": "completed",
            "skill_identification": "pending",
            "alignment": "pending",
        },
    }


# ─── Skill extraction (Step 3 of the pipeline) ───────────
@app.post("/analyze/extract-skills")
async def extract_skills_endpoint():
    """
    Extract skills/topics from previously processed text files.
    - Reads processed_text/syllabus.txt and processed_text/jobs.txt
    - Runs TF-IDF based skill extraction independently on each
    - Returns two separate skill lists for curriculum and industry
    """
    from skill_extraction import extract_skills

    syllabus_path = PROCESSED_DIR / "syllabus.txt"
    jobs_path = PROCESSED_DIR / "jobs.txt"

    if not syllabus_path.exists():
        raise HTTPException(status_code=400, detail="Processed syllabus text not found. Run text extraction first.")
    if not jobs_path.exists():
        raise HTTPException(status_code=400, detail="Processed job descriptions text not found. Run text extraction first.")

    try:
        syllabus_text = syllabus_path.read_text(encoding="utf-8")
        jobs_text = jobs_path.read_text(encoding="utf-8")

        curriculum_skills = extract_skills(syllabus_text, top_n=15)
        industry_skills = extract_skills(jobs_text, top_n=15)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Skill extraction failed: {str(e)}")

    return {
        "status": "success",
        "skills": {
            "curriculum": curriculum_skills,
            "industry": industry_skills,
        },
        "steps": {
            "document_parsing": "completed",
            "text_extraction": "completed",
            "skill_identification": "completed",
            "alignment": "pending",
        },
    }


# ─── Alignment analysis (Step 4 of the pipeline) ─────────
@app.post("/analyze/alignment")
async def alignment_endpoint():
    """
    Compute curriculum–industry alignment from previously extracted skills.
    - Re-reads processed text and extracts skills
    - Computes overlap, missing, and low-relevance categories
    - Returns alignment results with all pipeline steps marked completed
    """
    from skill_extraction import extract_skills
    from alignment import compute_alignment

    syllabus_path = PROCESSED_DIR / "syllabus.txt"
    jobs_path = PROCESSED_DIR / "jobs.txt"

    if not syllabus_path.exists() or not jobs_path.exists():
        raise HTTPException(
            status_code=400,
            detail="Processed text files not found. Run text extraction and skill extraction first.",
        )

    try:
        syllabus_text = syllabus_path.read_text(encoding="utf-8")
        jobs_text = jobs_path.read_text(encoding="utf-8")

        curriculum_skills = extract_skills(syllabus_text, top_n=15)
        industry_skills = extract_skills(jobs_text, top_n=15)

        alignment_result = compute_alignment(curriculum_skills, industry_skills)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Alignment computation failed: {str(e)}")

    return {
        "status": "success",
        "alignment": alignment_result,
        "steps": {
            "document_parsing": "completed",
            "text_extraction": "completed",
            "skill_identification": "completed",
            "alignment": "completed",
        },
    }


# ─── Explainability (generates reasoning for results) ─────
@app.post("/analyze/explain")
async def explain_endpoint():
    """
    Generate deterministic explanations for alignment results.
    Re-derives alignment data from processed text, then produces
    structured {skill, reason} explanations for each category.
    """
    from skill_extraction import extract_skills
    from alignment import compute_alignment
    from explainability import generate_explanations

    syllabus_path = PROCESSED_DIR / "syllabus.txt"
    jobs_path = PROCESSED_DIR / "jobs.txt"

    if not syllabus_path.exists() or not jobs_path.exists():
        raise HTTPException(
            status_code=400,
            detail="Processed text files not found. Run the full analysis pipeline first.",
        )

    try:
        syllabus_text = syllabus_path.read_text(encoding="utf-8")
        jobs_text = jobs_path.read_text(encoding="utf-8")

        curriculum_skills = extract_skills(syllabus_text, top_n=15)
        industry_skills = extract_skills(jobs_text, top_n=15)

        alignment_result = compute_alignment(curriculum_skills, industry_skills)

        explanations = generate_explanations(
            overlap=alignment_result["overlap"],
            missing=alignment_result["missing"],
            low_relevance=alignment_result["low_relevance"],
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Explanation generation failed: {str(e)}")

    return {
        "status": "success",
        "explanations": explanations,
    }


# ─── Readiness scoring (qualitative assessment) ───────────
@app.post("/analyze/readiness")
async def readiness_endpoint():
    """
    Compute qualitative curriculum readiness from alignment results.
    Returns a tier label (Strong/Moderate/Low) plus categorized skill
    lists for strengths, improvements, and review items.
    """
    from skill_extraction import extract_skills
    from alignment import compute_alignment
    from readiness import compute_readiness

    syllabus_path = PROCESSED_DIR / "syllabus.txt"
    jobs_path = PROCESSED_DIR / "jobs.txt"

    if not syllabus_path.exists() or not jobs_path.exists():
        raise HTTPException(
            status_code=400,
            detail="Processed text files not found. Run the full analysis pipeline first.",
        )

    try:
        syllabus_text = syllabus_path.read_text(encoding="utf-8")
        jobs_text = jobs_path.read_text(encoding="utf-8")

        curriculum_skills = extract_skills(syllabus_text, top_n=15)
        industry_skills = extract_skills(jobs_text, top_n=15)

        alignment_result = compute_alignment(curriculum_skills, industry_skills)

        readiness_result = compute_readiness(
            overlap=alignment_result["overlap"],
            missing=alignment_result["missing"],
            low_relevance=alignment_result["low_relevance"],
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Readiness scoring failed: {str(e)}")

    return {
        "status": "success",
        "readiness": readiness_result,
    }


# ─── Performance profiling (qualitative metrics) ──────────
@app.post("/analyze/performance")
async def performance_endpoint():
    """
    Run lightweight performance profiling of the analysis pipeline.
    Returns qualitative labels (not raw ms) + system info.
    """
    from performance import run_performance_profile

    syllabus_path = PROCESSED_DIR / "syllabus.txt"
    jobs_path = PROCESSED_DIR / "jobs.txt"

    if not syllabus_path.exists() or not jobs_path.exists():
        raise HTTPException(
            status_code=400,
            detail="Processed text files not found. Run the full analysis pipeline first.",
        )

    try:
        profile = run_performance_profile()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Performance profiling failed: {str(e)}")

    return {
        "status": "success",
        **profile,
    }


# ─── Demo mode (judge-safe one-click flow) ─────────────────
DEMO_DIR = Path(__file__).parent / "demo_data"


@app.post("/demo/run")
async def demo_run():
    """
    One-click demo: load preconfigured sample documents, run the
    entire analysis pipeline, and return all results in one response.

    This endpoint is designed for live hackathon judging — it must
    be reliable, fast, and produce interesting results every time.
    """
    from text_extractor import extract_text_from_file
    from skill_extraction import extract_skills
    from alignment import compute_alignment
    from explainability import generate_explanations
    from readiness import compute_readiness
    from performance import run_performance_profile

    demo_syllabus = DEMO_DIR / "syllabus.txt"
    demo_jobs_dir = DEMO_DIR / "jobs"

    if not demo_syllabus.exists() or not demo_jobs_dir.exists():
        raise HTTPException(status_code=500, detail="Demo data not found on server.")

    try:
        # ── 1. Clear previous uploads and copy demo files ───
        # Wipe old state so demo is always clean
        for d in [SYLLABUS_DIR, JOBS_DIR, PROCESSED_DIR]:
            if d.exists():
                shutil.rmtree(d)
            d.mkdir(parents=True, exist_ok=True)

        shutil.copy2(demo_syllabus, SYLLABUS_DIR / "syllabus.txt")

        job_files = sorted(demo_jobs_dir.glob("*.txt"))
        for jf in job_files:
            shutil.copy2(jf, JOBS_DIR / jf.name)

        # ── 2. Text extraction ──────────────────────────────
        syllabus_text = extract_text_from_file(SYLLABUS_DIR / "syllabus.txt")
        jobs_texts = [extract_text_from_file(JOBS_DIR / jf.name) for jf in job_files]
        combined_jobs_text = "\n\n".join(jobs_texts)

        (PROCESSED_DIR / "syllabus.txt").write_text(syllabus_text, encoding="utf-8")
        (PROCESSED_DIR / "jobs.txt").write_text(combined_jobs_text, encoding="utf-8")

        # ── 3. Skill extraction ─────────────────────────────
        curriculum_skills = extract_skills(syllabus_text, top_n=15)
        industry_skills = extract_skills(combined_jobs_text, top_n=15)

        # ── 4. Alignment ────────────────────────────────────
        alignment_result = compute_alignment(curriculum_skills, industry_skills)

        # ── 5. Explainability ───────────────────────────────
        explanations = generate_explanations(
            overlap=alignment_result["overlap"],
            missing=alignment_result["missing"],
            low_relevance=alignment_result["low_relevance"],
        )

        # ── 6. Readiness scoring ────────────────────────────
        readiness_result = compute_readiness(
            overlap=alignment_result["overlap"],
            missing=alignment_result["missing"],
            low_relevance=alignment_result["low_relevance"],
        )

        # ── 7. Performance profiling ────────────────────────
        perf_profile = run_performance_profile()

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Demo pipeline failed: {str(e)}")

    # Pipeline step statuses — all completed
    steps = {
        "document_parsing": "completed",
        "text_extraction": "completed",
        "skill_identification": "completed",
        "alignment": "completed",
    }

    return {
        "status": "success",
        "mode": "judge_demo",
        "message": "Demo analysis completed",
        "steps": steps,
        "skills": {
            "curriculum": curriculum_skills,
            "industry": industry_skills,
        },
        "alignment": alignment_result,
        "explanations": explanations,
        "readiness": readiness_result,
        "performance": perf_profile,
        "demo_files": {
            "syllabus": "syllabus.txt",
            "jobs": [jf.name for jf in job_files],
        },
    }
