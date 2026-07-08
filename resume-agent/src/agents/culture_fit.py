"""
Culture Fit Agent.
Receives only the resume summary + JD text → returns CultureFitResult.
Deliberately uses MINIMUM context to prevent hallucination.
"""
from __future__ import annotations

from langchain_core.messages import HumanMessage, SystemMessage

from src.prompts.culture_prompt import CULTURE_SYSTEM_PROMPT
from src.utils.llm import get_llm
from src.utils.schemas import CultureFitResult

# Limit JD to 2000 chars to stay focused on soft skills section
_JD_CHAR_LIMIT: int = 2000


class CultureFitAgent:
    """
    Estimates cultural alignment from the candidate's professional summary and JD.

    Strict anti-hallucination design: only uses the summary text.
    Unknown dimensions are rated 5 (neutral) with uncertainty noted.
    """

    def __init__(self) -> None:
        self._llm = get_llm().with_structured_output(CultureFitResult)

    def run(self, candidate_summary: str, jd_text: str) -> CultureFitResult:
        """
        Assess culture fit from candidate summary and JD.

        Args:
            candidate_summary: Professional summary from the parsed resume.
            jd_text: Raw job description text (truncated to avoid noise).

        Returns:
            CultureFitResult with per-dimension scores and uncertainty notes.
        """
        summary_section = (
            candidate_summary.strip()
            if candidate_summary.strip()
            else "No professional summary was provided in the resume."
        )

        context = f"""Candidate Professional Summary:
{summary_section}

Job Description (excerpt):
{jd_text[:_JD_CHAR_LIMIT]}

Assess culture fit based ONLY on the above. Acknowledge uncertainty where evidence is absent."""

        messages = [
            SystemMessage(content=CULTURE_SYSTEM_PROMPT),
            HumanMessage(content=context),
        ]
        return self._llm.invoke(messages)
