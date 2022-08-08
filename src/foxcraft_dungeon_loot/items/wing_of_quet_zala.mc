import ../../macros.mcm

function clock_10t {
    schedule function foxcraft_dungeon_loot:items/wing_of_quet_zala/clock_10t 10t

    execute as @a[tag=satyrn.fdl.wingOfQuetZala.effectsApplied,predicate=!foxcraft_dungeon_loot:items/wing_of_quet_zala/in_off_hand] run {
        effect clear @s minecraft:levitation
        tag @s remove satyrn.fdl.wingOfQuetZala.effectsApplied
    }

    execute as @a[predicate=!foxcraft_dungeon_loot:items/wing_of_quet_zala/has_effects,predicate=foxcraft_dungeon_loot:items/wing_of_quet_zala/in_off_hand] run {
        effect give @s minecraft:levitation 1000000 0 true
        tag @s add satyrn.fdl.wingOfQuetZala.effectsApplied
    }
}

function clock_60s {
    schedule function foxcraft_dungeon_loot:items/wing_of_quet_zala/clock_60s 60s
    execute as @r if entity @s[predicate=foxcraft_dungeon_loot:items/wing_of_quet_zala/in_inventory] run effect give @s minecraft:levitation 5 0 true
}

function on_load {
    schedule function foxcraft_dungeon_loot:items/wing_of_quet_zala/clock_10t 4t
    schedule function foxcraft_dungeon_loot:items/wing_of_quet_zala/clock_60s 8t
}
