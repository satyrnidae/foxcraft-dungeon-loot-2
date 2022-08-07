import ../../macros.mcm

# Occurs once per player per tick
function on_tick {
    execute (if score @s satyrn.fdl.itemId.boots matches 52) {
        execute unless entity @s[predicate=foxcraft_dungeon_loot:items/stompies/has_effects] run {
            effect give @s minecraft:jump_boost 1000000 1 true
            tag @s add satyrn.fdl.stompies.effectsApplied
        }
    } else execute (if entity @s[tag=satyrn.fdl.stompies.effectsApplied]) {
        effect clear @s minecraft:jump_boost
        tag @s remove satyrn.fdl.stompies.effectsApplied
    }
}
