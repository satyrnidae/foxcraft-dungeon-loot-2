# Verifying behavior against Minecraft's own code

How to check what Minecraft 26.3 actually does, instead of relying on the wiki or on what loads without an error. It was used for
the 1.19 to 26.3 port research (issue #130) and is meant as the starting point for repeatable unit tests.

`python tests/run_all.py` runs these checks together with the unit suite, see `tests/README.md`. The rest of this file explains how each Java check works.

Nothing here launches the game, needs a Mojang account, accepts the EULA or starts a server. It runs the game's own classes from the
client jar in a short-lived Java process, and reads vanilla's own data.

## 1. Why this exists

The wiki was wrong or silent on several points that matter for this pack. Checking the game's code found:

| Topic | What the wiki implied | What 26.3 does |
|---|---|---|
| Default components | New components replace an item's defaults | Defaults stay until removed with `!component`; only the same component type is overridden |
| Trade costs (`wants.components`) | "exact or partial?" unknown | Exact value per *listed* component; unlisted components on the stack are ignored |
| Trade cost count | Clamped to the item's `max_stack_size` component | Clamped to the item type's **default** max stack size |
| `given_item_modifier` | Does not accept ids | Accepts ids, lists of ids and inline objects |
| Pre-26.3 loot keys (`functions`, `conditions`, `function`, `condition`) | "Renamed" | Parse **without error** and are silently dropped, so items spawn bare |
| JSON numbers in `custom_data` | Same as SNBT | A JSON `1` becomes a byte (`1b`); an SNBT string `"{a:1}"` is an int, and the two do not match |

A parse that returns OK does not mean the data was applied. Re-encode what the game kept and compare.

## 2. What you need

- Java 25 (26.3 requires it) with `javac`.
- The client jar for the version under test, for example `.minecraft/versions/26.3/26.3.jar`, and its version JSON next to it.
- Python 3 (library download and output comparison scripts).
- Optional, for the mc-build comparison in section 7: Node.js and `npm`.

Use a scratch directory for everything generated (extracted assets, libraries, compiled classes); none of it belongs in the repository.

## 3. Setup

Set a few variables (paths are examples; adjust them):

```bash
MC_DIR=~/.minecraft                         # launcher folder containing versions/
VER=26.3
JAR="$MC_DIR/versions/$VER/$VER.jar"
WORK=/tmp/fdl-verify                        # scratch directory
mkdir -p "$WORK"
```

1. **Download the libraries the jar needs** and capture the classpath (the launcher's `libraries/` folder is often not readable, and a
   script should not depend on a launcher install):
   ```bash
   CP=$(python3 tests/tools/fetch_mc_libs.py --version-json "$MC_DIR/versions/$VER/$VER.json" --out "$WORK/libs")
   ```
2. **Extract vanilla's own data and assets for reference** (read-only; this is how the 26.3 folder names, trade sets and shaders were checked):
   ```bash
   mkdir -p "$WORK/vanilla" && cd "$WORK/vanilla"
   python3 - "$JAR" <<'EOF'
   import sys, zipfile
   z = zipfile.ZipFile(sys.argv[1])
   z.extractall('.', [n for n in z.namelist() if n.startswith(('assets/', 'data/')) or n in ('pack.mcmeta', 'version.json')])
   EOF
   ```
   `version.json` in the jar states the pack formats (26.3: data 121.0, resource 97.1).
3. **Dump every item's default components** with vanilla's own data generator:
   ```bash
   java -cp "$JAR:$CP" net.minecraft.data.Main --reports --output "$WORK/gen"
   ```
   Output is `reports/minecraft/components/item/<item>.json` for each item (1,658 in 26.3) plus block, command, registry and packet reports.
   This is the authoritative answer to "what must this item remove or override". `commands.json` is the command syntax tree.
4. **Compile and run the harness** (section 4):
   ```bash
   javac -cp "$JAR:$CP" -d "$WORK/classes" tests/java/Harness.java
   java  -cp "$WORK/classes:$JAR:$CP" Harness        # prints PASS/FAIL lines, exit code 1 on any FAIL
   ```

## 4. The harness

`tests/java/Harness.java` boots the game's registries the way the data generator does, binds every item's default components, and then
calls the game's own codecs on JSON strings. The five checks it ships with are regression tests for the table in section 1. Full source:

```java
import com.google.gson.*;
import com.mojang.serialization.*;
import net.minecraft.SharedConstants;
import net.minecraft.core.*;
import net.minecraft.core.component.DataComponents;
import net.minecraft.core.registries.*;
import net.minecraft.data.registries.VanillaRegistries;
import net.minecraft.resources.*;
import net.minecraft.server.Bootstrap;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.item.trading.ItemCost;
import net.minecraft.world.level.storage.loot.LootPool;
import net.minecraft.world.level.storage.loot.functions.LootItemFunction;
import net.minecraft.world.level.storage.loot.functions.LootItemFunctions;

/** Minimal harness that runs Minecraft's own parsers on test JSON. See tests/verifying-against-vanilla.md. */
public class Harness {
    static HolderLookup.Provider lookup;
    static RegistryOps<JsonElement> ops;

    /** Boot the game registries and bind every item's default components (as the data generator does). */
    static void boot() {
        SharedConstants.tryDetectVersion();
        Bootstrap.bootStrap();
        lookup = VanillaRegistries.createReloadableLookup(VanillaRegistries.createWorldLookup());
        BuiltInRegistries.DATA_COMPONENT_INITIALIZERS.build(lookup).forEach(pc -> pc.apply());
        ops = lookup.createSerializationContext(JsonOps.INSTANCE);
    }

    static JsonElement json(String s) { return JsonParser.parseString(s); }

    static ItemStack stack(String s) { return ItemStack.CODEC.parse(ops, json(s)).getOrThrow(); }

    /** Add item modifiers to the lookup so loot JSON can reference them by id. */
    static RegistryOps<JsonElement> opsWithModifier(String id, String inlineModifierJson) {
        LootItemFunction fn = LootItemFunctions.DIRECT_CODEC.parse(ops, json(inlineModifierJson)).getOrThrow();
        ResourceKey<LootItemFunction> key = ResourceKey.create(Registries.ITEM_MODIFIER, Identifier.parse(id));
        HolderLookup.Provider with = new RegistrySetBuilder()
            .add(Registries.ITEM_MODIFIER, ctx -> ctx.register(key, fn)).build(lookup);
        return with.createSerializationContext(JsonOps.INSTANCE);
    }

    static int failures = 0;

    /**
     * The game replaces System.out with a logger that prefixes every line, so print through the saved
     * original stream to keep the output easy to read and to grep.
     */
    static void check(String label, boolean ok) {
        if (!ok) failures++;
        Bootstrap.STDOUT.println((ok ? "PASS " : "FAIL ") + label);
    }

    public static void main(String[] args) {
        boot();

        // 1. Default components are not removed by setting others (only "!" removes).
        ItemStack kept = stack("{\"id\":\"minecraft:poisonous_potato\",\"count\":1,\"components\":{\"minecraft:item_model\":\"ns:x\",\"minecraft:max_stack_size\":99}}");
        check("setting components keeps unrelated defaults (consumable, food)", kept.has(DataComponents.CONSUMABLE) && kept.has(DataComponents.FOOD));
        ItemStack stripped = stack("{\"id\":\"minecraft:poisonous_potato\",\"count\":1,\"components\":{\"!minecraft:consumable\":{},\"!minecraft:food\":{}}}");
        check("! removes a default", !stripped.has(DataComponents.CONSUMABLE) && !stripped.has(DataComponents.FOOD));

        // 2. Trade cost matching: only listed components are compared, extras on the stack are ignored.
        ItemStack coin = stack("{\"id\":\"minecraft:gold_nugget\",\"count\":5,\"components\":{\"minecraft:item_model\":\"ns:coin/silver\",\"minecraft:custom_name\":{\"text\":\"Renamed\"}}}");
        ItemCost cost = ItemCost.CODEC.parse(ops, json("{\"id\":\"minecraft:gold_nugget\",\"count\":3,\"components\":{\"minecraft:item_model\":\"ns:coin/silver\"}}")).getOrThrow();
        check("cost on item_model matches a renamed coin", cost.test(coin));

        // 3. Loot JSON using pre-26.3 keys parses but is silently stripped.
        String old = "{\"rolls\":1,\"entries\":[{\"type\":\"minecraft:item\",\"name\":\"minecraft:stick\",\"functions\":[{\"function\":\"minecraft:set_count\",\"count\":2}]}]}";
        JsonElement kept26 = LootPool.CODEC.encodeStart(ops, LootPool.CODEC.parse(ops, json(old)).getOrThrow()).getOrThrow();
        check("old-key loot entry lost its functions", !kept26.toString().contains("set_count"));

        // 4. Loot tables accept an item modifier id once the modifier exists.
        var withMod = opsWithModifier("ns:items/example", "{\"type\":\"minecraft:set_components\",\"components\":{\"minecraft:rarity\":\"rare\"}}");
        String pool = "{\"rolls\":1,\"entries\":[{\"type\":\"minecraft:item\",\"name\":\"minecraft:stick\",\"modifier\":\"ns:items/example\"}]}";
        check("loot entry accepts an item modifier id", LootPool.CODEC.parse(withMod, json(pool)).result().isPresent());

        System.exit(failures == 0 ? 0 : 1);
    }
}
```

Things the harness had to get right, and which any new check must keep:

- **Bind default components before parsing items.** Without the `DATA_COMPONENT_INITIALIZERS` step an item parse fails with
  "Item ... does not have components yet".
- **Use the reloadable lookup** (`createReloadableLookup`) so loot, predicate and number-provider registries exist.
- **Run it from a scratch directory.** The game writes a `logs/` folder into the current working directory; run `java` from `$WORK`, not from inside the repository.
- **Print through `Bootstrap.STDOUT`.** The game replaces `System.out` with a logger that prefixes every line.
- **Library paths are version specific.** Re-run `fetch_mc_libs.py` for each version; Java version and library set change between releases.
- **API names change between releases.** 26.x uses unobfuscated names (`Identifier`, `ItemStack.CODEC`, `LootPool.CODEC`). When a call
  stops compiling after an update, use `javap -cp "$JAR" -p <class>` to find the new name.

### Adding a check

1. Decide the observable: does a component survive, does a matcher return true, does a codec accept a form, what does a re-encode keep.
2. Build input as JSON strings with `json(...)` / `stack(...)` and call the codec with `ops`.
3. Prefer asserting on the re-encoded output (`CODEC.encodeStart(ops, parsed)`) over "it parsed", because unknown keys are ignored.
4. For things that reference registry entries (item modifiers, predicates), register a test entry with `opsWithModifier` style helpers.

Useful classes to start from (all under `net.minecraft`): `world.item.ItemStack`, `world.item.trading.{ItemCost, TradeCost, VillagerTrade}`,
`core.component.{DataComponentExactPredicate, DataComponentInitializers}`, `world.level.storage.loot.{LootTable, LootPool}`,
`world.level.storage.loot.functions.LootItemFunctions`, `world.level.storage.loot.predicates.LootItemCondition`.

## 5. Findings already verified (regression targets)

- Setting components on a poisonous potato keeps `consumable` and `food`; `"!minecraft:consumable": {}` and `"!minecraft:food": {}` remove them.
- A trade cost with `components: {"minecraft:item_model": "<id>"}` matches a coin that has additional or changed components (renamed with
  `custom_name`, changed `custom_data`/`lore`) and does not match a different coin type. A cost listing the whole coin does not.
- With `custom_data`, the JSON compound and the SNBT-string forms are not interchangeable (byte versus int).
- `LootPool` entries accept `"modifier": "<namespace:id>"` at pool and entry level and in lists, once an `item_modifier` with that id exists.
- `VillagerTrade`: `given_item_modifier` and `merchant_predicate` accept ids; `gives` and `wants` are inline only; `TradeCost` clamps its count to the
  item's default max stack size.
- Default components for the base items used by the plan (poisonous potato, warped fungus on a stick, goat horn, discs, totem, iron axe, ...) come
  straight from the generated reports.

## 6. Turning this into unit tests [suggestions]

- **Keep it plain.** The harness returns exit code 1 on any FAIL, so a CI job can run it as-is. Move to JUnit only if per-test reporting is wanted.
- **Scan the repository's own data.** Walk `data/` and parse every file with its codec (`LootTable.DIRECT_CODEC`, `LootItemFunctions.DIRECT_CODEC`,
  `LootItemCondition` for predicates, the advancement codec); re-encode and compare key sets with the input so any key the game ignored is
  reported. This catches an unconverted `functions`/`conditions` anywhere, which otherwise loads silently.
