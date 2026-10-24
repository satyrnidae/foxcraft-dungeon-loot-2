---
title: Music Notation Test Book
author: Debug
rarity: epic
generation: tattered
lore:
  Dev only, not in any loot table.
  The music fence, drawn in the staff_notation font: every clef, bar line, accidental and stem.
debug: true
---

<center>__**Musical Notation Demo**__</center>

```music
||: ClefG2 TSC Bm 5-4i 6-8i 6-8i 2-4 2-4 | 1-4 2-2 R1 :||
```
Ly-rics can go un-der by hand

Alto, chord, rests
```music
ClefC3 TS3/4 Eb (2-1 4-1 6-1) || R-2 R-4 | R-8 R-8 R-8 |||
```
<br>
<center>__**Clefs**__</center>

Treble
```music
ClefG2 C# 8-4 || Cb 8-4 |||
```

French violin
```music
ClefG1 C# 8-4 || Cb 8-4 |||
```

Baritone, F clef
```music
ClefF3 C# 8-4 || Cb 8-4 |||
```

Bass
```music
ClefF4 C# 8-4 || Cb 8-4 |||
```

Sub-bass
```music
ClefF5 C# 8-4 || Cb 8-4 |||
```

Soprano
```music
ClefC1 C# 8-4 || Cb 8-4 |||
```

Mezzo-soprano
```music
ClefC2 C# 8-4 || Cb 8-4 |||
```

Alto
```music
ClefC3 C# 8-4 || Cb 8-4 |||
```

Tenor
```music
ClefC4 C# 8-4 || Cb 8-4 |||
```

Baritone, C clef
```music
ClefC5 C# 8-4 || Cb 8-4 |||
```
<br>


```music
ClefG2 TS2/4 8-4 8-4 | TS3/4 8-4 8-4 8-4 | TS6/8 8-8 8-8 8-8 |
```
2/4, 3/4, 6/8

```music
ClefF4 TS4/4 8-4 | TS3/2 8-2 | TS8/6 8-4 | TS2/3 8-4 |
```
4/4, 3/2, 8/6, 2/3
<br>
```music
| 8-4 || 8-4 ||| 8-4 ||: 8-4 :|| 8-4 |
```
Bars mid-line

```music
||| 8-4 8-4 |||
```
Stops

```music
||: 8-4 8-4 :||
```
Repeats
<br>
```music
|| 8-4 8-4 ||
```
Double bars

```music
8-4 8-4 ||:
```
Start repeat last

```music
|| |||
```
Bars alone
<br>
Sharps
```music
// Every accidental, from the lower extension to the upper one
#0-4 #1-4 #2-4 #3-4 #8-4 #13-4 #14-4 #15-4 #16-4
```

Flats
```music
b0-4 b1-4 b2-4 b3-4 b8-4 b13-4 b14-4 b15-4 b16-4
```

Naturals
```music
n0-4 n1-4 n2-4 n3-4 n8-4 n13-4 n14-4 n15-4 n16-4
```
<br>
Ledger lines
```music
16-4 15-4 14-4 2-4 1-4 0-4 16-1 0-1 |
```

Stems: i, d, p
```music
7-4 7-4i 7-4d 7-4p 9-8 9-8i 9-8d 9-8p |
```

Missing stems
```music
15-4i 1-4p 7-1p (4-4p 6-4d) (2-4 15-4) |
```
<br>
```music
// Chord accidentals in columns: the highest nearest the heads, then the lowest, then inwards
ClefG2 (#2-1 #4-1 #6-1) | (b8-2 b10-2 b12-2 b14-2) |||
```
Chord accidentals

```music
// A seventh or more apart they share a column; mixed signs, and with and without
(#2-4 #9-4) (b3-4 n10-4) (#4-4 b5-4 n6-4) (n7-4 9-4 #11-4) |
```
Shared columns
<br>
```music
ClefC4 TS2/4 C 8-2 7-2i || ClefF4 TS6/8 Ab 9-8 10-8 11-8 12-8 |||
```
Clef, key changes

```music
staff:dark_aqua symbol:#5a1f8c ClefG2 G \ue600 \ue601 \ue602 \ue603 R-4 3-4 :||
```
Colors, glyphs
<br>
```music
// Too long for one line even squeezed, so it breaks at a bar
||: ClefG2 TS6/8 F#m 8-8 9-8 10-8 11-8 12-8 13-8 | 14-8 15-8 16-8 15-8 14-8 13-8
| 12-4 11-4 10-4 9-4 | 8-2 7-2 | 1-1 :||
```
Wraps at bars

```music
ClefG2 8-8 9-8 10-8 11-8 12-8 13-8 8-8 9-8 10-8 11-8 12-8 13-8 8-8 9-8 10-8 11-8 12-8 13-8 || 8-8 9-8 10-8 11-8 12-8 13-8 8-8 9-8 10-8 11-8 12-8 13-8 8-8 9-8 10-8 11-8 12-8 13-8 |
```
Wraps at ||
