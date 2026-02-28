"""
skill_extraction.py
────────────────────
Extract skills and topics from raw text using TF-IDF scoring.

Approach:
  We use scikit-learn's TfidfVectorizer to score n-grams (1–3 words)
  from the input text. This is a simple, fully-local approach that
  requires no cloud APIs or heavy ML models. TF-IDF naturally surfaces
  domain-specific terms that appear frequently in a document but are
  distinct from common English words, making it well-suited for
  identifying technical skills and topics in syllabi and job postings.

Pipeline:
  1. Lowercase & clean text (remove punctuation, digits-only tokens)
  2. TfidfVectorizer with built-in English stopwords & n-gram range (1,3)
  3. Rank all terms by TF-IDF score
  4. Filter out very short terms (< 3 chars) and deduplicate
  5. Return the top N skills as a list of strings
"""

import re
from sklearn.feature_extraction.text import TfidfVectorizer


def _clean_text(text: str) -> str:
    """Basic text cleaning: lowercase, collapse whitespace, strip noise."""
    text = text.lower()
    # Remove URLs
    text = re.sub(r"https?://\S+", " ", text)
    # Remove email addresses
    text = re.sub(r"\S+@\S+", " ", text)
    # Replace non-alphanumeric chars (keep spaces) with spaces
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    # Collapse multiple spaces
    text = re.sub(r"\s+", " ", text).strip()
    return text


def extract_skills(text: str, top_n: int = 15) -> list[str]:
    """
    Extract the top N skill/topic phrases from the given text.

    Args:
        text:  Raw text content (syllabus or job descriptions).
        top_n: Number of top skills to return.

    Returns:
        A list of skill/topic strings, ordered by relevance (highest first).
    """
    cleaned = _clean_text(text)

    if not cleaned or len(cleaned.split()) < 3:
        return []

    # TF-IDF with unigrams, bigrams, and trigrams.
    # Using English stopwords to filter out common words.
    # We treat the entire document as a single "corpus of one" —
    # the vectorizer still produces meaningful term scores because
    # IDF becomes 1.0 for all terms and TF drives the ranking,
    # effectively giving us a frequency-weighted keyword extractor.
    vectorizer = TfidfVectorizer(
        stop_words="english",
        ngram_range=(1, 3),
        max_features=500,       # keep top 500 candidate terms
        min_df=1,
        max_df=1.0,
        token_pattern=r"(?u)\b[a-z][a-z0-9]{1,}\b",  # min 2-char tokens
    )

    try:
        tfidf_matrix = vectorizer.fit_transform([cleaned])
    except ValueError:
        # Not enough terms to vectorize
        return []

    feature_names = vectorizer.get_feature_names_out()
    scores = tfidf_matrix.toarray().flatten()

    # Pair terms with their scores and sort descending
    scored_terms = sorted(
        zip(feature_names, scores),
        key=lambda x: x[1],
        reverse=True,
    )

    # ── Post-processing filters ─────────────────────────────
    seen = set()
    skills = []

    for term, score in scored_terms:
        if len(skills) >= top_n:
            break

        # Skip very short terms (likely noise)
        if len(term) < 3:
            continue

        # Skip purely numeric terms
        if term.replace(" ", "").isdigit():
            continue

        # Basic deduplication: skip if a term is a substring of
        # an already-selected longer term (e.g. "machine" vs "machine learning")
        is_substring = any(term in existing for existing in seen)
        if is_substring:
            continue

        # Also remove any previously added shorter term that is a
        # substring of this new longer term (prefer the more specific one)
        to_remove = [s for s in seen if s in term and s != term]
        for r in to_remove:
            seen.discard(r)
            skills = [s for s in skills if s != r]

        seen.add(term)
        # Title-case for display
        skills.append(term.title())

    return skills
