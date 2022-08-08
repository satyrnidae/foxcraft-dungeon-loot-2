# TAGS USED
# satyrn.fdl.estudinaesSurvival.effectsApplied - A player who has had the effects of this item applied to them.

# Applies item effects every 10 ticks.
function clock_10t {
    schedule function foxcraft_dungeon_loot:items/estudinaes_survival/clock_10t 10t
    # Apply the effects to anyone wearing Estudinae's Survival who does not yet have the effects.
    execute as @a[predicate=foxcraft_dungeon_loot:items/estudinaes_survival/worn,predicate=!foxcraft_dungeon_loot:items/estudinaes_survival/has_effects] run {
        tag @s add satyrn.fdl.estudinaesSurvival.effectsApplied
        effect give @s minecraft:conduit_power 1000000
        effect give @s minecraft:mining_fatigue 1000000
    }
    # Remove the effects from anyone marked as having the effects but no longer wearing Estudinae's Survival.
    execute as @a[predicate=!foxcraft_dungeon_loot:items/estudinaes_survival/worn,tag=satyrn.fdl.estudinaesSurvival.effectsApplied] run {
        effect clear @s minecraft:conduit_power
        effect clear @s minecraft:mining_fatigue
        tag @s remove satyrn.fdl.estudinaesSurvival.effectsApplied
    }
}

# Applies more item effects every 10 seconds.
function clock_10s {
    schedule function foxcraft_dungeon_loot:items/estudinaes_survival/clock_10s 10s
    execute as @a[predicate=foxcraft_dungeon_loot:items/estudinaes_survival/worn] run effect give @s minecraft:saturation
}

# Schedules the saturation effect clock
function on_load {
    schedule function foxcraft_dungeon_loot:items/estudinaes_survival/clock_10t 4t
    schedule function foxcraft_dungeon_loot:items/estudinaes_survival/clock_10s 2t
}
