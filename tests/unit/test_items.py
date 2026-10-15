"""One generated test per item.

Items are discovered from loot_table/item/**, except item/random_loot. Discs and copper horns are under item/special/. Each test builds the item from its loot table
and modifiers, then checks it against its entry in specs/items.json and against rules every item must follow. If a test
fails because you changed an item on purpose, run `python tests/unit/gen_specs.py` and review the spec diff.

Test names read test_<folder>__<rarity or group>__<item>, so `python -m unittest -k chainsaw` runs one item.
"""
import json
import re
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import packdata as pk  # noqa: E402

SPEC_PATH = Path(__file__).resolve().parent / "specs" / "items.json"
SPECS = pk.load_json(SPEC_PATH) if SPEC_PATH.exists() else {}
ITEMS = pk.item_tables()
SOUNDS = pk.read_sounds()
LANG = pk.load_json(pk.TP_MC / "lang" / "en_us.json") if (pk.TP_MC / "lang" / "en_us.json").exists() else {}


def basename(name):
    return name.rsplit("/", 1)[-1]


def sound_problems(event):
    """Problems with a sound event id from this namespace, such as one missing from sounds.json or its audio file."""
    problems = []
    body = SOUNDS.get(event)
    if body is None:
        return ["sound event %s is not in sounds.json" % event]
    for sound_event, path in pk.sound_files({event: body}):
        if path.startswith(pk.GITIGNORED_AUDIO):
            continue
        if not (pk.TP / "sounds" / (path + ".ogg")).exists():
            problems.append("missing audio %s" % pk.rel(pk.TP / "sounds" / (path + ".ogg")))
    return problems


def predicate_patterns(node):
    """Every custom_data SNBT string a predicate asks for."""
    out = []
    if isinstance(node, dict):
        for key, value in node.items():
            if key == "minecraft:custom_data" and isinstance(value, str):
                out.append(value)
            else:
                out.extend(predicate_patterns(value))
    elif isinstance(node, list):
        for value in node:
            out.extend(predicate_patterns(value))
    return out


class ItemTests(unittest.TestCase):
    maxDiff = None


def check_spec_present(case, name):
    case.assertIn(name, SPECS, "no spec for %s, run python tests/unit/gen_specs.py" % name)
    return SPECS[name]


def check_identity(case, item, spec):
    with case.subTest("loot table and modifiers resolve"):
        case.assertEqual(item.errors, [])
    with case.subTest("loot ids match spec"):
        case.assertEqual(sorted(item.loot_ids), spec["loot_ids"])
    with case.subTest("DungeonLootId is an int"):
        for tag in item.custom_data_all:
            if "DungeonLootId" in tag:
                case.assertEqual(tag["DungeonLootId"][0], "int", "a byte or other type never matches the predicates")
    with case.subTest("DungeonItem flag matches spec"):
        flagged = item.custom_data.get("DungeonItem") == ("byte", 1)
        case.assertEqual(flagged, spec["dungeon_item"])
    with case.subTest("rarity matches spec"):
        rarity = item.custom_data.get("Rarity")
        case.assertEqual(rarity if isinstance(rarity, str) else None, spec["rarity"])
    with case.subTest("rarity matches the folder"):
        folder = item.name.split("/")[1] if item.name.startswith("item/") else None
        rarity = item.custom_data.get("Rarity")
        if isinstance(rarity, str) and folder in ("common", "uncommon", "rare", "epic", "mythic"):
            case.assertEqual(rarity.lower(), folder)


def expected_define_id(name):
    """Where an item's define.json lives: <rarity>/<item>, special/<item> for discs and horns."""
    parts = name.split("/")
    if len(parts) == 4 and parts[1] == "special":
        return "%s:special/%s/define" % (pk.NS, parts[3])
    if len(parts) == 3:
        return "%s:%s/%s/define" % (pk.NS, parts[1], parts[2])
    return None


def check_layout(case, item):
    expected = expected_define_id(item.name)
    with case.subTest("define.json is where the layout says"):
        if expected is None or not item.modifier_ids:
            return
        case.assertIn(expected, item.modifier_ids)
        path = pk.modifier_path(expected)
        case.assertTrue(path.exists(), "missing " + pk.rel(path))


def check_content(case, item, spec):
    with case.subTest("base items match spec"):
        case.assertEqual(sorted(item.base_items), spec["base_items"])
        case.assertTrue(item.base_items, "loot table produces no item")
    with case.subTest("modifier is not silently empty"):
        case.assertEqual(item.has_name, spec["named"])
        pack_item = bool(spec["loot_ids"] or spec["dungeon_item"])
        if pack_item and not item.name.startswith("item/special/disc/"):
            case.assertTrue(item.has_name, "no set_name, the item would spawn unnamed")
        case.assertTrue(item.function_types, "no item functions were found")
    with case.subTest("modifier function types match spec"):
        case.assertEqual(sorted(set(item.function_types)), spec.get("function_types", sorted(set(item.function_types))))
    with case.subTest("item models match spec"):
        case.assertEqual(sorted(item.item_models), spec["item_models"])
    with case.subTest("item models have a definition, model and texture"):
        for model in sorted(item.item_models):
            case.assertEqual(pk.resource_problems(model), [], model)


