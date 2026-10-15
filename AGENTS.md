# AGENTS.md

Instructions for automated agents working in this repo, such as the goosebot Ollama agent. Humans should read `README.md` and `CLAUDE.md`. This file repeats the rules that cause the most mistakes, in order of how often they bite.

## What this repo is

A Minecraft Java 26.3 datapack that adds custom dungeon loot items, plus a companion resource pack in `texturepack/`. Functions are written in mc-build 4.2.0 (`.mcb` and `.mcbt`) and compiled to `.mcfunction`. Everything else is hand-written JSON.

- Datapack format: 121, in `pack.mcmeta`.
- Resource pack format: 97.1, in `texturepack/pack.mcmeta`.
- Version: `26.3-alpha.1`, kept in `config.json` `mc.version`, `pack.mcmeta` `meta.version` and `texturepack/pack.mcmeta` `meta.version`. Change all three together.
- Default branch: `main`. Work branches look like `feat/<issue>_<slug>`.

## Never do these

1. Never edit `data/foxcraft_dungeon_loot/function/`, `data/minecraft/tags/function/load.json` or `tick.json`. They are generated and gitignored. Edit `src/` instead.
2. Never write a `custom_data` tag as a JSON object. Always write the SNBT string, for example `"tag": "{DungeonLootId:87,DungeonItem:1b}"`. A JSON object turns small ints into bytes and never matches.
3. Never reuse a `DungeonLootId`. IDs 1 to 138 are in use except 23 to 27 and 84. Take the next free number above 138 and say so in the PR.
4. Never add `custom_model_data` overrides to a vanilla item model. 26.3 ignores them. Use the `item_model` component and an item definition in `texturepack/assets/foxcraft_dungeon_loot/items/`.
5. Never use pre-1.20.5 keys: `CustomModelData`, `tag:{` on an item, `HideFlags`, `Count` as a byte, `set_nbt`, `conditions`, `functions`, `alternative`, `pack_format`. `python tests/tools/check_old_keys.py` flags most of them.
6. Never end an `if / else` chain in `.mcb` without a plain final `else run {`. mc-build 4.2.0 can run an outer `else` otherwise.
7. Never use `<%config.x%>` on a `} else execute ... run {` line. Write the literal value, for example `satyrn.fdl.internal`.
8. Never add an item hook without adding its entry to the matching function tag in `data/foxcraft_dungeon_loot/tags/function/`, and never remove one without removing the entry. An unlisted hook never runs.
9. Never add a scoreboard objective in an `on_load` without a removal in the matching `on_uninstall`. If you rename or change the type of an existing objective, bump `scoreboardsVersion` in `config.json` and add the removal to `update_scoreboards` in `src/foxcraft_dungeon_loot.mcb`.
10. Never commit generated output, `node_modules/`, `.build/` or gitignored audio under `texturepack/assets/foxcraft_dungeon_loot/sounds/records/wolfgun/` and `.../c418/`.
11. Never turn `mc.dev` to `true` in a commit meant for release. It forces maximum trade counts and shows tracker armor stands.
12. Never bypass hooks or commit signing. Do not use `--no-verify` or `--no-gpg-sign`.

## Layout

```
src/                         mc-build sources, the source of truth for functions
  foxcraft_dungeon_loot.mcb  load, tick, uninstall, update_scoreboards
  macros.mcbt                shared templates: break_item, rng
  foxcraft_dungeon_loot/
    events.mcb               turns stats and predicates into event tags
    math.mcb                 helpers: durability odds, ticks to text
    trades.mcb, trades.mcbt  Wandering Trader macros
    trades/                  index.mcb (hand-written trade index), wandering_trader.mcb
    copper_horn.mcbt         horn swap template
    items/<item>.mcb         one file per item
data/foxcraft_dungeon_loot/
  loot_table/item/<rarity>/    item loot tables, thin, one file per item
  loot_table/item/special/     disc/ and goat_horn/ loot tables
  loot_table/item/random_loot/ pickers, pools and groups for random drops
  loot_table/entity/           loot for entities, such as the Wandering Trader
  item_modifier/<rarity>/<item>/define.json   the real item definition, plus the item's other modifiers beside it
  item_modifier/special/<item>/               discs and copper horns
  item_modifier/random_loot/<group>/          modifiers for random loot: armor, book, coin, player_head, potion, tool
  predicate/item/<rarity>/<item>/  item predicates such as in_main_hand and worn
  predicate/item/              shared item predicates, durability and snowball checks
  predicate/event/             event gating, the process_* predicates
  predicate/entity/, world/    shared entity and world checks
  predicate/random_chance/     random chance predicates
  advancement/items/         use-detection advancements
  tags/function/             event bus, hand-maintained
  instrument/, jukebox_song/ copper horns and music discs
data/minecraft/loot_table/   vanilla overrides that inject loot
texturepack/                 resource pack, own pack.mcmeta and build.ps1
docs/                        notes, audits, todo lists
tests/                       run_all.py, unit tests, Java and Python checks
```

