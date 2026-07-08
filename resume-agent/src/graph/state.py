"""
GraphState — the single shared state object passed between all LangGraph nodes.

Design rules:
- Every field is Optional (total=False) so nodes only update what they own.
- Only the fields a node owns should be in its return dict.
- No Pydantic models in state — use plain dicts (model.model_dump()) for serialization safety.
"""
from __future__ import annotations

from typing import Annotated, Any, Dict, List, Optional
from typing_extensions import TypedDict


def merge_errors(old: Optional[List[str]], new: Optional[List[str]]) -> List[str]:
    if old is None:
        old = []
    if new is None:
        new = []
    merged = list(old)
    for e in new:
        if e not in merged:
            merged.append(e)
    return merged


class GraphState(TypedDict, total=False):
    # ── Inputs ────────────────────────────────────────────────────
    resume_text: str          # raw text from uploaded resume
    jd_text: str              # raw job description text

    # ── Parsed data (from LLM parsing agents) ────────────────────
    resume_data: Dict[str, Any]   # ParsedResume.model_dump()
    jd_data: Dict[str, Any]       # ParsedJD.model_dump()

    # ── Keywords (from deterministic keyword extractor) ───────────
    resume_keywords: List[str]
    jd_keywords: List[str]

    # ── Skill matching (from SkillMatcherAgent) ───────────────────
    matched_skills: List[str]
    missing_skills: List[str]
    partial_skills: List[str]
    skill_score: float            # 0–100
    skill_reasoning: str

    # ── Experience evaluation (from ExperienceEvaluatorAgent) ─────
    experience_score: float       # 0–100
    experience_reasoning: str

    # ── Education evaluation (from EducationEvaluatorAgent) ───────
    education_score: float        # 0–100
    education_reasoning: str

    # ── Culture fit (from CultureFitAgent) ────────────────────────
    culture_score: float          # 0–100
    culture_reasoning: str
    culture_details: Dict[str, float]  # per-dimension scores

    # ── Aggregated score (computed in final_decision_node) ────────
    overall_score: float          # weighted combination 0–100

    # ── Interview questions (from InterviewQuestionAgent) ─────────
    interview_questions: List[str]

    # ── Hiring decision (from DecisionAgent) ──────────────────────
    recommendation: str           # "Strong Hire" | "Hire" | "Maybe" | "Reject"
    reasoning: str
    pros: List[str]
    cons: List[str]
    risks: List[str]
    confidence: float             # 0.0–1.0

    # ── Final output ──────────────────────────────────────────────
    final_report: str             # formatted markdown recruiter report

    # ── Error tracking ────────────────────────────────────────────
    errors: Annotated[List[str], merge_errors]    # list of non-fatal error messages
