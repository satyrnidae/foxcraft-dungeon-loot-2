import ../../macros.mcm

# Run when the datapack is loaded.
function on_load {
    scoreboard objectives add satyrn.fdl.featherOfQuetZala.cooldown dummy

    execute store success score #test <%config.internalScoreboard%> run scoreboard players get featherOfQuetZala.cooldown <%config.internalScoreboard%>
    execute if score #test <%config.internalScoreboard%> matches 0 run scoreboard players set featherOfQuetZala.cooldown <%config.internalScoreboard%> 600
}

# Runs once per tick.
function on_tick {
    # Increment the cooldown timer
    execute as @a[scores={satyrn.fdl.featherOfQuetZala.cooldown=1..}] run {
        scoreboard players remove @s satyrn.fdl.featherOfQuetZala.cooldown 1

        # Reset the cooldown timer after 30 seconds.
        execute at @s[scores={satyrn.fdl.featherOfQuetZala.cooldown=..0}] run {
            playsound foxcraft_dungeon_loot:entity.player.spell_ready player @s ~ ~ ~ 0.5
            particle minecraft:witch ~ ~1 ~ 0 0.5 0 1 10 normal @s
            title @s actionbar {"text":"The Feather of Quet-Zala is ready to be used once more.","color":"dark_purple"}
            scoreboard players reset @s satyrn.fdl.featherOfQuetZala.cooldown
        }
    }
}

# Runs when the datapack is uninstalled via the uninstall function.
function on_uninstall {
    scoreboard objectives remove satyrn.fdl.featherOfQuetZala.cooldown

    scoreboard players reset featherOfQuetZala.cooldown <%config.internalScoreboard%>
}

# Runs on ticks where a player is using a warped fungus on a stick.
function on_warped_fungus_used {
    execute if entity @s[predicate=foxcraft_dungeon_loot:items/feather_of_quet_zala/in_main_hand] run {
        execute (if score @s satyrn.fdl.featherOfQuetZala.cooldown matches 1..) {
            playsound foxcraft_dungeon_loot:entity.player.spell_fails player @s ~ ~ ~ 0.5
            title @s actionbar {"text":"The Feather of Quet-Zala is on cooldown and cannot be used.","color":"dark_purple"}
        } else {
            # Player has used the Feather of Quet-Zala, so apply 30 seconds of Levitation.
            playsound foxcraft_dungeon_loot:entity.player.cast_spell player @a

            effect give @s minecraft:levitation 30

            # If the player is not in creative mode, destroy the feather and trigger the cooldown.
            execute unless entity @s[gamemode=creative] run {
                scoreboard players operation @s satyrn.fdl.featherOfQuetZala.cooldown = featherOfQuetZala.cooldown <%config.internalScoreboard%>
                scoreboard players operation #math.input1 <%config.internalScoreboard%> = featherOfQuetZala.cooldown <%config.internalScoreboard%>
                function foxcraft_dungeon_loot:math/ticks_to_min_sec

                execute (if score #math.minutes <%config.internalScoreboard%> matches 0) {
                    execute (if score #math.seconds <%config.internalScoreboard%> matches 1) {
                        title @s actionbar {"text":"The Feather of Quet-Zala is now on cooldown for 1 second.","color":"dark_purple"}
                    } else {
                        title @s actionbar [{"text":"The Feather of Quet-Zala is now on cooldown for ","color":"dark_purple"},{"score":{"name":"#math.seconds","objective":"<%config.internalScoreboard%>"}}," seconds."]
                    }
                } else execute (if score #math.seconds <%config.internalScoreboard%> matches 0) {
                    execute (if score #math.minutes <%config.internalScoreboard%> matches 1) {
                        title @s actionbar {"text":"The Feather of Quet-Zala is now on cooldown for 1 minute.","color":"dark_purple"}
                    } else {
                        title @s actionbar [{"text":"The Feather of Quet-Zala is now on cooldown for ","color":"dark_purple"},{"score":{"name":"#math.minutes","objective":"<%config.internalScoreboard%>"}}," minutes."]
                    }
                } else {
                    execute (if score #math.minutes <%config.internalScoreboard%> matches 1) {
                        execute (if score #math.seconds <%config.internalScoreboard%> matches 1) {
                            title @s actionbar {"text":"The Feather of Quet-Zala is now on cooldown for 1 minute, 1 second.","color":"dark_purple"}
                        } else {
                        title @s actionbar [{"text":"The Feather of Quet-Zala is now on cooldown for 1 minute, ","color":"dark_purple"},{"score":{"name":"#math.seconds","objective":"<%config.internalScoreboard%>"}}," seconds."]
                        }
                    } else {
                        execute (if score #math.seconds <%config.internalScoreboard%> matches 1) {
                            title @s actionbar [{"text":"The Feather of Quet-Zala is now on cooldown for ","color":"dark_purple"},{"score":{"name":"#math.minutes","objective":"<%config.internalScoreboard%>"}}," minutes, 1 second."]
                        } else {
                            title @s actionbar [{"text":"The Feather of Quet-Zala is now on cooldown for ","color":"dark_purple"},{"score":{"name":"#math.minutes","objective":"<%config.internalScoreboard%>"}}," minutes, ",{"score":{"name":"#math.seconds","objective":"<%config.internalScoreboard%>"}}," seconds."]
                        }
                    }
                }

                macro break_item weapon.mainhand minecraft:warped_fungus_on_a_stick{CustomModelData:4219513}
            }
        }
    }
}
