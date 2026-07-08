"""
Education Evaluator Agent.
Receives education + certifications + JD education requirement → returns EvaluationResult.
"""
from __future__ import annotations

import json
from typing import Any, Dict

from langchain_core.messages import HumanMessage, SystemMessage

from src.prompts.education_prompt import EDUCATION_SYSTEM_PROMPT
from src.utils.llm import get_llm
from src.utils.schemas import EvaluationResult


class EducationEvaluatorAgent:
    """
    Evaluates a candidate's educational background against JD requirements.
    """

    def __init__(self) -> None:
        self._llm = get_llm().with_structured_output(EvaluationResult)

    def run(
        self,
        resume_data: Dict[str, Any],
        jd_data: Dict[str, Any],
    ) -> EvaluationResult:
        """
        Score the candidate's education against the JD education requirement.

        Args:
            resume_data: ParsedResume as dict (education, certifications).
            jd_data: ParsedJD as dict (education_required).

        Returns:
            EvaluationResult with score (0–100) and reasoning.
        """
        education = resume_data.get("education", [])
        certifications = resume_data.get("certifications", [])
        jd_education_req = jd_data.get("education_required", "Not specified")

        context = f"""Candidate Education:
{json.dumps(education, indent=2)}

Certifications & Additional Qualifications:
{certifications}

Job Education Requirement: {jd_education_req}

Evaluate the candidate's education and provide a score (0–100) with reasoning."""

        messages = [
            SystemMessage(content=EDUCATION_SYSTEM_PROMPT),
            HumanMessage(content=context),
        ]
        return self._llm.invoke(messages)
