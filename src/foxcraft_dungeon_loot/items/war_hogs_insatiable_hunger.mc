import ../../macros.mcm

function give {
    macro give_as_loot mythic/war_hogs_insatiable_hunger
}

# Occurs once per player per tick
function on_tick {
    execute (if score @s satyrn.fdl.itemId.chestplate matches 59) {
        execute unless entity @s[predicate=foxcraft_dungeon_loot:items/war_hogs_insatiable_hunger/has_effects] run {
            effect give @s minecraft:hunger 1000000 1
            tag @s add satyrn.fdl.warHogsInsatiableHunger.effectsApplied
        }
    } else execute (if entity @s[tag=satyrn.fdl.warHogsInsatiableHunger.effectsApplied]) {
        effect clear @s minecraft:hunger
        tag @s remove satyrn.fdl.warHogsInsatiableHunger.effectsApplied
    }
}
