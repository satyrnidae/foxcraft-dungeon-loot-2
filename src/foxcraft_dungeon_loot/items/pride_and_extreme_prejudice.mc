import ../../macros.mcm

# Runs when the datapack is loaded.
function on_load {
    scoreboard objectives add satyrn.fdl.prideAndExtremePrejudice.cooldown dummy

    execute store success score #test <%config.internalScoreboard%> run scoreboard players get prideAndExtremePrejudice.cooldown <%config.internalScoreboard%>
    execute if score #test <%config.internalScoreboard%> matches 0 run scoreboard players set prideAndExtremePrejudice.cooldown <%config.internalScoreboard%> 24000
}

# Runs once per tick
function on_tick {
    # Increment the cooldown timer.
    execute as @a[scores={satyrn.fdl.prideAndExtremePrejudice.cooldown=1..}] run {
        scoreboard players remove @s satyrn.fdl.prideAndExtremePrejudice.cooldown 1

        # Reset the cooldown timer.
        execute at @s[scores={satyrn.fdl.prideAndExtremePrejudice.cooldown=..0}] run {
            playsound foxcraft_dungeon_loot:entity.player.spell_ready player @s ~ ~ ~ 0.5
            particle minecraft:witch ~ ~1 ~ 0 0.5 0 1 10 normal @s
            title @s actionbar {"text":"Pride and Extreme Prejudice is ready to be used once more.","color":"dark_purple"}
            scoreboard players reset @s satyrn.fdl.prideAndExtremePrejudice.cooldown
        }
    }
}

# Runs when the datapack is uninstalled.
function on_uninstall {
    scoreboard objectives remove satyrn.fdl.prideAndExtremePrejudice.cooldown

    scoreboard players reset prideAndExtremePrejudice.cooldown <%config.internalScoreboard%>
}

# Runs on ticks where a player has used a warped fungus on a stick.
function on_warped_fungus_used {
    execute if entity @s[predicate=foxcraft_dungeon_loot:items/pride_and_extreme_prejudice/in_main_hand] run {
        execute (if score @s satyrn.fdl.prideAndExtremePrejudice.cooldown matches 1..) {
            playsound foxcraft_dungeon_loot:entity.player.spell_fails player @s ~ ~ ~ 0.5
            title @s actionbar {"text":"Pride and Extreme Prejudice is ready to be used once more.","color":"dark_purple"}
        } else {
            macro random 1 10

            execute (if score #math.result <%config.internalScoreboard%> matches 1) {
                playsound minecraft:event.raid.horn hostile @a ~ ~ ~ 100
                effect give @s minecraft:bad_omen 1200 3
                tellraw @s {"text":"The sound of horns fills the air.","color":"gray","italic":true}
            } else execute (if score #math.result <%config.internalScoreboard%> matches 2) {
                playsound minecraft:event.raid.horn hostile @a ~ ~ ~ 100
                effect give @s minecraft:bad_omen 1200 2
                tellraw @s {"text":"A fell wind sweeps the land.","color":"gray","italic":true}
            } else execute (if score #math.result <%config.internalScoreboard%> matches 3..8) {
                playsound minecraft:event.raid.horn hostile @a ~ ~ ~ 100
                effect give @s minecraft:bad_omen 1200
                tellraw @s {"text":"A chill trickles down your spine.","color":"gray","italic":true}
            } else {
                playsound foxcraft_dungeon_loot:event.roll.hero player @a
                effect give @s minecraft:hero_of_the_village 1200
                tellraw @s {"text":"A warm breeze calms your nerves.","color":"gray","italic":true}
            }

            execute unless entity @s[gamemode=creative] run {
                scoreboard players operation @s satyrn.fdl.prideAndExtremePrejudice.cooldown = prideAndExtremePrejudice.cooldown <%config.internalScoreboard%>
                scoreboard players operation #math.input1 <%config.internalScoreboard%> = prideAndExtremePrejudice.cooldown <%config.internalScoreboard%>
                function foxcraft_dungeon_loot:math/ticks_to_min_sec

                execute (if score #math.minutes <%config.internalScoreboard%> matches 0) {
                    execute (if score #math.seconds <%config.internalScoreboard%> matches 1) {
                        title @s actionbar {"text":"Pride and Extreme Prejudice is now on cooldown for 1 second.","color":"dark_purple"}
                    } else {
                        title @s actionbar [{"text":"Pride and Extreme Prejudice is now on cooldown for ","color":"dark_purple"},{"score":{"name":"#math.seconds","objective":"<%config.internalScoreboard%>"}}," seconds."]
                    }
                } else execute (if score #math.seconds <%config.internalScoreboard%> matches 0) {
                    execute (if score #math.minutes <%config.internalScoreboard%> matches 1) {
                        title @s actionbar {"text":"Pride and Extreme Prejudice is now on cooldown for 1 minute.","color":"dark_purple"}
                    } else {
                        title @s actionbar [{"text":"Pride and Extreme Prejudice is now on cooldown for ","color":"dark_purple"},{"score":{"name":"#math.minutes","objective":"<%config.internalScoreboard%>"}}," minutes."]
                    }
                } else {
                    execute (if score #math.minutes <%config.internalScoreboard%> matches 1) {
                        execute (if score #math.seconds <%config.internalScoreboard%> matches 1) {
                            title @s actionbar {"text":"Pride and Extreme Prejudice is now on cooldown for 1 minute, 1 second.","color":"dark_purple"}
                        } else {
                        title @s actionbar [{"text":"Pride and Extreme Prejudice is now on cooldown for 1 minute, ","color":"dark_purple"},{"score":{"name":"#math.seconds","objective":"<%config.internalScoreboard%>"}}," seconds."]
                        }
                    } else {
                        execute (if score #math.seconds <%config.internalScoreboard%> matches 1) {
                            title @s actionbar [{"text":"Pride and Extreme Prejudice is now on cooldown for ","color":"dark_purple"},{"score":{"name":"#math.minutes","objective":"<%config.internalScoreboard%>"}}," minutes, 1 second."]
                        } else {
                            title @s actionbar [{"text":"Pride and Extreme Prejudice is now on cooldown for ","color":"dark_purple"},{"score":{"name":"#math.minutes","objective":"<%config.internalScoreboard%>"}}," minutes, ",{"score":{"name":"#math.seconds","objective":"<%config.internalScoreboard%>"}}," seconds."]
                        }
                    }
                }

                macro break_item weapon.mainhand minecraft:warped_fungus_on_a_stick{CustomModelData:4219511}
            }
        }
    }
}
