"""
explainability.py
──────────────────
Generate transparent, deterministic explanations for alignment results.

Design rationale:
  We avoid any probabilistic or hallucinated language. Each explanation
  is a factual statement derived directly from the alignment computation.
  This makes every result fully justifiable and auditable — critical for
  an educational analytics tool where stakeholders need to trust the output.

  No LLMs, no scoring, no confidence values — just clear reasoning
  about why a skill ended up in each category.
"""


def generate_explanations(
    overlap: list[str],
    missing: list[str],
    low_relevance: list[str],
) -> dict:
    """
    Generate structured explanations for each alignment category.

    Args:
        overlap:       Skills found in both curriculum and industry.
        missing:       Industry skills absent from the curriculum.
        low_relevance: Curriculum topics not found in industry data.

    Returns:
        Dict with three lists of {skill, reason} objects.
    """

    # ── Overlap explanations ────────────────────────────────
    # These skills appear in both sources — we explain the match.
    overlap_explanations = [
        {
            "skill": skill,
            "reason": (
                f"'{skill}' was identified in both the syllabus and the "
                f"uploaded job descriptions, indicating strong alignment "
                f"between the curriculum and current industry expectations."
            ),
        }
        for skill in overlap
    ]

    # ── Missing industry skill explanations ─────────────────
    # These are in-demand skills the curriculum doesn't cover.
    missing_explanations = [
        {
            "skill": skill,
            "reason": (
                f"'{skill}' appears in the analyzed job descriptions but "
                f"was not detected in the syllabus content. This suggests "
                f"a potential curriculum gap that could affect graduate "
                f"employability in roles requiring this skill."
            ),
        }
        for skill in missing
    ]

    # ── Low relevance explanations ──────────────────────────
    # Curriculum topics with no industry counterpart.
    low_relevance_explanations = [
        {
            "skill": skill,
            "reason": (
                f"'{skill}' is present in the syllabus but was not found "
                f"in the analyzed job descriptions. This may indicate "
                f"lower current industry demand, though it could still "
                f"hold foundational or theoretical value."
            ),
        }
        for skill in low_relevance
    ]

    return {
        "overlap_explanations": overlap_explanations,
        "missing_explanations": missing_explanations,
        "low_relevance_explanations": low_relevance_explanations,
    }
