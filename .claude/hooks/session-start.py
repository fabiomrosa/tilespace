#!/usr/bin/env python3
"""SessionStart: puts the current state in front of Claude (stdout is added to the context).

The 'Last session' block of docs/STATE.md, the current branch, and the current slice of docs/PLAN.md
(the first 'next' entry; otherwise the waiting slices and what blocks them).
"""
import os
import re
import subprocess

root = os.environ.get("CLAUDE_PROJECT_DIR") or os.getcwd()
HUB = "tilespace"  # the repository that holds docs/shared and the shared skills
shared = "docs/shared" if os.path.basename(os.path.realpath(root)) == HUB else f"../{HUB}/docs/shared"


def read(path):
    try:
        with open(os.path.join(root, path)) as f:
            return f.read()
    except OSError:
        return ""


def section(text, title):
    match = re.search(rf"^## {re.escape(title)}\n(.*?)(?=^## |\Z)", text, re.S | re.M)
    return match.group(1).strip() if match else None


def git(*args):
    result = subprocess.run(["git", "-C", root, *args], capture_output=True, text=True)
    return result.stdout.strip() if result.returncode == 0 else ""


print("=== tilespace session start ===")
print(f"Follow {shared}/SESSION.md: pull every repository first, one slice, one pull request, merged by you")
print("only when every check is green (§4). Never commit or push to main.")
print("Read the project's CONVENTIONS.md and the nearest code before writing code. If anything you were")
print("told disagrees with the files on disk, the files win.")
if not os.path.isdir(os.path.join(root, shared)):
    print(f"\nWARNING: {shared} is missing: clone {HUB} next to this repository.")

branch = git("branch", "--show-current")
if branch:
    print(f"\nCurrent branch: {branch}")
    if branch != "main":
        print("A slice or docs branch: its pull request may be open on GitHub. Continue it (SESSION §1.4, §5).")

plan = read("docs/PLAN.md")
state = read("docs/STATE.md")
print("\n## Last session\n" + (section(state, "Last session") or "(no handoff found)"))
blocks = [b for b in re.split(r"\n(?=### )", plan) if b.startswith("### ")]


def status(block):
    match = re.search(r"\*\*Status:\*\*\s*(.+)", block)
    return match.group(1).strip() if match else ""


current = next((b for b in blocks if status(b).startswith("next")), None)
if current:
    print("\n## Current slice\n" + current.strip())
else:
    waiting = [f"- {b.splitlines()[0][4:]} — {status(b)}" for b in blocks if status(b).startswith("waiting")]
    print("\n## Current slice\nNone is marked next. Waiting slices (and what blocks them):")
    print("\n".join(waiting[:6]) or "- (none)")
    print("A waiting slice may start only when every item in its list is done (slices, on the owning repo's")
    print("main) or accepted (decisions); check them (SESSION §1.5) and otherwise ask the owner.")
