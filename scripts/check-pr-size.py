#!/usr/bin/env python3
"""Fails a pull request too big to review (SESSION §0). Usage: scripts/check-pr-size.py <base branch>

Lockfiles, the `generated` globs and the `size_excluded` globs of .agents/protected.json don't count.
A glob without a "/" matches the file name in any folder; one with a "/" matches the path from the
repository root, and its "*" also crosses folders.
"""
import fnmatch
import json
import os
import subprocess
import sys

MAX_FILES, MAX_LINES = 15, 400
LOCKFILES = [
    "package-lock.json", "npm-shrinkwrap.json", "pnpm-lock.yaml", "yarn.lock", "bun.lock", "bun.lockb",
    "uv.lock", "poetry.lock", "Pipfile.lock", "pdm.lock", "Gemfile.lock", "Cargo.lock", "go.sum",
    "composer.lock", "mix.lock", "Podfile.lock", "pubspec.lock", "packages.lock.json", "gradle.lockfile",
    "gradlew", "gradlew.bat", "gradle/wrapper/*",
]


def git(*args):
    return subprocess.run(["git", *args], capture_output=True, text=True)


def matches(path, glob):
    return fnmatch.fnmatch(path if "/" in glob else os.path.basename(path), glob)


with open(".agents/protected.json") as f:
    rules = json.load(f)
globs = LOCKFILES + [r["glob"] for r in rules.get("generated", []) + rules.get("size_excluded", [])]

base_ref = sys.argv[1]
base = git("merge-base", f"origin/{base_ref}", "HEAD")
if base.returncode != 0:
    base = git("merge-base", base_ref, "HEAD")
if base.returncode != 0:
    sys.exit(f"no merge base with {base_ref}")

files = lines = 0
for entry in git("diff", "--numstat", "--no-renames", "-z", base.stdout.strip(), "HEAD").stdout.split("\0"):
    if not entry:
        continue
    added, removed, path = entry.split("\t", 2)
    if any(matches(path, g) for g in globs):
        continue
    files += 1
    if added != "-":  # binary files count as a file, not as lines
        lines += int(added) + int(removed)

print(f"files: {files}/{MAX_FILES}, lines: {lines}/{MAX_LINES}")
if files > MAX_FILES or lines > MAX_LINES:
    print("Too big to review: split the slice in docs/PLAN.md (SESSION §0).")
    sys.exit(1)
