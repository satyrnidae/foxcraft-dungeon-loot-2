# Books

Written book loot is made from the markdown files here. This file has no frontmatter, so the generator skips it, like any markdown file without one. Edit the markdown and never the generated files; `mcb build` runs `scripts/book_loot_gen.js` on every build, or run `node scripts/book_loot_gen.js` by hand, add `--check` to write nothing and fail when output is stale. Generator internals are in `scripts/README.md`.

## Files

- One book is `src/books/<locale>/<id>.md`, for example `src/books/en_us/enderman.md`. The id is the file name, lowercase with underscores.
- `en_us` is the reference. It writes the item modifier `data/foxcraft_dungeon_loot/item_modifier/random_loot/book/generated/<id>.json` and the loot table `loot_table/item/random_loot/book/generated/<id>.json`, both gitignored and made by every build. A file in those `generated` folders without a markdown source is deleted, so removing or renaming a book cleans up after itself. Hand-written book files beside them are never touched. Adding a book to a random loot pool is still done by hand, or point the pool at `item/random_loot/book/generated/random_book`,, or at `item/random_loot/book/generated/random_book`. `random_book` rolls one of all generated books and `random_<rarity>_book` one of a rarity, for common to cursed. A `debug: true` book is left out of all of them. A rarity without a book is an empty table that drops nothing. Loot tables have no tags, and those names are not usable as book ids.
- Every locale writes its text to `texturepack/assets/foxcraft_dungeon_loot/lang/<locale>.json`, committed. A translation is the same markdown in another locale folder. Pages are cut by the text, so a translation that cuts differently gets a warning and the English page structure.
- Dev builds get `/trigger give_<id>` for every en_us book. A release build adds none; `/function foxcraft_dungeon_loot:give/give_<id>` stays.

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
- A `lore` line is plain text, or a JSON or SNBT text component when it starts with `{` or `[`, for example `{"text":"Hush","color":"gray","italic":true}` or `["A ",{"text":"list","bold":true}]`, kept on one line. The whole block can also be one JSON or SNBT list after `lore:`, over as many lines as it takes, `lore: ["first", {"text":"second","color":"gray"}]`, where every string is plain text and every object or list a component. A line is saved as written and its width is measured from its text. A component line is never joined or wrapped by the reflow.
- `lore` lines are wrapped by hand and stay within 44 average characters, 226 pixels. The script warns, and a test fails, for a line over that or one that stops early. When a book has such a line, the warning ends with the whole lore block reflowed: lines that do not end in punctuation are joined with the next, then wrapped to the width, and the Rarity line is left alone. Paste it under `lore:`.

## Pages

- Text flows over the pages by itself. A newline is a line break, a blank line is an empty line, and a long line wraps. A page holds 14 lines of 114 pixels.
- A line of only `---` (spaces around it are fine) is a manual page break. A page never starts or ends with an empty line.
- A line that starts at a newline keeps its indentation, a line that starts at a wrap loses its leading spaces, and every line loses its trailing spaces.
- Widths come from the font of each glyph, bold is a pixel wider. A page past the editor limit of 1024 characters, a book over 100 pages and a font that is not defined anywhere all warn.
- Spans do not reach across a page break. Close them first. A `---` in a code block, or with other text on its line, is text, not a break.

## Formatting

- `**bold**`, `*italic*` or `_italic_`, `__underlined__`, `~~strikethrough~~`, `||obfuscated||`. `\*` escapes a marker.
- `# Header`, any number of `#`, is bold and underlined with an empty line under it.
- `` `inline code` `` and fenced blocks are set in `foxcraft_dungeon_loot:pixel_mono`. The text is literal, nothing in it is markup. A block keeps its indentation and a `#` in it is not a heading. A block with a language after the fence is colored: `mcfunction`, `json`, `javascript` or `js`, `bash` or `sh`, `python` or `py`, `yaml` and `java`. Anything else stays plain.
- `<font color="gray" face="minecraft:illageralt" shadow="#80ff0000">text</font>`: color is a name or `#rrggbb`, face is the font, shadow is `#aarrggbb`.
- `<filter as="darn">damn</filter>`: players with chat filtering on see `as` in its place. `as` takes the same markdown and inherits the formatting around it. Both readings have the same page count.
- `<style class="url">text</style>`: the class `.url` from the stylesheet. Several names, `class="url warn"`, apply in order and a later one wins. An unknown class stops the build. Inside the tag the usual markup still works, and a `<font>` or `<a>` inside overrides it.
- `class` also works on `<font>`, `<a>` and `<span>`, as `<a class="url" href="...">`. The default style of the tag comes first, then the class, then the attributes of the tag, so `<font class="url" color="red">` is red and `<font class="url" face="minecraft:alt">` takes the font from the tag. A `<span class>` is also kept from being hyphenated.
- `<span>text</span>`: no style of its own, the `span` type or a class can add one. The words inside are never hyphenated, for text that is not a word, such as a name in a made-up language or a string of symbols. It leaves no trace in the page.

## Styles

The `styles` of the frontmatter work like a small stylesheet. A key is a selector, a value is a style.

- Keys and values are SNBT, with a little slack: a key can be quoted or not, `.url` and `".url"` are the same, and a value can be an unquoted id, link or color, `font: foxcraft_dungeon_loot:hexenaat` or `color: #ff8800`.
- A key that starts with a dot is a class of your own, `.url`, used as `class="url"` on `<style>`, `<font>`, `<a>` and `<span>`.
- A key without a dot names a format type and changes how that type looks by default. The names are:
  - `body`: all of the text.
  - `header` for `#` headers of every level, and `h1` to `h6` for a level. A header is bold and underlined, `header` and then its level are added to that.
  - `bold`, `italic`, `underline`, `strikethrough` and `obfuscated`: the markdown formats. `**x**` stays bold and takes what the type adds. Set `bold: false` in `bold` to take the bold off, or `italic: false` in `italic` for a color without slant.
  - `code`: inline code and code blocks. The colors of a highlighted block win over it.
  - `a`, `font` and `span`: the tags. The class and the attributes of the tag come after them.
- A name that is neither a dotted class nor one of those is an error.
- A style is a compound of `color` (a name or `#rrggbb`), `font`, `bold`, `italic`, `underline`, `strikethrough`, `obfuscated` and `shadow_color` (an integer or `#aarrggbb`). Every key is optional and anything else is an error. A flag that is `false` turns the format off where the text around it has it on.
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
Some **gold bold** text, and a <a class="url" href="https://example.com">blue link</a>.
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

## Hyphenation

A word wider than a whole line cannot be moved down to fit, so the game breaks it between two letters. In a locale with hyphenation patterns, `en_us` for now, it breaks at a syllable with a hyphen instead, and the hyphen goes into the text as `-` and a line break.

- The break is the last one that fits with its hyphen in what is left of the line the word comes after: `By Valentina` becomes `By Val-` and `entina` when the word is too wide for a line.
- If no break fits there, it is the last one that fits a line of its own. Without any, the word breaks between letters.
- A word that fits a line is never hyphenated. When `By Valentina` is too wide but `Valentina` is not, it wraps to `By` and `Valentina`.
- Code and `<span>` text are never hyphenated.

The patterns are the dependencies `hypher` and `hyphenation.en-us`, installed with `npm i`.

## Test books

`formatting_test_book`, `code_block_test_book` and the `*_test_book` font books show every feature in game. They are not in any loot pool, give them with `/trigger give_<id>` on a dev build.