- **Expand items.** For each custom item loot table, generate the stack and assert the components the design requires (`item_model`, `custom_data`,
  the removals for its base item, `max_stack_size` for coins).
- **Assert identity components.** Check that trade costs use the minimal coin definition (`item_model` and `item_name` only) and the coin loot
  tables still produce the same `item_model` and `item_name`; changing either breaks existing coins.
- **Pin versions.** Record the game version, the Java version and the library set the tests ran against; update them with each Minecraft release.
- **Reports as fixtures.** Diff the generated `reports/minecraft/components/item/*.json` between versions to see which defaults changed for the
  base items the pack uses.

## 7. Comparing mc-build 2.x and 4.x output

Used to check a source conversion: build the old sources with mc-build 2.15.0, the converted sources with 4.2.0, then compare the generated
commands per user-named function, ignoring how each version splits blocks:

```bash
python3 tests/tools/compare_mcfunction.py OLD_BUILD_ROOT NEW_BUILD_ROOT --namespace foxcraft_dungeon_loot --diffs diffs.json
```

`OLD_BUILD_ROOT` and `NEW_BUILD_ROOT` each contain `data/<namespace>/function(s)/`. The script inlines generated helper functions, drops the internal
`#execute`/`#ifelse` score updates, collapses one-line blocks and ignores the `replace` that 4.x adds to `schedule`. Exit status is 1 when any function
differs. Known benign differences: 4.x wraps a nested `execute A run execute B run { ... }` in an extra block.

