# TAGS USED
# satyrn.fdl.stompies.effectsApplies - Marks a player as having effects applied by the item.

# Occurs once per ten ticks, or once every half second.
function clock_10t {
    schedule function foxcraft_dungeon_loot:items/stompies/clock_10t 10t

    # Remove the effects from players who aren't wearing the stompies.
    execute as @a[tag=satyrn.fdl.stompies.effectsApplied,predicate=!foxcraft_dungeon_loot:items/stompies/worn] run {
        effect clear @s minecraft:jump_boost
        tag @s remove satyrn.fdl.stompies.effectsApplied
    }

    # Add the effects to players who are wearing the stompies.
    execute as @a[predicate=foxcraft_dungeon_loot:items/stompies/worn,predicate=!foxcraft_dungeon_loot:items/stompies/has_effects] run {
        effect give @s minecraft:jump_boost 1000000 1 true
        tag @s add satyrn.fdl.stompies.effectsApplied
    }
}

# Starts the clock function
function on_load {
    schedule function foxcraft_dungeon_loot:items/stompies/clock_10t 8t
}
