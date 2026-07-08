"""
Node: evaluate_experience
Responsibility: Score candidate's work experience against JD requirements.
Runs in PARALLEL with match_skills, evaluate_education, evaluate_culture.
Inputs: resume_data, jd_data
Outputs: experience_score, experience_reasoning
"""
from __future__ import annotations

from typing import Any, Dict

from src.agents.experience_evaluator import ExperienceEvaluatorAgent
from src.graph.state import GraphState


def evaluate_experience_node(state: GraphState) -> Dict[str, Any]:
    """
    LangGraph node — Experience Evaluation.

    Passes only experience-relevant data to the agent.
    """
    agent = ExperienceEvaluatorAgent()

    try:
        result = agent.run(
            resume_data=state.get("resume_data", {}),
            jd_data=state.get("jd_data", {}),
        )
        return {
            "experience_score": result.score,
            "experience_reasoning": result.reasoning,
        }

    except Exception as exc:
        errors = list(state.get("errors", []))
        errors.append(f"[evaluate_experience] {type(exc).__name__}: {exc}")
        return {
            "experience_score": 0.0,
            "experience_reasoning": f"Experience evaluation failed: {exc}",
            "errors": errors,
        }