Notes from the 4.2.0 test (details in the issue #130 comments):
- 4.2.0 needs `REPEAT(0, n-1)` (the single-number form emits nothing), a bare `} else {` must be `} else run {`, `<% %>` is not evaluated in later links of
  an `else execute` chain, and its shared `#ifelse` score can trigger an outer `else` when a called chain has no final `else`.
- mc-build 2.15.0's runner is a file watcher; run it with a timeout and read the output directory.

## 8. Limits

- No rendering, trading UI, command execution, function execution or real datapack loading. The checks cover data formats, matching rules and
  default values only. Anything that needs a running server (a villager actually offering a trade, a jukebox playing a disc, a horn swap while played)
  still needs a manual test in game.
- Registry entries are added programmatically in the harness; loading `item_modifier` or `instrument` files from a datapack on disk is not exercised.
- The checks are specific to 26.3's class and method names; expect to adjust them for each release.

## 9. Scanning the pack's own data

Two tools check the repository's JSON under `data/`, because 26.3 loads unconverted files without an error and silently drops the old keys.

- `tests/tools/check_old_keys.py [DATA_DIR]` is a plain Python scan for pre-26.3 keys in loot tables, item modifiers, predicates and advancements
  (`function`, `functions`, `conditions`, old `condition` type names, removed types). It needs no jar. Exit status 1 means something is left to convert.
- `tests/java/Scan.java DATA_DIR` parses every loot table, predicate, item modifier and advancement with the game's own codecs, re-encodes what the game
  kept, and reports any key that was lost. Compile and run it like the harness, from a scratch directory, with an absolute `DATA_DIR`:
  ```bash
  javac -cp "$JAR:$CP" -d "$WORK/classes" tests/java/Scan.java
  java -cp "$WORK/classes:$JAR:$CP" Scan "$(pwd)/data"
  ```
  `-Dscan.skip=minecraft:set_nbt,set_nbt` removes functions of those types before parsing, for constructs a later migration step still has to convert.
  Pack predicates are inlined before parsing because the vanilla lookup already owns the predicate registry, and loot table references are checked
  for existence and parsed as empty tables. Known harmless re-encodings (default `weight`, `quality`, `add`, constant number providers, `__comment` keys,
  advancement defaults) are not reported.
  Pack instruments are parsed with `Instrument.DIRECT_CODEC`, then a `minecraft:instrument` component naming one is swapped for a vanilla id before the table or modifier is parsed, since the vanilla registry cannot take them.


## 10. Parsing the generated commands

`tests/java/CmdCheck.java FUNCTION_DIR` runs every command line of every `.mcfunction` under a folder through the game's own command dispatcher.
It parses only, nothing executes. Renamed arguments, old item and particle syntax, bad text components and incomplete commands show up as errors.
Build first (`npx mcb build`), then compile and run it from a scratch directory with an absolute path:
```bash
javac -cp "$JAR:$CP" -d "$WORK/classes" tests/java/CmdCheck.java
java -cp "$WORK/classes:$JAR:$CP" CmdCheck "$(pwd)/data/foxcraft_dungeon_loot/function"
```
Limits: the pack's own loot tables, predicates, item modifiers and instruments are not in the vanilla registries, so unresolved ids in the `foxcraft_dungeon_loot`
namespace are counted and ignored. NBT inside `summon` and `data modify` is only checked as syntax, so an old key such as `HandItems` still parses;
grep `src/` for those. Macro lines starting with `$` are skipped.
