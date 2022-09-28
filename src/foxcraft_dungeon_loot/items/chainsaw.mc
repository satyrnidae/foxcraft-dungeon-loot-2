# TAGS USED
# satyrn.fdl.chainsaw.effectsApplied - Refers to a player who has had the effects of the chainsaw applied to them.

# Occurs once every ten ticks
function clock_10t {
    # Schedule the function to run again in 10 ticks.
    schedule function foxcraft_dungeon_loot:items/chainsaw/clock_10t 10t

    # Execute for every player holding the chainsaw in their main hand.
    execute as @a[predicate=foxcraft_dungeon_loot:items/chainsaw/in_main_hand,predicate=!foxcraft_dungeon_loot:items/chainsaw/has_effects] at @s run {
        effect give @s minecraft:haste 1000000 1 true
        tag @s add satyrn.fdl.chainsaw.effectsApplied
    }

    # Execute for every player not holding the chainsaw in their main hand, but tagged as having the chainsaw's effects.
    execute as @a[predicate=!foxcraft_dungeon_loot:items/chainsaw/in_main_hand,tag=satyrn.fdl.chainsaw.effectsApplied] at @s run {
        effect clear @s minecraft:haste
        tag @s remove satyrn.fdl.chainsaw.effectsApplied
    }
}

function give_netherite_upgrade {
    scoreboard players set @s satyrn.fdl.loot.variant 2
    loot give @s loot foxcraft_dungeon_loot:items/mythic/chainsaw
    scoreboard players reset @s satyrn.fdl.loot.variant
}

function give_diamond_upgrade {
    scoreboard players set @s satyrn.fdl.loot.variant 1
    loot give @s loot foxcraft_dungeon_loot:items/mythic/chainsaw
    scoreboard players reset @s satyrn.fdl.loot.variant
}

# Occurs once as the data pack is loaded.
function on_load {
    schedule function foxcraft_dungeon_loot:items/chainsaw/clock_10t 1t
    scoreboard objectives add satyrn.fdl.chainsaw.soundCooldown dummy
}

# Executes on each tick.
function on_tick {
    execute as @a[predicate=foxcraft_dungeon_loot:items/chainsaw/in_main_hand] run {
        execute (unless score @s satyrn.fdl.chainsaw.soundCooldown matches 1.. at @s) {
            execute (unless score @s satyrn.fdl.chainsaw.soundCooldown matches 0..) {
                playsound foxcraft_dungeon_loot:item.chainsaw.start player @a
                scoreboard players set @s satyrn.fdl.chainsaw.soundCooldown 7
            } else {
                playsound foxcraft_dungeon_loot:item.chainsaw.idle player @a
                scoreboard players set @s satyrn.fdl.chainsaw.soundCooldown 65
            }
        } else {
            scoreboard players remove @s satyrn.fdl.chainsaw.soundCooldown 1
        }
    }

    execute as @a[predicate=!foxcraft_dungeon_loot:items/chainsaw/in_main_hand,scores={satyrn.fdl.chainsaw.soundCooldown=1..}] at @s run {
        scoreboard players reset @s satyrn.fdl.chainsaw.soundCooldown
        stopsound @a player foxcraft_dungeon_loot:item.chainsaw.idle
        playsound foxcraft_dungeon_loot:item.chainsaw.stop player @a
    }
}

function on_uninstall {
    scoreboard objectives remove satyrn.fdl.chainsaw.soundCooldown
}
