#!/usr/bin/env bash
# Bash equivalent of build.ps1 in this folder: zip the resource pack into
# ../.build/<baseArchiveName>-<version>.zip with a .sha1 beside it.
# Needs Node and 7-Zip as 7z, 7zz or 7za.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BUILD_DIR="$HERE/../.build"
cd "$HERE"

SEVENZ="$(command -v 7z || command -v 7zz || command -v 7za || true)"
if [[ -z "$SEVENZ" ]]; then
    echo "7-Zip not found, install it as 7z, 7zz or 7za" >&2
    exit 1
fi

mkdir -p "$BUILD_DIR"
BUILD_DIR="$(cd "$BUILD_DIR" && pwd)"

if [[ -f pack.mcmeta ]]; then
    mapfile -t meta < <(node -p "const m = JSON.parse(require('fs').readFileSync('./pack.mcmeta', 'utf8')).meta; [m.baseArchiveName || '', m.version || ''].join('\n')")
    base="${meta[0]:-}"
    version="${meta[1]:-}"
    if [[ -n "$base" && -n "$version" ]]; then
        stem="$BUILD_DIR/$base-$version"
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
