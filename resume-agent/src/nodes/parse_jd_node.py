"""
Node: parse_jd
Responsibility: Parse raw JD text → structured jd_data dict.
Inputs: jd_text
Outputs: jd_data
"""
from __future__ import annotations

from typing import Any, Dict

from src.agents.jd_parser import JDParserAgent
from src.graph.state import GraphState


def parse_jd_node(state: GraphState) -> Dict[str, Any]:
    """
    LangGraph node — Job Description Parsing.

    Calls JDParserAgent with only the raw JD text.
    On success: returns {"jd_data": {...}}
    On failure: returns {"jd_data": {}, "errors": [...]}
    """
    agent = JDParserAgent()

    try:
        parsed = agent.run(state["jd_text"])
        return {"jd_data": parsed.model_dump()}

    except Exception as exc:
        errors = list(state.get("errors", []))
        errors.append(f"[parse_jd] {type(exc).__name__}: {exc}")
        return {"jd_data": {}, "errors": errors}
