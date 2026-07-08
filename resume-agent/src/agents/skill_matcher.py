"""
Skill Matching Agent.
Combines RapidFuzz pre-matching with LLM reasoning for accurate skill gap analysis.
Receives only skill lists → returns SkillMatchResult.
"""
from __future__ import annotations

from typing import List

from langchain_core.messages import HumanMessage, SystemMessage

from src.prompts.skill_prompt import SKILL_SYSTEM_PROMPT
from src.utils.llm import get_llm
from src.utils.schemas import SkillMatchResult
from src.utils.similarity import compute_skill_score, find_skill_matches


class SkillMatcherAgent:
    """
    Matches resume skills against JD requirements.

    Pipeline:
        1. RapidFuzz performs fast fuzzy pre-matching
        2. LLM reviews, corrects, handles synonyms, and provides reasoning
    """

    def __init__(self) -> None:
        self._llm = get_llm().with_structured_output(SkillMatchResult)

    def run(
        self,
        resume_skills: List[str],
        jd_required_skills: List[str],
        jd_preferred_skills: List[str],
    ) -> SkillMatchResult:
        """
        Perform skill matching with fuzzy pre-compute + LLM refinement.

        Args:
            resume_skills: Skills listed in the candidate's resume.
            jd_required_skills: Mandatory skills from the JD.
            jd_preferred_skills: Nice-to-have skills from the JD.

        Returns:
            SkillMatchResult with matched, missing, partial lists and score.
        """
        # Combine required + preferred for full coverage analysis
        all_jd_skills = list(dict.fromkeys(jd_required_skills + jd_preferred_skills))

        # Run fast deterministic pre-match
        fuzzy_matched, fuzzy_partial, fuzzy_missing = find_skill_matches(
            resume_skills, all_jd_skills
        )
        fuzzy_score = compute_skill_score(fuzzy_matched, fuzzy_partial, fuzzy_missing)

        context = f"""Resume Skills:
{resume_skills}

JD Required Skills: {jd_required_skills}
JD Preferred Skills: {jd_preferred_skills}

Pre-computed Fuzzy Match Results:
  Matched  ({len(fuzzy_matched)}): {fuzzy_matched}
  Partial  ({len(fuzzy_partial)}): {fuzzy_partial}
  Missing  ({len(fuzzy_missing)}): {fuzzy_missing}
  Fuzzy Score: {fuzzy_score:.1f}/100

Review these results, correct synonym mismatches, and provide your final analysis."""

        messages = [
            SystemMessage(content=SKILL_SYSTEM_PROMPT),
            HumanMessage(content=context),
        ]
        return self._llm.invoke(messages)
