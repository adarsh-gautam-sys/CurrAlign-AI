"""
alignment.py
─────────────
Compute curriculum–industry skill alignment.

Approach:
  We use basic string containment matching to classify skills into
  three categories: overlapping, missing from curriculum, and
  low-relevance curriculum topics. This is a simple, deterministic
  approach that doesn't require ML — just normalized string comparison.

  Containment matching (rather than exact match) handles cases like:
    - "Python" in curriculum ↔ "Python Programming" in industry
    - "Data Structures" ↔ "Data Structures And Algorithms"
  This gives more lenient, realistic matching.
"""


def _normalize(skill: str) -> str:
    """Lowercase and strip whitespace for comparison."""
    return skill.lower().strip()


def _contains_match(skill_a: str, skill_b: str) -> bool:
    """
    Check if two skills match via substring containment.
    Returns True if either skill contains the other.
    E.g., "machine learning" contains "learning" → True
    """
    a = _normalize(skill_a)
    b = _normalize(skill_b)
    return a in b or b in a


def compute_alignment(
    curriculum_skills: list[str],
    industry_skills: list[str],
    max_results: int = 10,
) -> dict:
    """
    Classify skills into overlap, missing, and low-relevance categories.

    Args:
        curriculum_skills: Skills extracted from the syllabus.
        industry_skills:   Skills extracted from job descriptions.
        max_results:       Max number of items per category.

    Returns:
        Dict with keys: overlap, missing, low_relevance — each a list of strings.
    """
    # Deduplicate inputs
    curr_set = list(dict.fromkeys(curriculum_skills))  # preserves order
    ind_set = list(dict.fromkeys(industry_skills))

    overlap = []
    matched_curriculum = set()
    matched_industry = set()

    # ── Find overlapping skills ─────────────────────────────
    # A curriculum skill "overlaps" with an industry skill if either
    # contains the other as a substring (case-insensitive).
    for i, c_skill in enumerate(curr_set):
        for j, i_skill in enumerate(ind_set):
            if _contains_match(c_skill, i_skill):
                # Use the longer (more specific) form for display
                display = c_skill if len(c_skill) >= len(i_skill) else i_skill
                if display not in overlap:
                    overlap.append(display)
                matched_curriculum.add(i)
                matched_industry.add(j)

    # ── Missing industry skills ─────────────────────────────
    # Skills demanded by industry but NOT covered in the curriculum.
    missing = [
        ind_set[j]
        for j in range(len(ind_set))
        if j not in matched_industry
    ]

    # ── Low-relevance curriculum topics ─────────────────────
    # Curriculum topics that have NO match in industry requirements.
    low_relevance = [
        curr_set[i]
        for i in range(len(curr_set))
        if i not in matched_curriculum
    ]

    return {
        "overlap": overlap[:max_results],
        "missing": missing[:max_results],
        "low_relevance": low_relevance[:max_results],
    }
