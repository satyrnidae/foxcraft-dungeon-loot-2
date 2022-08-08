# Occurs once every ten ticks
function clock_10t {
    schedule function foxcraft_dungeon_loot:items/war_hogs_seething_hatred/clock_10t 10t

    execute as @a[tag=satyrn.fdl.warHogsSeethingHatred.effectsApplied,predicate=!foxcraft_dungeon_loot:items/war_hogs_seething_hatred/worn] run {
        effect clear @s minecraft:fire_resistance
        tag @s remove satyrn.fdl.warHogsSeethingHatred.effectsApplied
    }

    execute as @a[predicate=foxcraft_dungeon_loot:items/war_hogs_seething_hatred/worn,predicate=!foxcraft_dungeon_loot:items/war_hogs_seething_hatred/has_effects] run {
        effect give @s minecraft:fire_resistance 1000000
            tag @s add satyrn.fdl.warHogsSeethingHatred.effectsApplied
    }
}

# Runs when the datapack is loaded.
function on_load {
    schedule function foxcraft_dungeon_loot:items/war_hogs_seething_hatred/clock_10t 3t
}
