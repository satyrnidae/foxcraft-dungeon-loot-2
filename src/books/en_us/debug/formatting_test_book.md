---
title: Formatting Test Book
author: Debug
rarity: epic
generation: tattered
lore: Dev only, not in any loot table. Every format the book generator knows.
styles: {
  .nohyphen: { hyphenate: false },
  body: {
    char: "="
  },
  hr: {
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
<!-- vertical-align-center -->
Page one. This book is given by
/trigger give_formatting_test_book
and by nothing else.
Pages fill by themselves, 14 lines
each, and a newline is a line break.
<!-- page-break -->
# Styles
<!-- vertical-align-center -->
**bold**, *italic*, _italic too_,
__underlined__, ~~struck out~~ and
||obfuscated text||.

Stacked: ***bold italic***,
**__bold underlined__**,
~~*struck italic*~~.

Escaped: \*not italic\* and \_not\_.
Snake_case_names stay as written.
<!-- page-break -->
# Nesting
<!-- vertical-align-center -->
**Bold with *italic inside* and
__underlined inside__ it, then
plain bold again.**

*Italic around **bold around
~~strike~~** and back.*
<!-- page-break -->
# Colors
<!-- vertical-align-center -->
<font color="dark_red">dark_red</font> <font color="red">red</font> <font color="gold">gold</font> <font color="yellow">yellow</font>
<font color="dark_green">dark_green</font> <font color="green">green</font> <font color="aqua">aqua</font>
<font color="dark_aqua">dark_aqua</font> <font color="dark_blue">dark_blue</font> <font color="blue">blue</font>
<font color="light_purple">light_purple</font> <font color="dark_purple">dark_purple</font>
<font color="white">white</font> <font color="gray">gray</font> <font color="dark_gray">dark_gray</font> <font color="black">black</font>
<!-- page-break -->
# More colors
<!-- vertical-align-center -->
Hex: <font color="#ff8800">#ff8800</font> and <font color="#3366cc">#3366cc</font>.

A <font color="red">red **bold** word</font> inside a line.
<!-- page-break -->
# Fonts
<!-- vertical-align-center -->
default: The quick brown fox.
<font face="minecraft:alt">alt The quick brown fox</font>
<font face="minecraft:illageralt">illageralt The quick brown fox</font>
<font face="minecraft:uniform">uniform: The quick brown fox.</font>
<font face="minecraft:alt" color="aqua">**alt aqua and bold**</font>
<!-- page-break -->
# Shadow
<!-- vertical-align-center -->
<font shadow="#ffff0000">Red shadow</font>

<font shadow="#80000000" color="white">Faint shadow</font>

<font color="gold" shadow="#ff552200">Gold with a dark orange shadow</font>
<!-- page-break -->
# Inline code
<!-- vertical-align-center -->
Use `/trigger give_book` to give one, or `font: a:b` in the frontmatter.

It stays literal: `**not bold**`, `_not italic_` and `<font>`.

Inside **bold `code`** and *italic `code`*.

A lone ` backtick stays one.
<!-- page-break -->
# Code blocks
<!-- vertical-align-center -->
```
function hello() {
  # a comment, not a heading
  say **no markup** here

  say "indented and spaced"
}
```
Text after the block, in the book font.
<!-- page-break -->
# Events
<!-- vertical-align-center -->
<a data-on-hover='{action:show_text,value:"Hover text"}'>Hover over this.</a>

<a data-on-click='{action:change_page,page:1}'>Click to go to page 1.</a>

<a data-on-click='{action:copy_to_clipboard,value:"copied from the formatting test book"}' data-on-hover='{action:show_text,value:"Copies a line"}'>Click to copy, hover to read.</a>

<a href="https://minecraft.wiki/w/Written_Book">Open the wiki page.</a>
<!-- page-break -->
# Classes
<span class=".url">A url style</span>
<span class=".warn">A warn style</span>
<span class=".url .warn">Both, warn wins</span>
**Bold <span class=".url">not bold</span> bold**
<a class=".url" href="https://example.com">A styled link</a>
<font class=".url" color="red">Class, red color</font>
<font class=".url" face="minecraft:alt">Class alt font</font>
<!-- page-break -->
# Centered styles
<!-- vertical-align-center -->
<span class=".center">Starts</span> the line.
<span class="center">Built-in</span> center.
Mid-line <span class=".center">is ignored</span>.
Mid-line <span class=".redcenter">but wrapping onto the next lines centers those lines</span> after.
<span class=".center"><span class=".nocenter">Turned off</span> inside.</span>
<!-- page-break -->
# Aligned styles
<!-- vertical-align-center -->
<span class=".right">Right aligned</span>
<span class=".redright">A longer red run that wraps onto the next lines, which stay right aligned</span>
<span class=".right"><span class=".nocenter">Left again</span> inside.</span>
Left by default.
<!-- page-break -->
# Hyphenation
<!-- vertical-align-center -->
A word wider than a line breaks at a syllable:
antidisestablishmentarianism

In a span it does not:
<span class=".nohyphen">antidisestablishmentarianism</span>
<!-- page-break -->
# Everything
<!-- vertical-align-center -->
<a data-on-hover='{action:show_text,value:"All at once"}'><font color="light_purple" face="minecraft:alt">**Bold *italic* __underlined__ ~~struck~~ and ||hidden||** in alt</font></a>

100% sure, with a percent sign.

Last line, then the page ends.
<!-- page-break -->
# Horizontal lines
A gray line of the body char =, as the hr style says, fills the page exactly:
---
And another one below.
---
Text between.
<hr class=".tildehoriz">
Tilde line above, blank underlined below:
<hr class=".underhoriz">
A class without a char keeps the one of hr:
<hr class=".warn">
<!-- page-break -->
# Tallies
Seven: <span class="tally">7</span>.

Octal <span class="tally">0o17</span>, hex <span class="tally">0xf</span>, binary <span class="tally">0b1111</span>

Tallied: <span class="tally">IIIII III</span>!

Forty-five wraps:
<span class="tally">45</span>
<!-- page-break -->
<!-- vertical-align-center -->
<span class=".intentionalblank">This page intentionally left blank.</span>
