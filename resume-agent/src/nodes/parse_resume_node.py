"""
Node: parse_resume
Responsibility: Parse raw resume text → structured resume_data dict.
Inputs: resume_text
Outputs: resume_data
"""
from __future__ import annotations

from typing import Any, Dict

from src.agents.resume_parser import ResumeParserAgent
from src.graph.state import GraphState


def parse_resume_node(state: GraphState) -> Dict[str, Any]:
    """
    LangGraph node — Resume Parsing.

    Calls ResumeParserAgent with only the raw resume text.
    On success: returns {"resume_data": {...}}
    On failure: returns {"resume_data": {}, "errors": [...]}
    """
    agent = ResumeParserAgent()

    try:
        parsed = agent.run(state["resume_text"])
        return {"resume_data": parsed.model_dump()}

    except Exception as exc:
        errors = list(state.get("errors", []))
        errors.append(f"[parse_resume] {type(exc).__name__}: {exc}")
        return {"resume_data": {}, "errors": errors}
