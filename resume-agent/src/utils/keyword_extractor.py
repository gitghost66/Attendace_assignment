"""
Deterministic keyword extraction — no LLM required.
Uses regex tokenization + stopword filtering + deduplication.
"""
from __future__ import annotations

import re
from typing import List

# Common English stopwords (expanded list for resumes/JDs)
_STOPWORDS: frozenset[str] = frozenset(
    {
        "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
        "of", "with", "by", "from", "up", "about", "into", "through", "during",
        "before", "after", "above", "below", "between", "each", "i", "me", "my",
        "we", "our", "you", "your", "he", "she", "it", "they", "them", "this",
        "that", "these", "those", "is", "are", "was", "were", "be", "been",
        "being", "have", "has", "had", "do", "does", "did", "will", "would",
        "could", "should", "may", "might", "must", "shall", "can", "need",
        "not", "no", "nor", "so", "yet", "both", "either", "neither", "as",
        "such", "than", "too", "very", "just", "because", "while", "although",
        "though", "however", "therefore", "thus", "also", "only", "own", "same",
        "then", "when", "where", "which", "who", "what", "how", "all", "any",
        "few", "more", "most", "other", "some", "its", "their", "there",
        "been", "about", "over", "per", "etc", "new", "use", "using", "used",
        "strong", "good", "well", "ability", "experience", "knowledge", "work",
        "working", "will", "including", "role", "team", "responsibilities",
        "required", "preferred", "excellent", "skills", "must", "candidate",
        "position", "looking", "seeking", "join", "looking", "responsible",
        "ensure", "ensure", "manage", "help", "develop", "support", "within",
    }
)

# Regex to capture tokens including C++, .NET, Node.js etc.
_TOKEN_PATTERN = re.compile(r"\b[a-zA-Z][a-zA-Z0-9\+\#\.]*\b")


def extract_keywords(text: str) -> List[str]:
    """
    Extract meaningful keywords from raw text.

    Steps:
        1. Tokenize with regex (preserves C++, .NET, etc.)
        2. Lowercase
        3. Remove stopwords and tokens shorter than 3 characters
        4. Deduplicate while preserving first-occurrence order

    Args:
        text: Raw text to extract keywords from.

    Returns:
        Ordered, deduplicated list of keywords.
    """
    tokens = _TOKEN_PATTERN.findall(text)
    seen: set[str] = set()
    keywords: List[str] = []

    for token in tokens:
        lower = token.lower()
        if lower not in _STOPWORDS and len(lower) > 2 and lower not in seen:
            seen.add(lower)
            keywords.append(lower)

    return keywords


def normalize_skill(skill: str) -> str:
    """Lowercase and strip whitespace from a skill string."""
    return skill.lower().strip()


def normalize_skills(skills: List[str]) -> List[str]:
    """Normalize a list of skills, removing empty entries."""
    return [normalize_skill(s) for s in skills if s.strip()]
