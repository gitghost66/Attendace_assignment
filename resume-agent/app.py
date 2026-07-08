"""
app.py — Chainlit UI entry point for the AI Resume Screening Agent.

Flow:
    1. User uploads resume (PDF / DOCX)
    2. User pastes job description text
    3. LangGraph workflow runs with real-time node streaming
    4. Each node's output is displayed as a collapsible Step
    5. Final recruiter report is displayed as a rich markdown message
"""
from __future__ import annotations

import os
from pathlib import Path

import chainlit as cl
from dotenv import load_dotenv

load_dotenv()

from src.graph.state import GraphState
from src.graph.workflow import create_workflow
from src.utils.docx_loader import load_docx
from src.utils.pdf_loader import load_pdf

# ── Node display configuration ────────────────────────────────────────────────

NODE_LABELS: dict[str, str] = {
    "parse_resume": "📝 Parsing Resume",
    "parse_jd": "📋 Parsing Job Description",
    "extract_keywords": "🔑 Extracting Keywords",
    "match_skills": "⚡ Matching Skills",
    "evaluate_experience": "💼 Evaluating Experience",
    "evaluate_education": "🎓 Evaluating Education",
    "evaluate_culture": "🤝 Assessing Culture Fit",
    "generate_questions": "❓ Generating Interview Questions",
    "final_decision": "🎯 Making Final Decision",
}

# LangGraph internal node names to skip
_SYSTEM_NODES: frozenset[str] = frozenset({"__start__", "__end__", "__interrupt__"})


# ── Helper functions ──────────────────────────────────────────────────────────

def _load_resume_file(file_path: str, file_name: str) -> str:
    """Load and return text from a PDF or DOCX resume file."""
    name_lower = file_name.lower()
    if name_lower.endswith(".pdf"):
        return load_pdf(file_path)
    if name_lower.endswith(".docx"):
        return load_docx(file_path)
    raise ValueError(
        f"Unsupported file type: '{file_name}'. Please upload a PDF or DOCX file."
    )


def _format_node_summary(node_name: str, updates: dict) -> str:
    """
    Return a one-line human-readable summary of what a node produced.
    Shown as the output of the collapsible Step element.
    """
    formatters: dict = {
        "parse_resume": lambda u: (
            f"Name: **{u.get('resume_data', {}).get('name', 'N/A')}** | "
            f"Skills found: {len(u.get('resume_data', {}).get('skills', []))}"
        ),
        "parse_jd": lambda u: (
            f"Role: **{u.get('jd_data', {}).get('role_title', 'N/A')}** | "
            f"Required skills: {len(u.get('jd_data', {}).get('required_skills', []))}"
        ),
        "extract_keywords": lambda u: (
            f"Resume keywords: {len(u.get('resume_keywords', []))} | "
            f"JD keywords: {len(u.get('jd_keywords', []))}"
        ),
        "match_skills": lambda u: (
            f"Matched: {len(u.get('matched_skills', []))} | "
            f"Missing: {len(u.get('missing_skills', []))} | "
            f"Score: **{u.get('skill_score', 0):.1f}/100**"
        ),
        "evaluate_experience": lambda u: (
            f"Experience score: **{u.get('experience_score', 0):.1f}/100**"
        ),
        "evaluate_education": lambda u: (
            f"Education score: **{u.get('education_score', 0):.1f}/100**"
        ),
        "evaluate_culture": lambda u: (
            f"Culture fit score: **{u.get('culture_score', 0):.1f}/100**"
        ),
        "generate_questions": lambda u: (
            f"{len(u.get('interview_questions', []))} questions generated"
        ),
        "final_decision": lambda u: (
            f"Decision: **{u.get('recommendation', 'N/A')}** | "
            f"Overall score: **{u.get('overall_score', 0):.1f}/100**"
        ),
    }

    formatter = formatters.get(node_name)
    if formatter:
        try:
            return formatter(updates)
        except Exception:
            return "Completed"
    return "Completed"


# ── Workflow runner ───────────────────────────────────────────────────────────

