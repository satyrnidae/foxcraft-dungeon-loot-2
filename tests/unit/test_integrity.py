"""Whole-pack checks that no single item owns: identity, references, resources, scoreboards, versions, old keys."""
import json
import re
import subprocess
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import packdata as pk  # noqa: E402

NS = pk.NS
ITEMS = pk.item_tables()
SOUNDS = pk.read_sounds()


def all_json(root):
    return sorted(Path(root).rglob("*.json"))


def walk_strings(node):
    if isinstance(node, str):
        yield node
    elif isinstance(node, dict):
        for value in node.values():
            yield from walk_strings(value)
    elif isinstance(node, list):
        for value in node:
            yield from walk_strings(value)


class Identity(unittest.TestCase):
    def test_loot_ids_are_unique_across_items(self):
        owners = {}
        for name, path in ITEMS.items():
            for loot_id in pk.build_item(name, path).loot_ids:
                owners.setdefault(loot_id, []).append(name)
        clashes = {i: n for i, n in owners.items() if len(n) > 1}
        self.assertEqual(clashes, {}, "the same DungeonLootId on more than one item")

    def test_loot_ids_are_positive_and_not_retired(self):
        retired = set(range(23, 28)) | {84}
        used = set()
        for name, path in ITEMS.items():
            used |= pk.build_item(name, path).loot_ids
        self.assertTrue(all(i > 0 for i in used))
        self.assertEqual(sorted(used & retired), [], "a retired DungeonLootId was reused")


class References(unittest.TestCase):
    def test_every_loot_table_reference_resolves(self):
        missing = []
        for path in all_json(pk.DATA / "loot_table"):
            for node in _dicts(pk.load_json(path)):
                if node.get("type", "").replace("minecraft:", "") == "loot_table" and isinstance(node.get("value"), str):
                    target = pk.loot_table_path(node["value"])
                    if target is not None and not target.exists():
                        missing.append("%s -> %s" % (pk.rel(path), node["value"]))
        self.assertEqual(missing, [])

    def test_every_modifier_reference_resolves(self):
        missing = []
        for path in all_json(pk.DATA / "loot_table"):
            for node in _dicts(pk.load_json(path)):
                for mid in pk._as_list(node.get("modifier")):
                    if isinstance(mid, str):
                        target = pk.modifier_path(mid)
                        if target is not None and not target.exists():
                            missing.append("%s -> %s" % (pk.rel(path), mid))
        self.assertEqual(missing, [])

    def test_every_loot_table_has_valid_modifier_snbt(self):
        bad = []
        for path in all_json(pk.DATA / "item_modifier"):
            for fn in pk.function_list(pk.load_json(path)):
                if pk.bare_type(fn) != "set_custom_data":
                    continue
                tag = fn.get("tag")
                try:
                    if not isinstance(tag, str):
                        raise pk.SnbtError("not an SNBT string")
                    pk.parse_snbt(tag)
                except pk.SnbtError as exc:
                    bad.append("%s: %s" % (pk.rel(path), exc))
        self.assertEqual(bad, [])

    def test_every_pack_item_model_has_a_definition(self):
        problems = []
        pattern = re.compile(r"^%s:[a-z0-9_/]+$" % NS)
        for root in (pk.DATA, ):
            for path in all_json(root):
                data = pk.load_json(path)
                for node in _dicts(data):
                    model = node.get("minecraft:item_model")
                    if isinstance(model, str) and pattern.match(model):
                        for issue in pk.resource_problems(model):
                            problems.append("%s: %s" % (pk.rel(path), issue))
        self.assertEqual(sorted(set(problems)), [])

    def test_every_advancement_parent_exists(self):
        missing = []
        for path in all_json(pk.DATA / "advancement"):
            parent = pk.load_json(path).get("parent")
            if parent and parent.startswith(NS + ":") and not (pk.DATA / "advancement" / (parent.split(":", 1)[1] + ".json")).exists():
                missing.append("%s -> %s" % (pk.rel(path), parent))
        self.assertEqual(missing, [])

    def test_every_advancement_function_exists(self):
        if not pk.build_exists():
            self.skipTest("no build output, run npx mcb build for this check")
        missing = []
        for path in all_json(pk.DATA / "advancement"):
            reward = pk.load_json(path).get("rewards", {}).get("function")
            if reward and not pk.generated_function(reward.split(":", 1)[1]).exists():
                missing.append("%s -> %s" % (pk.rel(path), reward))
        self.assertEqual(missing, [])


