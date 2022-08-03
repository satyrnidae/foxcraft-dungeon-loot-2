import ../../macros.mcm

function give {
    macro give_as_loot mythic/totem_of_gnumoch
}

function on_tick {
    execute (if score @s satyrn.fdl.itemId.offHand matches 20 if entity @s[predicate=foxcraft_dungeon_loot:is_on_ground] if score @s satyrn.fdl.custom.sneakTime matches 1..) {
        execute unless entity @s[tag=satyrn.fdl.totemOfGnumoch.healthApplied] run {
            effect give @s minecraft:absorption 1000000 2 true
            effect give @s minecraft:health_boost 1000000 1 true
            tag @s add satyrn.fdl.totemOfGnumoch.healthApplied
        }
        execute unless entity @s[predicate=foxcraft_dungeon_loot:items/totem_of_gnumoch/has_effects] run {
            effect give @s minecraft:resistance 1000000 2
            effect give @s minecraft:slowness 1000000 1
            tag @s add satyrn.fdl.totemOfGnumoch.effectsApplied
        }
    } else {
        execute if entity @s[tag=satyrn.fdl.totemOfGnumoch.healthApplied] run {
            effect clear @s minecraft:absorption
            effect clear @s minecraft:health_boost
            tag @s remove satyrn.fdl.totemOfGnumoch.healthApplied
        }
        execute if entity @s[tag=satyrn.fdl.totemOfGnumoch.effectsApplied] run {
            effect clear @s minecraft:resistance
            effect clear @s minecraft:slowness
            tag @s remove satyrn.fdl.totemOfGnumoch.effectsApplied
        }
    }
}
