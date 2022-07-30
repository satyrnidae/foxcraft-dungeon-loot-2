import ../../macros.mcm

# Applies the regeneration effects every two seconds
function clock_2s {
    schedule function foxcraft_dungeon_loot:items/totem_of_deilona/clock_2s 2s

    execute as @a at @s run {
        execute (if score @s satyrn.fdl.itemId.mainHand matches 55) {
            tag @s add satyrn.fdl.deilonaSource
            execute as @e[type=#foxcraft_dungeon_loot:ally,tag=!satyrn.fdl.deilonaSource,limit=5,sort=nearest,distance=..10] at @s anchored eyes run {
                effect give @s minecraft:regeneration 3
                particle minecraft:heart ^ ^0.5 ^ 0 0 0 0.2 1 force @a[tag=satyrn.fdl.deilonaSource]
            }
            tag @s remove satyrn.fdl.deilonaSource
        } else {
            execute if score @s satyrn.fdl.itemId.offHand matches 55 run effect give @s minecraft:regeneration 3 1
        }
    }
}

# Gives the sender a copy of the Totem of Deilona
function give {
    macro give_as_loot mythic/totem_of_deilona
}

# Schedules the clock function with an offset of 13 ticks.
function on_load {
    schedule function foxcraft_dungeon_loot:items/totem_of_deilona/clock_2s 13t
}
