---
title: Formatting Test Book
author: Debug
rarity: epic
lore: Dev only, not in any loot table. Every format the book generator knows.
styles: {
  body: {
    char: "="
  },
  horiz: {
    color: dark_gray,
    bold: true
  },
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
  },
  .tildehoriz: {
    char: "~",
    color: dark_aqua
  },
  .underhoriz: {
    char: " ",
    underline: true,
    color: gold
  },
  .center: {
    align: center
  },
  .redcenter: {
    align: center,
    color: "red"
  },
  .nocenter: {
    align: left
  },
  .right: {
    align: right
  },
  .redright: {
    align: right,
    color: "red"
  },
  .intentionalblank: {
    italic: true,
    color: gray,
    align: center
  }
}
debug: true
---

# Formatting Test
<vcenter>
Page one. This book is given by
/trigger give_formatting_test_book
and by nothing else.
Pages fill by themselves, 14 lines
each, and a newline is a line break.
<br>
# Styles
<vcenter>
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
<vcenter>
**Bold with *italic inside* and
__underlined inside__ it, then
plain bold again.**

*Italic around **bold around
~~strike~~** and back.*
<br>
# Colors
<vcenter>
<font color="dark_red">dark_red</font> <font color="red">red</font> <font color="gold">gold</font> <font color="yellow">yellow</font>
<font color="dark_green">dark_green</font> <font color="green">green</font> <font color="aqua">aqua</font>
<font color="dark_aqua">dark_aqua</font> <font color="dark_blue">dark_blue</font> <font color="blue">blue</font>
<font color="light_purple">light_purple</font> <font color="dark_purple">dark_purple</font>
<font color="white">white</font> <font color="gray">gray</font> <font color="dark_gray">dark_gray</font> <font color="black">black</font>
<br>
# More colors
<vcenter>
Hex: <font color="#ff8800">#ff8800</font> and <font color="#3366cc">#3366cc</font>.

A <font color="red">red **bold** word</font> inside a line.
<br>
# Fonts
<vcenter>
default: The quick brown fox.
<font face="minecraft:alt">alt: The quick brown fox.</font>
<font face="minecraft:illageralt">illageralt: The quick brown fox.</font>
<font face="minecraft:uniform">uniform: The quick brown fox.</font>
<font face="minecraft:alt" color="aqua">**alt, aqua and bold**</font>
<br>
# Shadow
<vcenter>
<font shadow="#ffff0000">Red shadow</font>

<font shadow="#80000000" color="white">Faint shadow</font>

<font color="gold" shadow="#ff552200">Gold with a dark orange shadow</font>
<br>
# Inline code
<vcenter>
Use `/trigger give_book` to give one, or `font: a:b` in the frontmatter.

It stays literal: `**not bold**`, `_not italic_` and `<font>`.

Inside **bold `code`** and *italic `code`*.

A lone ` backtick stays one.
<br>
# Code blocks
<vcenter>
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
<vcenter>
<a on_hover='{action:show_text,value:"Hover text"}'>Hover over this.</a>

<a on_click='{action:change_page,page:1}'>Click to go to page 1.</a>

<a on_click='{action:copy_to_clipboard,value:"copied from the formatting test book"}' on_hover='{action:show_text,value:"Copies a line"}'>Click to copy, hover to read.</a>

<a href="https://minecraft.wiki/w/Written_Book">Open the wiki page.</a>
<br>
# Classes
<style class=".url">A url style</style>
<style class=".warn">A warn style</style>
<style class=".url .warn">Both, warn wins</style>
**Bold <style class=".url">not bold</style> bold**
<a class=".url" href="https://example.com">A styled link</a>
<font class=".url" color="red">Class, red color</font>
<font class=".url" face="minecraft:alt">Class, alt font</font>
<br>
# Centered styles
<vcenter>
<style class=".center">Starts</style> the line.
<style class="center">Built-in</style> center.
Mid-line <style class=".center">is ignored</style>.
Mid-line <style class=".redcenter">but wrapping onto the next lines centers those lines</style> after.
<style class=".center"><style class=".nocenter">Turned off</style> inside.</style>
<br>
# Aligned styles
<vcenter>
<style class=".right">Right aligned</style>
<style class=".redright">A longer red run that wraps onto the next lines, which stay right aligned</style>
<style class=".right"><style class=".nocenter">Left again</style> inside.</style>
Left by default.
<br>
# Hyphenation
<vcenter>
A word wider than a line breaks at a syllable:
antidisestablishmentarianism

In a span it does not:
<span>antidisestablishmentarianism</span>
<br>
# Everything
<vcenter>
<a on_hover='{action:show_text,value:"All at once"}'><font color="light_purple" face="minecraft:alt">**Bold, *italic*, __underlined__, ~~struck~~ and ||hidden||** in alt.</font></a>

100% sure, with a percent sign.

Last line, then the page ends.
<br>
# Horizontal lines
A gray line of the body char =, as the horiz style says, fills the page exactly:
---
And another one below.
---
Text between.
<style class=".tildehoriz">
---
</style>
Tilde line above, blank underlined below:
<style class=".underhoriz">
---
</style>
A class without a char keeps the one of horiz:
<style class=".warn">
---
</style>
<br>
# Tallies
Seven: `7`tally.

Octal `0o17`tally, hex `0xf`tally, binary `0b1111`tally

Tallied: `IIIII III`tally!

Forty-five wraps:
`45`tally
<br>
<vcenter>
<style class=".intentionalblank">This page intentionally left blank.</style>