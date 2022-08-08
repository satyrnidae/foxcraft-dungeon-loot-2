# TAGS USED
# satyrn.fdl.estudinaesGuidance.effectsApplied - Players who have had the item's effect applied to them.

# Occurs once every 10 ticks.
function clock_10t {
    schedule function foxcraft_dungeon_loot:items/estudinaes_guidance/clock_10t 10t
    # Apply the effect to players that are wearing Estudinae's Guidance but do not yet have the effects applied to them.
    execute as @a[predicate=foxcraft_dungeon_loot:items/estudinaes_guidance/worn,predicate=!foxcraft_dungeon_loot:items/estudinaes_guidance/has_effects] run {
        tag @s add satyrn.fdl.estudinaesGuidance.effectsApplied
        effect give @s minecraft:slowness 1000000 1
        effect give @s minecraft:dolphins_grace 1000000
    }
    # Apply the effect to players who are not wearing the item but have had the item's effects applied to them.
    execute as @a[predicate=!foxcraft_dungeon_loot:items/estudinaes_guidance/worn,tag=satyrn.fdl.estudinaesGuidance.effectsApplied] run {
        effect clear @s minecraft:slowness
        effect clear @s minecraft:dolphins_grace
        tag @s remove satyrn.fdl.estudinaesGuidance.effectsApplied
    }
}

# Occurs when the datapack is loaded.
function on_load {
    # Schedules the clock function with an offset of 2 ticks.
    schedule function foxcraft_dungeon_loot:items/estudinaes_guidance/clock_10t 2t
}
