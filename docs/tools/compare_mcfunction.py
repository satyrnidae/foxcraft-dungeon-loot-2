#!/usr/bin/env python3
"""Compare the mcfunction output of two mc-build runs, ignoring how each version splits blocks.

mc-build 2.x and 4.x both turn `execute ... run { ... }` and if/else chains into generated helper
functions, with different names, folder layouts and bookkeeping. To check that a source conversion kept
behavior, this inlines every generated helper back into its caller, drops the internal if/else score
updates, collapses one-line blocks and compares the resulting command lists per user-named function.

Usage:
    python3 compare_mcfunction.py OLD_BUILD_ROOT NEW_BUILD_ROOT [--namespace NAME] [--diffs diffs.json]

Each root contains data/<namespace>/function(s)/. 2.x writes `functions`, 4.x writes `function`.
Exit status is 1 if any user-named function differs after normalising.
"""
import argparse
import difflib
import json
import os
import re
import sys


def load(root, namespace):
    """Return {relative function path: [lines]} for whichever of function/functions exists."""
    for folder in ("function", "functions"):
        base = os.path.join(root, "data", namespace, folder)
        if os.path.isdir(base):
            break
    else:
        sys.exit("no function folder under %s/data/%s" % (root, namespace))
    functions = {}
    for dirpath, _dirs, files in os.walk(base):
        for name in files:
            if name.endswith(".mcfunction"):
                rel = os.path.relpath(os.path.join(dirpath, name), base)[:-len(".mcfunction")].replace(os.sep, "/")
                with open(os.path.join(dirpath, name), encoding="utf-8") as handle:
                    functions[rel] = [line.rstrip() for line in handle.read().split("\n")]
    return functions


def normalise(functions, name, namespace):
    out = []
    call = re.compile(r"^(.*?)run function %s:(\S*__generated__/\S+)\s*$" % re.escape(namespace))
    else_check = re.compile(r"if score #(execute|ifelse) \S+ matches 0 ?")
    for line in functions[name]:
        text = line.strip()
        if not text or text.startswith("#"):
            continue
        if re.search(r"scoreboard players set #(execute|ifelse) ", text):
            continue
        text = re.sub(r"(schedule function \S+ \S+) replace$", r"\1", text)  # 4.x appends 'replace'
        match = call.match(text)
        if match and match.group(2) in functions:
            prefix = else_check.sub("ELSE ", match.group(1))
            out.append(prefix + "run {")
            out.extend("  " + inner for inner in normalise(functions, match.group(2), namespace))
            out.append("}")
        else:
            out.append(else_check.sub("ELSE ", text))
    collapsed, i = [], 0
    while i < len(out):
        if out[i].endswith("run {") and i + 2 < len(out) and out[i + 2] == "}" and not out[i + 1].lstrip().endswith("{"):
            collapsed.append(out[i][:-1] + out[i + 1].strip())
            i += 3
        else:
            collapsed.append(out[i])
            i += 1
    return collapsed


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("old_root")
    parser.add_argument("new_root")
    parser.add_argument("--namespace", default="foxcraft_dungeon_loot")
    parser.add_argument("--diffs", help="write the differing functions to this JSON file")
    args = parser.parse_args()

    old = load(args.old_root, args.namespace)
    new = load(args.new_root, args.namespace)
    user_old = {k for k in old if "__generated__" not in k}
    user_new = {k for k in new if "__generated__" not in k}
    print("user functions: old %d, new %d; only old: %s; only new: %s"
          % (len(user_old), len(user_new), sorted(user_old - user_new)[:5], sorted(user_new - user_old)[:5]))

    same, different = 0, []
    for name in sorted(user_old & user_new):
        a = normalise(old, name, args.namespace)
        b = normalise(new, name, args.namespace)
        if a == b:
            same += 1
        else:
            different.append((name, a, b))
    print("identical after normalising: %d, different: %d" % (same, len(different)))

    for name, a, b in different[:10]:
        print("=====", name)
        for line in list(difflib.unified_diff(a, b, "old", "new", lineterm="", n=0))[:14]:
            print(line)
    if args.diffs:
        with open(args.diffs, "w", encoding="utf-8") as handle:
            json.dump([(n, "\n".join(a), "\n".join(b)) for n, a, b in different], handle)
    sys.exit(1 if different else 0)


if __name__ == "__main__":
    main()