## How an item is built

1. A loot table in `loot_table/item/<rarity>/<item>.json` holds only pools and a root `"modifier": "foxcraft_dungeon_loot:<rarity>/<item>/define"`.
2. The modifier in `item_modifier/<rarity>/<item>/define.json` sets name, lore, `set_custom_data`, `set_components` with `minecraft:item_model`, enchantments and attributes.
3. Predicates under `predicate/item/<rarity>/<item>/` match on the `custom_data` `DungeonLootId`.
4. `src/foxcraft_dungeon_loot/items/<item>.mcb` holds hooks. A `function x` in `<item>.mcb` becomes `foxcraft_dungeon_loot:items/<item>/x`.
5. The hook name is listed in `tags/function/<event>.json`.
6. A model definition `texturepack/assets/foxcraft_dungeon_loot/items/<model>.json` points at `models/item/<model>.json`, which points at a texture.
7. Variants, like chainsaw tiers, pick a pool by the `satyrn.fdl.loot.variant` score and set their own `item_model`.

To add a disc, copy an existing one: a `jukebox_song`, a `sounds.json` event, a lang key, an item definition, a model, a texture, a loot table, a modifier, a give function in `items/music_discs.mcb`, and trade index entries in `trades/index.mcb`. The trade index numbers matter, they are used by position.

## Build and verify

Run from the repo root. Do all of this before claiming a change works.

1. `python tests/run_all.py`. It deletes the generated functions, runs `npx mcb build`, runs the unit tests, and runs the Java checks when the 26.3 client jar and Java 25 exist. The summary at the end says PASS, FAIL or SKIPPED for each step. If the jar is missing the Java checks are SKIPPED, say so in your report and do not claim they passed.
2. If a unit test fails because you changed an item on purpose, run `python tests/unit/gen_specs.py`, read the diff of `tests/unit/specs/items.json`, and keep only changes you meant to make.
3. A new item needs no new test file. Its loot table is found automatically, and its spec entry comes from `gen_specs.py`. A new item source file in `src/foxcraft_dungeon_loot/items/` is also found automatically.
4. For a new hook, the tests fail until its entry is in the function tag.

There is no CI. The tests are static, so you cannot test gameplay. State plainly which checks ran and which did not, and list what a human must test in game. `docs/todo_manual_verification.md` is the running checklist; add the new item to it.

## Style

- American English. ASCII only: `->`, `>=`, plain `-`, no em dashes, no emoji.
- Terse fragments over sentences in notes and lists. Sentence case in comments. Short fragments need no trailing period.
- Avoid parenthetical asides. Use a comma, colon or a second sentence.
- Commit messages: match `git log`, a gitmoji then an imperative summary, for example `👽️ Modernize copper goat horns`. Reference the issue as `Refs #<n>` in the body.
- Preserve each file's line endings. Most `.mcb` are LF, most JSON is CRLF. Do not reformat unrelated lines.
- JSON: two-space indent, no trailing commas.

## Working rules

- One logical change per commit. Do not mix a port fix with a feature.
- Do not push, open a pull request, merge, or change issue labels unless the task says to. Report what you did and stop.
- Read the issue and `CLAUDE.md` first. If the issue is unclear or two readings change the result, ask. Do not guess balance numbers, item names or lore.
- Do not delete files you did not create unless the task says so. Check the target before overwriting.
- Out of scope unless asked: Evoker's Tome fang geometry, replacing armor stands, new items or features beyond the issue.
- Deferred ideas live in issue #140 and `docs/todo_modernization_inventory.md`. Do not start them unprompted.

## Known traps

- `warped_fungus_on_a_stick` is the base of most interactive items. It carries default components, such as a durability bar. Setting a component never removes a default, remove with `!minecraft:<component>`.
- Use detection reads `minecraft.used:*` stats. A hook runs only if the player matches its `event/process_*` predicate.
- Item entities spawned for the trade index live in a force-loaded End chunk at 264, 64, 264.
- Scratch scores `#test` and `#math.*` are shared. Do not call a helper that uses them from inside another chain that also uses them.
- The uninstall function disables `file/<baseArchiveName>-<version>.zip`. A dev build or a duplicate name breaks that match.
- Audio for Wolfgun and C418 discs is not in the repo. Missing-sound warnings on a fresh clone are expected.
- The master `DungeonLootId` list is a Google Sheet linked in `README.md`. You cannot update it; mention new ids in your report.
- Effects granted by clocks (`effect give ... 1000000`) are cleared with `effect clear`, which also removes the same effect from other sources. Prefer attributes or enchantment effects when adding new passive bonuses.

## Reporting

End every task with:

- What changed, as file paths.
- Which checks ran and their result, and which did not run.
- What needs in-game testing.
- Any new `DungeonLootId`, objective, tag entry or lang key added, so a human can update the sheet and the checklist.

See `docs/architecture-audit.md` for the architecture and known weaknesses.
