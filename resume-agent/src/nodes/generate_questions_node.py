"""
Node: generate_questions
Responsibility: Generate 10 personalized interview questions.
Runs AFTER all 4 parallel evaluation nodes complete (fan-in point).
Inputs: missing_skills, partial_skills, resume_data, jd_data
Outputs: interview_questions
"""
from __future__ import annotations

from typing import Any, Dict

from src.agents.interview_question_agent import InterviewQuestionAgent
from src.graph.state import GraphState


def generate_questions_node(state: GraphState) -> Dict[str, Any]:
    """
    LangGraph node — Interview Question Generation.

    This is the fan-in point: runs only after all 4 parallel evaluators complete.
    Uses skill gap results to generate targeted questions.
    """
    agent = InterviewQuestionAgent()

    try:
        result = agent.run(
            missing_skills=state.get("missing_skills", []),
            partial_skills=state.get("partial_skills", []),
            resume_data=state.get("resume_data", {}),
            jd_data=state.get("jd_data", {}),
        )
        return {"interview_questions": result.questions}

    except Exception as exc:
        errors = list(state.get("errors", []))
        errors.append(f"[generate_questions] {type(exc).__name__}: {exc}")
        return {"interview_questions": [], "errors": errors}
