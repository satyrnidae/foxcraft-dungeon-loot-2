import ../../macros.mcm

# Occurs once per player per tick
function on_tick {
    execute (if score @s satyrn.fdl.itemId.chestplate matches 39) {
        # Add the item effect
        execute unless entity @s[predicate=foxcraft_dungeon_loot:items/estudinaes_patience/has_effects] run {
            tag @s add satyrn.fdl.estudinaesPatience.effectsApplied
            effect give @s minecraft:weakness 1000000 4
        }
    } else execute (if entity @s[tag=satyrn.fdl.estudinaesPatience.effectsApplied]) {
        effect clear @s minecraft:weakness
        tag @s remove satyrn.fdl.estudinaesPatience.effectsApplied
    }
}
