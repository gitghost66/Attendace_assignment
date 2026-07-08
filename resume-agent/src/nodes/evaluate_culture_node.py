"""
Node: evaluate_culture
Responsibility: Estimate culture fit from resume summary + JD.
Runs in PARALLEL with match_skills, evaluate_experience, evaluate_education.
Inputs: resume_data (summary only), jd_text
Outputs: culture_score, culture_reasoning, culture_details
"""
from __future__ import annotations

from typing import Any, Dict

from src.agents.culture_fit import CultureFitAgent
from src.graph.state import GraphState


def evaluate_culture_node(state: GraphState) -> Dict[str, Any]:
    """
    LangGraph node — Culture Fit Assessment.

    Deliberately passes ONLY the resume summary (not full resume)
    and JD text to prevent hallucination from over-contextualization.
    """
    agent = CultureFitAgent()
    resume_data = state.get("resume_data", {})
    candidate_summary: str = resume_data.get("summary", "")
    jd_text: str = state.get("jd_text", "")

    try:
        result = agent.run(
            candidate_summary=candidate_summary,
            jd_text=jd_text,
        )
        culture_details: Dict[str, float] = {
            "communication": result.communication,
            "leadership": result.leadership,
            "ownership": result.ownership,
            "problem_solving": result.problem_solving,
            "adaptability": result.adaptability,
        }
        return {
            "culture_score": result.overall_score,
            "culture_reasoning": result.reasoning,
            "culture_details": culture_details,
        }

    except Exception as exc:
        errors = list(state.get("errors", []))
        errors.append(f"[evaluate_culture] {type(exc).__name__}: {exc}")
        return {
            "culture_score": 50.0,  # neutral fallback
            "culture_reasoning": f"Culture assessment failed: {exc}",
            "culture_details": {},
            "errors": errors,
        }