class ResourcePack(unittest.TestCase):
    def test_every_item_definition_resolves(self):
        problems = []
        for path in all_json(pk.TP / "items"):
            model = "%s:%s" % (NS, path.relative_to(pk.TP / "items").as_posix()[:-5])
            problems += pk.resource_problems(model)
        self.assertEqual(problems, [])

    def test_every_sound_event_has_its_audio(self):
        missing = []
        ignored = []
        for event, sound in pk.sound_files(SOUNDS):
            target = pk.TP / "sounds" / (sound + ".ogg")
            if target.exists():
                continue
            (ignored if sound.startswith(pk.GITIGNORED_AUDIO) else missing).append("%s -> %s" % (event, sound))
        self.assertEqual(missing, [])
        if ignored:
            print("\nnote: %d sound entries point at gitignored audio that is not in this checkout" % len(ignored))

    def test_every_jukebox_song_has_an_item(self):
        songs = {p.stem for p in (pk.DATA / "jukebox_song").glob("*.json")}
        discs = {n.rsplit("/", 1)[-1] for n in ITEMS if n.startswith("item/special/disc/")}
        self.assertEqual(sorted(songs ^ discs), [])

    def test_every_instrument_has_a_swap_modifier(self):
        names = {p.stem for p in (pk.DATA / "instrument").glob("*.json")}
        swaps = {"%s_%s" % (p.parent.name, p.stem) for p in (pk.DATA / "item_modifier" / "special").glob("*/*.json") if p.stem in ("bass", "harmony", "melody")}
        self.assertEqual(sorted(names ^ swaps), [])

    def test_lang_has_every_song_title(self):
        lang_path = pk.TP_MC / "lang" / "en_us.json"
        lang = pk.load_json(lang_path)
        missing = []
        for path in (pk.DATA / "jukebox_song").glob("*.json"):
            key = pk.load_json(path)["description"]["translate"]
            if key not in lang:
                missing.append(key)
        self.assertEqual(missing, [])


class Scoreboards(unittest.TestCase):
    SRC = "\n".join(pk.strip_comments(pk.read_text(p)) for p in sorted(pk.SRC.rglob("*.mcb*")))

    def test_every_objective_added_is_removed(self):
        added = set(re.findall(r"scoreboard objectives add ([\w.]+)", self.SRC))
        removed = set(re.findall(r"scoreboard objectives remove ([\w.]+)", self.SRC))
        self.assertEqual(sorted(added - removed), [])

    def test_objectives_removed_only_in_update_are_not_added_again(self):
        update = pk.read_text(pk.SRC / "foxcraft_dungeon_loot.mcb")
        block = update[update.index("function update_scoreboards"):]
        legacy = set(re.findall(r"scoreboard objectives remove ([\w.]+)", block))
        added = set(re.findall(r"scoreboard objectives add ([\w.]+)", self.SRC))
        # The loot variant trigger is removed and re-added on purpose when versions change.
        self.assertEqual(sorted((legacy & added) - {"satyrn.fdl.loot.variant"}), [])


class Versions(unittest.TestCase):
    def test_versions_agree(self):
        config = pk.load_json(pk.ROOT / "config.json")["mc"]
        data = pk.load_json(pk.ROOT / "pack.mcmeta")["meta"]
        resource = pk.load_json(pk.ROOT / "texturepack" / "pack.mcmeta")["meta"]
        self.assertEqual(config["version"], data["version"])
        self.assertEqual(config["version"], resource["version"])

    def test_changelog_has_the_current_version(self):
        version = pk.load_json(pk.ROOT / "config.json")["mc"]["version"]
        for rel_path in ("pack.mcmeta", "texturepack/pack.mcmeta"):
            log = pk.load_json(pk.ROOT / rel_path)["meta"]["changelog"]
            self.assertIn(version, log, rel_path)
            self.assertTrue(log[version], rel_path + " changelog entry is empty")

    def test_pack_formats(self):
        data = pk.load_json(pk.ROOT / "pack.mcmeta")["pack"]
        resource = pk.load_json(pk.ROOT / "texturepack" / "pack.mcmeta")["pack"]
        self.assertEqual((data["min_format"], data["max_format"]), (121, 121))
        self.assertEqual((resource["min_format"], resource["max_format"]), ([97, 1], [97, 1]))

    def test_scoreboards_version_is_an_int(self):
        self.assertIsInstance(pk.load_json(pk.ROOT / "config.json")["mc"]["scoreboardsVersion"], int)


class OldKeys(unittest.TestCase):
    def test_no_pre_26_3_keys(self):
        result = subprocess.run([sys.executable, str(pk.ROOT / "tests" / "tools" / "check_old_keys.py"), str(pk.ROOT / "data")],
                                capture_output=True, text=True)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)


def _dicts(node):
    if isinstance(node, dict):
        yield node
        for value in node.values():
            yield from _dicts(value)
    elif isinstance(node, list):
        for value in node:
            yield from _dicts(value)


class ReleaseReadiness(unittest.TestCase):
    """Only runs with FDL_RELEASE=1. These are fine in development and wrong in a release."""

    def setUp(self):
        import os
        if os.environ.get("FDL_RELEASE") != "1":
            self.skipTest("set FDL_RELEASE=1 to run release checks")

    def test_dev_flag_is_off(self):
        self.assertFalse(pk.load_json(pk.ROOT / "config.json")["mc"]["dev"], "mc.dev is true, a release would be a dev build")

    def test_version_has_no_dev_suffix(self):
        self.assertNotIn("+dev", pk.load_json(pk.ROOT / "config.json")["mc"]["version"])


if __name__ == "__main__":
    unittest.main()
