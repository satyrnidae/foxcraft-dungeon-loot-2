import ../../macros.mcm

# Runs when the datapack is loaded.
function on_load {
    scoreboard objectives add satyrn.fdl.howAboutNo.cooldown dummy

    execute store success score #test <%config.internalScoreboard%> run scoreboard players get howAboutNo.cooldown <%config.internalScoreboard%>
    execute if score #test <%config.internalScoreboard%> matches 0 run scoreboard players set howAboutNo.cooldown <%config.internalScoreboard%> 6000
}

# Executes once per tick.
function on_tick {
    # Increment the cooldown timer
    execute as @a[scores={satyrn.fdl.howAboutNo.cooldown=1..}] run {
        scoreboard players remove @s satyrn.fdl.howAboutNo.cooldown 1

        # Reset the cooldown timer after 5 minutes.
        execute at @s[scores={satyrn.fdl.howAboutNo.cooldown=..0}] run {
            playsound foxcraft_dungeon_loot:entity.player.spell_ready player @s ~ ~ ~ 0.5
            particle minecraft:witch ~ ~1 ~ 0 0.5 0 1 10 normal @s
            title @s actionbar {"text":"How About No is ready to be used once more.","color":"dark_purple"}
            scoreboard players reset @s satyrn.fdl.howAboutNo.cooldown
        }
    }
}

# Executes when the datapack is uninstalled via the uninstall function.
function on_uninstall {
    scoreboard objectives remove satyrn.fdl.howAboutNo.cooldown

    scoreboard players reset howAboutNo.cooldown <%config.internalScoreboard%>
}

# Executes on ticks where a player is using a Warped Fungus on a Stick.
function on_warped_fungus_used {
    execute if entity @s[predicate=foxcraft_dungeon_loot:items/how_about_no/in_main_hand] run {
        execute (if score @s satyrn.fdl.howAboutNo.cooldown matches 1..) {
            playsound foxcraft_dungeon_loot:entity.player.spell_fails player @s ~ ~ ~ 0.5
            title @s actionbar {"text":"How About No is on cooldown and cannot be used.","color":"dark_purple"}
        } else {
            # playsound to players in a 50-block radius
            playsound foxcraft_dungeon_loot:entity.player.cast_spell player @a ~ ~ ~ 3.125
            kill @e[type=#foxcraft_dungeon_loot:hostile,distance=..50,predicate=!foxcraft_dungeon_loot:is_persistent]

            execute unless entity @s[gamemode=creative] run {
                scoreboard players operation @s satyrn.fdl.howAboutNo.cooldown = howAboutNo.cooldown <%config.internalScoreboard%>
                scoreboard players operation #math.input1 <%config.internalScoreboard%> = howAboutNo.cooldown <%config.internalScoreboard%>
                function foxcraft_dungeon_loot:math/ticks_to_min_sec

                execute (if score #math.minutes <%config.internalScoreboard%> matches 0) {
                    execute (if score #math.seconds <%config.internalScoreboard%> matches 1) {
                        title @s actionbar {"text":"How About No is now on cooldown for 1 second.","color":"dark_purple"}
                    } else {
                        title @s actionbar [{"text":"How About No is now on cooldown for ","color":"dark_purple"},{"score":{"name":"#math.seconds","objective":"<%config.internalScoreboard%>"}}," seconds."]
                    }
                } else execute (if score #math.seconds <%config.internalScoreboard%> matches 0) {
                    execute (if score #math.minutes <%config.internalScoreboard%> matches 1) {
                        title @s actionbar {"text":"How About No is now on cooldown for 1 minute.","color":"dark_purple"}
                    } else {
                        title @s actionbar [{"text":"How About No is now on cooldown for ","color":"dark_purple"},{"score":{"name":"#math.minutes","objective":"<%config.internalScoreboard%>"}}," minutes."]
                    }
                } else {
                    execute (if score #math.minutes <%config.internalScoreboard%> matches 1) {
                        execute (if score #math.seconds <%config.internalScoreboard%> matches 1) {
                            title @s actionbar {"text":"How About No is now on cooldown for 1 minute, 1 second.","color":"dark_purple"}
                        } else {
                        title @s actionbar [{"text":"How About No is now on cooldown for 1 minute, ","color":"dark_purple"},{"score":{"name":"#math.seconds","objective":"<%config.internalScoreboard%>"}}," seconds."]
                        }
                    } else {
                        execute (if score #math.seconds <%config.internalScoreboard%> matches 1) {
                            title @s actionbar [{"text":"How About No is now on cooldown for ","color":"dark_purple"},{"score":{"name":"#math.minutes","objective":"<%config.internalScoreboard%>"}}," minutes, 1 second."]
                        } else {
                            title @s actionbar [{"text":"How About No is now on cooldown for ","color":"dark_purple"},{"score":{"name":"#math.minutes","objective":"<%config.internalScoreboard%>"}}," minutes, ",{"score":{"name":"#math.seconds","objective":"<%config.internalScoreboard%>"}}," seconds."]
                        }
                    }
                }

                macro break_item weapon.mainhand minecraft:warped_fungus_on_a_stick{CustomModelData:421959}
            }
        }
    }
}
