import ../../macros.mcm

# Occurs once per player per tick
function on_tick {
    execute (if score @s satyrn.fdl.itemId.offHand matches 47) {
        execute unless entity @s[predicate=foxcraft_dungeon_loot:items/idol_of_melimonas/has_effects] run {
            effect give @s minecraft:jump_boost 1000000 1 true
            effect give @s minecraft:invisibility 1000000 0 true
            tag @s add satyrn.fdl.idolOfMelimonas.effectsApplied
        }
    } else execute (if entity @s[tag=satyrn.fdl.idolOfMelimonas.effectsApplied]) {
        effect clear @s minecraft:jump_boost
        effect clear @s minecraft:invisibility
        tag @s remove satyrn.fdl.idolOfMelimonas.effectsApplied
    }
}
