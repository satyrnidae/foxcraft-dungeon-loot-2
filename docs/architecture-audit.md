# Architecture audit

Snapshot of branch `feat/130_upgrade_datapack_from_1.19` after the 26.3 port, version `26.3-alpha.1`. Static review plus the repo's own tools. Nothing here was run in game, so every runtime claim is a prediction. Related: `todo_manual_verification.md` for the in-game checklist, `todo_modernization_inventory.md` for native-component replacements, issue #140 for deferred modernizations.

## 1. Scope and method

- Read `src/`, `data/`, `texturepack/`, build scripts, config and docs.
- Counted files, hooks, clocks, objectives and per-tick selectors with throwaway scripts against the generated functions.
- Checked invariants: unique `DungeonLootId`, every objective added has a removal, tag files match item hooks.
- Not covered: runtime behavior, real tick cost, client rendering, balance.

## 2. System overview

Three artifacts come from one repo:

| Artifact | Source of truth | Built by |
|---|---|---|
| Datapack, format 121 | `src/` for functions, hand-written JSON under `data/` for everything else | `npx mcb build`, then `build.ps1` zips it |
| Resource pack, format 97.1 | `texturepack/` | `texturepack/build.ps1` |
| Verification tools and tests | `tests/` | run by hand with JDK 25 and the 26.3 client jar |

Layers inside the datapack:

1. Core: `src/foxcraft_dungeon_loot.mcb` defines `load`, `tick`, `uninstall` and `update_scoreboards`. It owns three scoreboards and calls function tags.
2. Event bus: `events.mcb` turns stats and predicates into events, dispatched through function tags in `data/foxcraft_dungeon_loot/tags/function/`.
3. Items: 56 files in `src/foxcraft_dungeon_loot/items/`, each exporting hooks that the tags list by hand.
4. Content data: loot tables, item modifiers, predicates, advancements, instruments, jukebox songs.
5. Trades: a loot-built index in storage plus the Wandering Trader offer builder.
6. Vanilla overrides: six loot tables under `data/minecraft/loot_table/` that inject discs and loot.

Data flow for one item: a loot table rolls the base item and runs a modifier chain that writes `custom_data` with `DungeonLootId`, the `item_model`, name, lore, enchantments and attributes. Predicates match that id at runtime. Hooks run through tick, scheduled clocks, or the event tags.

## 3. Metrics

| Measure | Value |
|---|---|
| mc-build source files | 66 files, about 5,060 lines |
| Generated `.mcfunction` files | 1,154 |
| Loot tables | 268 in the pack, 6 vanilla overrides |
| Item modifiers | 290 |
| Predicates | 122 |
| Advancements | 17 |
| Instruments, jukebox songs | 30, 51 |
| Unique `DungeonLootId` | 132, range 1 to 138, gaps 23-27 and 84 |
| Function tag hooks | `on_load` 41, `on_tick` 21, `on_uninstall` 22, `on_warped_fungus_used` 20, `on_snowball_used` 5, `on_fall` 2, `on_spider_eye_eaten` 1, `on_block` 1 |
| Clock functions | 30, mostly `clock_10t` with 16, plus `4t` 5, `2s` 3, `10s` 2, `60s` 2, `3s` 1, `3t` 1 |
| `schedule function` sites | 65 |
| Scoreboard objectives added | 48 in source, each with a matching removal |
| Armor stand summon sites | 14 |
| Largest sources | `trades/index.mcb` 801 lines, `trades/wandering_trader.mcb` 407, `war_hogs_blighted_harvest.mcb` 209, `music_discs.mcb` 205 |

## 4. Strengths