def check_source(case, item, spec):
    base = basename(item.name)
    src = pk.SRC_ITEMS / (base + ".mcb")
    with case.subTest("source file matches spec"):
        case.assertEqual(base if src.exists() else None, spec["src"])
    with case.subTest("hooks match spec"):
        hooks = sorted(pk.top_level_functions(pk.read_text(src))) if src.exists() else []
        case.assertEqual(hooks, spec["hooks"])
    pred_dir = pk.predicate_dir(item.name)
    with case.subTest("predicates match spec"):
        found = sorted(p.stem for p in pred_dir.glob("*.json")) if pred_dir and pred_dir.is_dir() else []
        case.assertEqual(found, spec["predicates"])
    with case.subTest("predicates ask for this item's custom_data"):
        if pred_dir and pred_dir.is_dir():
            for path in sorted(pred_dir.glob("*.json")):
                for text in predicate_patterns(pk.load_json(path)):
                    pattern = pk.parse_snbt(text)
                    ok = any(pk.snbt_matches(pattern, tag) for tag in item.custom_data_all)
                    case.assertTrue(ok, "%s wants %s, which no tier of %s sets" % (pk.rel(path), text, item.name))


def check_disc(case, item):
    if not item.name.startswith("item/special/disc/"):
        return
    song_id = item.components.get("minecraft:jukebox_playable")
    with case.subTest("disc has a jukebox_playable that resolves"):
        case.assertIsInstance(song_id, str, "no jukebox_playable component")
        ns, _, path = song_id.partition(":")
        case.assertEqual(ns, pk.NS)
        song_file = pk.DATA / "jukebox_song" / (path + ".json")
        case.assertTrue(song_file.exists(), "missing %s" % pk.rel(song_file))
        song = pk.load_json(song_file)
        with case.subTest("song fields"):
            case.assertGreater(song["length_in_seconds"], 0)
            case.assertTrue(0 <= song["comparator_output"] <= 15)
            case.assertTrue(song["description"]["translate"] in LANG, "no lang entry for " + song["description"]["translate"])
        with case.subTest("song sound resolves"):
            sound_id = song["sound_event"]["sound_id"]
            case.assertTrue(sound_id.startswith(pk.NS + ":"))
            case.assertEqual(sound_problems(sound_id.split(":", 1)[1]), [])


def check_horn(case, item):
    if not item.name.startswith("item/special/goat_horn/"):
        return
    song = item.custom_data.get("CustomInstrument")
    if song is None:
        return  # the random horn picks one of the others
    with case.subTest("CustomInstrument is the file name"):
        case.assertEqual(song, basename(item.name))
    with case.subTest("copper horn flag is a byte"):
        case.assertEqual(item.custom_data.get("CopperGoatHorn"), ("byte", 1))
    for part in ("bass", "harmony", "melody"):
        with case.subTest("%s part" % part):
            inst = pk.DATA / "instrument" / ("%s_%s.json" % (song, part))
            case.assertTrue(inst.exists(), "missing " + pk.rel(inst))
            case.assertTrue((pk.DATA / "item_modifier" / "special" / song / (part + ".json")).exists(), "missing swap modifier")
            body = pk.load_json(inst)
            case.assertEqual(body["use_duration"], 4.0)
            case.assertEqual(body["range"], 256.0)
            sound_id = body["sound_event"]["sound_id"]
            case.assertEqual(sound_problems(sound_id.split(":", 1)[1]), [])
    with case.subTest("default instrument resolves"):
        default = item.components.get("minecraft:instrument")
        case.assertIsInstance(default, str)
        case.assertTrue((pk.DATA / "instrument" / (default.split(":", 1)[1] + ".json")).exists())


def make_test(name, path):
    def test(self):
        spec = check_spec_present(self, name)
        item = pk.build_item(name, path)
        check_identity(self, item, spec)
        check_layout(self, item)
        check_content(self, item, spec)
        check_source(self, item, spec)
        check_disc(self, item)
        check_horn(self, item)
    return test


for _name, _path in ITEMS.items():
    setattr(ItemTests, "test_" + re.sub(r"[^A-Za-z0-9_]", "_", _name.replace("/", "__")), make_test(_name, _path))


class SpecCoverage(unittest.TestCase):
    def test_every_spec_still_has_an_item(self):
        stale = sorted(set(SPECS) - set(ITEMS))
        self.assertEqual(stale, [], "specs for items that no longer exist, regenerate with gen_specs.py")

    def test_every_item_has_a_spec(self):
        missing = sorted(set(ITEMS) - set(SPECS))
        self.assertEqual(missing, [], "items without a spec, regenerate with gen_specs.py")


if __name__ == "__main__":
    unittest.main()