async def _run_workflow(resume_text: str, jd_text: str) -> None:
    """
    Execute the LangGraph workflow and stream each node's result to Chainlit.

    Strategy:
        - Use workflow.astream(stream_mode="updates") to get node deltas
        - Display each node as a cl.Step (collapsible panel in UI)
        - Accumulate full state from deltas
        - Display the final_report at the end
    """
    initial_state: GraphState = {
        "resume_text": resume_text,
        "jd_text": jd_text,
        "errors": [],
    }

    workflow = create_workflow()

    # Track accumulated state from all node updates
    full_state: dict = dict(initial_state)

    await cl.Message(
        content=(
            "🚀 **Multi-agent analysis starting...**\n\n"
            "9 specialized AI agents are analyzing this candidate. "
            "Watch the steps below as they complete."
        )
    ).send()

    try:
        async for updates in workflow.astream(initial_state, stream_mode="updates"):
            for node_name, node_output in updates.items():
                if node_name in _SYSTEM_NODES:
                    continue

                # Merge delta into our accumulated state
                full_state.update(node_output)

                label = NODE_LABELS.get(node_name, node_name)
                summary = _format_node_summary(node_name, node_output)

                # Display each node as a collapsible Step
                async with cl.Step(name=label, type="tool") as step:
                    step.output = summary

    except Exception as exc:
        await cl.Message(
            content=f"❌ **Workflow error:** {type(exc).__name__}: {exc}\n\nPlease check your API key and try again."
        ).send()
        return

    # Report any non-fatal errors
    errors: list[str] = full_state.get("errors", [])
    if errors:
        error_text = "\n".join(f"- ⚠️ {e}" for e in errors)
        await cl.Message(
            content=f"**Some agents reported warnings:**\n{error_text}"
        ).send()

    # Display the final report
    final_report: str = full_state.get("final_report", "")
    if final_report:
        await cl.Message(content=final_report).send()
    else:
        await cl.Message(
            content="❌ The final report could not be generated. Check the error messages above."
        ).send()


# ── Chainlit event handlers ───────────────────────────────────────────────────

@cl.on_chat_start
async def on_chat_start() -> None:
    """
    Entry point when a user opens a new chat session.

    Guides the user through:
        1. Resume file upload
        2. Job description text input
        3. Workflow execution
    """
    await cl.Message(
        content=(
            "# 🤖 AI Resume Screening Agent\n\n"
            "I use **9 specialized AI agents** powered by LangGraph to provide "
            "a comprehensive, multi-dimensional candidate evaluation.\n\n"
            "**Agents:** Resume Parser · JD Parser · Keyword Extractor · "
            "Skill Matcher · Experience Evaluator · Education Evaluator · "
            "Culture Fit Assessor · Interview Question Generator · Decision Agent\n\n"
            "Let's get started! 👇"
        )
    ).send()

    # ── Step 1: Resume upload ─────────────────────────────────────────────────
    resume_files = await cl.AskFileMessage(
        content=(
            "📄 **Step 1 of 2 — Upload Resume**\n\n"
            "Please upload the candidate's resume file.\n"
            "Accepted formats: **PDF** or **DOCX**"
        ),
        accept=[
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ],
        max_size_mb=10,
        timeout=300,
    ).send()

    if not resume_files:
        await cl.Message(
            content="❌ No file was uploaded. Please refresh the page and try again."
        ).send()
        return

    resume_file = resume_files[0]
    await cl.Message(
        content=f"✅ Resume received: **{resume_file.name}** — reading content..."
    ).send()

    # Load text from the uploaded file
    try:
        resume_text = _load_resume_file(resume_file.path, resume_file.name)
    except Exception as exc:
        await cl.Message(
            content=f"❌ Could not read the resume file: {exc}"
        ).send()
        return

    if not resume_text.strip():
        await cl.Message(
            content=(
                "❌ The uploaded file appears to be empty or could not be parsed.\n"
                "Please check the file and try again."
            )
        ).send()
        return

    # ── Step 2: Job Description input ─────────────────────────────────────────
    jd_response = await cl.AskUserMessage(
        content=(
            "📋 **Step 2 of 2 — Job Description**\n\n"
            "Please **copy and paste** the full job description text below.\n"
            "Include all sections: responsibilities, requirements, and qualifications."
        ),
        timeout=600,
    ).send()

    if not jd_response:
        await cl.Message(
            content="❌ No job description was provided."
        ).send()
        return

    jd_text: str = jd_response["output"].strip()

    if len(jd_text) < 50:
        await cl.Message(
            content=(
                "❌ The job description is too short. "
                "Please paste the **complete** job description text."
            )
        ).send()
        return

    await cl.Message(
        content=f"✅ Job description received ({len(jd_text)} characters). **Starting analysis...**"
    ).send()

    # ── Run the workflow ───────────────────────────────────────────────────────
    await _run_workflow(resume_text, jd_text)


@cl.on_message
async def on_message(message: cl.Message) -> None:
    """Handle any follow-up messages after the initial analysis."""
    await cl.Message(
        content=(
            "✅ Analysis is complete.\n\n"
            "To analyze another candidate, please **start a new chat session** "
            "(click the ✏️ button or refresh).\n\n"
            "If you have questions about this report, feel free to ask!"
        )
    ).send()
