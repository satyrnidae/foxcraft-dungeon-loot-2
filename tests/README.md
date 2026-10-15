# Tests

Static checks for the datapack and resource pack. Nothing here launches Minecraft, so gameplay still needs the manual list in `docs/todo_manual_verification.md`.

## Run

```
python tests/run_all.py                build, unit tests, then the Java checks if a client jar is found
python tests/run_all.py --no-java      skip the Java checks
python tests/run_all.py --no-build     reuse the current generated functions
python tests/run_all.py --release      also run the release checks, such as mc.dev being false
python tests/run_all.py -k chainsaw    only unit tests whose name contains chainsaw
```

Needs Python 3.11 and Node with `npm ci` done. The Java checks also need Java 25 and the 26.3 client jar, see `run_all.py` for how it finds them. Each step is reported as PASS, FAIL or SKIPPED, and only FAIL makes the exit status 1.

Unit tests alone: `python -m unittest discover -s tests/unit -t tests/unit`.

## Layout

| Path | What it is |
|---|---|
| `run_all.py` | Runs the build, the unit tests and the Java checks, then prints a summary |
| `unit/` | Standard-library `unittest` suite, no dependencies |
| `unit/packdata.py` | Loader for the pack's JSON, SNBT strings and sources, shared by the tests |
| `unit/test_items.py` | One generated test per item, 162 of them |
| `unit/test_source.py` | One generated test per file in `src/foxcraft_dungeon_loot/item/` |
| `unit/test_integrity.py` | Whole-pack checks: ids, references, resources, scoreboards, versions, old keys |
| `unit/specs/items.json` | Snapshot of the facts each item test pins down |
| `unit/gen_specs.py` | Regenerates the snapshot |
| `java/` | `Harness`, `Scan` and `CmdCheck`, which run the game's own codecs and command parser |
| `tools/` | `check_old_keys.py`, `compare_mcfunction.py`, `fetch_mc_libs.py` |
| `verifying-against-vanilla.md` | How the Java checks work and what they found |
| `.cache/` | Downloaded libraries and compiled classes, gitignored |

## What the item tests check

For every loot table under `loot_table/item/` except `item/random_loot/`, which includes the discs and horns under `item/special/`:

- The loot table, its modifiers and any loot tables it references exist, and every `set_custom_data` tag is valid SNBT.
- The item matches its entry in `specs/items.json`: `DungeonLootId`, `DungeonItem` flag, rarity, base items, modifier function types, `item_model` values, source hooks and predicates.
- `DungeonLootId` is an int. A byte never matches the predicates.
- Rarity matches the folder, and an item is not left unnamed.
- Every `item_model` has an item definition, a model and a texture.
- Every predicate that names a `DungeonLootId` matches the custom data the item sets, with SNBT type rules.
- Discs: the `jukebox_playable` song exists, its sound event and audio exist, the lang title exists, the comparator output is 0 to 15.
- Copper horns: all three parts of the song exist as instruments with a swap modifier, with use duration 4.0 and range 256.0.

For every file under `src/foxcraft_dungeon_loot/item/`:

- Each hook that has a function tag is listed in it, and each tag entry for the item has a function.
- Each `clock_*` function is started from somewhere other than itself.
- Objectives it adds are removed somewhere.
- Predicates, item modifiers, loot tables, advancements, tags, sound events and functions named in its commands exist.

The snapshot pins current state, not correctness. Reviewing a diff of `specs/items.json` is part of reviewing a change.

## Adding things

- New item: add the loot table, modifier and source. The tests find them. Run `python tests/unit/gen_specs.py` and review the new spec entry.
- Changed item on purpose: regenerate the spec and read the diff.
- New check that applies to every item: add it to `test_items.py`. A check for one item belongs in a spec field.

## Known limits

- No gameplay. Trades, hooks firing, cooldowns, sounds playing and rendering are not exercised.
- The item tests do not run item modifier functions. They read what the modifiers declare, ignoring function conditions, so a variant item shows the union of its tiers.
- Gitignored Wolfgun and C418 audio is not required to exist. Its entries are listed, not failed.
