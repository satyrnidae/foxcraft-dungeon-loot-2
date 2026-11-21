# Gametest harness and wave 1 scenarios

Port of the headless gametest setup from `~/sandbox/furnace_train/gametest` to this pack. Wave 1 is the deterministic, playerless scenarios. Projectile items, trader staging and tick hooks are wave 2.

## Goal

`npm run gametest` runs scenarios headless on a 26.3 server jar and prints PASS/FAIL per scenario. It covers runtime behavior the static suite in `tests/` can't see, and retires entries of `docs/todo_manual_verification.md` as they land.

## Constraints

- Server jar only, Java 25 for 26.x. `java` on this machine is 22, so `GAMETEST_JAVA` points at a 25.
- A headless gametest server has no player. Anything that selects `@a` is out: fall, snowball, block and `process_*` dispatch. Mobs holding the item stand in, the item predicates are `entity_properties` and match any entity.
- Chance effects (Aura 1 in 20, Disarming 1 in 10, Poncho 1 in 10) are tested by calling the effect function directly. The roll lives in the enchantment JSON and is a static check.
- Separate from `npm run build` and `tests/run_all.mjs`. The `fdl_test` namespace never lands in `data/`, a zip of `data/` is the release.

## Layout

```
gametest/
  run.js           build both projects, generate the pack, run the server, parse report.xml
  generate.js      structure, test_environment and test_instance per entry of tests.js, gt_tick
  fetch-server.js  download and sha1-check the server jar into .gametest/server
  tests.js         manifest: id, steps [[age, function]], global-clock windows
  README.md        Java 25, env vars, how to add a scenario
  mc/
    mcb.config.js  second mc-build project, namespace fdl_test
    pack.mcmeta
    src/fdl_test.mcb       library: begin, flat, cleanup, dump, poll glue
    src/<scenario>.mcb     one file per scenario group
```

Same mechanics as the reference. One start block, a repeating command block running the poll function, an accept block and a fail block per structure. Each test gets a window on a global tick clock so scenarios share one force-loaded arena at 100 64 100 and never overlap. `#ok` is 1 before every step, a step fails the test by setting it to 0, the last step passing accepts. `package.json` gets `gametest` and `gametest:fetch` scripts. `.gitignore` gets `.gametest`, `gametest/mc/data`, `gametest/mc/.mcb`. mc-build stays at the pack's 4.2.0, the first task checks that `import` of `tests.js` and the `fdl_test` scoreboard name work there.

## Scenarios

| id | what it checks |
| --- | --- |
| `load_scoreboards` | Every objective added by `load` and the `on_load` tag exists, `#version` matches `config.json` `scoreboardsVersion`, `satyrn.fdl.loot.variant` is reset for everyone |
| `loot_sweep` | Each table under `loot_table/item/**` run through `loot spawn` yields an item with `DungeonLootId` in the CSV, a rarity byte and a custom name. Tiered items rolled once per tier through the variant score, then the score is reset |
| `aura_post_attack` | `post_attack` as a spider: zombie within 10 gets Wither II, arthropod gets Weakness II, mob at 11+ gets nothing |
| `haemolymph_levels` | Zombie holding a sword with level 1, then level 2, runs `on_killed_arthropod`: Weaving 15s, Resistance II/III 5s, Regeneration I 3s / 5s |
| `balm_levels` | Spider eye tag as a mob holding levels 1 to 4: Strength I to III for 10s, level 4 Strength III for 30s |
| `disarming_entity` | `post_attack_entity` on a zombie with a sword: sword dropped as an item with `Thrower` set, mainhand empty after. A zombie with an empty hand drops nothing. A war hog keeps its item |
| `poncho_post_attack` | `post_attack` on a zombie: Wither II, 5s. A creative player is skipped, which needs a player, so only the non-player branch is asserted |
| `hammer_expiry` | Item tagged `satyrn.fdl.titanHammerSpawnedItem` with expiry 2, the live `on_tick` pops it: tag removed, the `expiry` loot table dropped, a zombie touching the cube takes explosion damage and burns, a zombie 3 blocks away is untouched |
| `uninstall` | Last window. The `on_uninstall` tag removes the objectives and storage. `load` runs again after so nothing leaks into a rerun |

`disarming_player` and the creative-mode branches need a player and are wave 2 if a way to get one turns up.

## Error handling

`run.js` fails the run, as the reference does, on a compile error in either project, a function that did not load, registry loading errors, a missing report, and a leftover `data/fdl_test`. Failing steps print a dump of the stage with `say gt dump`, since a headless server logs `say` and not `tellraw`.

## Testing the harness

First scenario in is `load_scoreboards`. Each later scenario is checked once by breaking the behavior it asserts, for example by editing a Resistance amplifier, and confirming it fails, then reverting.

## Open items

- Java 25 install path for `GAMETEST_JAVA`.
- Whether a loot sweep over every table fits one scenario window or needs chunking by rarity.
