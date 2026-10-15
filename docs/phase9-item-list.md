# Phase 9 item list: base item migration

Draft for review. Nothing is moved yet. Moving an item to `poisonous_potato` means removing `!minecraft:food` and `!minecraft:consumable` and changing its loot table, `src/` readers and predicates in the same step. Coins and snowballs never move. Interactive items stay on their current base.

Counts: 95 items, 5 to review, 90 stay.

Result of the survey: almost nothing qualifies. Every item on `warped_fungus_on_a_stick` has a use hook except buckwheat, which relies on the durability bar. Everything else sits on a base item that provides its function. The only real candidates are passive items already on a clean base, where the move gains nothing but uniformity.

Not listed: coins (never move), the per-rarity grab bags (fungus use hook, stay), the `loot/` tables for potions, heads, armor and tools.

## Review (needs your call)

| Id | Item | Rarity | Base | Reason |
|---|---|---|---|---|
| 4 | kobolds_vengeance | epic | bone | Passive. bone has no food or consumable component. Potato only for uniformity. |
| 29 | lucky_rabbits_foot | rare | rabbit_foot | Passive. rabbit_foot has no food or consumable component. Potato only for uniformity. |
| 35 | constantines_gift | mythic | (loot table ref) | Passive offhand effect. Base is enchanted_golden_apple, which is consumable by default. Moving to the potato still needs !consumable, so no gain over keeping the apple and removing consumable. |
| 53 | talking_stick | mythic | stick | Passive. stick has no food or consumable component, nothing to strip. Potato only for uniformity. |
| 76 | buckwheat | epic | warped_fungus_on_a_stick | Held-item tool on warped_fungus_on_a_stick, but it uses the durability bar on purpose. Stays unless durability moves to another scheme. |

## Stay

