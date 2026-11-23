#!/usr/bin/env python3
"""PreToolUse guard for Bash: nothing reaches `main` except through a merged pull request (DEC-04).

Blocks:
  - `git push` to main: a refspec whose destination is main, `--all`/`--mirror`, or a bare push
    while the current branch is main;
  - `git push --force` / `-f` (`--force-with-lease` is allowed on your own slice branch);
  - `git commit` while the current branch is main;
  - `gh pr merge` without `--squash`, or with `--admin` (it bypasses the checks).
The CI job `main-via-pr` repeats the main rule for any agent. This is a guard rail, not a sandbox.
Exit code 2 blocks the tool call; stderr is shown to Claude.
"""
import json
import os
import re
import shlex
import subprocess
import sys

MAIN = ("main", "master")
GIT_OPTIONS_WITH_VALUE = ("-C", "-c", "--git-dir", "--work-tree", "--namespace")
PUSH_OPTIONS_WITH_VALUE = ("-o", "--push-option", "--repo", "--receive-pack", "--exec")
HEREDOC = re.compile(r"<<-?\s*['\"]?(\w+)['\"]?")


def strip_heredocs(cmd):
    """Drops heredoc bodies (commit messages, PR bodies), which are text, not commands."""
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


def block(message):
    print(f"BLOCKED: {message} (SESSION §4)", file=sys.stderr)
    sys.exit(2)


def current_branch(directory):
    result = subprocess.run(["git", "-C", directory, "branch", "--show-current"],
                            capture_output=True, text=True)
    return result.stdout.strip() if result.returncode == 0 else ""


def destination(refspec):
    target = refspec.lstrip("+").split(":")[-1]
    return target.removeprefix("refs/heads/")


def check_push(args, directory):
    positional, i = [], 0
    while i < len(args):
        arg = args[i]
        if arg in PUSH_OPTIONS_WITH_VALUE:
            i += 2
            continue
        if arg in ("--all", "--mirror"):
            block(f"`git push {arg}` would push main; push only the slice branch")
        if arg == "--force" or (re.fullmatch(r"-[a-zA-Z]+", arg) and "f" in arg):
            block("force-push rewrites history; use --force-with-lease on your own slice branch")
        if not arg.startswith("-"):
            positional.append(arg)
        i += 1
    refspecs = positional[1:]  # the first positional is the remote
    if not refspecs and current_branch(directory) in MAIN:
        block("you are on main: branch `slice/<id>-<name>` and push that")
    for refspec in refspecs:
        if destination(refspec) in MAIN or (refspec == "HEAD" and current_branch(directory) in MAIN):
            block(f"`{refspec}` pushes to main; only a merged pull request reaches main")


def check(tokens, directory):
    while tokens and re.fullmatch(r"[A-Za-z_][A-Za-z0-9_]*=.*", tokens[0]):
        tokens = tokens[1:]  # leading VAR=value assignments
    if not tokens:
        return directory
    name = os.path.basename(tokens[0])
    if name == "cd" and len(tokens) > 1:
        return os.path.join(directory, os.path.expanduser(tokens[1]))
    if name == "git":
        i = 1
        while i < len(tokens) and tokens[i].startswith("-"):
            if tokens[i] == "-C" and i + 1 < len(tokens):
                directory = os.path.join(directory, os.path.expanduser(tokens[i + 1]))
            i += 2 if tokens[i] in GIT_OPTIONS_WITH_VALUE else 1
        sub, rest = (tokens[i], tokens[i + 1:]) if i < len(tokens) else ("", [])
        if sub == "push":
            check_push(rest, directory)
        elif sub == "commit" and current_branch(directory) in MAIN:
            block("you are on main: branch `slice/<id>-<name>` before committing")
    elif name == "gh" and tokens[1:3] == ["pr", "merge"]:
        flags = tokens[3:]
        if "--admin" in flags:
            block("`gh pr merge --admin` bypasses the checks")
        if "--squash" not in flags and "-s" not in flags:
            block("merge with `gh pr merge <n> --squash --delete-branch`")
    return directory


def main():
    try:
        data = json.load(sys.stdin)
    except ValueError as error:
        block(f"guard-git cannot read its input ({error})")
    if data.get("tool_name") != "Bash":
        sys.exit(0)
    directory = data.get("cwd") or os.environ.get("CLAUDE_PROJECT_DIR") or os.getcwd()
    for part in re.split(r"&&|\|\||;|\||\n", strip_heredocs(data.get("tool_input", {}).get("command", ""))):
        try:
            tokens = shlex.split(part, comments=True)
        except ValueError:
            tokens = part.split()
        directory = check(tokens, directory)
    sys.exit(0)


if __name__ == "__main__":
    main()
