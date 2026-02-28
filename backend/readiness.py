"""
readiness.py
─────────────
Compute a qualitative curriculum readiness assessment.

Design rationale:
  We use a simple rule-based approach to classify curriculum readiness
  into three tiers: Strong, Moderate, or Low Alignment. This is
  intentionally qualitative — no percentages, no confidence scores,
  no probabilistic language.

  The logic is:
    - If overlap skills outnumber missing skills 2:1 → Strong
    - If overlap skills >= missing skills → Moderate
    - Otherwise → Low

  This makes the scoring fully deterministic and easy to explain
  to judges or stakeholders: "We look at how many skills match
  versus how many are missing, and classify accordingly."
"""


def compute_readiness(
    overlap: list[str],
    missing: list[str],
    low_relevance: list[str],
    max_display: int = 5,
) -> dict:
    """
    Compute qualitative readiness assessment from alignment results.

    Args:
        overlap:       Skills found in both curriculum and industry.
        missing:       Industry skills absent from the curriculum.
        low_relevance: Curriculum topics not found in industry data.
        max_display:   Max skills to show per category in the summary.

    Returns:
        Dict with readiness level, strengths, improvements, and review items.
    """
    overlap_count = len(overlap)
    missing_count = len(missing)

    # ── Determine readiness tier ────────────────────────────
    # Rule-based classification using overlap-to-missing ratio.
    # No ML, no scoring functions — just clear conditional logic.
    if overlap_count >= missing_count * 2:
        level = "Strong Alignment"
    elif overlap_count >= missing_count:
        level = "Moderate Alignment"
    else:
        level = "Low Alignment"

    # ── Build summary bullets ───────────────────────────────
    # Each bullet is a factual observation, not a prediction.
    summary_bullets = []

    if overlap_count > 0:
        summary_bullets.append("Core foundational skills covered")
    else:
        summary_bullets.append("Core foundational skills are partially covered")

    if missing_count > 0:
        summary_bullets.append("In-demand skills missing")

    if len(low_relevance) > 0:
        summary_bullets.append("Topics need modernization")

    return {
        "level": level,
        "summary_bullets": summary_bullets,
        "strengths": overlap[:max_display],
        "improvements": missing[:max_display],
        "review": low_relevance[:max_display],
    }
