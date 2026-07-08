"""
Hiring Decision Agent.
Aggregates all evaluation scores → returns final DecisionResult.
This is the only agent that sees the full picture.
"""
from __future__ import annotations

import json
from typing import Any, Dict, List

from langchain_core.messages import HumanMessage, SystemMessage

from src.prompts.decision_prompt import DECISION_SYSTEM_PROMPT
from src.utils.llm import get_llm
from src.utils.schemas import DecisionResult

# Scoring weights — must sum to 1.0
SCORING_WEIGHTS: Dict[str, float] = {
    "skill": 0.40,
    "experience": 0.30,
    "education": 0.10,
    "culture": 0.20,
}


class DecisionAgent:
    """
    Final hiring decision maker. Consumes all agent outputs.

    Also provides the weighted score computation method so nodes
    can compute the score before calling the LLM.
    """

    def __init__(self) -> None:
        self._llm = get_llm().with_structured_output(DecisionResult)

    @staticmethod
    def compute_weighted_score(
        skill_score: float,
        experience_score: float,
        education_score: float,
        culture_score: float,
    ) -> float:
        """
        Compute the overall weighted score from individual component scores.

        Weights: Skill 40%, Experience 30%, Culture 20%, Education 10%.

        Args:
            skill_score: Skill match score (0–100).
            experience_score: Experience evaluation score (0–100).
            education_score: Education evaluation score (0–100).
            culture_score: Culture fit score (0–100).

        Returns:
            Weighted score in [0.0, 100.0].
        """
        score = (
            skill_score * SCORING_WEIGHTS["skill"]
            + experience_score * SCORING_WEIGHTS["experience"]
            + education_score * SCORING_WEIGHTS["education"]
            + culture_score * SCORING_WEIGHTS["culture"]
        )
        return round(score, 2)

    def run(
        self,
        resume_data: Dict[str, Any],
        jd_data: Dict[str, Any],
        matched_skills: List[str],
        missing_skills: List[str],
        partial_skills: List[str],
        skill_score: float,
        skill_reasoning: str,
        experience_score: float,
        experience_reasoning: str,
        education_score: float,
        education_reasoning: str,
        culture_score: float,
        culture_reasoning: str,
        overall_score: float,
    ) -> DecisionResult:
        """
        Make a final hiring recommendation based on all evaluation data.

        Returns:
            DecisionResult with recommendation, reasoning, pros, cons, risks, confidence.
        """
        context = f"""CANDIDATE: {resume_data.get("name", "Unknown")}
ROLE: {jd_data.get("role_title", "Not specified")}

━━━━━━━━━━━━━━━━━━━━━━━
EVALUATION SCORES
━━━━━━━━━━━━━━━━━━━━━━━
Skill Match:   {skill_score:.1f}/100  (weight 40%)
  → {skill_reasoning}

Experience:    {experience_score:.1f}/100  (weight 30%)
  → {experience_reasoning}

Education:     {education_score:.1f}/100  (weight 10%)
  → {education_reasoning}

Culture Fit:   {culture_score:.1f}/100  (weight 20%)
  → {culture_reasoning}

OVERALL WEIGHTED SCORE: {overall_score:.1f}/100

━━━━━━━━━━━━━━━━━━━━━━━
SKILL DETAILS
━━━━━━━━━━━━━━━━━━━━━━━
Matched Skills  ({len(matched_skills)}): {matched_skills}
Partial Matches ({len(partial_skills)}): {partial_skills}
Missing Skills  ({len(missing_skills)}): {missing_skills}

Make your final hiring recommendation with full justification."""

        messages = [
            SystemMessage(content=DECISION_SYSTEM_PROMPT),
            HumanMessage(content=context),
        ]
        return self._llm.invoke(messages)
