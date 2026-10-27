# Books

Written book loot is made from the markdown files here. This file has no frontmatter, so the generator skips it, like any markdown file without one. Edit the markdown and never the generated files; `mcb build` runs `scripts/books/book_loot_gen.js` on every build, or run `node scripts/books/book_loot_gen.js` by hand, add `--check` to write nothing and fail when output is stale. Generator internals are in `scripts/books/README.md`.

## Files

- One book is `src/books/<locale>/<group>/<id>.md`, for example `src/books/en_us/unattributed/enderman.md`; the group folder (the author) only sorts, the id is the file name. The id is the file name, lowercase with underscores.
- `en_us` is the reference. It writes the item modifier `data/foxcraft_dungeon_loot/item_modifier/random_loot/book/generated/<id>.json` and the loot table `loot_table/item/random_loot/book/generated/<id>.json`, both gitignored and made by every build. A file in those `generated` folders without a markdown source is deleted, so removing or renaming a book cleans up after itself. Hand-written book files beside them are never touched. Adding a book to a random loot pool is still done by hand, or point the pool at `item/random_loot/book/generated/random_book`,, or at `item/random_loot/book/generated/random_book`. `random_book` rolls one of all generated books and `random_<rarity>_book` one of a rarity, for common to cursed. A `debug: true` book is left out of all of them. A rarity without a book is an empty table that drops nothing. Loot tables have no tags, and those names are not usable as book ids.
- Every locale writes its text to `texturepack/assets/generated/lang/<locale>.json`, gitignored and made by the build. A translation is the same markdown in another locale folder. There is one book, built from the `en_us` file, and a translation only gives it lang entries. Every locale has its pages cut on its own, each page filled to 14 lines, so a language that needs more or fewer pages than the others does not leave partly empty ones; the book has the pages of the longest locale and a shorter one ends in empty pages. A page of the book lists the spans of every locale that has them on it, and the lang entry of each locale for the page uses the ones it needs. A translation takes `rarity`, `model` and `styles` from the `en_us` file when its own frontmatter leaves them out, so it only needs `title`, `author` and `lore`. For that the translation needs the same spans, in the same order, as the `en_us` file, with the same styles, though the text a `<filter>` shows instead may be formatted differently; its text needs nothing else, and the `<br>` breaks may differ. A translation whose spans differ is left out, with a warning, and shows English. A page never ends inside a `<filter>` span, and it has to fit in 14 lines in the filtered reading too.
- Dev builds get `/trigger give_book_<id>_by_<author>` (`give_book_<id>` for `unattributed`, `give_debug_book_<id>` for `debug`) for every en_us book. A release build adds none; `/function foxcraft_dungeon_loot:give/give_book_<id>_by_<author>` stays.

## Frontmatter

```
---
title: Book title, or an SNBT text component
author: Name
rarity: common|uncommon|rare|epic|mythic|cursed
model: foxcraft_dungeon_loot:random_loot/written_letter
data: {DungeonLootId:87,DungeonItem:1b}
writable: false
debug: true
lore:
  first lore line, wrapped by hand
  second lore line
---
```

