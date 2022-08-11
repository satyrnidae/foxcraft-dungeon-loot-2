# TAGS USED
# satyrn.fdl.estudinaesPatience.effectsApplied - Players who have had the item's effect applied to them.

# Occurs once per 10 ticks
function clock_10t {
    schedule function foxcraft_dungeon_loot:items/estudinaes_patience/clock_10t 10t
    # Apply the effect to players who are wearing Estudinae's Patience but who do not currently have the item's effects.
    execute as @a[predicate=foxcraft_dungeon_loot:items/estudinaes_patience/worn,predicate=!foxcraft_dungeon_loot:items/estudinaes_patience/has_effects] run {
        tag @s add satyrn.fdl.estudinaesPatience.effectsApplied
        effect give @s minecraft:weakness 1000000 4
    }
    # Remove the effect from players who are not wearing Estudinae's Patience but have had the effect applied to them.
    execute as @a[predicate=!foxcraft_dungeon_loot:items/estudinaes_patience/worn,tag=satyrn.fdl.estudinaesPatience.effectsApplied] run {
        effect clear @s minecraft:weakness
        tag @s remove satyrn.fdl.estudinaesPatience.effectsApplied
    }
}

# Occurs when the datapack is loaded.
function on_load {
    schedule function foxcraft_dungeon_loot:items/estudinaes_patience/clock_10t 3t
}
