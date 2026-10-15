#!/usr/bin/env python3
"""Fail if loot tables, item modifiers, predicates or advancements still use pre-26.3 keys.

26.3 loads old keys without an error and silently drops them, so an unconverted file produces bare items with no names,
components or conditions. This check needs no game jar. Run it from anywhere:

    python docs/tools/check_old_keys.py [DATA_DIR]

Exit status is 1 when anything is found. See docs/verifying-against-vanilla.md for the codec-based Scan tool, which is the
stronger check but needs the client jar and Java 25.
"""
import glob
import json
import os
import re
import sys

# Condition types that used to be written as "condition": "minecraft:<name>" and are now "type".
OLD_CONDITION_NAMES = {
    "alternative", "reference", "inverted", "entity_properties", "entity_scores", "random_chance", "weather_check",
    "killed_by_player", "match_tool", "block_state_property", "survives_explosion", "table_bonus", "time_check",
    "value_check", "location_check", "damage_source_properties", "random_chance_with_looting", "entity_scores",
}
# Type values that no longer exist.
REMOVED_TYPES = {"alternative", "reference", "looting_enchant", "random_chance_with_looting", "set_nbt"}
LOOT_KINDS = {"loot_table", "item_modifier", "predicate"}


def bare(value):
    return value.split(":", 1)[-1]


def walk(node, kind, path, found):
    if isinstance(node, dict):
        for key, value in node.items():
            here = path + "/" + key
            if kind in LOOT_KINDS and key in ("functions", "conditions"):
                found.append("%s: old key '%s'" % (here, key))
            if kind == "advancement" and key == "functions":
                found.append("%s: old key 'functions'" % here)
            if kind in LOOT_KINDS and key == "function" and isinstance(value, str):
                found.append("%s: old key 'function' (now 'type')" % here)
            if key == "condition" and isinstance(value, str) and bare(value) in OLD_CONDITION_NAMES and value.startswith(
                    ("minecraft:", bare(value))) and ":" not in value.replace("minecraft:", "", 1):
                found.append("%s: old 'condition' type name '%s' (now 'type')" % (here, value))
            if key == "type" and isinstance(value, str) and bare(value) in REMOVED_TYPES and value.startswith(
                    ("minecraft:", bare(value))) and ":" not in value.replace("minecraft:", "", 1):
                found.append("%s: removed type '%s'" % (here, value))
            if key == "nbt" and isinstance(value, str):
                found.append("%s: item NBT string, use components or custom_data" % here)
            if isinstance(value, str) and re.search(r"tag\s*:\s*\{", value):
                found.append("%s: item 'tag' in SNBT '%s', use components" % (here, value[:40]))
            if isinstance(value, str) and ("CustomModelData" in value or "HideFlags" in value):
                found.append("%s: item NBT key in '%s'" % (here, value[:40]))
            walk(value, kind, here, found)
    elif isinstance(node, list):
        for i, value in enumerate(node):
            walk(value, kind, "%s[%d]" % (path, i), found)


def main():
    root = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), "..", "..", "data")
    root = os.path.abspath(root)
    total = 0
    checked = 0
    for path in sorted(glob.glob(os.path.join(root, "**", "*.json"), recursive=True)):
        parts = os.path.relpath(path, root).replace(os.sep, "/").split("/")
        if len(parts) < 3 or parts[1] not in LOOT_KINDS | {"advancement"}:
            continue
        checked += 1
        with open(path, encoding="utf-8") as handle:
            data = json.load(handle)
        found = []
        walk(data, parts[1], "", found)
        for line in found:
            print("%s %s" % ("/".join(parts), line))
        total += len(found)
    print("checked %d files, %d old-key problems" % (checked, total))
    return 1 if total else 0


if __name__ == "__main__":
    sys.exit(main())
