# Modernization inventory

Inventory only, nothing here is implemented. Feeds issue #140. Sources: the 26.3 client jar registries, attribute names included, (`DataComponents`, `EnchantmentEffectComponents`, `enchantment/effects/*`) and every `src/foxcraft_dungeon_loot/items/*.mcb`. Everything below is unverified in game.

## 1. Mechanism notes

A custom enchantment is a data file in `data/<ns>/enchantment/`. It names `supported_items`, `slots`, and `effects` keyed by effect component. Applying it through the item modifier (`set_enchantments`) ties the behavior to the item with no predicate, tag, clock or `effectsApplied` bookkeeping. Costs and open questions:

- It shows on the tooltip unless hidden through `tooltip_display.hidden_components`. Hiding is fine for pure flavor, a visible line is fine for a "Chainsaw I" style identity.
- `slots` takes `mainhand`, `offhand`, `hand`, `head`, `chest`, `legs`, `feet`, `armor`, `body`, `any`. That covers both the worn and the held cases below.
- `minecraft:tick` runs every tick while equipped, so `apply_mob_effect` there needs a short duration refreshed each tick or two. A 1000000 tick infinite effect is not an option inside it. Check the particle and icon flicker in game.
- `minecraft:attributes` is the cleanest passive: no effect icon, no HUD change, no clock, removed automatically when unequipped. Gameplay change from potion effect, see section 4.
- `post_attack` has `affected: attacker | victim | damaging_entity`, `enchanted: attacker | victim`, so on-hit effects on the target are possible. Entity effects: `apply_mob_effect`, `ignite`, `damage_entity`, `explode`, `apply_impulse`, `apply_exhaustion`, `summon_entity`, `spawn_particles`, `play_sound`, `change_item_damage`, `run_function`, `all_of`, `replace_block`, `replace_disk`, `set_block_properties`.
- `run_function` inside any hook runs as the entity named by the hook, which is the escape hatch for anything else, like `/posteffect`.
- Level based values: `linear`, `exponent`, `levels_squared`, `fraction`, `clamped`, `lookup`. Use one enchantment level per tier for the variant items.
- Enchantments stack with normal ones; `enchantable`/`exclusive_set` decide whether a table or anvil can add them. Pack items would be set by the modifier only.

## 2. Component inventory, per item

Sources for this section: the jar registry and https://minecraft.wiki/w/Data_component_format. Do not use https://minecraft.wiki/w/Item_components for this pack. That page documents the Bedrock components, including `digger`, `cooldown` and `wearable`. The Java equivalents are `tool`, `use_cooldown` and `equippable`. Component registry in 26.3 has these relevant to this pack. Used by the pack already: `custom_data`, `item_model`, `item_name`, `lore`, `enchantments`, `attribute_modifiers`, `tooltip_display`, `unbreakable`, `damage`, `max_damage`, `max_stack_size`, `potion_contents`, `instrument`, `jukebox_playable`, `profile`, `dyed_color`, `entity_data`, `rarity` (not used, see below). Candidates not used yet:

