# Runs once every four ticks, or five times per second.
function clock_4t {
    schedule function foxcraft_dungeon_loot:items/totem_of_gnumoch/clock_4t 4t

    execute as @a[predicate=foxcraft_dungeon_loot:items/totem_of_gnumoch/should_apply_effects] run {
        execute unless entity @s[tag=satyrn.fdl.totemOfGnumoch.healthApplied] run {
            effect give @s minecraft:absorption 1000000 1 true
            effect give @s minecraft:health_boost 1000000 2 true
            tag @s add satyrn.fdl.totemOfGnumoch.healthApplied
        }
        execute unless entity @s[predicate=foxcraft_dungeon_loot:items/totem_of_gnumoch/has_effects] run {
            effect give @s minecraft:resistance 1000000 1
            effect give @s minecraft:slowness 1000000 1
            tag @s add satyrn.fdl.totemOfGnumoch.effectsApplied
        }
    }

    execute as @a[predicate=!foxcraft_dungeon_loot:items/totem_of_gnumoch/should_apply_effects] run {
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

# Runs when the datapack is loaded.
function on_load {
    schedule function foxcraft_dungeon_loot:items/totem_of_gnumoch/clock_4t 4t
}