- `title` is plain text, at most 32 characters. `<filter as="Darn Book">Damn Book</filter>` sets the title that players with chat filtering see. An SNBT title also sets the item name and cannot be filtered.
- `title` and `author` are required, a book without either stops the build. A key the generator does not know, such as a typo, warns.
- `debug: true` keeps the book out of anything but a dev build, `config.json` `mc.dev`. It gets no loot table, give function or lang entries in a release. Test and demo books are marked with it.
- `rarity` adds a `Rarity: ` lore line and colors the item name by it, not italic. An SNBT title keeps its own colors over that. The item name has no filtered side, so it uses the filtered title when there is one.
- The font of the whole text is `styles: { body: { font: foxcraft_dungeon_loot:pixellated_elegance } }`, see Styles. The old `font:` key still works but is deprecated and warns. A `<font face>` inside still wins. Title and lore keep the default font.
- `model` is optional and is the resource location of a client item definition, `assets/<namespace>/items/<path>.json`, saved as the `item_model` component. A trailing `.json` is dropped and a bare path gets the pack namespace. Without it the book keeps the vanilla written book model.
- `writable` is optional and `false` by default. `true` makes a book and quill (`minecraft:writable_book`, with `writable_book_content`) instead of a written book. Its pages are plain strings, so bold, colors, fonts, links, `styles` and hyphenation are dropped and only the text stays, `<filter>` still gives a filtered reading. It has no author or title, so `author` is not required and `title` becomes the item name. Pages are still cut like a written book's. Signing keeps the `item_model` component, so every five ticks the datapack swaps `foxcraft_dungeon_loot:random_loot/writable_letter` on a written book held by a player for `random_loot/written_letter` (`event/clock_5t`). Give a writable letter `model: foxcraft_dungeon_loot:random_loot/writable_letter`.
- `data` is optional and is an SNBT compound for the `minecraft:custom_data` component, for example `{DungeonLootId:87,DungeonItem:1b}`, over as many lines as it takes to close the braces. It is written with `minecraft:set_custom_data` as the SNBT string, so `1b` stays a byte and `87` an int. Anything that is not a valid compound stops the build.
- `styles` is optional and is a small stylesheet, a compound of SNBT over as many lines as it takes. Each key is a selector and each value a style, see Styles below.
- A `lore` line is plain text, or a JSON or SNBT text component when it starts with `{` or `[`, for example `{"text":"Hush","color":"gray","italic":true}` or `["A ",{"text":"list","bold":true}]`, kept on one line. The whole block can also be one JSON or SNBT list after `lore:`, over as many lines as it takes, `lore: ["first", {"text":"second","color":"gray"}]`, where every string is plain text and every object or list a component. A component line is shown as written, on a line of its own, and is never joined or wrapped.
- Plain `lore` text is wrapped by the build to 44 average characters, 226 pixels, so it can be written on one long line or wrapped any way. A frontmatter line is joined with the next unless it ends a sentence or the next one is empty, then the text is broken where the next word does not fit. Only a single word wider than a line, or a component line over the width, gets a warning.
- The item name and every plain `lore` line are lang keys, `book.foxcraft_dungeon_loot.<id>.title` and `book.foxcraft_dungeon_loot.<id>.lore.<n>`, so a translation names the item and words its lore from its own `title` and `lore`. Each locale wraps its own lore, and all get the line count of the one that wraps into the most: a locale with fewer lines is wrapped narrower to fill them, and only when it has too few words is the rest left empty. Component lines stay as written in every locale. The Rarity line is `lore.foxcraft_dungeon_loot.rarity`, `Rarity: %s`, around `rarity.foxcraft_dungeon_loot.<rarity>`, keys of the whole pack in the hand-written `texturepack/assets/foxcraft_dungeon_loot/lang/<locale>.json`; a test checks every rarity is in each of those files. The lore width check reads a translated line from the lang files and holds every locale to the limit.

## Pages

- Text flows over the pages by itself. A newline is a line break, a blank line is an empty line, and a long line wraps. A page holds 14 lines of 114 pixels.
- `<br>` (or `<br/>`) is a manual page break, alone on a line or in the middle of one; the spaces after it are dropped. A page never starts or ends with an empty line.
- A line of only `---` is a horizontal line across the page, 114 pixels: one glyph of `foxcraft_dungeon_loot:rule`, a line with no gaps in it, in the color of the `horiz` style, whatever the font of the book. It is never bold. The `horiz` type of the stylesheet styles it, `horiz: { color: gray }`. `char` is a key of every style, but only a `---` line reads it: `horiz` takes it from `body` when it has none of its own. With a `char` or a `font` in `horiz`, it is made of that character instead, a hyphen unless `char` says otherwise, as many as fit and, where they do not fit evenly, the last one pulled back over the one before it by padding, so the line is still exactly as wide as the page. `horiz: { char: "~" }` is a line of tildes, `horiz: { char: " ", underline: true }` a blank with an underline, `strikethrough: true` one through the middle; a bold character is a pixel wider, so it takes fewer of them. Each character is followed by a pixel without ink, so the generator steps back over it with padding and the characters touch; a blank has no ink and is left as it is. A `<style>` around the line, on lines of their own or the same, styles that line over `horiz`: `<style class=".tildehoriz">`, `---`, `</style>` with a class that sets `char` or `color`; a class without a `char` leaves the one of `horiz`.
- A line that starts at a newline keeps its indentation, a line that starts at a wrap loses its leading spaces, and every line loses its trailing spaces.
- Widths come from the font of each glyph, bold is a pixel wider. A page past the editor limit of 1024 characters, a book over 100 pages and a font that is not defined anywhere all warn.
- Spans do not reach across a page break. Close them first. A `<br>` in a code block or an inline code span is text, not a break, and a `---` line is a horizontal line, not a break.

