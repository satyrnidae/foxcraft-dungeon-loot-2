import ../../macros.mcm

# Applies the totem's effects to players every two seconds.
function clock_2s {
    schedule function foxcraft_dungeon_loot:items/totem_of_dendris/clock_2s 2s
    execute as @a if score @s satyrn.fdl.itemId.offHand matches 54 run {
        effect give @s minecraft:night_vision 15
        effect give @s minecraft:water_breathing 3
        effect give @s minecraft:resistance 3 4
    }
}

# Gives the sender a copy of the totem.
function give {
    macro give_as_loot mythic/totem_of_dendris
}

# Starts the item's clock, offset by 12 ticks.
function on_load {
    schedule function foxcraft_dungeon_loot:items/totem_of_dendris/clock_2s 12t
}
