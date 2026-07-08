"""
LangGraph workflow definition.

Graph topology:
    parse_resume → parse_jd → extract_keywords
        ↓ (fan-out — all 4 run in parallel)
    match_skills  evaluate_experience  evaluate_education  evaluate_culture
        ↓ (fan-in — waits for all 4)
    generate_questions → final_decision → END
"""
from __future__ import annotations

from langgraph.graph import END, StateGraph

from src.graph.state import GraphState
from src.nodes.evaluate_culture_node import evaluate_culture_node
from src.nodes.evaluate_education_node import evaluate_education_node
from src.nodes.evaluate_experience_node import evaluate_experience_node
from src.nodes.extract_keywords_node import extract_keywords_node
from src.nodes.final_decision_node import final_decision_node
from src.nodes.generate_questions_node import generate_questions_node
from src.nodes.match_skills_node import match_skills_node
from src.nodes.parse_jd_node import parse_jd_node
from src.nodes.parse_resume_node import parse_resume_node


def create_workflow():
    """
    Build and compile the LangGraph StateGraph.

    Returns:
        A compiled LangGraph runnable ready for .astream() or .ainvoke().
    """
    builder = StateGraph(GraphState)

    # ── Register all nodes ────────────────────────────────────────────────────
    builder.add_node("parse_resume", parse_resume_node)
    builder.add_node("parse_jd", parse_jd_node)
    builder.add_node("extract_keywords", extract_keywords_node)
    builder.add_node("match_skills", match_skills_node)
    builder.add_node("evaluate_experience", evaluate_experience_node)
    builder.add_node("evaluate_education", evaluate_education_node)
    builder.add_node("evaluate_culture", evaluate_culture_node)
    builder.add_node("generate_questions", generate_questions_node)
    builder.add_node("final_decision", final_decision_node)

    # ── Entry point ───────────────────────────────────────────────────────────
    builder.set_entry_point("parse_resume")

    # ── Sequential: parse phase ───────────────────────────────────────────────
    builder.add_edge("parse_resume", "parse_jd")
    builder.add_edge("parse_jd", "extract_keywords")

    # ── Fan-out: all 4 evaluation nodes run in parallel ───────────────────────
    builder.add_edge("extract_keywords", "match_skills")
    builder.add_edge("extract_keywords", "evaluate_experience")
    builder.add_edge("extract_keywords", "evaluate_education")
    builder.add_edge("extract_keywords", "evaluate_culture")

    # ── Fan-in: generate_questions waits for all 4 evaluators ────────────────
    builder.add_edge("match_skills", "generate_questions")
    builder.add_edge("evaluate_experience", "generate_questions")
    builder.add_edge("evaluate_education", "generate_questions")
    builder.add_edge("evaluate_culture", "generate_questions")

    # ── Sequential: final steps ───────────────────────────────────────────────
    builder.add_edge("generate_questions", "final_decision")
    builder.add_edge("final_decision", END)

    return builder.compile()
