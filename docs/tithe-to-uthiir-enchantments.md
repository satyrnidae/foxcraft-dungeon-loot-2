# Tithe to Uthiir: from item activation to item and enchantment activation

The Tithe to Uthiir was the first item built on custom enchantments, as a proof of concept. This records what it was, what it is now, why each piece landed where it did, and the limits of 26.3 that shaped it. For the working rules see the Enchantments section of `CLAUDE.md`.

## Before

The Tithe was a single netherite sword. Every effect was keyed off "the held item is a Tithe", through `custom_data` on the item and, later, flags in it.

- Identity: `DungeonLootId:81` in `custom_data`, set by `item_modifier/epic/tithe_to_uthiir/define.json`.
- Aura of Uthiir: an advancement fired on a hit against an arthropod, the reward function rolled a D20 with `rng` and on a 20 ran the wither aura around the player.
- Haemolymph Sacrifice: the same advancement, on a kill, gave Speed, Resistance and Regeneration.
- Balm of the Spider God: a stat objective `minecraft.used:minecraft.spider_eye` was polled every tick, gated by the `ProcessSpiderEye` flag in `custom_data`. It cleared poison.
- Everything was gated by checking the item, so a second sword could never share any of it.

## Steps that led here

1. Balm gained Strength II for 30 seconds on the spider eye event.
2. The sword gained weapon tiers by rarity, using the `satyrn.fdl.loot.variant` score: netherite as the default epic one, diamond as rare, iron as uncommon and copper as common. Per-tier flags in `custom_data` (`TitheAura`, `TitheHaemolymph`, `TitheStrength:<seconds>`) turned effects off for the lower tiers, read with `execute if items entity @s weapon.* *[custom_data~{...}]`.
3. Each tier got its own modifier file, `item_modifier/epic/tithe_to_uthiir/<tier>.json`, and vanilla sword textures with the spider overlay. `define.json` stayed as the loot table's root modifier for the shared id and enchantments.
4. The three effects moved into real enchantments. The flags in `custom_data` and the item checks went away. This is the change the rest of this page covers.

## The three enchantments

All live in `data/foxcraft_dungeon_loot/enchantment/`, with ids `foxcraft_dungeon_loot:<name>`. They are not tied to the Tithe, they work on any sword that carries them, even one enchanted with `/enchant` or an anvil.

| Enchantment | Max level | Effect hook | Cost |
|---|---|---|---|
| `aura_of_uthiir` | 1 | `post_attack`, native | min and max 7 |
| `haemolymph_sacrifice` | 2 | `post_attack`, native | placeholder, 1 plus 1 per level |
| `balm_of_the_spider_god` | 4 | none, found by predicate | placeholder, 1 plus 1 per level |

All three use `supported_items: #minecraft:swords` and anvil cost 8. Aura is `mainhand`, Balm is `hand` so either hand counts, Haemolymph is `mainhand`.

They are in no enchantment tag, so they never roll in an enchanting table, loot or trades. A unit test keeps it that way. `/enchant` and anvils still work.

### Which hooks are native

26.3 offers `post_attack`, `post_piercing_attack`, `hit_block`, `tick`, `location_changed`, `projectile_spawned` and others, but no "killed an entity" and no "consumed an item" hook. A kill can still be seen from `post_attack`, because the effects run after the hit is applied and a dying entity has not despawned yet. So:

- Aura of Uthiir maps cleanly. Its enchantment has one `post_attack` effect, with the attacker as the enchanted entity and the victim as the affected one. Requirements: the victim is in `#foxcraft_dungeon_loot:arthropods` and a `random_chance` of 0.05, which replaces the old D20 roll. The effect is `run_function`, which runs `enchantment/aura_of_uthiir/post_attack` as the victim at the victim's position: sound, crit particles, a short-lived radius cloud, and Wither III for 5 seconds on `#foxcraft_dungeon_loot:hostile` entities within 10 blocks. The cloud is only visual and takes its red from `potion_contents.custom_color`, since the old `Color` tag is gone in 26.3.
- Haemolymph Sacrifice uses `post_attack` as a kill check. The attacker is both the enchanted and the affected entity, so `run_function` runs as the player, while the requirements are evaluated on the victim: it is in `#foxcraft_dungeon_loot:arthropods` and an NBT predicate `{Health:0.0f}` says the hit was lethal. The effect runs `enchantment/haemolymph_sacrifice/on_killed_arthropod`. This replaced a `player_killed_entity` advancement with its reward function, which counted kills by any means while the sword was held. The `post_attack` version only counts melee and sweep hits.
- Balm of the Spider God is a marker, with nothing to hook. The enchantment is the data, an existing function does the work, and a predicate decides whether the enchantment is on the item.

## Where the code lives

Functions: `src/foxcraft_dungeon_loot/enchantment/<name>.mcb`, compiled to `enchantment/<name>/<function>`. The Tithe's own source, `item/epic/tithe_to_uthiir.mcb`, holds only its give functions.

