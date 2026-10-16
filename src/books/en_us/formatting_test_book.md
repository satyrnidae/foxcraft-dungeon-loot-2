---
title: Formatting Test Book
author: Claude
rarity: epic
lore:
  Dev only, not in any loot table.
  Every format the book generator knows.
styles: {
  .url: {
    color: "blue",
    bold: false,
    italic: false,
    underline: true,
    shadow_color: "#40000000"
  },
  .warn: {
    color: "#ff8800",
    italic: true
  }
}
debug: true
---

# Formatting Test
Page one. This book is given by
/trigger give_formatting_test_book
and by nothing else.
Pages fill by themselves, 14 lines
each, and a newline is a line break.
<br>
# Styles
**bold**, *italic*, _italic too_,
__underlined__, ~~struck out~~ and
||obfuscated text||.

Stacked: ***bold italic***,
**__bold underlined__**,
~~*struck italic*~~.

Escaped: \*not italic\* and \_not\_.
Snake_case_names stay as written.
<br>
# Nesting
**Bold with *italic inside* and
__underlined inside__ it, then
plain bold again.**

*Italic around **bold around
~~strike~~** and back.*
<br>
# Colors
<font color="dark_red">dark_red</font> <font color="red">red</font> <font color="gold">gold</font> <font color="yellow">yellow</font>
<font color="dark_green">dark_green</font> <font color="green">green</font> <font color="aqua">aqua</font>
<font color="dark_aqua">dark_aqua</font> <font color="dark_blue">dark_blue</font> <font color="blue">blue</font>
<font color="light_purple">light_purple</font> <font color="dark_purple">dark_purple</font>
<font color="white">white</font> <font color="gray">gray</font> <font color="dark_gray">dark_gray</font> <font color="black">black</font>
<br>
# More colors
Hex: <font color="#ff8800">#ff8800</font> and <font color="#3366cc">#3366cc</font>.

A <font color="red">red **bold** word</font> inside a line.
<br>
# Fonts
default: The quick brown fox.
<font face="minecraft:alt">alt: The quick brown fox.</font>
<font face="minecraft:illageralt">illageralt: The quick brown fox.</font>
<font face="minecraft:uniform">uniform: The quick brown fox.</font>
<font face="minecraft:alt" color="aqua">**alt, aqua and bold**</font>
<br>
# Shadow
<font shadow="#ffff0000">Red shadow</font>

<font shadow="#80000000" color="white">Faint shadow</font>

<font color="gold" shadow="#ff552200">Gold with a dark orange shadow</font>
<br>
# Inline code
Use `/trigger give_book` to give one, or `font: a:b` in the frontmatter.

It stays literal: `**not bold**`, `_not italic_` and `<font>`.

Inside **bold `code`** and *italic `code`*.

A lone ` backtick stays one.
<br>
# Code blocks
```
function hello() {
  # a comment, not a heading
  say **no markup** here

  say "indented and spaced"
}
```
Text after the block, in the book font.
<br>
# Events
<a on_hover='{action:show_text,value:"Hover text"}'>Hover over this.</a>

<a on_click='{action:change_page,page:1}'>Click to go to page 1.</a>

<a on_click='{action:copy_to_clipboard,value:"copied from the formatting test book"}' on_hover='{action:show_text,value:"Copies a line"}'>Click to copy, hover to read.</a>

<a href="https://minecraft.wiki/w/Written_Book">Open the wiki page.</a>
<br>
# Classes
<style class="url">A url style</style>
<style class="warn">A warn style</style>
<style class="url warn">Both, warn wins</style>
**Bold <style class="url">not bold</style> bold**
<a class="url" href="https://example.com">A styled link</a>
<font class="url" color="red">Class, red color</font>
<font class="url" face="minecraft:alt">Class, alt font</font>
<br>
# Hyphenation
A word wider than a line breaks at a syllable:
antidisestablishmentarianism

In a span it does not:
<span>antidisestablishmentarianism</span>
<br>
# Everything
<a on_hover='{action:show_text,value:"All at once"}'><font color="light_purple" face="minecraft:alt">**Bold, *italic*, __underlined__, ~~struck~~ and ||hidden||** in alt.</font></a>

100% sure, with a percent sign.

Last line, then the page ends.
