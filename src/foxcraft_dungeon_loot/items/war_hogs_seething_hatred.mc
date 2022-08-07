import ../../macros.mcm

# Occurs once per player per tick
function on_tick {
    execute (if score @s satyrn.fdl.itemId.leggings matches 60) {
        execute unless entity @s[predicate=foxcraft_dungeon_loot:items/war_hogs_seething_hatred/has_effects] run {
            effect give @s minecraft:fire_resistance 1000000
            tag @s add satyrn.fdl.warHogsSeethingHatred.effectsApplied
        }
    } else execute (if entity @s[tag=satyrn.fdl.warHogsSeethingHatred.effectsApplied]) {
        effect clear @s minecraft:fire_resistance
        tag @s remove satyrn.fdl.warHogsSeethingHatred.effectsApplied
    }
}