| Component | Fits | Notes |
|---|---|---|
| `use_cooldown` | all spell items: Bringer of Fear, Deilona's Holy Blessings, Downpour Amulet, Evoker's Tome, Feather of Quet Zala, How About No, Poncho Sanchez's Fate, Pride and Extreme Prejudice, Scripture of Cleansing, Silverfish Escape Artist, Hammer of Sol, Torenhia's Fist | Cooldown overlay on the item and server-side use block. Already in #140. Keep the score only where a ready sound fires. |
| `consumable` + `use_remainder` | Eye Cream, Gift of Sheep Island, Constantine's Gift, Buckwheat if it ever gets eaten | Gives eating animation, sound, particles and `on_consume_effects`: `apply_status_effects` with `effects` and `probability`, `clear_all_effects`, `remove_effects`, `teleport_randomly`, `play_sound`. Eye Cream and Gift of Sheep Island then need no `used` hook, no break step and no `remove` modifier. `use_effects` can disable the slowdown while using. |
| `food` | same as above | `nutrition`, `saturation`, `can_always_eat`. Stats apply only when `consumable` is also present. Eye Cream and Gift of Sheep Island are essentially one-shot potions. |
| `death_protection` | Totem of Deilona, Ima Leaf, Heros Amulet if wanted | Per the wiki, restores one health point when the holder would die, with optional `death_effects`. Same as the vanilla totem. The pack totems are passives, not undying, so only a candidate if one should save the holder. |
| `equippable` | Estudinae set, Gravilock Boots, Stompies, War Hog set, Quet Zala's Beloved | Already present on armor base items. Put `damage_on_hurt`, `equip_sound`, `asset_id` here for a custom model. `slot` accepts head, chest, legs, feet, body, mainhand, offhand and saddle, so the offhand totems and idols can be equippable in the offhand, which gives swap-by-right-click and `equip_sound`. Enchantment `slots` still decide where an enchantment effect applies. |
| `glider` | Wing of Quet Zala, Quet Zala's Beloved, Feather of Quet Zala | Empty compound. Equipped entities glide like with an elytra, and gliding uses durability. Elytra flight on a non-elytra chest item. Beloved currently simulates a parachute with slow falling on fall events; `glider` plus `equippable` chest gives real gliding. Gameplay change. |
| `tool` (`rules`, `default_mining_speed`, `damage_per_block`) | Chainsaw, Auto Pickaxe, Wand of Block State Editing | Replaces the haste clock; chainsaw plan is already in #140. Auto Pickaxe uses haste 2. The Wand has its own entry, see section 3.6. |
| `weapon` (`item_damage_per_attack`, `disable_blocking_for_seconds`) | Beta Iron Sword, Rogues Dagger, Pride items | Beta Iron Sword already damages itself in `on_hit` through an advancement; `weapon` + vanilla damage replaces the hook and the Unbreaking math. |
| `blocks_attacks` | Beta Iron Sword | The sword plays a shield sound on block. `blocks_attacks` is the native blocking behavior, with `block_sound`, `disabled_sound`, `damage_reductions`, `item_damage`, `bypassed_by`. Would replace the `on_block` event. Check whether the item can drop its shield base. |
| `attack_range`, `minimum_attack_charge`, `piercing_weapon`, `kinetic_weapon` | Hammer of Sol, Tor'Enhia's Fist, Rogues Dagger | `attack_range` sets `min_reach`, `max_reach` (default 3.0) and `hitbox_margin`; `minimum_attack_charge` is 0.0 to 1.0; `piercing_weapon` makes melee hit every entity along a ray and blocks mining; `kinetic_weapon` is the spear charge attack. Only if the item should hit at range instead of the snowball and raycast. |
| `damage_resistant` | Totem of Mysteria, War Hog's Seething Hatred, Gift of Sheep Island | Field `types` is a damage type tag. The item survives those types as an item entity or when equipped, for example `#minecraft:is_fire`. A custom tag works here too, see section 6. |
| `repairable`, `enchantable` | Repair with a specific coin or item; allow table enchanting | Optional. Makes tiered items behave like vanilla. |
| `minimum_attack_charge`, `attack_animation`, `interact_animation` | Cosmetic | Skip unless wanted. `attack_animation` has `type` whack, stab or none and `duration` in ticks. `swing_animation` is listed as removed on the wiki. |
| `intangible_projectile`, `piercing_weapon`, `charged_projectiles` | Spell Scroll Hail of Arrows | Not a clean fit. |
| `additional_trade_cost` | Trades | Already covered by `Offers`. |
| `cooking_fuel`, `brewing_fuel`, `compostable`, `villager_food` | Buckwheat | `compostable` takes `layers`. `villager_food` takes `nutrition` and was added in 26.3 snapshot 4. `cooking_fuel` takes `burn_time` and `speed_multiplier`, `brewing_fuel` takes `uses` and `speed_multiplier`. Buckwheat fits `villager_food` and `compostable` if it is a feed item; today it uses a 3 s clock and `InLove`. See section 3. |
| `rarity` | All | Pack uses name colors and `Rarity` custom_data. `rarity` would color the name by itself and change the tooltip name color. Decided against earlier, listed for completeness. |
| `creative_slot_lock`, `tooltip_style`, `lock`, `container_loot` | None | No fit. |

## 3. Item inventory

Each row: what the item does today, then the native replacement. "Enchant" means a custom enchantment from section 1. Order is by how much code it removes.

### 3.1 Passive potion effects while worn or held

All currently use a 10 tick clock, `effectsApplied` tag, `has_effects` predicate, `worn` or `in_*_hand` predicate and an `effect give ... 1000000`.

