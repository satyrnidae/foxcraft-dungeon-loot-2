import ../../macros.mcm

# TAGS USED
# satyrn.fdl.deilonasHolyBlessings.source - The player who is the source of a healing burst.

# Runs once when the datapack is loaded or reloaded.
function on_load {
    scoreboard objectives add satyrn.fdl.deilonasHolyBlessings.cooldown dummy

    execute store success score #test <%config.internalScoreboard%> run scoreboard players get deilonasHolyBlessings.cooldown <%config.internalScoreboard%>
    execute if score #test <%config.internalScoreboard%> matches 0 run scoreboard players set deilonasHolyBlessings.cooldown <%config.internalScoreboard%> 200
}

# Runs once per tick
function on_tick {
    # Increment the item's cooldown timer for all players on cooldown.
    execute as @a[scores={satyrn.fdl.deilonasHolyBlessings.cooldown=1..}] run {
        scoreboard players remove @s satyrn.fdl.deilonasHolyBlessings.cooldown 1

        # Reset the cooldown timer for all players whose cooldown has been incremented for 200 ticks.
        execute at @s[scores={satyrn.fdl.deilonasHolyBlessings.cooldown=..0}] run {
            playsound foxcraft_dungeon_loot:entity.player.spell_ready player @s ~ ~ ~ 0.5
            particle minecraft:witch ~ ~1 ~ 0 0.5 0 1 10 normal @s
            title @s actionbar {"text":"Deilona's Holy Blessings is ready to be used once more.","color":"dark_purple"}
            scoreboard players reset @s satyrn.fdl.deilonasHolyBlessings.cooldown
        }
    }
}

# Runs when the datapack is uninstalled.
function on_uninstall {
    scoreboard objectives remove satyrn.fdl.deilonasHolyBlessings.cooldown

    scoreboard players reset deilonasHolyBlessings.cooldown <%config.internalScoreboard%>
}

# Runs on ticks where a player is attempting to use a warped fungus on a stick.
function on_warped_fungus_used {
    execute if entity @s[predicate=foxcraft_dungeon_loot:items/deilonas_holy_blessings/in_main_hand] run {
        execute (if score @s satyrn.fdl.deilonasHolyBlessings.cooldown matches 1..) {
            playsound foxcraft_dungeon_loot:entity.player.spell_fails player @s ~ ~ ~ 0.5
            title @s actionbar {"text":"Deilona's Holy Blessings is on cooldown and cannot be used.","color":"dark_purple"}
        } else {
            tag @s add satyrn.fdl.deilonasHolyBlessings.source
            # Summon a short-lived area effect cloud to show the effect radius
            summon minecraft:area_effect_cloud ~ ~0.1 ~ {Duration:2,Color:16262179,Radius:20}
            # Apply the effects for using Deilona's Holy Blessings
            execute as @e[tag=!satyrn.fdl.deilonasHolyBlessings.source,distance=0.0001..20,type=!#foxcraft_dungeon_loot:non_living] at @s anchored eyes run {
                effect give @s minecraft:instant_health 3 5
                particle minecraft:heart ^ ^0.5 ^ 0 0 0 0.2 1 force @a[tag=satyrn.fdl.deilonasHolyBlessings.source]
            }
            tag @s remove satyrn.fdl.deilonasHolyBlessings.source

            playsound foxcraft_dungeon_loot:entity.player.cast_wololo player @a ~ ~ ~ 1.125
            particle minecraft:enchanted_hit ~ ~1 ~ 0.5 0.5 0.5 1.0 10 normal @s

            # Break the item and set cooldown for players who are not creative enough ;P
            execute unless entity @s[gamemode=creative] run {
                scoreboard players operation @s satyrn.fdl.deilonasHolyBlessings.cooldown = deilonasHolyBlessings.cooldown <%config.internalScoreboard%>
                scoreboard players operation #math.input1 <%config.internalScoreboard%> = deilonasHolyBlessings.cooldown <%config.internalScoreboard%>
                function foxcraft_dungeon_loot:math/ticks_to_min_sec

                execute (if score #math.minutes <%config.internalScoreboard%> matches 0) {
                    execute (if score #math.seconds <%config.internalScoreboard%> matches 1) {
                        title @s actionbar {"text":"Deilona's Holy Blessings are now on cooldown for 1 second.","color":"dark_purple"}
                    } else {
                        title @s actionbar [{"text":"Deilona's Holy Blessings are now on cooldown for ","color":"dark_purple"},{"score":{"name":"#math.seconds","objective":"<%config.internalScoreboard%>"}}," seconds."]
                    }
                } else execute (if score #math.seconds <%config.internalScoreboard%> matches 0) {
                    execute (if score #math.minutes <%config.internalScoreboard%> matches 1) {
                        title @s actionbar {"text":"Deilona's Holy Blessings are now on cooldown for 1 minute.","color":"dark_purple"}
                    } else {
                        title @s actionbar [{"text":"Deilona's Holy Blessings are now on cooldown for ","color":"dark_purple"},{"score":{"name":"#math.minutes","objective":"<%config.internalScoreboard%>"}}," minutes."]
                    }
                } else {
                    execute (if score #math.minutes <%config.internalScoreboard%> matches 1) {
                        execute (if score #math.seconds <%config.internalScoreboard%> matches 1) {
                            title @s actionbar {"text":"Deilona's Holy Blessings are now on cooldown for 1 minute, 1 second.","color":"dark_purple"}
                        } else {
                        title @s actionbar [{"text":"Deilona's Holy Blessings are now on cooldown for 1 minute, ","color":"dark_purple"},{"score":{"name":"#math.seconds","objective":"<%config.internalScoreboard%>"}}," seconds."]
                        }
                    } else {
                        execute (if score #math.seconds <%config.internalScoreboard%> matches 1) {
                            title @s actionbar [{"text":"Deilona's Holy Blessings are now on cooldown for ","color":"dark_purple"},{"score":{"name":"#math.minutes","objective":"<%config.internalScoreboard%>"}}," minutes, 1 second."]
                        } else {
                            title @s actionbar [{"text":"Deilona's Holy Blessings are now on cooldown for ","color":"dark_purple"},{"score":{"name":"#math.minutes","objective":"<%config.internalScoreboard%>"}}," minutes, ",{"score":{"name":"#math.seconds","objective":"<%config.internalScoreboard%>"}}," seconds."]
                        }
                    }
                }

                macro break_item weapon.mainhand minecraft:warped_fungus_on_a_stick{CustomModelData:421955}
            }
        }
    }
}
