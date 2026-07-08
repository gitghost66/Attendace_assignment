"""
Resume Summarizer Agent.
Utility agent: generates a narrative paragraph summary from parsed resume data.
Used by other agents or UI when a concise candidate overview is needed.
"""
from __future__ import annotations

import json
from typing import Any, Dict

from langchain_core.messages import HumanMessage, SystemMessage

from src.utils.llm import get_llm

_SUMMARIZER_SYSTEM_PROMPT: str = """You are a professional resume writer tasked with creating a concise executive summary.

From the provided structured resume data, write a 3–5 sentence professional summary in third person.

Guidelines:
- Highlight total years of experience and seniority level
- Mention the 3–5 most relevant technical skills
- Reference 1–2 notable achievements (if present)
- Keep it factual — do not exaggerate or infer
- Write in present tense (e.g., "She brings 5 years of...")
- Do NOT start with the candidate's name"""


class ResumeSummarizerAgent:
    """
    Generates a narrative summary paragraph from structured resume data.

    This is a utility agent, not in the main workflow graph.
    Can be called on-demand for use in reports or UI displays.
    """

    def __init__(self) -> None:
        self._llm = get_llm()

    def run(self, resume_data: Dict[str, Any]) -> str:
        """
        Generate a 3–5 sentence professional summary from resume data.

        Args:
            resume_data: ParsedResume as dict.

        Returns:
            Plain text narrative summary.
        """
        context = f"""Resume Data:
{json.dumps(resume_data, indent=2, default=str)}

Generate a professional summary paragraph (3–5 sentences, third person)."""

        messages = [
            SystemMessage(content=_SUMMARIZER_SYSTEM_PROMPT),
            HumanMessage(content=context),
        ]
        response = self._llm.invoke(messages)
        return str(response.content).strip()
