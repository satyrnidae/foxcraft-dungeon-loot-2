import ../../macros.mcm

# Applies effects every 2 seconds.
function clock_2s {
    schedule function foxcraft_dungeon_loot:items/idol_of_melimonas/clock_2s 2s
    execute as @a if score @s satyrn.fdl.itemId.offHand matches 47 run {
        effect give @s minecraft:jump_boost 3 1 true
        effect give @s minecraft:invisibility 30 0 true
    }
}

# Gives the sender a copy of the item.
function give {
    macro give_as_loot mythic/idol_of_melimonas
}

# Initializes the 2 second item clock (offset by 8 ticks).
function on_load {
    schedule function foxcraft_dungeon_loot:items/idol_of_melimonas/clock_2s 8t
}
