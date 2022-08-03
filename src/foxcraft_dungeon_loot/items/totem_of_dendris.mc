import ../../macros.mcm

# Gives the sender a copy of the totem.
function give {
    macro give_as_loot mythic/totem_of_dendris
}

# Occurs once per player per tick
function on_tick {
    execute (if score @s satyrn.fdl.itemId.offHand matches 54) {
        execute unless entity @s[predicate=foxcraft_dungeon_loot:items/totem_of_dendris/has_effects] run {
            effect give @s minecraft:night_vision 1000000
            effect give @s minecraft:water_breathing 1000000
            effect give @s minecraft:resistance 1000000 4
            tag @s add satyrn.fdl.totemOfDendris.effectsApplied
        }
    } else execute (if entity @s[tag=satyrn.fdl.totemOfDendris.effectsApplied]) {
        effect clear @s minecraft:night_vision
        effect clear @s minecraft:water_breathing
        effect clear @s minecraft:resistance
        tag @s remove satyrn.fdl.totemOfDendris.effectsApplied
    }
}
