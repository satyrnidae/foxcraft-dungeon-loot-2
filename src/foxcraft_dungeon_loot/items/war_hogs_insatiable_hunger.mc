import ../../macros.mcm

# Occurs once per player per tick
function clock_10t {
    schedule function foxcraft_dungeon_loot:items/war_hogs_insatiable_hunger/clock_10t 10t

    execute as @a[tag=satyrn.fdl.warHogsInsatiableHunger.effectsApplied,predicate=!foxcraft_dungeon_loot:items/war_hogs_insatiable_hunger/worn] run {
        effect clear @s minecraft:hunger
        tag @s remove satyrn.fdl.warHogsInsatiableHunger.effectsApplied
    }

    execute as @a[predicate=!foxcraft_dungeon_loot:items/war_hogs_insatiable_hunger/has_effects,predicate=foxcraft_dungeon_loot:items/war_hogs_insatiable_hunger/worn] run {
        effect give @s minecraft:hunger 1000000 1
        tag @s add satyrn.fdl.warHogsInsatiableHunger.effectsApplied
    }
}

function on_load {
    schedule function foxcraft_dungeon_loot:items/war_hogs_insatiable_hunger/clock_10t 2t
}
