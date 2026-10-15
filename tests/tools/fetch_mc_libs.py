#!/usr/bin/env python3
"""Download the library jars a Minecraft version needs and print a Java classpath.

The launcher's libraries folder is not always readable (and a scripted check should not depend on a
launcher install), so this fetches the same files from Mojang's library URLs listed in the version JSON.

Usage:
    python3 fetch_mc_libs.py --version-json PATH/TO/26.3.json --out DIR  > classpath.txt

Prints a ':'-joined classpath of the downloaded jars (Linux/macOS; use ';' on Windows).
"""
import argparse
import json
import os
import sys
import urllib.request


def applies_to_this_os(rules):
    """Version JSON library rules: no rules means always; otherwise allow/disallow by os name."""
    if not rules:
        return True
    ok = False
    for rule in rules:
        os_name = rule.get("os", {}).get("name")
        if os_name not in (None, "linux"):
            continue
        ok = rule["action"] == "allow"
    return ok


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--version-json", required=True)
    parser.add_argument("--out", required=True)
    args = parser.parse_args()

    os.makedirs(args.out, exist_ok=True)
    with open(args.version_json, encoding="utf-8") as handle:
        version = json.load(handle)

    classpath = []
    for library in version["libraries"]:
        if not applies_to_this_os(library.get("rules")):
            continue
        artifact = library.get("downloads", {}).get("artifact")
        if not artifact:
            continue
        target = os.path.join(args.out, os.path.basename(artifact["path"]))
        if not os.path.exists(target):
            print("downloading", artifact["path"], file=sys.stderr)
            urllib.request.urlretrieve(artifact["url"], target)
        classpath.append(target)

    print(os.pathsep.join(classpath))


if __name__ == "__main__":
    main()