| Piece | File or id |
|---|---|
| Aura effect | `enchantment/aura_of_uthiir/post_attack` |
| Haemolymph effects | `enchantment/haemolymph_sacrifice/on_killed_arthropod`, run by the enchantment's `post_attack` effect |
| Balm | `enchantment/balm_of_the_spider_god/on_spider_eye_eaten`, in the tag `#foxcraft_dungeon_loot:on_spider_eye_eaten` |
| Spider eye gate | `predicate/event/process_spider_eye`, true while any Balm level is held in either hand |

Effects by level:

- Haemolymph I: Speed I 10 s, Resistance II 5 s, Regeneration 3 s. Level II: Speed II 10 s, Resistance III 5 s, Regeneration 5 s.
- Balm I to III: Strength I to III for 10 s. Level IV: Strength III for 30 s, three times Balm III's length. Every level clears poison first.

The higher level is a stronger effect, except Balm IV, which is a longer one.

## Detecting the enchantments

`predicate/enchantment/<name>/`:

- `haemolymph_sacrifice/level_1`, `level_2`: the main hand has the enchantment at an exact level.
- `balm_of_the_spider_god/level_1` to `level_4`: the exact level in either hand.

They check only the enchantment. An earlier version also required `DungeonLootId:81`, first inline and then through the Tithe's `in_main_hand` and `in_off_hand` predicates, which kept the effects Tithe-only. Those two predicates and the id checks were removed so any sword with the enchantment gets the effect. Levels are tested exactly, not as a minimum, so effects never stack from several tiers.

`Scan.java` swaps pack enchantment ids for vanilla stand-ins, because the vanilla registry cannot take them, and inlines pack predicates that reference other pack predicates.

## What stayed Tithe-only

The sword itself and its tiers:

| Tier | Base item | Rarity | Enchantments set |
|---|---|---|---|
| default | netherite sword | Epic | Aura 1, Haemolymph 2, Balm 4 |
| score 1 | diamond sword | Rare | Haemolymph 1, Balm 3 |
| score 2 | iron sword | Uncommon | Balm 2 |
| score 3 | copper sword | Common | Balm 1 |

Each pool in `loot_table/item/epic/tithe_to_uthiir.json` points at its tier file. `define.json` is the root modifier, so it runs on all four: the `DungeonLootId:81` tag and Bane of Arthropods V, Mending, Unbreaking V. Name, lore and the model come from the tier file. The lore text lives in `define.json` and the tier files. The enchantment tooltip lines come from the enchantments themselves, with names in `lang/en_us.json` as `enchantment.foxcraft_dungeon_loot.<name>`.

Uthiir's Grasp is an intrinsic of the Tithe and not an enchantment. It needs the item, found through `DungeonLootId` in `predicate/item/epic/tithe_to_uthiir/killed_with`, on the killer. The vanilla `spider`, `cave_spider` and `silverfish` loot tables in `data/minecraft/loot_table/entities/` each have an added pool that calls `loot_table/entity/uthiirs_grasp`, which gives the Grasp of Uthiir on 1 in 10 kills made with the sword.

## Give triggers

- `give_tithe_to_uthiir` is one dev-build trigger whose value is the tier, 1 copper up to 4 netherite. `give.js` takes the tier order from the loot table's default pool.
- Each enchantment has `give_<name>_book`, whose value is the level of the enchanted book, limited to its `max_level`.

## Tests added along the way

- Pack enchantments are in no enchantment tag.
- Every function under `src/.../enchantment/` is referenced, and every enchantment has a source file.
- Every enchantment has its book trigger, clamped to `max_level`, naming the right id.
- No lore line is repeated after modifiers run in order, which caught a base `define` inserting a blurb a tier file already wrote.
- Lore lines stay within 226 pixels, 44 average characters, on changed lines. Old over-width lines are todo entries.
- Summons carry no ignored pre-26.3 keys, as todo entries.
- `PackLoad.java` loads the enchantments, predicates and the advancement with the game's own registry loader.

## Open items

- Aura of Uthiir has no item check, only the enchantment on the held item. Its requirement is evaluated on the victim, so a check on the attacker's hand needs an attacker-side predicate.
- Haemolymph and Balm costs are placeholders. Tell me the numbers.
- The Haemolymph kill check relies on the victim reading `Health` 0 when `post_attack` runs. That follows from the jar, a lethal hit is applied before the post-attack effects, but it has not been seen in a game.
- The Aura's wither skips non-hostile arthropods such as bees, since they are not in `#foxcraft_dungeon_loot:hostile`. That is intended.
- Deilona's Holy Blessings has the same ignored area effect cloud `Color` the Aura had.
- Tithe swords already in worlds have no enchantments and no migration. Their old `custom_data` flags do nothing.
- Nothing here has been run in a 26.3 world yet. The manual checklist has entries for the enchantments, the tiers and the Grasp.

## Where this leads

The same split works for other items: a native hook where 26.3 has one, a marker enchantment plus a predicate and an existing function where it does not, and a loot table or modifier for anything that really belongs to the item.
