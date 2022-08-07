import ../../macros.mcm

# A clock function that runs once every 10 seconds.
function clock_10s {
    schedule function foxcraft_dungeon_loot:items/constantines_gift/clock_10s 10s

    execute as @a[predicate=foxcraft_dungeon_loot:items/constantines_gift/in_off_hand] run effect give @s minecraft:saturation
}

# Occurs once when the datapack is loaded.
function on_load {
    schedule function foxcraft_dungeon_loot:items/constantines_gift/clock_10s 1t
}
