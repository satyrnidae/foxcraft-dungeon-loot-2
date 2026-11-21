# Gametests

Headless runtime scenarios, run on the Mojang server jar with the game's own gametest runner. They cover behavior the static suite in `tests/` can't see. Separate from `npm run build` and `tests/run_all.mjs`.

```
npm run gametest:fetch    download server.jar for 26.3 into .gametest/server, sha1 checked
npm run gametest          build, generate, run, print PASS/FAIL per scenario
```

## Needs

- Java 25. `run.js` takes `GAMETEST_JAVA` (an executable or a JDK folder), then `JAVA25`, `JDK_HOME`, `JAVA_HOME`, then the newest JDK under `~/.jdks`, then `java` on the path.
- `GAMETEST_SERVER`, a folder holding `server.jar`, default `.gametest/server`.
- `GAMETEST_TESTS`, a test filter, default `fdl_test:*`. `GAMETEST_TESTS=fdl_test:aura_post_attack` runs one.

A run compiles the pack and `gametest/mc` with the pack's own mc-build, so it takes about a minute before the server starts. The `fdl_test` namespace is never built into `data/`, `run.js` fails if `data/fdl_test` exists. Output: `.gametest/server/run.log` has the full server log, the `gt` lines are echoed.

## No player

A headless gametest server has no player. Scenarios that select `@a` can't run, so fall, snowball, block and `process_*` dispatch are not covered, and creative-mode branches are not asserted. Mobs holding the item stand in, the item predicates match any entity. Chance rolls live in the enchantment JSON, the scenarios call the effect functions directly.

## Layout

- `tests.js`: the manifest, one entry per scenario, `{ id, steps: [[age, "<function under fdl_test>"]] }`. Each test gets a window on a global tick clock so scenarios share one arena at 100 64 100 without overlapping.
- `generate.js`: writes a structure, environment and test instance per entry.
- `mc/`: second mc-build project, namespace `fdl_test`. `src/fdl_test.mcb` holds the library and the generated poll functions, scenario files are in `src/fdl_test/`, a function `x` in `load.mcb` is `fdl_test:load/x`.

## Adding a scenario

1. Add the entry to `tests.js`.
2. Write the functions in `mc/src/fdl_test/<group>.mcb`. Start with `function fdl_test:lib/begin` and `lib/flat`, spawn mobs tagged `tt`, set `#ok fdl_test` to 0 on a failed check. `lib/expect_effect` and `lib/expect_no_effect` take macro arguments, see their comments.
3. Run it, watch it fail with the assertion inverted, then right.

## Wave 1

`load_scoreboards`, `aura_post_attack`, `haemolymph_levels`, `balm_levels`, `disarming_entity`, `poncho_post_attack`, `hammer_expiry`, `sweep_<rarity>`, `uninstall`. Spec: `docs/superpowers/specs/2026-11-09-gametest-design.md`.
