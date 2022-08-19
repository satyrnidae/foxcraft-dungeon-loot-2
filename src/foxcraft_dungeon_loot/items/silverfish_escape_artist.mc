# Runs when the datapack is loaded
function on_load {
    scoreboard objectives add satyrn.fdl.silverfishEscapeArtist.cooldown dummy

    execute store success score #test <%config.internalScoreboard%> run scoreboard players get silverfishEscapeArtist.cooldown <%config.internalScoreboard%>
    execute if score #test <%config.internalScoreboard%> matches 0 run scoreboard players set silverfishEscapeArtist.cooldown <%config.internalScoreboard%> 600
}

# Runs once per tick
function on_tick {
    execute as @a[scores={satyrn.fdl.silverfishEscapeArtist.cooldown=1..}] run {
        scoreboard players remove @s satyrn.fdl.silverfishEscapeArtist.cooldown 1

        execute at @s[scores={satyrn.fdl.silverfishEscapeArtist.cooldown=..0}] run {
            playsound foxcraft_dungeon_loot:entity.player.spell_ready player @s ~ ~ ~ 0.5
            particle minecraft:witch ~ ~1 ~ 0 0.5 0 1 10 normal @s
            title @s actionbar {"text":"Silverfish Escape Artist is ready to be used once more.","color":"dark_purple"}
            scoreboard players reset @s satyrn.fdl.silverfishEscapeArtist.cooldown
        }
    }
}

# Runs when the datapack is uninstalled.
function on_uninstall {
    scoreboard objectives remove satyrn.fdl.silverfishEscapeArtist.cooldown

    scoreboard players reset silverfishEscapeArtist.cooldown <%config.internalScoreboard%>
}

# Runs when a player uses a warped fungus on a stick
function on_warped_fungus_used {
    execute if entity @s[predicate=foxcraft_dungeon_loot:items/silverfish_escape_artist/in_main_hand] run {
        execute (if score @s satyrn.fdl.silverfishEscapeArtist.cooldown matches 1..) {
            playsound foxcraft_dungeon_loot:entity.player.spell_fails player @s ~ ~ ~ 0.5
            title @s actionbar {"text":"Silverfish Escape Artist is on cooldown and cannot be used.","color":"dark_purple"}
        } else {
            playsound minecraft:entity.generic.eat player @a
            playsound minecraft:entity.player.burp player @a
            particle minecraft:item minecraft:warped_fungus_on_a_stick{CustomModelData:4219510} ^ ^1.25 ^0.5 0 0.5 0.5 0.1 8

            effect give @s minecraft:saturation 3 0 true
            effect give @s minecraft:speed 30 3
            effect give @s minecraft:mining_fatigue 30
            effect give @s minecraft:jump_boost 30
            effect give @s minecraft:regeneration 30
            effect give @s minecraft:water_breathing 30
            effect give @s minecraft:invisibility 30
            effect give @s minecraft:night_vision 30
            effect give @s minecraft:weakness 30
            effect give @s minecraft:absorption 30
            effect give @s minecraft:glowing 30
            effect give @s minecraft:luck 30
            effect give @s minecraft:slow_falling 30
            effect give @s minecraft:hunger 30 2

            execute unless entity @s[gamemode=creative] run {
                scoreboard players operation @s satyrn.fdl.silverfishEscapeArtist.cooldown = silverfishEscapeArtist.cooldown <%config.internalScoreboard%>
                scoreboard players operation #math.input1 <%config.internalScoreboard%> = silverfishEscapeArtist.cooldown <%config.internalScoreboard%>
                function foxcraft_dungeon_loot:math/ticks_to_min_sec

                execute (if score #math.minutes <%config.internalScoreboard%> matches 0) {
                    execute (if score #math.seconds <%config.internalScoreboard%> matches 1) {
                        title @s actionbar {"text":"Silverfish Escape Artist is now on cooldown for 1 second.","color":"dark_purple"}
                    } else {
                        title @s actionbar [{"text":"Silverfish Escape Artist is now on cooldown for ","color":"dark_purple"},{"score":{"name":"#math.seconds","objective":"<%config.internalScoreboard%>"}}," seconds."]
                    }
                } else execute (if score #math.seconds <%config.internalScoreboard%> matches 0) {
                    execute (if score #math.minutes <%config.internalScoreboard%> matches 1) {
                        title @s actionbar {"text":"Silverfish Escape Artist is now on cooldown for 1 minute.","color":"dark_purple"}
                    } else {
                        title @s actionbar [{"text":"Silverfish Escape Artist is now on cooldown for ","color":"dark_purple"},{"score":{"name":"#math.minutes","objective":"<%config.internalScoreboard%>"}}," minutes."]
                    }
                } else {
                    execute (if score #math.minutes <%config.internalScoreboard%> matches 1) {
                        execute (if score #math.seconds <%config.internalScoreboard%> matches 1) {
                            title @s actionbar {"text":"Silverfish Escape Artist is now on cooldown for 1 minute, 1 second.","color":"dark_purple"}
                        } else {
                        title @s actionbar [{"text":"Silverfish Escape Artist is now on cooldown for 1 minute, ","color":"dark_purple"},{"score":{"name":"#math.seconds","objective":"<%config.internalScoreboard%>"}}," seconds."]
                        }
                    } else {
                        execute (if score #math.seconds <%config.internalScoreboard%> matches 1) {
                            title @s actionbar [{"text":"Silverfish Escape Artist is now on cooldown for ","color":"dark_purple"},{"score":{"name":"#math.minutes","objective":"<%config.internalScoreboard%>"}}," minutes, 1 second."]
                        } else {
                            title @s actionbar [{"text":"Silverfish Escape Artist is now on cooldown for ","color":"dark_purple"},{"score":{"name":"#math.minutes","objective":"<%config.internalScoreboard%>"}}," minutes, ",{"score":{"name":"#math.seconds","objective":"<%config.internalScoreboard%>"}}," seconds."]
                        }
                    }
                }

                item modify entity @s weapon.mainhand foxcraft_dungeon_loot:remove
            }
        }
    }
}
