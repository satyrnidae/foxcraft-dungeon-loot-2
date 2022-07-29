import ../../macros.mcm

# A clock function that runs once every 10 seconds.
function clock_10s {
    schedule function foxcraft_dungeon_loot:items/constantines_gift/clock_10s 10s
    execute as @a if score @s satyrn.fdl.itemId.offHand matches 35 run effect give @s minecraft:saturation
}

# Gives the sender a copy of the item.
function give {
    macro give mythic/constantines_gift
}

# Initializes the item's timer function.
function on_load {
    schedule function foxcraft_dungeon_loot:items/constantines_gift/clock_10s 1t
}
