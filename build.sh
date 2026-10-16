#!/usr/bin/env bash
# Bash equivalent of build.ps1: rebuild the functions with mc-build, run the tests, zip the datapack into
# .build/<baseArchiveName>-<version>[+dev].zip with a .sha1 beside it, then build the resource pack.
# Needs Node (npx) and 7-Zip as 7z, 7zz or 7za.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

SEVENZ="$(command -v 7z || command -v 7zz || command -v 7za || true)"
if [[ -z "$SEVENZ" ]]; then
    echo "7-Zip not found, install it as 7z, 7zz or 7za" >&2
    exit 1
fi

BUILD_DIR="$ROOT/.build"
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"

# Generated functions and function tags, mc-build does not clean stale output
rm -rf "$ROOT/data/foxcraft_dungeon_loot/function"
rm -f "$ROOT/data/minecraft/tags/function/load.json" "$ROOT/data/minecraft/tags/function/tick.json"
npx mcb build

# Tests run on the output just built, a failure stops the build. Set SKIP_TESTS=1 when they already ran, such as in CI.
# A non-dev build also runs the release checks.
if [[ -z "${SKIP_TESTS:-}" ]]; then
    release="$(node -p "require('./config.json').mc.dev ? '' : '--release'")"
    node tests/run_all.mjs --no-build $release
fi

if [[ -f config.json ]]; then
    # name, version and dev flag from config.json, one per line
    mapfile -t cfg < <(node -p "const c = require('./config.json').mc; [c.baseArchiveName || '', c.version || '', c.dev ? '+dev' : ''].join('\n')")
    base="${cfg[0]:-}"
    version="${cfg[1]:-}"
    dev="${cfg[2]:-}"
    if [[ -n "$base" && -n "$version" ]]; then
        stem="$BUILD_DIR/$base-$version$dev"
        out="$stem.zip"
        n=0
        while [[ -e "$out" ]]; do
            n=$((n + 1))
            out="$stem ($n).zip"
        done

        "$SEVENZ" a -tzip "$out" '-i!*' '-xr@exclude.txt' '-x!src/*'
        # Uppercase hex only, like Get-FileHash
        sha1sum "$out" | cut -d' ' -f1 | tr 'a-f' 'A-F' > "$out.sha1"
    fi
fi

bash "$ROOT/texturepack/build.sh"
