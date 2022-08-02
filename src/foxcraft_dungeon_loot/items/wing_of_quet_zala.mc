import ../../macros.mcm

function clock_2s {
    schedule function foxcraft_dungeon_loot:items/wing_of_quet_zala/clock_2s 2s
    execute as @a if score @s satyrn.fdl.itemId.offHand matches 62 run effect give @s minecraft:levitation 3
}

function clock_60s {
    schedule function foxcraft_dungeon_loot:items/wing_of_quet_zala/clock_60s 60s
    execute as @r if entity @s[predicate=foxcraft_dungeon_loot:items/wing_of_quet_zala/in_inventory] run effect give @s minecraft:levitation 5 0 true
}

function give {
    macro give_as_loot mythic/wing_of_quet_zala
}

function on_load {
    schedule function foxcraft_dungeon_loot:items/wing_of_quet_zala/clock_2s 20t
    schedule function foxcraft_dungeon_loot:items/wing_of_quet_zala/clock_60s 21t
}