## Formatting

- `**bold**`, `*italic*` or `_italic_`, `__underlined__`, `~~strikethrough~~`, `||obfuscated||`. `\*` escapes a marker, `\uXXXX` or `\u{X..}` is that code point, for glyphs a keyboard can't type, such as the private-use ones of `staff_notation`.
- `# Header`, one to six `#`, is a header with an empty line under it, except when a `---` horizontal line follows it directly. Each level has its own look: `#` is centered, bold and underlined, `##` bold and underlined, `###` underlined and italic, `####` underlined, `#####` bold and `######` italic. A format a level leaves off is set to false, so a header inside italic text is upright. Only `#` is centered, the other levels follow the text around them. `styles` can change any of it.
- `` `32`pad ``, inline code with `pad` right after it, is that many pixels of blank padding, the glyphs of `foxcraft_dungeon_loot:padding`. The number is decimal, `0x10`, `0o10` or `0b0111_0001`, with `_` between digits, and a `-` steps back. It goes up to 113, a line of 114 being a line break, and anything that is not a number stops the build. The word may be followed by any character but a letter or a digit: `` `25`pad! `` is the padding and then `!`, while `` `25`padLone `` is the code `25` and the word `padLone`. `pad` also drops one space after it, so `` `25`pad Lone `` is the padding and then `Lone`. Without `pad` after it, it is code.
- `` `45`tally ``, with `tally` right after it, is that many tally marks in `foxcraft_dungeon_loot:tallies`, in groups of five: four ticks and a crosswise mark over them, stepped back to the middle of the ticks. The number is written as for `pad`, or as tallies: `` `IIIII IIIII III`tally `` or `` `IIIIIIIIIII`tally `` counts the Is, with spaces between them allowed. A run too wide for a line goes on over more lines, six groups to one. A space or any other character after `tally` stays text. The marks are `dark_gray`, and the `tally` type of the stylesheet, `tally: { color: red }`, styles them.
- `` `inline code` `` and fenced blocks are set in `foxcraft_dungeon_loot:pixel_mono`. The text is literal, nothing in it is markup. A block keeps its indentation and a `#` in it is not a heading. A block with a language after the fence is colored: `mcfunction`, `json`, `javascript` or `js`, `bash` or `sh`, `python` or `py`, `yaml` and `java`. Anything else stays plain.
- `<font color="gray" face="minecraft:illageralt" shadow="#80ff0000">text</font>`: color is a name or `#rrggbb`, face is the font, shadow is `#aarrggbb`.
- `<filter as="darn">damn</filter>`: players with chat filtering on see `as` in its place. `as` takes the same markdown and inherits the formatting around it. Both readings have the same page count.
- `<style class=".url">text</style>`: the class `.url` from the stylesheet, the dot is needed. Several names, `class=".url .warn"`, apply in order and a later one wins. An unknown class, or one without its dot, stops the build. The built-in classes go without a dot: `h1` to `h6` and `header`, the look of a header, and `center`, which centers the lines the text starts, see `center` under Styles. Inside the tag the usual markup still works, and a `<font>` or `<a>` inside overrides it.
- `class` also works on `<font>`, `<a>`, `<span>` and `<center>`, as `<a class=".url" href="...">`. The default style of the tag comes first, then the class, then the attributes of the tag, so `<font class=".url" color="red">` is red and `<font class=".url" face="minecraft:alt">` takes the font from the tag. A `<span class>` is also kept from being hyphenated.
- `<span>text</span>`: no style of its own, the `span` type or a class can add one. The words inside are never hyphenated, for text that is not a word, such as a name in a made-up language or a string of symbols. It leaves no trace in the page.
- `<vcenter>` on a line of its own puts the text under it in the middle of the space it has. At the start of a page, as the first thing after the `<br>` line, that is the whole page and only the end of the page ends it. Under a header, that is the text up to the next header or the end of the page, with the header where it is. The empty lines left over on the page are shared between the `<vcenter>`s on it, half above their text and half below. They are lines of a blank glyph of the padding font, as a page does not start with an empty line. A page of more than 14 lines is left as it is, and so is a book and quill.
- `<vbottom>` on a line of its own works like `<vcenter>`, but anchors the text under it to the bottom of its space: all of the empty lines left over go above it and none below. The two can be mixed on a page, which shares the empty lines between them. As with `<vcenter>`, one that has to flow across a page boundary is ignored.
- `<center>text</center>`: every line the text is on is centered, the line it wraps onto too. The padding is drawn with blank glyphs of `foxcraft_dungeon_loot:padding`, 1 pixel exact (`\uf801` is 1px up to `\uf840` 64px, and `\uf881` to `\uf8c0` the same widths backwards, as `\uf881` between the staff glyphs of `staff_notation`, which draw 10px and step 11, and `\uf882` on both sides of a bar, which sets it over the edge of the glyphs around it), and carries no underline or strikethrough. On lines of their own, `<center>` and `</center>` add no empty line. The `center` type of the stylesheet styles it, then `class` like on `<style>`; `class="h1"` to `h6`, or `header`, gives it the look of a header, without the empty line a `#` header gets. A book and quill leaves the text where it is.

