import ../../macros.mcm

function clock_2s {
    schedule function foxcraft_dungeon_loot:items/war_hogs_insatiable_hunger/clock_2s 2s
    execute as @a if score @s satyrn.fdl.itemId.chestplate matches 59 run effect give @s minecraft:hunger 10 1 true
}

function give {
    macro give_as_loot mythic/war_hogs_insatiable_hunger
}

function on_load {
    schedule function foxcraft_dungeon_loot:items/war_hogs_insatiable_hunger/clock_2s 16t
}
