"""
Job Description Parser Agent.
Receives only raw JD text → returns ParsedJD.
Knows nothing about the resume or other agents.
"""
from __future__ import annotations

from langchain_core.messages import HumanMessage, SystemMessage

from src.prompts.jd_prompt import JD_SYSTEM_PROMPT
from src.utils.llm import get_llm
from src.utils.schemas import ParsedJD


class JDParserAgent:
    """
    Parses raw job description text into a strongly-typed ParsedJD object.
    """

    def __init__(self) -> None:
        self._llm = get_llm().with_structured_output(ParsedJD)

    def run(self, jd_text: str) -> ParsedJD:
        """
        Extract structured data from job description text.

        Args:
            jd_text: Raw plain text of the job description.

        Returns:
            ParsedJD instance with required/preferred skills and requirements.
        """
        messages = [
            SystemMessage(content=JD_SYSTEM_PROMPT),
            HumanMessage(content=f"Parse the following job description:\n\n{jd_text}"),
        ]
        result: ParsedJD = self._llm.invoke(messages)
        return result
