# build

Packaging scripts, run through npm from the repo root. They need 7-Zip as `7z`, `7zz` or `7za`.

| Command | Script | Does |
|---|---|---|
| `npm run build` | | `data` then `assets` |
| `npm run data` | `data.mjs` | Fetches the client jar to `tests/.cache/mc` if missing, compiles `src/` with mc-build, runs `tests/run_all.mjs --no-build` (with `--release` when `mc.dev` is false) and zips the datapack to `.build/<baseArchiveName>-<version>[+dev].zip` with a `.sha1`. `npm run data -- --no-tests` or `SKIP_TESTS=1` skips the tests. |
| `npm run assets` | `assets.mjs` | Zips `texturepack/` to `.build/<baseArchiveName>-<version>.zip` with a `.sha1`, name and version from the `meta` of its `pack.mcmeta`. |
| `npm run watch` | | `mcb watch`, rebuild the functions on change. |

`common.mjs` holds what they share, including `buildFunctions()`, which `tests/run_all.mjs` also uses. What a zip leaves out, and its `src/`, is named by `data.exclude.txt` for the datapack and `assets.exclude.txt` for the resource pack, beside the scripts. Building again replaces the zip of the same name.