## Styles

The `styles` of the frontmatter work like a small stylesheet. A key is a selector, a value is a style.

- Keys and values are SNBT, with a little slack: a key can be quoted or not, `.url` and `".url"` are the same, and a value can be an unquoted id, link or color, `font: foxcraft_dungeon_loot:hexenaat` or `color: #ff8800`.
- A key that starts with a dot is a class of your own, `.url`, used as `class=".url"` on `<style>`, `<font>`, `<a>`, `<span>` and `<center>`.
- A key without a dot names a format type and changes how that type looks by default. The names are:
  - `body`: all of the text.
  - `header` for `#` headers of every level, and `h1` to `h6` for a level. Each level starts from its own look, see `# Header` above, then `header` and then its level are added to that, so `h1: { align: left }` stops centering the top headers.
  - `bold`, `italic`, `underline`, `strikethrough` and `obfuscated`: the markdown formats. `**x**` stays bold and takes what the type adds. Set `bold: false` in `bold` to take the bold off, or `italic: false` in `italic` for a color without slant.
  - `code`: inline code and code blocks. The colors of a highlighted block win over it.
  - `a`, `font` and `span`: the tags. The class and the attributes of the tag come after them.
  - `center`: the `<center>` tag, and the built-in `class="center"`, which also turns `align: center` on.
- A name that is neither a dotted class nor one of those is an error.
- A style is a compound of `color` (a name or `#rrggbb`), `font`, `bold`, `italic`, `underline`, `strikethrough`, `obfuscated`, `shadow_color` (an integer or `#aarrggbb`) and `align` (`left`, `center` or `right`). Every key is optional and anything else is an error. A flag that is `false` turns the format off where the text around it has it on.
- `align: center` or `align: right` aligns every line that starts with text of that style, padded like `<center>` on the left of the line, `left` is where text starts anyway. Unlike `<center>`, text that starts mid-line leaves that line where it is; when it wraps, the lines it wraps onto start with it and are aligned. An inner `align` overrides it, `align: left` turns it off, and `body: { align: right }` right-aligns every line. A book and quill leaves the text where it is.
- Languages written right to left, `ar_sa` and `he_il`, align every line to the right by themselves, as the game itself draws every line from the left edge, whichever way it reads. There an alignment is mirrored, as the book is written for text that starts at the left: `left` is drawn at the right, `right` at the left and `center` stays. The same book and the same styles then work in every language. Lines with padding, code or music are left where they are, unless an `align` is written for them.
- `body: { font: ... }` sets the font of the whole text, and a `<font face>` inside still wins. The old frontmatter `font:` key is deprecated: it still sets the font of `body`, and `body` wins when both set one, but the build warns.

