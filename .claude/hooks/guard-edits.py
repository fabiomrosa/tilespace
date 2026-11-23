#!/usr/bin/env python3
"""PreToolUse guard: blocks edits to generated, released or read-only files.

Rules come from .agents/protected.json (globs relative to the project root, except
"readonly_anywhere", which matches absolute paths):
  {"generated":            [{"glob": "...", "how": "command to regenerate"}],
   "frozen_when_released": [{"glob": "...", "why": "..."}],   # blocked once the file is on `main`
   "readonly_anywhere":    [{"glob": "...", "why": "..."}]}
For Bash, only real write targets are checked (redirections, sed/perl in-place, tee, cp/mv/install
destinations, rm/truncate, git rm/mv); heredoc bodies are ignored. This is a guard rail, not a
sandbox. It fails closed: an unreadable protected.json or hook input blocks the call.
Exit code 2 blocks the tool call; stderr is shown to Claude.
"""
import fnmatch
import json
import os
import re
import shlex
import subprocess
import sys

HEREDOC = re.compile(r"<<-?\s*['\"]?(\w+)['\"]?")


def strip_heredocs(cmd):
    out, delimiter = [], None
    for line in cmd.split("\n"):
        if delimiter is not None:
            if line.strip() == delimiter:
                delimiter = None
            continue
        match = HEREDOC.search(line)
        if match:
            delimiter = match.group(1)
        out.append(line)
    return "\n".join(out)


def bash_targets(cmd):
    targets = []
    for part in re.split(r"&&|\|\||;|\||\n", strip_heredocs(cmd)):
        try:
            tokens = shlex.split(part, comments=True)
        except ValueError:
            tokens = part.split()
        if not tokens:
            continue
        for i, tok in enumerate(tokens):
            if tok in (">", ">>") and i + 1 < len(tokens):
                targets.append(tokens[i + 1])
            elif re.match(r"^\d?>>?[^>&]", tok):
                targets.append(re.sub(r"^\d?>>?", "", tok))
        name = os.path.basename(tokens[0])
        if name == "git" and len(tokens) > 1 and tokens[1] in ("rm", "mv"):
            name, tokens = tokens[1], tokens[1:]
        args = [t for t in tokens[1:] if not t.startswith("-") and t not in (">", ">>")]
        inplace = any(t == "--in-place" or (t.startswith("-") and not t.startswith("--") and "i" in t)
                      for t in tokens[1:])
        if name in ("sed", "perl") and inplace and args:
            targets.append(args[-1])
        elif name == "tee":
            targets.extend(args)
        elif name == "mv":
            targets.extend(args)  # the sources disappear too
        elif name in ("cp", "install") and len(args) >= 2:
            targets.append(args[-1])
        elif name in ("rm", "truncate"):
            targets.extend(args)
    return targets


def targets(tool, tool_input):
    if tool in ("Edit", "Write", "MultiEdit"):
        return [tool_input.get("file_path", "")]
    if tool == "NotebookEdit":
        return [tool_input.get("notebook_path", "")]
    if tool == "Bash":
        return bash_targets(tool_input.get("command", ""))
    return []


def released(path):
    """True when the file exists on `main` or `origin/main` of the git repo that contains it."""
    directory = os.path.dirname(path)
    while directory and not os.path.isdir(directory):
        directory = os.path.dirname(directory)
    top = subprocess.run(["git", "-C", directory, "rev-parse", "--show-toplevel"],
                         capture_output=True, text=True)
    if top.returncode != 0:
        return False
    relpath = os.path.relpath(path, os.path.realpath(top.stdout.strip()))
    for ref in ("main", "origin/main"):
        result = subprocess.run(["git", "-C", directory, "cat-file", "-e", f"{ref}:{relpath}"],
                                stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        if result.returncode == 0:
            return True
    return False


def block(message):
    print(f"BLOCKED: {message}", file=sys.stderr)
    sys.exit(2)


def main():
    root = os.path.realpath(os.environ.get("CLAUDE_PROJECT_DIR") or os.getcwd())
    try:
        data = json.load(sys.stdin)
        with open(os.path.join(root, ".agents", "protected.json")) as f:
            rules = json.load(f)
    except (OSError, ValueError) as error:
        block(f"guard-edits cannot read its input or .agents/protected.json ({error}); fix that first.")
    cwd = data.get("cwd") or root
    for target in targets(data.get("tool_name", ""), data.get("tool_input", {})):
        if not target:
            continue
        path = os.path.realpath(os.path.expanduser(target) if os.path.isabs(os.path.expanduser(target))
                                else os.path.join(cwd, target))
        for rule in rules.get("readonly_anywhere", []):
            if fnmatch.fnmatch(path, rule["glob"]):
                block(f"{path} is read-only: {rule['why']}.")
        if not path.startswith(root + os.sep):
            continue
        relpath = os.path.relpath(path, root)
        for rule in rules.get("generated", []):
            if fnmatch.fnmatch(relpath, rule["glob"]):
                block(f"{relpath} is generated. Do not edit it; {rule['how']}.")
        for rule in rules.get("frozen_when_released", []):
            if fnmatch.fnmatch(relpath, rule["glob"]) and released(path):
                block(f"{relpath} is on main and frozen: {rule['why']}.")
    sys.exit(0)


if __name__ == "__main__":
    main()
