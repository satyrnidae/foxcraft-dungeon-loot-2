---
title: Music Notation Test Book
author: Claude
rarity: epic
lore:
  Dev only, not in any loot table.
  The music fence, drawn in the staff_notation font.
debug: true
---

```music
||: ClefTr TSC Bm 4-4i 6-8i 6-8i 2-4 2-4 | 1-4 2-2 R1 :||
```

Words go un-der by hand

```music
ClefA TS3/4 Eb (2-1 4-1 6-1) || R-2 R-4 | R-8 R-8 R-8 |||
```
---
```music
// Every accidental, from the lower extension to the upper one
#0-4 #1-4 #2-4 #3-4 #8-4 #13-4 #14-4 #15-4 #16-4
```

```music
b0-4 b1-4 b2-4 b3-4 b8-4 b13-4 b14-4 b15-4 b16-4
```

```music
n0-4 n1-4 n2-4 n3-4 n8-4 n13-4 n14-4 n15-4 n16-4
```
---
```music
ClefTe TS2/4 C 8-2 7-2i || ClefB TS6/8 Ab 9-8 10-8 11-8 12-8 |||
```

```music
staff:dark_aqua symbol:#5a1f8c ||: ClefTr G \ue600 \ue601 \ue602 R-4 3-4 :||
```
---
```music
// Chord accidentals in columns: the highest nearest the heads, then the lowest, then inwards
ClefTr (#2-1 #4-1 #6-1) | (b8-2 b10-2 b12-2 b14-2) |||
```

```music
// A seventh or more apart they share a column; mixed signs, and with and without
(#2-4 #9-4) (b3-4 n10-4) (#4-4 b5-4 n6-4) (n7-4 9-4 #11-4) |
```
---
```music
// Too long for one line even squeezed, so it breaks at a bar
||: ClefTr TS6/8 F#m 8-8 9-8 10-8 11-8 12-8 13-8 | 14-8 15-8 16-8 15-8 14-8 13-8
| 12-4 11-4 10-4 9-4 | 8-2 7-2 | 1-1 :||
```