- Decoupled core. `load`, `tick` and `uninstall` know no item. Adding an item is one file plus tag entries.
- Thin loot tables. Item definitions live in `item_modifier/` mirroring the loot table path, so there is one place to edit an item.
- Strict identity. `DungeonLootId` uniqueness holds across all modifier files, checked by script. SNBT string form is used everywhere so ints never turn into bytes.
- Lifecycle symmetry. Every objective added has a removal, and `scoreboardsVersion` plus `update_scoreboards` handle renames.
- Real verification tools, now under `tests/`. `Scan.java` parses data with the game's own codecs, `CmdCheck.java` parses generated commands with the game's dispatcher, `check_old_keys.py` flags removed keys, and a `unittest` suite generates one test per item and per item source file. These caught real bugs during the port.
- Event gating. Item events are only dispatched to players matching `process_*` predicates, which keeps idle cost low on slow CPUs.
- Reproducible build. Compiler pinned to mc-build 4.2.0, output paths deterministic.

## 5. Findings

Severity is about risk to a release, not effort. Each has a recommendation.

### High

**F1. Dev flag committed as true.** `config.json` has `mc.dev: true`. It forces maximum trader trade counts, makes tracker armor stands visible, and re-enables the loot variant trigger every tick. It also puts `+dev` in the zip name. A release built from a committed tree is a dev build.
Recommendation: commit `false`; flip to true locally, or let `build.ps1` take a `-Dev` switch that writes a temporary config.

**F2. Uninstall path depends on the zip file name.** `uninstall` runs `datapack disable "file/<baseArchiveName>-<version>.zip"`. `build.ps1` appends `+dev` for dev builds and ` (n)` when the file exists, so the name does not match. The function then prints the manual-command fallback, so it fails soft, but a normal install is mislabeled as broken.
Recommendation: build the name from one helper, or drop the automatic disable and always print the command.

### Medium

