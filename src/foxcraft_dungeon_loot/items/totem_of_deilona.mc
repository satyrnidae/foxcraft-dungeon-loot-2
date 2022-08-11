# Applies the regeneration effects every two seconds
function clock_2s {
    schedule function foxcraft_dungeon_loot:items/totem_of_deilona/clock_2s 2s

    execute as @a[predicate=foxcraft_dungeon_loot:items/totem_of_deilona/in_off_hand] at @s run {
        tag @s add satyrn.fdl.deilonaSource
        execute as @e[type=#foxcraft_dungeon_loot:ally,tag=!satyrn.fdl.deilonaSource,limit=5,sort=nearest,distance=..10] at @s anchored eyes run {
            effect give @s minecraft:regeneration 3
            particle minecraft:heart ^ ^0.5 ^ 0 0 0 0.2 1 force @a[tag=satyrn.fdl.deilonaSource]
        }
        tag @s remove satyrn.fdl.deilonaSource
    }
}

# Grants a burst of instant health when the player has the Totem of Deilona in their main hand.
function clock_4t {
    schedule function foxcraft_dungeon_loot:items/totem_of_deilona/clock_4t 4t

    execute as @a[predicate=!foxcraft_dungeon_loot:items/totem_of_deilona/has_regen] run {
        execute (if entity @s[tag=!satyrn.fdl.deilonaBurstHeal,predicate=foxcraft_dungeon_loot:items/totem_of_deilona/in_main_hand]) {
            tag @s add satyrn.fdl.deilonaBurstHeal
            effect give @s minecraft:regeneration 5 2
        } else execute (if entity @s[tag=satyrn.fdl.deilonaBurstHeal,predicate=!foxcraft_dungeon_loot:items/totem_of_deilona/in_main_hand]) {
            tag @s remove satyrn.fdl.deilonaBurstHeal
        }
    }
}

# Schedules the clock function with an offset of 1 tick.
function on_load {
    schedule function foxcraft_dungeon_loot:items/totem_of_deilona/clock_4t 2t
    schedule function foxcraft_dungeon_loot:items/totem_of_deilona/clock_2s 1t
}
