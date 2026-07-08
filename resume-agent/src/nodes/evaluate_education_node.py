"""
Node: evaluate_education
Responsibility: Score candidate's education against JD requirements.
Runs in PARALLEL with match_skills, evaluate_experience, evaluate_culture.
Inputs: resume_data, jd_data
Outputs: education_score, education_reasoning
"""
from __future__ import annotations

from typing import Any, Dict

from src.agents.education_evaluator import EducationEvaluatorAgent
from src.graph.state import GraphState


def evaluate_education_node(state: GraphState) -> Dict[str, Any]:
    """
    LangGraph node — Education Evaluation.

    Passes only education-relevant data (degree, certs, JD requirement).
    """
    agent = EducationEvaluatorAgent()

    try:
        result = agent.run(
            resume_data=state.get("resume_data", {}),
            jd_data=state.get("jd_data", {}),
        )
        return {
            "education_score": result.score,
            "education_reasoning": result.reasoning,
        }

    except Exception as exc:
        errors = list(state.get("errors", []))
        errors.append(f"[evaluate_education] {type(exc).__name__}: {exc}")
        return {
            "education_score": 0.0,
            "education_reasoning": f"Education evaluation failed: {exc}",
            "errors": errors,
        }
