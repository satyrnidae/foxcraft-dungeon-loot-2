# TAGS USED
# satyrn.fdl.roguesDagger.effectsApplied - Added to players when the dagger applies its effects to them.

# Runs twice a second. Applies invisibilty to players who are crouching.
function clock_4t {
    schedule function foxcraft_dungeon_loot:items/rogues_dagger/clock_4t 4t

    # Remove the invisiblity effect from players who are no longer crouching or who have unequipped the item.
    execute as @a[tag=satyrn.fdl.roguesDagger.effectsApplied,predicate=!foxcraft_dungeon_loot:items/rogues_dagger/should_apply_effects] run {
        effect clear @s minecraft:invisibility
        tag @s remove satyrn.fdl.roguesDagger.effectsApplied
    }

    # Give invisibility to all players who are holding the dagger in their off hand and sneaking.
    execute as @a[predicate=foxcraft_dungeon_loot:items/rogues_dagger/should_apply_effects,predicate=!foxcraft_dungeon_loot:items/rogues_dagger/has_effects] run {
        effect give @s minecraft:invisibility 1000000 0 true
        tag @s add satyrn.fdl.roguesDagger.effectsApplied
    }
}

# Runs when the datapack is loaded.
function on_load {
    schedule function foxcraft_dungeon_loot:items/rogues_dagger/clock_4t 1t
}
