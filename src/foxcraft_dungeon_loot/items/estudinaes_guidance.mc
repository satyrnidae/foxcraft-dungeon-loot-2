import ../../macros.mcm

# Occurs each tick
function on_tick {
    execute (if score @s satyrn.fdl.itemId.boots matches 38) {
        # Apply the item effects if the entity doesn't have them
        execute unless entity @s[predicate=foxcraft_dungeon_loot:items/estudinaes_guidance/has_effects] run {
            tag @s add satyrn.fdl.estudinaesGuidance.effectsApplied
            effect give @s minecraft:slowness 1000000 1
            effect give @s minecraft:dolphins_grace 1000000
        }
    } else execute (if entity @s[tag=satyrn.fdl.estudinaesGuidance.effectsApplied]) {
        effect clear @s minecraft:slowness
        effect clear @s minecraft:dolphins_grace
        tag @s remove satyrn.fdl.estudinaesGuidance.effectsApplied
    }
}