```
---
title: Styles
styles: {
  body: {
    color: "dark_gray"
  },
  header: {
    color: "dark_red"
  },
  bold: {
    color: "gold"
  },
  a: {
    underline: true
  },
  .url: {
    color: "blue",
    bold: false,
    shadow_color: "#80000000"
  }
}
---

# Dark red header
Some **gold bold** text, and a <a class=".url" href="https://example.com">blue link</a>.
```

## Interactive text

`<a>text</a>` makes the text clickable, hoverable or both. It has no style of its own and takes formatting inside and around it like any span. The attributes are in single or double quotes, and a value reads `&quot;`, `&apos;`, `&lt;`, `&gt;` and `&amp;` as the characters. That is how a value holds its own quote, or a `>`, which would otherwise end the tag: `on_hover="{action:show_text,value:&quot;tip&quot;}"`. It applies to every tag's attributes, `<font>` and `<filter as>` too.

- `on_click` is a click event as an SNBT compound with an `action`, for example `on_click='{action:copy_to_clipboard,value:"text"}'`. It takes whatever click event the game takes, such as `open_url` with a `url`, `run_command` and `suggest_command` with a `command`, `change_page` with a `page`, or `copy_to_clipboard` with a `value`.
- `on_hover` is a hover event the same way, for example `on_hover='{action:show_text,value:"tip"}'`.
- `href` is the short form of a link: `href="https://example.com"` is `on_click='{action:open_url,url:"https://example.com"}'`. A value that starts with `{` is read as a click event instead. `on_click` wins when both are given.
- `open_url` takes `http` and `https` links only. The game refuses any other scheme and the text with it, so the generator stops on one; use `copy_to_clipboard` to hand over an email address.
- An event without an `action`, or one that is not valid SNBT, stops the build with an error that shows the event.

```
Read the <a href="https://example.com">docs</a> or
<a on_click='{action:copy_to_clipboard,value:"/give @s stone"}' on_hover='{action:show_text,value:"Copy the command"}'>copy the command</a>.
```

## Tall fonts

A font whose `ascent` is over 9 pixels, more than a line, takes empty lines above its line: one for every 9 pixels it reaches over the 7 of the default font, so an ascent of 18 takes two. The generator adds the lines that are missing, empty lines already in the text count, and so does a glyph at the top of a page, which gets pushed down. An illustration is one glyph alone after a `---` page break. At most 13 lines are added, the most a page has above its last line, so a font that reaches further than 126 pixels leaks over the top of the page instead of failing the build. Such a font suits a drop cap at the start of a section:

```
## 1:


<font face="foxcraft_dungeon_loot:hexenaat">I</font>n Time Immemorial, the Sun God
```

## Music

A fenced block with the language `music` is drawn as a staff line in `foxcraft_dungeon_loot:staff_notation`: the staff and ledger lines in grey `#aaaaaa`, the bars, clef, key, time, notes and rests over them in black, unless the block sets its own colors. The staff and its ledger lines, `\uef00` to `\uef05`, the bars, `\uee00` to `\uee05`, and the C clefs, `\ued00` to `\ued04`, are glyphs of `staff_notation` from `staff.png`: its cells are three times the size of the notes' and drawn as high, so the lines are a third as thick and the bars and C clefs reach from the top line of the staff to its bottom one exactly. The notes, other clefs and the rest are `notation.png`. Words are separated by spaces or line breaks, and `//` or a `#` on its own starts a comment to the end of the line.

```
```music
||: ClefG2 TSC Bm 5-4i 6-8i 6-8i 2-4 2-4 | 1-4 2-2 R1 :||
```
Words go un-der by hand
```