**F3. Per-tick work scales with players and entities.** `on_tick` has 21 hooks. A static count of top-level lines gives about 44 player-selector commands and 12 `@e[tag=...]` scans every tick, before nested calls. The `@e[tag=...]` scans in the projectile trackers (Hammer of Sol, Grasp of Uthiir, X No Evil, Hail of Arrows, Tor'Enhia's Fist, Evoker's Tome) have no `distance` and run all the time, not only while a projectile exists. This is the stated hot spot for the slow-CPU target.
Recommendation: gate every tracker scan behind a cheap flag (score or `execute if entity` on a single tagged entity), and move cooldown ticking to `use_cooldown` where a ready sound is not needed.

**F4. Potion-effect clocks are duplicated and unsafe.** 16 items run the same 10 tick clock: a `worn` or `in_*_hand` predicate, a `has_effects` predicate, a tag, `effect give ... 1000000`, and `effect clear` on unequip. Hazards:
- `effect clear @s <effect>` removes the same effect from beacons, potions and other items, not only this one.
- Items that share an effect type clear each other's when one is removed.
- A death, disconnect or modified inventory can leave effects or tags behind until the next clock.
Recommendation: replace with custom enchantment effects and attributes, see `todo_modernization_inventory.md` section 3.1. That removes about 16 clocks, 16 tags and about 32 predicates.

**F5. Cooldown pattern copied 11 times.** Each spell item has its own objective, per-tick increment for every player with a score, a ready sound and particle, and a time-to-text helper. Hazard: logic drift between items.
Recommendation: `use_cooldown` for gating, one shared helper where a ready sound must remain.

**F6. Durability helpers duplicated.** `should_damage_*` is called from 10 sites and `break_item` from 15 files, with 19 `set_damage` modifiers. Behavior was verified against vanilla Unbreaking, but it is a lot of code for what `change_item_damage` and native `damage` do.
Recommendation: replace as in the inventory doc, section 3.4 and section 5 step 5.

**F7. Shared scratch scores.** `#test`, `#math.result` and `#math.input*` are global. Nested chains can overwrite each other, as with the `#test` chains in `grasp_of_uthiir`, `ima_leaf` and `dice`.
Recommendation: `return` and `execute store` straight into the consumer, tracked in #140.

**F8. Wandering Trader index is hand-maintained.** `trades/index.mcb` is 801 lines. Indices 98 to 170 are repeated in four places, plus `REPEAT(0, 170)`, 73 hand-written disc blocks, and 51 give functions in `music_discs.mcb`. Adding a disc means editing all of them and keeping the order.
Recommendation: generate the disc section from one id list with mc-build `REPEAT` or a script, and compute the range from it.

**F9. Warped fungus on a stick is the base for 20 interactive items.** All share one use stat, an offhand-precedence predicate, and a durability bar from the base item. Offhand use is disabled by a TODO. The base item's default components need removing per item.
Recommendation: keep for interactive items, move non-interactive ones to `poisonous_potato` per `phase9-item-list.md`, and use `consumable` / `use_cooldown` where they fit.

### Low

**F10. Stale documentation.** `README.md` says "Customized Dungeon Loot for Minecraft 1.19" and describes `DungeonLootId` as a custom NBT entry. `.gitignore` still lists the deleted `texturepack/assets/custom_music_discs` and `music_disc_11.json`.
Recommendation: update both.

**F11. Tests exist but no CI runs them.** `tests/run_all.py` builds the pack and runs the unit suite and, with the client jar, the Java checks. Nothing runs it on push. The unit suite needs only Python and Node, so it can run in CI as is; the Java checks need the 26.3 client jar, which is not redistributable.
Recommendation: a workflow that runs `npm ci` and `python tests/run_all.py --no-java`, plus the release checks with `--release` on a tag.

**F12. Mixed line endings.** 63 of 66 source files are LF and 3 are CRLF, JSON is mostly CRLF, and there is no `.gitattributes`. Edits from different tools produce noisy diffs.
Recommendation: add `.gitattributes` with an explicit rule per extension.

**F13. Missing audio on a fresh clone.** Wolfgun and C418 audio is gitignored. A clone has `sounds.json` entries for files that do not exist, so the client logs missing sound errors. This is documented in `README.md` but not in the build.
Recommendation: have `build.ps1` warn when the files are missing.

**F14. Registry outside the repo.** The master list of `DungeonLootId` values lives in a Google Sheet. The repo can verify uniqueness but not that the sheet is current.
Recommendation: export the list to `docs/` as a CSV and check it in the same script.

**F15. Copper goat horn costs per tick.** `copper_goat_horn/on_tick` checks main and off hand for every player every tick and repeats the song list in two swap functions.
Recommendation: a `process_*` predicate gate and a generated swap list.

## 6. Risks that need in-game verification

These cannot be settled by reading code. `todo_manual_verification.md` carries the checklist.

- Pre-filled `Offers` suppressing the Wandering Trader's vanilla trades.
- `execute store` silencing `/random` output in functions.
- `set_enchantments` with -255 removing Vanishing and Binding.
- Chest and creeper loot overrides producing the intended odds.
- The `leash` key and trader state on the armor stand.
- Dog's comparator value and every `jukebox_playable` resolving.

## 7. Tooling hazards

- mc-build 4.2.0 can run an outer `else` when a called chain has no final `else`. Every chain ends in a plain `else run {`. Five chains were only checked statically: `dice`, `evokers_tome`, `totem_of_deilona`, `war_hogs_blighted_harvest`, `trades/wandering_trader/on_tick`.
- `<%config.x%>` is not evaluated on a `} else execute ... run {` line.
- A top-level template call that declares functions is not allowed, so give functions are written out.
- mc-build does not clean stale output, so delete the generated function folders before a rebuild after a rename.
- Generated functions are gitignored, so a build is required before the pack loads.

## 8. Recommended order

1. F1 and F2: make a release build correct.
2. F10 and F12: docs and line endings, cheap and removes noise.
3. F3 tracker gating, then the clock and cooldown replacements from the inventory doc, since they remove the most per-tick work.
4. F8 generation of the disc section.
5. F11 CI once the above is stable.
6. Phase 9 base item migration after the in-game pass.
