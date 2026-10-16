# scripts

Dev utilities, not part of the datapack zip.

## book_loot_gen.js

Writes written book loot from markdown. `mcb build` runs it through `src/foxcraft_dungeon_loot/books.js`; run it by hand with `node scripts/book_loot_gen.js`, add `--check` to write nothing and fail when output is stale, or pass source files to limit the modifiers.

### Layout

- Sources: `src/books/<locale>/<id>.md`, for example `src/books/en_us/palomina_and_the_demon_lord.md`.
- `en_us` is the reference. It writes `data/foxcraft_dungeon_loot/item_modifier/random_loot/book/generated/<id>.json` and `loot_table/item/random_loot/book/generated/<id>.json`, both gitignored. Files in those `generated` folders without a source are deleted, anything beside them is left alone. A book with `debug: true` is only generated when `config.json` `mc.dev` is true. Adding the book to a random loot pool stays manual, or point the pool at the loot table `item/random_loot/book/generated/random_book`, or at `item/random_loot/book/generated/random_book`. `random_book` rolls one of all generated books and `random_<rarity>_book` one of a rarity, for common to cursed. A `debug: true` book is left out of all of them. A rarity without a book is an empty table that drops nothing. Loot tables have no tags, and those names are not usable as book ids.
- Every locale writes its text to `texturepack/assets/foxcraft_dungeon_loot/lang/<locale>.json` under `book.foxcraft_dungeon_loot.<id>.*`. Other keys in that file are kept. A translation is the same markdown in another locale folder. Pages are cut by the text, so a translation that cuts differently gets a warning and the English page structure.
- Page text is `translate` with the English as `fallback`, as the key the resource pack translates. The books need the resource pack for their fonts anyway. A span inside a page is a `%1$s` argument with its own key.
- Dev builds get `/trigger give_<id>` for every en_us book, from `give.js`. A release build adds none, `/function foxcraft_dungeon_loot:give/give_<id>` stays.

### Source format

The authoring guide, with the tall font and hyphenation rules and the `<span>` tag, is `src/books/README.md`. What follows is the reference.

```
---
title: Book title, or SNBT text component
author: Name
rarity: common|uncommon|rare|epic|mythic|cursed
font: foxcraft_dungeon_loot:pixellated_elegance
debug: true
lore:
  first lore line, wrapped by hand
  second lore line
---

Text flows over the pages by itself. A newline is a line break,
so this is the second line, and a blank line is an empty one.

A long line wraps on its own, and the page changes after 14 lines.
<br>
This starts a new page.
```

- `<br>` is a manual page break. Everything else is cut into pages automatically: a page holds 14 lines of 114 pixels, a line wraps after its last space, and a page never starts with an empty line. A line that starts at a newline keeps its indentation, a line that starts at a wrap loses its leading spaces, and every line loses its trailing spaces. A trim can change where text wraps, so the layout is redone after each cut until no line needs one.
- Spans do not reach across a `<br>`, close them first. `<br>` inside a fence or an inline code span is not a break.
- Title is plain text, at most 32 characters. `<filter as="Darn Book">Damn Book</filter>` in it sets the chat-filtered title, the same tag as in the text. The filtered title is limited to 32 characters too, and an SNBT title cannot have one. A title in SNBT also sets `custom_name` and its plain text becomes the book title. A book with a `rarity` gets the item name in the color of the rarity, not italic, like the other items of the pack; the item name has no filtered side, so it uses the filtered title when there is one; an SNBT title keeps its own colors and styles over it. A book without a rarity keeps the name the game derives from the title.
- Font is optional and sets the font of the whole text, a `<font face>` inside still wins. It is measured for the layout, so the page fit follows it. Title and lore keep the default font.
- Rarity appends the `Rarity: ` lore line after the lore, colored like the rest of the pack. Lore lines stay within 44 average characters, 226 pixels, and the script warns about a line over that or one that stops early.
- Formatting: `**bold**`, `*italic*` or `_italic_`, `__underlined__`, `~~strikethrough~~`, `||obfuscated||`, `# Header` as bold and underlined with an empty line under it, `\*` to escape. Stacked formatting is one component, nested formatting uses `with`.
- `inline code` and fenced code blocks, three backticks on their own line, are set in `foxcraft_dungeon_loot:pixel_mono`. Their text is literal, nothing in it is markup, a block keeps its indentation and a `#` in it is not a heading. A backtick without a closer on the line stays a backtick. A block does not reach across a `<br>`. A block with a language after the fence is colored: `mcfunction`, `json`, `javascript` or `js`, `bash` or `sh`, `python` or `py`, `yaml` and `java`. A block with none, or one that is not in that list, stays plain. Prism does the lexing, a dependency; mcfunction has a tokenizer of its own in `scripts/highlight.js`, which also holds the colors. The code itself is written as plain text components, not translatable ones. A block is one `with` entry of its page, a translate component with a lang key of its own for the template that joins the pieces, so the text around it has a single `%n$s` for all the code. `code_block_test_book` shows every language.
- `<font color="gray" face="minecraft:illageralt" shadow="#80ff0000">text</font>`: color is a name or `#rrggbb`, face is the font, shadow is `#aarrggbb` for `shadow_color`.
- `<a on_click='{action:copy_to_clipboard,value:"text"}' on_hover='{action:show_text,value:"tip"}'>text</a>`: both attributes take SNBT click and hover events. A plain `href="https://..."` makes an `open_url`.
- `<filter as="darn">damn</filter>`: the chat-filtered text. Players with chat filtering on see `as` in its place, everyone else sees the content. `as` takes the same markdown as the text and inherits the formatting around the span. Pages are cut by the raw text and the filtered page follows, so both have the same page count. A page with no difference stays a plain component. Warns when a filtered page runs over 14 lines or a page break falls inside a span. An old `<id>_filtered.md` is ignored with a warning.

### Page fit

Widths come from the font of each glyph, so `<font face>` changes how much fits. Bold is a pixel wider. A page that would pass the editor limit of 1024 characters gets a warning, as does a book over 100 pages and a font that is not defined anywhere.

## fonts.js

Glyph widths per font. The vanilla fonts are measured from the client jar once and cached in `font_widths.json`, which is committed so builds need no jar. Regenerate after a Minecraft update with `node scripts/fonts.js [path/to/client.jar]`, the default is the 26.3 jar of the launcher.

Fonts of the resource pack, `texturepack/assets/<namespace>/font/<name>.json`, are read on every run with their bitmap and space providers, so a new font works without a step. `reference` providers are followed. TrueType and unihex providers cannot be measured, their glyphs count as 9 pixels, as does every glyph a font lacks.

## font_to_bitmap.js

Renders a pixel TrueType font to a bitmap font for the resource pack. Needs `npm i`, opentype.js is a dev dependency.

```
node scripts/font_to_bitmap.js "Pixelated Elegance.ttf" pixellated_elegance
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