- A clef is `Clef`, its letter and the line it sits on, counted from the bottom: `ClefG2` treble, `ClefG1` French violin, `ClefF3` baritone, `ClefF4` bass, `ClefF5` sub-bass, `ClefC1` soprano, `ClefC2` mezzo-soprano, `ClefC3` alto, `ClefC4` tenor and `ClefC5` baritone, which reads like `ClefF3`. The C clefs are `\ued00` to `\ued04` of `staff.png`, as tall as the staff.
- `TSC` is common time and `TS3/4` a time signature; the font has 8, 6, 4, 3 and 2 both above and below.
- A key such as `C`, `F#`, `Bb`, `Am` or `Ebm` draws its sharps or flats where the clef before it puts them, treble without one.
- A note is its place and the denominator of its length: `1-2` is a half note on B3. Places go from 0, A3, to 16, C6, as on a treble staff, under any clef; lengths are 1, 2, 4 and 8. Stems go up below 8, B4, and down from it. A trailing `i` turns a stem the other way, `d` sets it up and `p` down: `7-4p`. The font has up stems from 12, F5, down and down stems from 5, F4, up, so where it has no stem the asked way the note keeps the one it has, and a whole note has none to turn. Notes from 14 up and from 2 down get their ledger lines.
- `#`, `b` or `n` before a note is a sharp, flat or natural: `#6-4`.
- `(2-1 4-1 6-1)` is a chord, its notes over each other, stemmed the way its note furthest from the middle line goes. Its accidentals stand in columns left of it as engraved: the highest nearest the notes, then the lowest, then the next highest and next lowest, each in the nearest column where no other is closer than a seventh.
- `R-4` or `R4` is a rest, by the same lengths.
- `|` is a bar, `||` a double bar, `|||` a stop, its thick line first when it opens the block, `||:` and `:||` repeats. A block opens and closes with a bar, a plain one when it has none.
- `staff:gray` and `symbol:#5a1f8c` set the color of the staff, with its ledger lines, and of everything drawn over it, the bars too, for the whole block. A color is one of the 16 names, such as `dark_aqua`, or `#rrggbb`; the defaults are `#aaaaaa` and `#000000`, and each can be set once a block.
- `\ue600`, or the glyph itself, is that glyph of the font, and glyphs written one after another join up, as `\ue600 \ue601 \ue602 \ue603`, the glockenspiel triplet.

A block is one staff line across the page, 114 pixels: the room after its notes is shared out to reach it, or taken in down to a pixel when the music is wider. Only music that still does not fit is broken over more lines, at a bar, each line opening with the clef and key again and reaching across the page too. The staff reaches 20 pixels above its line, so it gets two empty lines over it. The staff itself ends within its own line, so a line of words right after the block clears it, and only notes under the staff, C4 and lower, reach into that line. Lining the words up under the notes is done by hand, with padding. `music_notation_test_book` shows all of it.

## Hyphenation

A word wider than a whole line cannot be moved down to fit, so the game breaks it between two letters. In a locale with hyphenation patterns, `en_us` for now, it breaks at a syllable with a hyphen instead, and the hyphen goes into the text as `-` and a line break.

- The break is the last one that fits with its hyphen in what is left of the line the word comes after: `By Valentina` becomes `By Val-` and `entina` when the word is too wide for a line.
- If no break fits there, it is the last one that fits a line of its own. Without any, the word breaks between letters.
- A word that fits a line is never hyphenated. When `By Valentina` is too wide but `Valentina` is not, it wraps to `By` and `Valentina`.
- Code and `<span>` text are never hyphenated.

The patterns are the dependencies `hypher` and `hyphenation.en-us`, installed with `npm i`.

## Test books

`formatting_test_book`, `code_block_test_book`, `music_notation_test_book` and the `*_test_book` font books show every feature in game. They are not in any loot pool, give them with `/trigger give_book_<id>_by_<author>` (`give_book_<id>` for `unattributed`, `give_debug_book_<id>` for `debug`) on a dev build.
