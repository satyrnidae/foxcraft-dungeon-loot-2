import ../../macros.mcm

function clock_2s {
    schedule function foxcraft_dungeon_loot:items/war_hogs_seething_hatred/clock_2s 2s
    execute as @a if score @s satyrn.fdl.itemId.leggings matches 60 run effect give @s minecraft:fire_resistance 3
}

function give {
    macro give_as_loot mythic/war_hogs_seething_hatred
}

function on_load {
    schedule function foxcraft_dungeon_loot:items/war_hogs_seething_hatred/clock_2s 17t
}
