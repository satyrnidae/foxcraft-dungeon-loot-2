# fonts

Glyph width cache and bitmap font rendering. Dev utilities, not part of the datapack zip.

## fonts.js

Glyph widths per font. The vanilla fonts are measured from the client jar once and cached in `font_widths.json`, which is committed so builds need no jar. Unifont, which the game takes from its asset index and the jar leaves empty, is measured from the files `tests/tools/fetch_mc_jar.mjs` downloads next to the jar, and kept in the cache once, as ranges, for the fonts that reach it. Regenerate after a Minecraft update with `node scripts/fonts/fonts.js [path/to/client.jar]`, the default is the 26.3 jar of the launcher.

Fonts of the resource pack, `texturepack/assets/<namespace>/font/<name>.json`, are read on every run with their bitmap and space providers, so a new font works without a step. `reference` providers are followed. TrueType and unihex providers cannot be measured, their glyphs count as 9 pixels, as does every glyph a font lacks.

## font_to_bitmap.js

Renders a pixel TrueType font to a bitmap font for the resource pack. Needs `npm i`, opentype.js is a dev dependency.

```
node scripts/fonts/font_to_bitmap.js "Pixelated Elegance.ttf" pixellated_elegance
```

Writes `texturepack/assets/<namespace>/textures/font/<name>.png` and `font/<name>.json`, a `space` provider and a `bitmap` provider, 16 glyphs a row. Use it in a book as `<font face="foxcraft_dungeon_loot:pixellated_elegance">`, or for the whole book with `font:` in the frontmatter. `book_loot_gen.js` measures it like any bitmap font.
- `--size` is the pixel size of the em, default the pixel grid of the font, found from the width of a period. Glyphs are filled without anti-aliasing or hinting, so a size that is not a whole multiple of the grid makes some strokes wider than others; the script says so. `--preview` prints the sheet as text and writes nothing.
- `--grid` is the number of font pixels across the em, for a font where the width of a period does not show it. Hexenaat is drawn on 4 units of 32, so `--grid 8`. It lets the script tell a clean scale from an uneven one: sheet pixels per font pixel times the scale has to be a whole number, 4 x 0.75 = 3.
- `--scale` sets the size of the glyphs in game relative to the sheet, `2` shows a sheet at twice the size without a bigger PNG, `0.5` shows a size 18 sheet at half size. The game scales by `height` over cell height when it draws, so one of the cell height and the shown height has to be a whole multiple of the other; the script says when the scale comes out uneven. The one pixel of spacing between glyphs is not scaled. At the grid size no scale is needed.
- `--chars` takes code points and ranges, default `32-126,160-255,0x2018-0x201d,0x2026`. Code points the font lacks are skipped and listed.
- `--pad` is the blank columns left of every glyph. The game trims only the right side of a glyph, so a left column is extra spacing; the default is none unless the font draws left of its origin.
- `--bearing` is `trim` or `keep`. `trim` moves every glyph to the left edge of its cell, `keep` leaves the left side bearing of the font. The default is `trim` for a monospaced font, where the bearings only center glyphs in a fixed cell and an `i` would carry columns of blank space, and `keep` for any other.
- `--monospace` makes every glyph advance the same, the space too. The game takes the advance of a glyph from its rightmost column with any alpha, so a glyph that ends short of the cell, such as a period, gets one pixel of alpha 1 in the last column. The text shader discards it, nothing shows. Without the flag a monospaced font still comes out narrow on punctuation and spaces. `--preview` shows those pixels as `:`.
- `--height`, `--ascent` and `--space` override what the font reports, `--namespace` and `--out` move the output.
- Glyph widths are the ink of each glyph plus one pixel, as in vanilla, so spacing can not go tighter than that. Kerning pairs and the advances of the TTF are not used.
