"""
Node: match_skills
Responsibility: Compare resume skills against JD requirements.
Runs in PARALLEL with evaluate_experience, evaluate_education, evaluate_culture.
Inputs: resume_data, jd_data
Outputs: matched_skills, missing_skills, partial_skills, skill_score, skill_reasoning
"""
from __future__ import annotations

from typing import Any, Dict

from src.agents.skill_matcher import SkillMatcherAgent
from src.graph.state import GraphState


def match_skills_node(state: GraphState) -> Dict[str, Any]:
    """
    LangGraph node — Skill Matching.

    Uses RapidFuzz + LLM for accurate skill gap analysis.
    Receives only skill lists (not full resume text).
    """
    agent = SkillMatcherAgent()
    resume_data = state.get("resume_data", {})
    jd_data = state.get("jd_data", {})

    resume_skills: list[str] = resume_data.get("skills", [])
    jd_required: list[str] = jd_data.get("required_skills", [])
    jd_preferred: list[str] = jd_data.get("preferred_skills", [])

    try:
        result = agent.run(
            resume_skills=resume_skills,
            jd_required_skills=jd_required,
            jd_preferred_skills=jd_preferred,
        )
        return {
            "matched_skills": result.matched,
            "missing_skills": result.missing,
            "partial_skills": result.partial,
            "skill_score": result.score,
            "skill_reasoning": result.reasoning,
        }

    except Exception as exc:
        errors = list(state.get("errors", []))
        errors.append(f"[match_skills] {type(exc).__name__}: {exc}")
        return {
            "matched_skills": [],
            "missing_skills": jd_required,
            "partial_skills": [],
            "skill_score": 0.0,
            "skill_reasoning": f"Skill matching failed: {exc}",
            "errors": errors,
        }
