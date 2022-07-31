import ../../macros.mcm

# Adds the effects of the item on an offset 2 second clock.
function clock_2s {
    schedule function foxcraft_dungeon_loot:items/talking_stick/clock_2s 2s
    execute as @a if score @s satyrn.fdl.itemId.offHand matches 53 run {
        effect give @s minecraft:haste 3 1
        effect give @s minecraft:resistance 3 3
        effect give @s minecraft:night_vision 15
        effect give @s minecraft:glowing 3
    }
}

# Gives the sender a copy of the item.
function give {
    macro give_as_loot mythic/talking_stick
}

function on_load {
    schedule function foxcraft_dungeon_loot:items/talking_stick/clock_2s 11t
}
