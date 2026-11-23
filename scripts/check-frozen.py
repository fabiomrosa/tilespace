#!/usr/bin/env python3
"""Fails a pull request that edits, renames or deletes a frozen file already on the base branch
(the `frozen_when_released` globs of .agents/protected.json). A rename counts as deleting the old
path. Usage: scripts/check-frozen.py <base>"""
import fnmatch
import json
import subprocess
import sys


def git(*args):
    return subprocess.run(["git", *args], capture_output=True, text=True)


base_ref = sys.argv[1]
base = git("merge-base", f"origin/{base_ref}", "HEAD")
if base.returncode != 0:
    base = git("merge-base", base_ref, "HEAD")
if base.returncode != 0:
    sys.exit(f"no merge base with {base_ref}")
with open(".agents/protected.json") as f:
    globs = [rule["glob"] for rule in json.load(f).get("frozen_when_released", [])]
diff = git("diff", "--name-only", "--no-renames", "--diff-filter=DM", "-z", base.stdout.strip(), "HEAD").stdout
hits = [path for path in diff.split("\0") if path and any(fnmatch.fnmatch(path, g) for g in globs)]
if hits:
    print("Frozen files changed; add a new file instead:\n" + "\n".join(hits))
    sys.exit(1)
print("frozen files: unchanged")
