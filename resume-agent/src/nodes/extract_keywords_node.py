"""
Node: extract_keywords
Responsibility: Extract and normalize keywords from both resume and JD texts.
This is a deterministic node — NO LLM call.
Inputs: resume_text, jd_text, resume_data (for skill normalization)
Outputs: resume_keywords, jd_keywords
"""
from __future__ import annotations

from typing import Any, Dict

from src.graph.state import GraphState
from src.utils.keyword_extractor import extract_keywords, normalize_skills


def extract_keywords_node(state: GraphState) -> Dict[str, Any]:
    """
    LangGraph node — Keyword Extraction (deterministic).

    Extracts keywords from both raw texts using regex + stopword filtering.
    Also merges normalized skills from parsed resume_data for richer coverage.

    No LLM calls. Fast and cheap.
    """
    resume_keywords = extract_keywords(state.get("resume_text", ""))
    jd_keywords = extract_keywords(state.get("jd_text", ""))

    # Merge normalized skills from parsed data into resume_keywords
    resume_data = state.get("resume_data", {})
    raw_skills: list[str] = resume_data.get("skills", [])
    if raw_skills:
        normalized = normalize_skills(raw_skills)
        seen = set(resume_keywords)
        for skill in normalized:
            if skill not in seen:
                resume_keywords.append(skill)
                seen.add(skill)

    return {
        "resume_keywords": resume_keywords,
        "jd_keywords": jd_keywords,
    }
