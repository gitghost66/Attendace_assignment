"""
Resume Parser Agent.
Receives only raw resume text → returns ParsedResume.
Knows nothing about the JD or other agents.
"""
from __future__ import annotations

from langchain_core.messages import HumanMessage, SystemMessage

from src.prompts.resume_prompt import RESUME_SYSTEM_PROMPT
from src.utils.llm import get_llm
from src.utils.schemas import ParsedResume


class ResumeParserAgent:
    """
    Parses raw resume text into a strongly-typed ParsedResume object.

    Uses LLM structured output (function-calling) to guarantee schema compliance.
    """

    def __init__(self) -> None:
        # Bind ParsedResume as the forced output schema
        self._llm = get_llm().with_structured_output(ParsedResume)

    def run(self, resume_text: str) -> ParsedResume:
        """
        Extract structured data from resume text.

        Args:
            resume_text: Raw plain text extracted from the resume file.

        Returns:
            ParsedResume instance with all extracted fields populated.
        """
        messages = [
            SystemMessage(content=RESUME_SYSTEM_PROMPT),
            HumanMessage(content=f"Parse the following resume:\n\n{resume_text}"),
        ]
        result: ParsedResume = self._llm.invoke(messages)
        return result
