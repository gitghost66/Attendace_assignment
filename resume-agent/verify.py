"""
Quick syntax/import verification script.
Run: python verify.py  (from the resume-agent directory)
Does NOT make any LLM API calls.
"""
import sys
import importlib

modules_to_check = [
    "src.utils.schemas",
    "src.utils.keyword_extractor",
    "src.utils.similarity",
    "src.utils.pdf_loader",
    "src.utils.docx_loader",
    "src.graph.state",
    "src.prompts.resume_prompt",
    "src.prompts.jd_prompt",
    "src.prompts.skill_prompt",
    "src.prompts.experience_prompt",
    "src.prompts.education_prompt",
    "src.prompts.culture_prompt",
    "src.prompts.decision_prompt",
    "src.prompts.question_prompt",
]

print("Verifying module imports (no API calls)...\n")
all_ok = True

for mod in modules_to_check:
    try:
        importlib.import_module(mod)
        print(f"  OK   {mod}")
    except Exception as e:
        print(f"  FAIL {mod}  ->  {e}")
        all_ok = False

print()
if all_ok:
    print("All modules imported successfully!")
    print("\nTo start the app, run:")
    print("   chainlit run app.py --watch")
else:
    print("Some modules failed. Check errors above.")
    sys.exit(1)
