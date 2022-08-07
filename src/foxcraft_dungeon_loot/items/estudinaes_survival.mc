import ../../macros.mcm

# Applies more item effects every 10 seconds.
function clock_10s {
    schedule function foxcraft_dungeon_loot:items/estudinaes_survival/clock_10s 10s
    execute as @a if score @s satyrn.fdl.itemId.helmet matches 40 run effect give @s minecraft:saturation
}

# Schedules the saturation effect clock
function on_load {
    schedule function foxcraft_dungeon_loot:items/estudinaes_survival/clock_10s 1t
}

# Occurs once per player per tick
function on_tick {
    execute (if score @s satyrn.fdl.itemId.helmet matches 40) {
        execute unless entity @s[predicate=foxcraft_dungeon_loot:items/estudinaes_survival/has_effects] run {
            tag @s add satyrn.fdl.estudinaesSurvival.effectsApplied
            effect give @s minecraft:conduit_power 1000000
            effect give @s minecraft:mining_fatigue 1000000
        }
    } else execute (if entity @s[tag=satyrn.fdl.estudinaesSurvival.effectsApplied]) {
        effect clear @s minecraft:conduit_power
        effect clear @s minecraft:mining_fatigue
        tag @s remove satyrn.fdl.estudinaesSurvival.effectsApplied
    }
}
