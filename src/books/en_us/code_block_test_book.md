---
title: Code Block Test Book
author: Claude
rarity: epic
lore:
  Dev only, not in any loot table.
  Syntax colors of code blocks.
debug: true
---

# Code Blocks
A fenced block is colored by the language after the fence.

Known: mcfunction, json, js, bash, python, yaml and java.

No language, or an unknown one, stays plain.
<br>
# mcfunction
```mcfunction
# tick
say hi
tp @s ~ ~1 ~
give @p stone 1
execute as @a
  at @s
  run say hi
effect give @a
  speed 5 1 true
```
<br>
# json
```json
{
  "a": 1,
  "b": [1, 2],
  "ok": true,
  "n": null,
  "s": "text"
}
```
<br>
# javascript
```js
// add
const f = (a) =>
  a + 1;
if (x) {
  go("hi", 2);
}
```
<br>
# bash
```bash
# list
for f in *; do
  echo "$f"
done
ls -l | wc -l
```
<br>
# python
```python
# square
def sq(x):
  return x * x
print(sq(3))
```
<br>
# yaml
```yaml
# pack
name: fdl
count: 3
tags:
  - loot
  - book
```
<br>
# java
```java
// hi
class A {
  int n = 1;
  void f() {
    n++;
  }
}
```
<br>
# Plain
```
no language
  stays plain
# not a heading
**not bold**
```
```rust
fn main() {}
```
Inline `code` stays plain.
