"""One generated test per item source file in src/foxcraft_dungeon_loot/items/.

Checks what the compiler and the game would only reveal at runtime: a hook that is not listed in its function tag never
runs, a clock that nothing schedules never ticks, and a predicate, modifier, loot table, advancement, tag or sound named in
a command that does not exist fails silently or logs an error in game.
"""
import re
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import packdata as pk  # noqa: E402

NS = pk.NS
SOUNDS = pk.read_sounds()
TAGS = pk.function_tags()
ALL_SRC = "\n".join(pk.strip_comments(pk.read_text(p)) for p in sorted(pk.SRC.rglob("*.mcb*")))
BUILD = pk.build_exists()


class SourceItemTests(unittest.TestCase):
    maxDiff = None


def refs(code, pattern):
    """Yield captures of pattern, skipping ones followed by a template expression, which are not final ids."""
    for m in re.finditer(pattern, code):
        end = m.end()
        if end < len(code) and code[end] in "<%":
            continue
        yield m.group(1)


def without_function(code, fn):
    """code with the body of `function fn { ... }` cut out, so a clock that reschedules itself does not count as started."""
    m = re.search(r"^[ \t]*function %s\b[^{]*\{" % re.escape(fn), code, flags=re.M)
    if not m:
        return code
    depth, i = 1, m.end()
    while i < len(code) and depth:
        depth += {"{": 1, "}": -1}.get(code[i], 0)
        i += 1
    return code[:m.start()] + code[i:]


def check_hooks(case, name, text, code):
    top = pk.top_level_functions(text)
    with case.subTest("event hooks are listed in their function tag"):
        for fn in top:
            if fn in TAGS:
                case.assertIn("%s:items/%s/%s" % (NS, name, fn), TAGS[fn], "%s defined but not in tags/function/%s.json" % (fn, fn))
    with case.subTest("function tag entries for this item are defined"):
        for tag, values in TAGS.items():
            for value in values:
                prefix = "%s:items/%s/" % (NS, name)
                if value.startswith(prefix) and value.count("/") == prefix.count("/"):
                    case.assertIn(value[len(prefix):], top, "tags/function/%s.json lists %s, which has no function" % (tag, value))
    with case.subTest("clock functions are scheduled"):
        for fn in top:
            if fn.startswith("clock_"):
                scheduled = re.search(r"schedule function %s:items/%s/%s\b" % (NS, name, fn), without_function(code, fn))
                case.assertTrue(scheduled, "%s is never started outside itself, so it never runs" % fn)
    with case.subTest("scoreboard objectives added here are removed"):
        for objective in re.findall(r"scoreboard objectives add ([\w.]+)", code):
            case.assertRegex(ALL_SRC, r"scoreboard objectives remove %s\b" % re.escape(objective), "%s is never removed" % objective)


def check_references(case, code):
    with case.subTest("predicates exist"):
        patterns = [r"predicate=!?%s:([\w/]+)" % NS, r"(?:if|unless) predicate %s:([\w/]+)" % NS]
        for pattern in patterns:
            for pid in refs(code, pattern):
                case.assertTrue((pk.DATA / "predicate" / (pid + ".json")).exists(), "missing predicate " + pid)
    with case.subTest("item modifiers exist"):
        for pid in refs(code, r"item modify \w+ \S+(?: \S+)? %s:([\w/]+)" % NS):
            case.assertTrue((pk.DATA / "item_modifier" / (pid + ".json")).exists(), "missing item modifier " + pid)
    with case.subTest("loot tables exist"):
        for pid in refs(code, r"\bloot (?:give|spawn|insert|replace)\b.*?\bloot %s:([\w/]+)" % NS):
            case.assertTrue((pk.DATA / "loot_table" / (pid + ".json")).exists(), "missing loot table " + pid)
    with case.subTest("advancements exist"):
        for pid in refs(code, r"advancements=\{%s:([\w/]+)" % NS):
            case.assertTrue((pk.DATA / "advancement" / (pid + ".json")).exists(), "missing advancement " + pid)
        for pid in refs(code, r"advancement (?:grant|revoke) \S+ (?:only|from|through|until) %s:([\w/]+)" % NS):
            case.assertTrue((pk.DATA / "advancement" / (pid + ".json")).exists() or (pk.DATA / "advancement" / pid).is_dir(), "missing advancement " + pid)
    with case.subTest("tags exist"):
        for pid in refs(code, r"type=!?#%s:([\w/]+)" % NS):
            case.assertTrue((pk.DATA / "tags" / "entity_type" / (pid + ".json")).exists(), "missing entity type tag " + pid)
        for pid in refs(code, r"\bblock [~\d. ^-]+ #%s:([\w/]+)" % NS):
            case.assertTrue((pk.DATA / "tags" / "block" / (pid + ".json")).exists(), "missing block tag " + pid)
        for pid in refs(code, r"\bfunction #%s:([\w/]+)" % NS):
            case.assertTrue((pk.DATA / "tags" / "function" / (pid + ".json")).exists(), "missing function tag " + pid)
    with case.subTest("sound events exist"):
        for sid in refs(code, r"(?:playsound|stopsound @\w+ \w+) %s:([\w.]+)" % NS):
            case.assertIn(sid, SOUNDS, "sound event %s is not in sounds.json" % sid)
    with case.subTest("called functions exist"):
        if not BUILD:
            case.skipTest("no build output, run npx mcb build for this check")
        for pid in refs(code, r"\bfunction %s:([\w/]+)" % NS):
            case.assertTrue(pk.generated_function(pid).exists(), "no generated function " + pid)


def make_test(path):
    name = path.stem

    def test(self):
        text = pk.read_text(path)
        code = pk.strip_comments(text)
        check_hooks(self, name, text, code)
        check_references(self, code)
    return test


for _path in pk.src_item_files():
    setattr(SourceItemTests, "test_" + _path.stem, make_test(_path))


class SourceCoverage(unittest.TestCase):
    def test_every_function_tag_entry_resolves(self):
        if not BUILD:
            self.skipTest("no build output, run npx mcb build for this check")
        missing = []
        for tag, values in TAGS.items():
            for value in values:
                if not pk.generated_function(value.split(":", 1)[1]).exists():
                    missing.append("%s -> %s" % (tag, value))
        self.assertEqual(missing, [])


if __name__ == "__main__":
    unittest.main()
