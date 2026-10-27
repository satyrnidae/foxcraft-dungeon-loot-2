# Tests

Static checks for the datapack and resource pack. Nothing here launches Minecraft, so gameplay still needs the manual list in `docs/todo_manual_verification.md`.

## Run

```
npm test                               same as node tests/run_all.mjs
node tests/run_all.mjs                 build, unit tests, then the Java checks if a client jar is found
node tests/run_all.mjs --no-java       skip the Java checks
node tests/run_all.mjs --no-download   never fetch the client jar from Mojang
node tests/run_all.mjs --no-build      reuse the current generated functions
node tests/run_all.mjs --release       also run the release checks, such as mc.dev being false
node tests/run_all.mjs -k chainsaw     only unit tests whose name matches chainsaw
```

Needs Node 22 or newer with `npm ci` done. The Java checks also need Java 25, `JAVA25` (the java executable or the JDK folder) or else a Java 25 `JDK_HOME` or `JAVA_HOME`, in that order, either of which can go in a gitignored `.env` in the repo root as `KEY=value` lines, and the client jar for `mc.mc_version` in `config.json`. The jar is `MC_JAR` if set, else the launcher copy, else a download from Mojang into `tests/.cache/mc` checked against its sha1, so a fresh checkout needs no launcher. `--no-download` turns that off. On CI a skipped step counts as a failure. Each step is reported as PASS, FAIL or SKIPPED, and only FAIL makes the exit status 1.

Unit tests alone: `node --test tests/unit/*.test.mjs`.

## Layout

| Path | What it is |
|---|---|
| `run_all.mjs` | Runs the build, the unit tests and the Java checks, then prints a summary |
| `unit/` | `node:test` suite, no dependencies |
| `unit/packdata.mjs` | Loader for the pack's JSON, SNBT strings and sources, shared by the tests |
| `unit/items.test.mjs` | One generated test per item, 162 of them |
| `unit/source.test.mjs` | One generated test per file in `src/foxcraft_dungeon_loot/item/` |
| `unit/integrity.test.mjs` | Whole-pack checks: ids, references, resources, scoreboards, versions, old keys |
| `unit/specs/items.json` | Snapshot of the facts each item test pins down |
| `unit/gen_specs.mjs` | Regenerates the snapshot |
| `unit/checks.mjs` | Lets one test report several failed checks together |
| `java/` | `Harness`, `Scan`, `CmdCheck` and `PackLoad`, which run the game's own codecs, command parser and datapack loader, `BookRender`, which draws every generated book page, and `ArabicShapingTable`, which checks `scripts/books/arabic_shaping.json` against the game's Arabic shaper and rewrites it and fails when they differ |
| `tools/` | `check_old_keys.mjs`, `compare_mcfunction.mjs`, `fetch_mc_libs.mjs`, `fetch_mc_jar.mjs` |
| `verifying-against-vanilla.md` | How the Java checks work and what they found |
| `.cache/` | Downloaded libraries, compiled classes and the rendered book pages in `books/<locale>/[<group>/]<id>/page_NN.png`, gitignored |

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

- New item: add the loot table, modifier and source. The tests find them. Run `node tests/unit/gen_specs.mjs` and review the new spec entry.
- Changed item on purpose: regenerate the spec and read the diff.
- New check that applies to every item: add it to `items.test.mjs`. A check for one item belongs in a spec field.

## Book pages

`BookRender` writes every page of every generated book, in en_us and in each locale it has a source for in `src/books/<locale>/`, to `tests/.cache/books/<locale>/[<group>/]<id>/page_NN.png`, three pixels to a GUI pixel, on the vanilla book background. The pages are read with the game's component codec, translated from the resource pack lang files and broken into lines by the game's own `StringSplitter`, as the book screen does, so the line breaks are the game's. The drawing is its own, with no GPU: bitmap and space providers of the pack and the client jar, colors, bold, italic, underline, strikethrough and `shadow_color`, which the game draws on a book page too. Unifont is not in the client jar but in Mojang's asset index, so `run_all.mjs` and `tests/tools/fetch_mc_jar.mjs` download it to `tests/.cache/mc/<version>/unifont` and the unihex providers are drawn from there, half size and advancing half their width plus one, as the game does. A glyph no font has is the missing glyph box, and TrueType providers are skipped with a warning. A locale has the game's en_us entries under its own, as in game, and the client jar has only the vanilla en_us, so vanilla text such as the page counter stays English. A page the game breaks into more than 14 lines fails the step, since the book cuts its end off. A book with filtered pages is drawn a second time into `books/<locale>/<id>/filtered/`, every page as a reader with chat filtering sees it: the filtered side where a page has one, the raw side elsewhere, and the line check covers both. Run it alone with `java -cp <classes and classpath> BookRender <repo> <out> [scale]`.

## Known limits

- No gameplay. Trades, hooks firing, cooldowns, sounds playing and rendering are not exercised.
- The item tests do not run item modifier functions. They read what the modifiers declare, ignoring function conditions, so a variant item shows the union of its tiers.
- Gitignored Wolfgun and C418 audio is not required to exist. Its entries are listed, not failed.