| Item | Slot | Effects | Replacement |
|---|---|---|---|
| Auto Pickaxe | mainhand | haste 2 | `tool` component for speed, or `minecraft:attributes` enchant with `mining_efficiency`. No effect icon. |
| Chainsaw | mainhand | haste 2 | `tool` with `#minecraft:mineable/axe`, see #140. |
| Wand of Block State Editing | mainhand | haste 101 | See section 3.6 and issue #138. `tool` with a high `default_mining_speed`, not an attribute. |
| Estudinae's Survival | head | conduit power, mining fatigue 1, saturation every 10 s | Conduit power and saturation via `tick` + `apply_mob_effect`. Mining fatigue via `attributes` `mining_efficiency` negative or `block_break_speed`. `water_breathing` stays an effect; conduit power is not an attribute. |
| Estudinae's Patience | chest | weakness 5 | `attributes` `attack_damage` add, negative. Easy win, loses the effect icon. |
| Estudinae's Guidance | feet | slowness 2, dolphins grace | `attributes` `movement_speed` negative multiplier; `tick` + `apply_mob_effect` for dolphins grace (or `water_movement_efficiency`/`submerged_mining_speed`/`oxygen_bonus` attributes). |
| Gravilock Boots | feet | slowness 2 | `attributes` `movement_speed` multiplier. Levitation-from-spark logic stays separate. |
| Stompies | feet | jump boost 2 | `attributes` `jump_strength` add; no clock, icon or hover. Also `safe_fall_distance` for fall damage. |
| War Hog's Insatiable Hunger | chest | hunger 2 | `tick` + `apply_exhaustion` is the direct fit: one value, no effect, no icon. Hunger effect adds exhaustion per tick; `apply_exhaustion` does the same. |
| War Hog's Seething Hatred | legs | fire resistance | `damage_immunity` with `damage_type: #minecraft:is_fire`, no effect, no clock. Direct vanilla analog, as fire protection would be. |
| Totem of Mysteria | offhand | fire resistance, sets fire on a timer | `damage_immunity` for fire plus `post_attack`/`tick` `ignite`. |
| Idol of Melimonas | offhand | jump boost 2, invisibility | `attributes` `jump_strength`; invisibility has no attribute, keep `tick` + `apply_mob_effect`. |
| Totem of Dendris | offhand | night vision, water breathing, resistance 2 | Night vision via `tick` effect; water breathing via `oxygen_bonus` attribute or effect; resistance via `damage_protection`. |
| Totem of Ekila | offhand | absorption 2, health boost, resistance 3, flying set: jump boost 3, slow falling | `attributes` `max_health`, `max_absorption`, `jump_strength`, `gravity`, `safe_fall_distance`; `damage_protection`. Two phases, grounded and flying, so two enchantments with a condition or `tick` + `all_of`. |
| Totem of Gnumoch | offhand while sneaking and on ground | absorption 2, health boost 3, resistance 2, slowness 2 | `attributes` `max_health`, `max_absorption`, `movement_speed`; `damage_protection`. Requirement `is_sneaking` and `OnGround` can live in `requirements` of the effect component. |
| Totem of Deilona | main and off hand | regeneration 3 pulse, regeneration burst | `tick` + `apply_mob_effect` regeneration, or `run_function` for the heal aura. The aura on other entities needs `run_function`. |
| Talking Stick | offhand | haste 2, resistance 2, night vision, glowing | Mixed: attributes for haste and resistance, `tick` effects for night vision and glowing. |
| Constantine's Gift | offhand | saturation every 10 s | `tick` + `apply_exhaustion` negative, or `apply_mob_effect` saturation, requirement on a timer score. |
| Rogue's Dagger | offhand and sneaking | invisibility | `tick` with `requirements` on `is_sneaking`, `apply_mob_effect` invisibility 1 tick refresh. No clock, no `effectsApplied`. Check the particle flicker. |
| Wing of Quet Zala / Ouet Zala | inventory, not equipped | levitation, nausea, timed levitation from a random player | Enchant `slots` cannot see the whole inventory, only equipment slots. Stays as is. `Glider` is not a fit either. |

Net: about 18 items lose a clock, an `effectsApplied` tag, a `has_effects` predicate and an `on_load` schedule each. Which ones need the HUD effect icon is a design choice, see section 4.

### 3.2 On-hit and on-kill effects

| Item | Today | Replacement |
|---|---|---|
| Beta Iron Sword | `on_hit` advancement damages the item with Unbreaking math and breaks it; `on_block` plays a sound | `weapon` + native durability; `blocks_attacks` sound. Drops `should_damage_tool` use, `break_item`, `mainhand_has_unbreaking` and the advancement. |
| Estudinae's Sorrow | advancement `on_hit`, nausea 10/20, hunger, then a raycast that withers the target | `post_attack` with `affected: victim` `apply_mob_effect` wither, `enchanted: attacker` nausea, hunger. Kill versus hit distinction needs `run_function` or a `requirements` on victim health. The raycast goes away since the victim is known. |
| Tithe to Uthiir | advancement `on_hit` plus `on_hit_arthropod` and `on_killed_arthropod`: wither cloud, speed, resistance, regen | `post_attack` with `requirements` `entity_properties` type `#minecraft:arthropod`, `apply_mob_effect` on victim, attacker. Kill bonus via `run_function` or the `minecraft:kill_entity`-style requirement on health. |
| War Hog's Burning Rage | `on_hit` plus a raycast plus disarm via item entity | `post_attack` `run_function` for the disarm; `affected: victim` `ignite`; raycast removed. |
| War Hog's Blighted Harvest | harvest and till circles via advancements, kill area effect cloud | `hit_block`/`post_attack` hooks cover the kill cloud via `summon_entity` or `apply_mob_effect`. Tilling and crop circles need `run_function`. |
| Hammer of Sol | snowball tracker, small fireball for fire, instant health/damage for damage | `damage_entity` with `damage_type: minecraft:magic` and `ignite` in `post_attack`; the throw stays. Already tracked in #140 as `/damage`. |
| Tor'Enhia's Fist | snowball plus lightning spawner marker | `post_attack` `summon_entity lightning_bolt`; throw tracking could be gone if the item is melee. |
| Totem of Deilona burst | `clock_4t` heals everyone nearby | `run_function` on `tick`. |