| Id | Item | Rarity | Base | Use hooks | Reason |
|---|---|---|---|---|---|
| - | absinthe | common | potion | - | drinkable |
| - | animus | common | potion | - | drinkable |
| - | armor_stand | common | armor_stand | - | placeable entity item |
| - | armor_stand_baby | common | armor_stand | - | placeable entity item |
| - | armor_stand_bashful | common | armor_stand | - | placeable entity item |
| - | armor_stand_cancan | common | armor_stand | - | placeable entity item |
| - | armor_stand_dab | common | armor_stand | - | placeable entity item |
| - | armor_stand_gallant | common | armor_stand | - | placeable entity item |
| - | armor_stand_greyskull | common | armor_stand | - | placeable entity item |
| - | armor_stand_skeleton | common | armor_stand | - | placeable entity item |
| - | armor_stand_zombie | common | armor_stand | - | placeable entity item |
| - | coffee | common | potion | - | drinkable |
| - | laudanum | common | potion | - | drinkable |
| - | luma | common | potion | - | drinkable |
| - | moonshine | common | potion | - | drinkable |
| - | nectar | common | potion | - | drinkable |
| - | stout | common | potion | - | drinkable |
| - | tequila | common | potion | - | drinkable |
| - | vitae | common | potion | - | drinkable |
| 1 | peerless_yewhewn | epic | bow | - | base item provides the function (equipment, weapon, totem, tool or wearable) |
| 2 | dawncleaver | epic | diamond_sword / iron_sword / netherite_sword | - | base item provides the function (equipment, weapon, totem, tool or wearable) |
| 3 | melimonas_guile | epic | trident | - | base item provides the function (equipment, weapon, totem, tool or wearable) |
| 5 | palominas_gift | epic | trident | - | base item provides the function (equipment, weapon, totem, tool or wearable) |
| 6 | skullbasher | epic | shield | - | base item provides the function (equipment, weapon, totem, tool or wearable) |
| 7 | pierce_the_sky | mythic | crossbow | - | base item provides the function (equipment, weapon, totem, tool or wearable) |
| 8 | yo_yo_mans_revenge | epic | fishing_rod | - | base item provides the function (equipment, weapon, totem, tool or wearable) |
| 9 | war_hogs_lingering_spite | mythic | netherite_sword | - | base item provides the function (equipment, weapon, totem, tool or wearable) |
| 10 | longsword | rare | diamond_sword / iron_sword / netherite_sword | - | base item provides the function (equipment, weapon, totem, tool or wearable) |
| 11 | admire_me_from_afar | rare | spyglass | - | base item provides the function (equipment, weapon, totem, tool or wearable) |
| 12 | quickdraw_crossbow | rare | crossbow | - | base item provides the function (equipment, weapon, totem, tool or wearable) |
| 13 | war_hogs_festering_wrath | mythic | netherite_helmet | - | base item provides the function (equipment, weapon, totem, tool or wearable) |
| 14 | armor_of_the_golem | rare | carved_pumpkin | - | base item provides the function (equipment, weapon, totem, tool or wearable) |
| 15 | shroud_of_notoriety | rare | player_head | - | base item provides the function (equipment, weapon, totem, tool or wearable) |
| 16 | shield_of_the_juggernaut | mythic | shield | - | base item provides the function (equipment, weapon, totem, tool or wearable) |
| 17 | rogues_dagger | epic | golden_sword | - | base item provides the function (equipment, weapon, totem, tool or wearable) |
| 18 | aurelias_lucky_compass | rare | compass | - | base item provides the function (equipment, weapon, totem, tool or wearable) |
| 19 | totem_of_ekila | mythic | totem_of_undying | - | base item provides the function (equipment, weapon, totem, tool or wearable) |
| 20 | totem_of_gnumoch | mythic | totem_of_undying | - | base item provides the function (equipment, weapon, totem, tool or wearable) |
| 21 | totem_of_undying | uncommon | totem_of_undying | - | base item provides the function (equipment, weapon, totem, tool or wearable) |
| 22 | fortune_500 | epic | diamond_pickaxe / iron_pickaxe / netherite_pickaxe | - | base item provides the function (equipment, weapon, totem, tool or wearable) |
| 28 | war_hogs_burning_rage | mythic | netherite_axe | - | base item provides the function (equipment, weapon, totem, tool or wearable) |
| 30 | estudinaes_script | epic | chainmail_leggings / diamond_leggings / iron_leggings / leather_leggings / netherite_leggings | - | base item provides the function (equipment, weapon, totem, tool or wearable) |
| 31 | estudinaes_sorrow | epic | diamond_sword / netherite_sword | - | base item provides the function (equipment, weapon, totem, tool or wearable) |
| 32 | auto_pickaxe | mythic | diamond_pickaxe / iron_pickaxe / netherite_pickaxe | - | base item provides the function (equipment, weapon, totem, tool or wearable) |
| 33 | gravilock_boots | mythic | diamond_boots / iron_boots / netherite_boots | - | base item provides the function (equipment, weapon, totem, tool or wearable) |
| 34 | bringer_of_fear | mythic | warped_fungus_on_a_stick | on_tick on_warped_fungus_used | interactive, uses the fungus use event |
| 36 | deilonas_holy_blessings | mythic | warped_fungus_on_a_stick | on_tick on_warped_fungus_used | interactive, uses the fungus use event |
| 37 | downpour_amulet | mythic | warped_fungus_on_a_stick | on_tick on_warped_fungus_used | interactive, uses the fungus use event |
| 38 | estudinaes_guidance | epic | chainmail_boots / diamond_boots / iron_boots / leather_boots / netherite_boots | - | base item provides the function (equipment, weapon, totem, tool or wearable) |
| 39 | estudinaes_patience | epic | chainmail_chestplate / diamond_chestplate / iron_chestplate / leather_chestplate | - | base item provides the function (equipment, weapon, totem, tool or wearable) |
| 40 | estudinaes_survival | epic | chainmail_helmet / diamond_helmet / iron_helmet / leather_helmet / netherite_helmet | - | base item provides the function (equipment, weapon, totem, tool or wearable) |
| 41 | evokers_tome | mythic | warped_fungus_on_a_stick | on_tick on_warped_fungus_used | interactive, uses the fungus use event |
| 42 | eye_cream | rare | warped_fungus_on_a_stick | on_warped_fungus_used | interactive, uses the fungus use event |
| 43 | feather_of_quet_zala | rare | warped_fungus_on_a_stick | on_tick on_warped_fungus_used | interactive, uses the fungus use event |
| 44 | gift_of_sheep_island | rare | warped_fungus_on_a_stick | on_warped_fungus_used | interactive, uses the fungus use event |
| 45 | heros_amulet | epic | warped_fungus_on_a_stick | on_warped_fungus_used | interactive, uses the fungus use event |
| 46 | how_about_no | mythic | warped_fungus_on_a_stick | on_tick on_warped_fungus_used | interactive, uses the fungus use event |
| 47 | idol_of_melimonas | mythic | totem_of_undying | - | base item provides the function (equipment, weapon, totem, tool or wearable) |
| 48 | poncho_sanchezs_fate | mythic | warped_fungus_on_a_stick | on_tick on_warped_fungus_used | interactive, uses the fungus use event |
| 49 | pride_and_extreme_prejudice | mythic | warped_fungus_on_a_stick | on_tick on_warped_fungus_used | interactive, uses the fungus use event |
| 50 | quet_zalas_beloved | mythic | elytra | on_fall | base item provides the function (equipment, weapon, totem, tool or wearable) |
| 51 | scripture_of_cleansing | mythic | warped_fungus_on_a_stick | on_tick on_warped_fungus_used | interactive, uses the fungus use event |
| 52 | stompies | mythic | chainmail_boots / diamond_boots / iron_boots / leather_boots / netherite_boots | - | base item provides the function (equipment, weapon, totem, tool or wearable) |
| 54 | totem_of_dendris | mythic | totem_of_undying | - | base item provides the function (equipment, weapon, totem, tool or wearable) |
| 55 | totem_of_deilona | mythic | totem_of_undying | - | base item provides the function (equipment, weapon, totem, tool or wearable) |
| 56 | totem_of_mysteria | mythic | totem_of_undying | - | base item provides the function (equipment, weapon, totem, tool or wearable) |
| 57 | wand_of_block_state_editing | epic | debug_stick | - | base item provides the function (equipment, weapon, totem, tool or wearable) |
| 58 | war_hogs_disdainful_pride | mythic | netherite_boots | on_fall | base item provides the function (equipment, weapon, totem, tool or wearable) |
| 59 | war_hogs_insatiable_hunger | mythic | netherite_chestplate | - | base item provides the function (equipment, weapon, totem, tool or wearable) |
| 60 | war_hogs_seething_hatred | mythic | netherite_leggings | - | base item provides the function (equipment, weapon, totem, tool or wearable) |
| 61 | wing_of_ouet_zala | mythic | totem_of_undying | - | base item provides the function (equipment, weapon, totem, tool or wearable) |
| 62 | wing_of_quet_zala | mythic | totem_of_undying | - | base item provides the function (equipment, weapon, totem, tool or wearable) |
| 63 | silverfish_escape_artist | epic | warped_fungus_on_a_stick | on_tick on_warped_fungus_used | interactive, uses the fungus use event |
| 64 | d4 | common | warped_fungus_on_a_stick | - | interactive, uses the fungus use event |
| 65 | d6 | common | warped_fungus_on_a_stick | - | interactive, uses the fungus use event |
| 66 | d8 | common | warped_fungus_on_a_stick | - | interactive, uses the fungus use event |
| 67 | d10 | common | warped_fungus_on_a_stick | - | interactive, uses the fungus use event |
| 68 | d12 | common | warped_fungus_on_a_stick | - | interactive, uses the fungus use event |
| 69 | d20 | common | warped_fungus_on_a_stick | - | interactive, uses the fungus use event |
| 75 | hammer_of_sol | mythic | snowball | on_snowball_used on_tick | thrown, snowball is the use trigger |
| 77 | ima_leaf | rare | warped_fungus_on_a_stick | on_warped_fungus_used | interactive, uses the fungus use event |
| 78 | spell_scroll_hail_of_arrows | epic | snowball | on_snowball_used on_tick | thrown, snowball is the use trigger |
| 79 | x_no_evil | mythic | snowball | on_snowball_used on_tick | thrown, snowball is the use trigger |
| 80 | torenhias_fist | epic | snowball | on_snowball_used on_tick | thrown, snowball is the use trigger |
| 81 | tithe_to_uthiir | epic | netherite_sword | on_spider_eye_eaten | base item provides the function (equipment, weapon, totem, tool or wearable) |
| 82 | beta_iron_sword | rare | shield | on_block on_tick | base item provides the function (equipment, weapon, totem, tool or wearable) |
| 83 | grasp_of_uthiir | rare | snowball | on_snowball_used on_tick | thrown, snowball is the use trigger |
| 85 | flawless_ashenhewn | rare | bow | - | base item provides the function (equipment, weapon, totem, tool or wearable) |
| 86 | war_hogs_blighted_harvest | mythic | netherite_hoe | on_tick | base item provides the function (equipment, weapon, totem, tool or wearable) |
| 87 | chainsaw | mythic | diamond_axe / iron_axe / netherite_axe | on_tick | base item provides the function (equipment, weapon, totem, tool or wearable) |
