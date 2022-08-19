import ../../macros.mcm

# Initializes the Downpour Amulet's cooldown scoreboard.
function on_load {
    scoreboard objectives add satyrn.fdl.downpourAmulet.cooldown dummy

    execute store success score #test <%config.internalScoreboard%> run scoreboard players get downpourAmulet.cooldown <%config.internalScoreboard%>
    execute if score #test <%config.internalScoreboard%> matches 0 run scoreboard players set downpourAmulet.cooldown <%config.internalScoreboard%> 6000
}

# Runs once per tick.
function on_tick {
    # Increment cooldown timer
    execute as @a[scores={satyrn.fdl.downpourAmulet.cooldown=1..}] run {
        scoreboard players remove @s satyrn.fdl.downpourAmulet.cooldown 1

        # Reset cooldown after 5 minutes
        execute at @s[scores={satyrn.fdl.downpourAmulet.cooldown=..0}] run {
            playsound foxcraft_dungeon_loot:entity.player.spell_ready player @s ~ ~ ~ 0.5
            particle minecraft:witch ~ ~1 ~ 0 0.5 0 1 10 normal @s
            title @s actionbar {"text":"The Downpour Amulet is ready to be used once more.","color":"dark_purple"}
            scoreboard players reset @s satyrn.fdl.downpourAmulet.cooldown
        }
    }
}

# Runs when the datapack is uninstalled using the uninstall function.
function on_uninstall {
    scoreboard objectives remove satyrn.fdl.downpourAmulet.cooldown

    scoreboard players reset downpourAmulet.cooldown <%config.internalScoreboard%>
}

function on_warped_fungus_used {
    execute if entity @s[predicate=foxcraft_dungeon_loot:items/downpour_amulet/in_main_hand] run {
        execute (if score @s satyrn.fdl.downpourAmulet.cooldown matches 1..) {
            # Warn the player that the item cooldown is currently active.
            playsound foxcraft_dungeon_loot:entity.player.spell_fails player @s ~ ~ ~ 0.5
            title @s actionbar {"text":"The Downpour Amulet is currently on cooldown and cannot be used.","color":"dark_purple"}
        } else {
            playsound foxcraft_dungeon_loot:entity.player.cast_wololo player @a
            playsound minecraft:entity.lightning_bolt.thunder weather @a ~ ~ ~ 6.0
            particle minecraft:enchanted_hit ~ ~1 ~ 0.5 0.5 0.5 1.0 10 normal @s

            # If the sender is crouching, set the weather to thunder. Otherwise, set it to rain.
            execute (if entity @s[predicate=foxcraft_dungeon_loot:is_sneaking]) {
                weather thunder 150
                tellraw @a ["[",{"selector":"@s"},"] ",{"text":"Set the weather to Thunder for 2 minutes, 30 seconds."}]
            } else {
                weather rain 300
                tellraw @a ["[",{"selector":"@s"},"] ",{"text":"Set the weather to Rain for 5 minutes."}]
            }

            # Set cooldown, damage, and potentially break the item for non-creative players.
            execute unless entity @s[gamemode=creative] run {
                scoreboard players operation @s satyrn.fdl.downpourAmulet.cooldown = downpourAmulet.cooldown <%config.internalScoreboard%>
                scoreboard players operation #math.input1 <%config.internalScoreboard%> = downpourAmulet.cooldown <%config.internalScoreboard%>
                function foxcraft_dungeon_loot:math/ticks_to_min_sec

                execute (if score #math.minutes <%config.internalScoreboard%> matches 0) {
                    execute (if score #math.seconds <%config.internalScoreboard%> matches 1) {
                        title @s actionbar {"text":"The Downpour Amulet is now on cooldown for 1 second.","color":"dark_purple"}
                    } else {
                        title @s actionbar [{"text":"The Downpour Amulet is now on cooldown for ","color":"dark_purple"},{"score":{"name":"#math.seconds","objective":"<%config.internalScoreboard%>"}}," seconds."]
                    }
                } else execute (if score #math.seconds <%config.internalScoreboard%> matches 0) {
                    execute (if score #math.minutes <%config.internalScoreboard%> matches 1) {
                        title @s actionbar {"text":"The Downpour Amulet is now on cooldown for 1 minute.","color":"dark_purple"}
                    } else {
                        title @s actionbar [{"text":"The Downpour Amulet is now on cooldown for ","color":"dark_purple"},{"score":{"name":"#math.minutes","objective":"<%config.internalScoreboard%>"}}," minutes."]
                    }
                } else {
                    execute (if score #math.minutes <%config.internalScoreboard%> matches 1) {
                        execute (if score #math.seconds <%config.internalScoreboard%> matches 1) {
                            title @s actionbar {"text":"The Downpour Amulet is now on cooldown for 1 minute, 1 second.","color":"dark_purple"}
                        } else {
                        title @s actionbar [{"text":"The Downpour Amulet is now on cooldown for 1 minute, ","color":"dark_purple"},{"score":{"name":"#math.seconds","objective":"<%config.internalScoreboard%>"}}," seconds."]
                        }
                    } else {
                        execute (if score #math.seconds <%config.internalScoreboard%> matches 1) {
                            title @s actionbar [{"text":"The Downpour Amulet is now on cooldown for ","color":"dark_purple"},{"score":{"name":"#math.minutes","objective":"<%config.internalScoreboard%>"}}," minutes, 1 second."]
                        } else {
                            title @s actionbar [{"text":"The Downpour Amulet is now on cooldown for ","color":"dark_purple"},{"score":{"name":"#math.minutes","objective":"<%config.internalScoreboard%>"}}," minutes, ",{"score":{"name":"#math.seconds","objective":"<%config.internalScoreboard%>"}}," seconds."]
                        }
                    }
                }

                execute (if entity @s[predicate=foxcraft_dungeon_loot:items/mainhand_has_unbreaking]) {
                    execute store result score #math.input1 <%config.internalScoreboard%> run data get entity @s SelectedItem.tag.Enchantments[{id:"minecraft:unbreaking"}].lvl
                    function foxcraft_dungeon_loot:math/should_damage_tool
                    execute if score #math.result <%config.internalScoreboard%> matches 1 run function foxcraft_dungeon_loot:items/downpour_amulet/damage
                } else {
                    function foxcraft_dungeon_loot:items/downpour_amulet/damage
                }
            }
        }
    }
}

function damage {
    execute (if entity @s[predicate=foxcraft_dungeon_loot:is_sneaking]) {
        item modify entity @s weapon.mainhand foxcraft_dungeon_loot:downpour_amulet/damage_thunder
    } else {
        item modify entity @s weapon.mainhand foxcraft_dungeon_loot:downpour_amulet/damage_rain
    }
    # Break item if damage is maxed out.
    execute if entity @s[predicate=foxcraft_dungeon_loot:items/mainhand_broken] run {
        macro break_item weapon.mainhand minecraft:warped_fungus_on_a_stick{CustomModelData:421954}
    }
}