### 3.3 Use hooks that can be components

| Item | Today | Replacement |
|---|---|---|
| Eye Cream | `warped_fungus_on_a_stick` use, blindness + night vision, break by modifier | `consumable` with `on_consume_effects`, sound. The random 1-in-5 outcome is two `apply_status_effects` entries, each with a `probability`. Removes the `used` hook. |
| Gift of Sheep Island | use hook, hunger 60 s + fire resistance 600 s, `remove` | `consumable` with two `on_consume_effects`. |
| Constantine's Gift | offhand saturation | see 3.1; could also be a `food` item. |
| Feather of Quet Zala | use hook, levitation 30, break, cooldown | `consumable` with `on_consume_effects` and `use_cooldown`. |
| Heros Amulet | random loot or vex or hero of the village or bad omen | Needs the random branching, keep the hook, use `use_cooldown`/`consumable` for the break and animation only. |
| Silverfish Escape Artist | long list of 30 s effects, break, cooldown | `consumable` with `on_consume_effects` list; cooldown by `use_cooldown`. |
| Poncho Sanchez's Fate | effects on every nearby non-hostile entity | Hook stays for the area; the self part can be `consumable`. |
| Pride and Extreme Prejudice | bad omen III, hero of the village | `consumable` with `apply_status_effects` and a probability each. |
| Bringer of Fear | bad omen, weather thunder | Keep hook for weather; effects through `consumable`. |
| Deilona's Holy Blessings | area heal 20 blocks | Hook stays; `use_cooldown` for the timer. |
| Feather, Scripture, Downpour, How About No | cooldown scores | `use_cooldown` |
| Ima Leaf | teleports user 10000 up and plants a sapling | Consumable `teleport_randomly` does not fit; keep. |
| Dice | spam counter clock | Keep, `use_cooldown` instead of the spam score. |
| Buckwheat | 3 s clock, in love for livestock within 5 blocks, durability | Native: `consumable` + `villager_food`/`compostable` and vanilla breeding by feeding. Pack behavior is area breeding, so keep the hook; remove `should_damage_tool` with `damage` handled by a native component. Low priority. |

### 3.4 Fall hooks

| Item | Today | Replacement |
|---|---|---|
| Quet Zala's Beloved | `on_fall` gives slow falling 3 s and damages armor | `glider` + `equippable`, or `location_changed`/`tick` `apply_mob_effect` slow falling with a `requirements` fall-distance check. Damage via `change_item_damage`, which handles Unbreaking math itself. Removes `should_damage_armor`, `chest_has_unbreaking` and `damage_slow_falling`. |
| War Hog's Disdainful Pride | `on_fall` slow falling 3 s 2, damages boots | `tick` with fall requirement, or `attributes` `fall_damage_multiplier`/`safe_fall_distance`. Same durability win. |
| Gravilock Boots | `has_levitation` plus damage per spark | `change_item_damage` replaces the manual armor damage helpers. |

### 3.6 Wand of Block State Editing

Tracked in issue #138, "Debug Stick addition / improvements". The wand is the existing debug stick implementation. Spec from the issue: base item `minecraft:debug_stick`, 230 uses, loses 1 durability each time a block's state is changed by breaking it, swapping to another state does not damage it, Mending, epic rarity, name color magenta, lore "An item left behind by the gods of creation. A scrawled carving in its side reads: Warning: universe warranty void if you use this product.", instant mining, 26.3 only, via a new item modifier adding the mining and durability components. The issue's investigation comments (a bot, including a note that the model exists and no code does) are stale: the item, its loot table, modifier, model and a 4 tick haste clock already exist in the pack.

Today: `items/wand_of_block_state_editing.mcb` runs `clock_4t`, gives haste 101 while held and clears it on unequip, tagged `satyrn.fdl.debugStickUser`. The loot modifier has the name, lore and a creative-mode note, which the new behavior makes stale.

Native version:

- `tool`: `default_mining_speed` high enough to break any block in one tick, plus a catch-all rule. Removes the haste clock, tag, `has_effects` predicate and `on_load` schedule.
- `max_damage` 230 and `damage` 0 for the durability bar. `enchantments` with Mending. `rarity` epic only if the name color should come from it; the pack colors names itself.
- `enchantment_glint_override` true for the glint the issue asks for.
- `damage_per_block` on `tool` removes 1 durability per broken block. The issue wants durability lost only when a block state was actually changed, so check how the debug stick handles left click: if the debug stick consumes the attack and never runs the normal block break, `damage_per_block` may never fire and a function has to damage it. If it does fire, it also fires for blocks with no editable state, which the issue does not want.
- Mending on a stick with no repair material: XP repair only. Fine.
- Open: whether a survival player can use a debug stick at all without operator permissions in 26.3. The current pack gives haste only, so the stick behaves as vanilla there. Verify before promising survival use.
- The current modifier (`DungeonLootId` 57, `item_model` `foxcraft_dungeon_loot:debug_stick`) sets only name, lore and custom data. It has no durability, glint, enchantments or `unbreakable`, so every issue #138 component is new.

### 3.5 Items with no enchantment fit

Copper Goat Horn, music discs, grab bags, Spell Scroll Hail of Arrows, Scripture of Cleansing (handled in #130), Evoker's Tome, X No Evil, Grasp of Uthiir. They are snowball projectiles, spells, or tooling that no vanilla component models.

## 4. Decisions needed before any of it

1. HUD effect icons: attributes and enchant effects remove them. Wanted for any item?
2. Visible enchant name on the tooltip, or hidden. Same answer for all, or per item?
3. Slowness, weakness, jump boost and mining fatigue are multipliers by level; attributes use add and multiply operations. Values need a translation table to match the current feel.
4. Only some effects have attribute equivalents. Night vision, invisibility, glowing, conduit power, dolphins grace, water breathing stay effects, applied through `tick`.
5. `tick` effects refresh each tick or short interval; flicker in the inventory screen is possible.
6. Totems in the offhand: enchantment `slots: offhand` works. Anvil, grindstone and mending interaction is unchecked. A grindstone may strip the enchantment, which would disable the item. Needs an in-game or jar check before committing to this design.
7. `change_item_damage` for armor and tools removes the Unbreaking math files, but only if the loot item is a real tool/armor base. Warped fungus on a stick items have no native durability hook.
8. Replacing the potion-based version changes balance: lose the potion cure by milk and the effect clear on death.

## 5. Suggested order

1. Direct vanilla analogs with no gameplay change: War Hog's Seething Hatred (`damage_immunity`), Stompies (`jump_strength`), Estudinae's Patience (`attack_damage`), Estudinae's Guidance, Gravilock Boots, Totem of Gnumoch.
2. Haste items: Auto Pickaxe, Chainsaw, Wand of Block State Editing (`tool`, see 3.6).
3. Hit effects: Beta Iron Sword, Estudinae's Sorrow, Tithe to Uthiir, War Hog's Burning Rage. Removes advancements and raycasts.
4. Consumables: Eye Cream, Gift of Sheep Island, Feather of Quet Zala, Silverfish Escape Artist.
5. Durability helpers: switch every `should_damage_*` caller to `change_item_damage` or native components, then delete `math/should_damage_*`, `*_has_unbreaking` and `*_broken` predicates.
6. `use_cooldown` for all spell items, in #140 already.

## 6. Custom damage types

Reference: https://minecraft.wiki/w/Damage_type, checked against the page. A damage type is a data file in `data/<ns>/damage_type/<name>.json`. The 26.3 codec has exactly these fields:

- `message_id`: string, builds the death message lang key `death.attack.<message_id>`.
- `scaling`: `never`, `when_caused_by_living_non_player`, `always`. Whether difficulty scales the damage. Vanilla `magic` uses `when_caused_by_living_non_player`.
- `exhaustion`: float, hunger drained on hit. Vanilla magic and fire use 0.0.
- `effects`: optional, default `hurt`. Values `hurt`, `thorns`, `drowning`, `burning`, `poking`, `freezing`. Only picks the hurt sound, for example `burning` plays the burn tick.
- `death_message_type`: optional, default `default`. `fall_variants` uses the fall messages, `intentional_game_design` the bed-in-the-nether message.

Scaling `when_caused_by_living_non_player` scales only when the attacker is a living non-player. Armor stands count as living, which matters for the tracker stands.

Behavior is not in the file, it is in damage type tags under `data/minecraft/tags/damage_type/`. The ones that fit this pack: `bypasses_armor`, `bypasses_enchantments`, `bypasses_resistance`, `bypasses_effects`, `bypasses_shield`, `bypasses_invulnerability`, `bypasses_cooldown`, `is_fire`, `is_projectile`, `is_explosion`, `is_lightning`, `is_player_attack`, `no_knockback`, `no_impact`, `no_anger`, `always_kills_armor_stands`, `burn_from_stepping`. Adding the custom type to a tag opts it into that behavior. A custom type in `minecraft:is_fire` gets Fire Resistance, Fire Protection and fire-immune mobs. Tag files in this pack must use `"replace": false`.

Lang keys, in the resource pack `en_us.json`, with `%1$s` the victim, `%2$s` the attacker, `%3$s` the weapon:

- `death.attack.<message_id>.item`: the attacker holds a named item in the main hand. Insertions are victim, attacker, item.
- `death.attack.<message_id>.player`: no attacker on this hit, but a player or other living entity damaged the victim in the last 100 ticks. Insertions are victim and that recent attacker.
- `death.attack.<message_id>`: neither applies. Insertions are victim and the attacker if any.

Ways to deal it: the item component `damage_type`, which sets the type an item deals on a melee hit, for example `diamond_sword[damage_type="minecraft:campfire"]`, and `/damage <target> <amount> <ns>:<type> [by <entity>] [from <cause>]`. `damage_type` needs no hook, so a melee item can carry its custom type and death message in its modifier. Whether it accepts a custom id is untested. The wiki says custom types can only be applied with `/damage`. The `damage_entity` enchantment effect also names a damage type, so test it with a custom one before relying on it. `/damage` accepts a custom type and a `by` entity, so the death message can name the player who used the item.

Damage-dealing code in the pack today:

| Item | Today | Custom type |
|---|---|---|
| Hammer of Sol | fireball for fire, `instant_damage` and `instant_health` for undead, deaths read as "killed by magic" or "burned" | `foxcraft_dungeon_loot:hammer_of_sol` with `message_id` `foxcraft_dungeon_loot.hammer_of_sol`, tags `is_fire` and `bypasses_armor`. Resource pack lang: `death.attack.foxcraft_dungeon_loot.hammer_of_sol` = `%1$s got bonked by a solar hammer`. The game picks the `.player` key when the victim was hurt by a player or mob in the last 5 seconds and the `.item` key when the attacker holds a named item, and the wiki does not describe a fallback to the plain key, so a missing variant probably shows the raw key. Define `.player` as well, for example `%1$s got bonked by a solar hammer while fighting %2$s`, and test in game. A thrown hammer has no holder, so use `by` the thrower and expect the plain or `.player` key, not `.item`. Removes the fireball and instant effect hack, covered in #140. |
| Estudinae's Sorrow, Tithe to Uthiir | wither effect, death message "withered away" | The effect keeps its own message. A custom type only helps if the wither is replaced by `damage_entity` in a `post_attack` effect. Optional. |
| Tor'Enhia's Fist | lightning bolts | Vanilla lightning message "was struck by lightning" is acceptable. A `/damage` type with `by` the thrower would give "struck down by %2$s". |
| How About No | `kill @e[type=#hostile]` | `kill` has no attacker and no custom message. `/damage` with a large amount and a custom type, using `by` the caster, credits the caster for drops and experience. Mobs only show a message when named or tamed. `bypasses_invulnerability` only means creative and spectator immunity, so it is not needed for hostile mobs. |
| Poncho Sanchez, Deilona, Hail of Arrows | healing or arrows | Arrows keep the vanilla projectile types. |
| X No Evil, Grasp of Uthiir | area effect clouds | Cloud effects use the effect's own message. |
| Evoker's Tome | evoker fangs | Already credits the player. `EvokerFangs` deals `indirectMagic(fangs, owner)`, and the Tome sets `Owner` on each fang to the player UUID, so the vanilla message reads "killed by %2$s using magic" with the player as attacker. No custom type needed. A custom type would only change the wording, and it would mean replacing the fang entities with `/damage`, so leave it. The fang trackers stay armor stands. |
| Beta Iron Sword | melee, attack speed +10 so there is no 1.9 charge cooldown | `damage_type` component set to a custom type `foxcraft_dungeon_loot:beta_iron_sword`, listed in `minecraft:bypasses_cooldown` so every swing lands, ignoring the target's brief invincibility after a hit. That tag is empty in vanilla, so only this type uses it. Pairs with the attack speed attribute for beta-style spam clicking. Add `is_player_attack` so it keeps melee behavior, and give it a `message_id` and lang key for the death message. Test that `damage_type` accepts a custom id and that `bypasses_cooldown` still applies when the type comes from the item. Lang, with `message_id` `foxcraft_dungeon_loot.beta_iron_sword`: `death.attack.foxcraft_dungeon_loot.beta_iron_sword` = `%1$s was slashed to death with a very, very old sword`, and `death.attack.foxcraft_dungeon_loot.beta_iron_sword.item` = `%2$s slashed %1$s to death with a very, very old sword`. The sword is named, so a kill with it in the main hand uses the `.item` key, which has the attacker. Also define `.player`, which is used when no direct attacker but someone hurt the victim in the last 5 seconds, for example `%1$s was slashed to death with a very, very old sword while fighting %2$s`. That wording is mine. |
| Any melee item | melee | `damage_type` component on the item, tested with a custom id first. Also `blocks_attacks` `damage_reductions` can match a custom type or tag by its `type` field. |

Also worth deciding:

- Naming: one type per item, or a few reused ones such as `foxcraft_dungeon_loot:spell` and `foxcraft_dungeon_loot:divine_fire`.
- `scaling` should be `never` for fixed-damage spells and `when_caused_by_living_non_player` for mob-style hits.
- The jar's `DamageType` has no armor or knockback fields, so those come only from tags. Test each in game.
- List the ids in the README when added.

### 6.1 Damage type tags

Reference: https://minecraft.wiki/w/Damage_type_tag_(Java_Edition), checked against the page. The jar ships 33 tags under `data/minecraft/tags/damage_type/`. The wiki also lists `no_hurt_sound`, planned for 26.4 and empty in vanilla; it is not in this jar. Add a custom type by writing the same file in this pack with `"replace": false` and the id in `values`.

| Tag | Effect per wiki | Likely use here |
|---|---|---|
| `bypasses_armor` | Ignores armor reduction. Included in `bypasses_shield`. | Hammer of Sol, fixed-damage spells |
| `bypasses_enchantments` | Ignores enchantment reduction | Unprotectable spells |
| `bypasses_effects` | Ignores Resistance and enchantment reduction | Same |
| `bypasses_resistance` | Ignores the Resistance effect only | Versus the totems that grant resistance |
| `bypasses_shield` | Shields cannot block it. Includes `bypasses_armor`. | Lightning, magic |
| `bypasses_invulnerability` | Ignores creative and spectator immunity | Not needed for mobs |
| `bypasses_cooldown` | Ignores the short invincibility after a hit. Empty in vanilla. | Rapid multi-hit spells |
| `bypasses_wolf_armor` | Wolf armor does not absorb it | Unlikely |
| `is_fire` | Fire Resistance, Fire Protection and fire-immune mobs apply; ignored for players when `fire_damage` is off | Hammer of Sol |
| `is_lightning` | Only effect: turtles drop bowls when killed | Cosmetic, Tor'Enhia |
| `is_explosion` | Blast Protection applies | Unlikely |
| `is_projectile` | Projectile Protection applies; affects Enderman teleport and shulker duplication; used in advancements | Custom arrows |
| `is_fall` | Feather Falling applies; ignored if `fall_damage` is off | Unlikely |
| `is_drowning` | Ignored for players if `drowning_damage` is off | Unlikely |
| `is_freezing` | Ignored for players if `freeze_damage` is off; 5x damage to `freeze_hurts_extra_types` | Unlikely |
| `is_player_attack` | Not used directly, only feeds `can_break_armor_stand` and `panic_causes` | Melee types |
| `no_anger` | Victim does not remember the attacker, so no aggro | Area spells that should not aggro |
| `no_impact` | Server does not sync knockback velocity to the client | Check in play |
| `no_knockback` | No velocity from the damage | Poison-style spells |
| `no_wolf_retaliation` | Tamed wolves do not attack the source | Unlikely |
| `always_hurts_ender_dragons` | Hurts the dragon with no player cause | Boss-capable spells |
| `always_kills_armor_stands` | Armor stand dies in one hit | Tracker cleanup, or keep out to leave stands alone |
| `can_break_armor_stand` | Breaks an armor stand in two hits | Same |
| `burns_armor_stands` | Sets armor stands on fire, wiki marks it incomplete | Unchecked |
| `ignites_armor_stands` | Ignites armor stands for 5 seconds | Unchecked |
| `burn_from_stepping` | Ignored by Frost Walker | Unlikely |
| `damages_helmet` | Damages the helmet, reduced by 25% | Falling-object style types |
| `avoids_guardian_thorns` | Does not trigger Guardian thorns | Unlikely |
| `always_triggers_silverfish` | Alerts hidden silverfish | Optional |
| `always_most_significant_fall` | Picks the right death message, currently the void | Unlikely |
| `mace_smash` | Counts toward the Over-Overkill advancement | Unlikely |
| `panic_causes` | Damage that makes mobs panic | Unchecked |
| `panic_environmental_causes` | Environmental panic damage, used in `panic_causes` | Unchecked |
| `witch_resistant_to` | Witches take 85% less | Check against holy and fire types |
| `wither_immune_to` | The Wither takes none | Check if the wither effect becomes a custom type |
| `sulfur_cube_with_block_immune_to` | Sulfur cubes holding a body-slot item take no health damage | Ignore |

Notes:

- `always_kills_armor_stands` and `can_break_armor_stand` matter because the tracker stands stay armor stands. A spell type in neither tag leaves them alone.
- `damage_immunity`, `damage_protection` and the `damage_resistant` item component match on damage type tags, so War Hog's Seething Hatred can use `#minecraft:is_fire`, and a custom fire type tagged `is_fire` is covered with no extra work.
- Mob immunity tags are why a custom type may do nothing to a Wither or a witch. Check them when testing against bosses.
- Death messages need no tag.

## 7. Wiki check status

The user supplied a saved copy of https://minecraft.wiki/w/Data_component_format. Every component name in section 2 exists on it. Field details were read for the components that section names with fields. Corrections it forced: `equippable` supports offhand and mainhand, `consumable` `animation` accepts none, eat, drink, block, bow, spear, crossbow, spyglass, toot_horn, brush, bundle and trident, and an item component `damage_type` exists. `break_sound` also exists and plays when the item breaks, which could replace the `break_item` sound step.


Checked against https://minecraft.wiki/w/Data_component_format: tool, weapon, use_cooldown, piercing_weapon, use_effects, repairable, minimum_attack_charge, villager_food, attack_range, attack_animation, blocks_attacks, consumable, damage_resistant, death_protection, enchantable, equippable, glider, intangible_projectile, food, compostable, cooking_fuel, brewing_fuel, rarity, tooltip_display, use_remainder, attribute_modifiers, max_damage, max_stack_size, unbreakable, potion_contents, lore, profile. Unchecked: the other components in the jar registry that this file does not mention. The wiki fetch returns a model summary of the page, not the raw text, and does not honor anchors, so each fetch needs a page offset.

## 8. custom_data key rename

Rename every `custom_data` key from PascalCase to a namespaced snake_case key, `foxcraft_dungeon_loot:snake_case`. Counts below are from a grep of `data/`, `src/` and `docs/tools`, treat them as approximate.

| Old key | New key | Uses |
|---|---|---|
| `DungeonLootId` | `foxcraft_dungeon_loot:dungeon_loot_id` | about 258 in `data/` |
| `DungeonItem` | `foxcraft_dungeon_loot:dungeon_item` | about 145 |
| `ProcessOnUsed` | `foxcraft_dungeon_loot:process_on_used` | about 34 |
| `DungeonHead` | `foxcraft_dungeon_loot:dungeon_head` | 19 |
| `Rarity` | `foxcraft_dungeon_loot:rarity` | about 104 |
| `GrabBag` | `foxcraft_dungeon_loot:grab_bag` | 6 |
| `CopperGoatHorn` | `foxcraft_dungeon_loot:copper_goat_horn` | 10 modifiers plus the two `on_tick` item checks in `copper_goat_horn.mcb` |
| `ProcessFall` | `foxcraft_dungeon_loot:process_fall` | 4 |
| `ProcessSpiderEye` | `foxcraft_dungeon_loot:process_spider_eye` | 3 |
| `ProcessBlock` | `foxcraft_dungeon_loot:process_block` | 3 |
| `PiglinBarter` | `foxcraft_dungeon_loot:piglin_barter` | 2 |
| `DungeonLoot` | `foxcraft_dungeon_loot:dungeon_loot` | 1 |
| `CustomInstrument` | `foxcraft_dungeon_loot:instrument_base` | Not dead. Written by the 10 `item_modifier/items/goat_horns/*.json` files and read by the `horn_swap` template in `copper_horn.mcbt`, which generates 20 checks, 10 songs for each hand. It stores the song name, and the stance swap uses it to pick the `_bass`, `_harmony` or `_melody` instrument. It could be dropped by reading the song from the current `minecraft:instrument` id, but that needs three checks per song per hand instead of one. Rename it with the rest. The new name fits: the value is the song, the base that the `_bass`, `_harmony` and `_melody` instrument ids are built from. |
| `AddedTrades`, `ScanTrades`, `CurrentTrade` | `foxcraft_dungeon_loot:added_trades`, `scan_trades`, `current_trade` | trader state on the armor stand, internal |

Places that read or write the keys:

- `set_custom_data` tags in every `item_modifier/` file.
- `minecraft:custom_data` item predicates under `predicate/`, including the `events/process_*` ones and `in_main_hand`, `in_off_hand`, `worn` and `in_inventory`.
- Advancement criteria under `advancement/items/`.
- `execute if items ... [minecraft:custom_data~{...}]` in `src/`, for example the copper horn tick.
- Trade checks and the trader state stand in `trades/`.
- Resource pack: none expected, confirm with a grep.
- Docs and tools: `CLAUDE.md`, `AGENTS.md`, `README.md`, `tests/java/Scan.java`, `tests/tools/check_old_keys.py`.

Format notes:

- A key with a colon must be quoted in SNBT, so the tag string becomes `"{\"foxcraft_dungeon_loot:dungeon_loot_id\":87,\"foxcraft_dungeon_loot:dungeon_item\":1b}"` inside JSON. Escaping gets ugly, so the rename needs a script and a round-trip parse of every file, not hand edits.
- The alternative of one nested compound, `{foxcraft_dungeon_loot:{dungeon_loot_id:87}}`, needs no quotes on the key and still matches with `~` partial comparison. Flat keys were asked for; nesting is worth a look if the quoting causes trouble in `.mcb` sources.
- Keep the SNBT string form. A JSON compound turns small ints into bytes and never matches.
- mc-build commands containing quoted keys need the quotes escaped the same way. Check each generated command with `CmdCheck.java`.

Cost and risk:

- Breaking for existing items. Anything already in a world keeps the old keys and stops matching every predicate, advancement and hook. The pack is alpha, so the options are: accept the break, or add a one-time migration that rewrites old keys on items in online player inventories and containers at load, which cannot reach items in unloaded chests.
- Do it in one commit with the mechanical script, before more items and discs are added, so there is one cutover point.
- Extend `check_old_keys.py` to flag any PascalCase key left in a `custom_data` string, and `Scan.java` to assert every `DungeonLootId` is still unique after the rename.
- Update the Google Sheet notes and the wording in `README.md` ("custom NBT entry") afterward.
