import ../../macros.mcm

# Run when the datapack is loaded.
function on_load {
    scoreboard objectives add satyrn.fdl.evokersTome.cooldown dummy
    scoreboard objectives add satyrn.fdl.evokersTome.spawnerLife dummy
    scoreboard objectives add satyrn.fdl.evokersTome.fangLife dummy
}

# Runs once per tick.
function on_tick {
    # Increment cooldown timer.
    execute as @a[scores={satyrn.fdl.evokersTome.cooldown=1..}] run {
        execute at @s[predicate=foxcraft_dungeon_loot:items/evokers_tome/in_main_hand,scores={satyrn.fdl.evokersTome.cooldown=1}] run {
            summon minecraft:armor_stand ^ ^ ^1 {Invisible:<%config.dev?0:1%>b,NoGravity:1b,Small:1b,Tags:[satyrn.fdl.evokerFangs,satyrn.fdl.fangBeam,satyrn.fdl.fangSpawn]}
            playsound foxcraft_dungeon_loot:entity.player.cast_spell player @a

            execute unless entity @s[gamemode=creative] run {
                execute (if entity @s[predicate=foxcraft_dungeon_loot:items/mainhand_has_unbreaking]) {
                    execute store result score #math.input1 <%config.internalScoreboard%> run data get entity @s SelectedItem.tag.Enchantments[{id:"minecraft:unbreaking"}].lvl
                    function foxcraft_dungeon_loot:math/should_damage_tool
                    execute if score #math.result <%config.internalScoreboard%> matches 1 run item modify entity @s weapon.mainhand foxcraft_dungeon_loot:evokers_tome/damage_jaw_trap
                } else {
                    item modify entity @s weapon.mainhand foxcraft_dungeon_loot:evokers_tome/damage_jaw_trap
                }

                execute if entity @s[predicate=foxcraft_dungeon_loot:items/mainhand_broken] run {
                    macro break_item weapon.mainhand minecraft:warped_fungus_on_a_stick{CustomModelData:421951}
                }
            }
        }
        execute at @s[predicate=foxcraft_dungeon_loot:items/evokers_tome/in_main_hand,scores={satyrn.fdl.evokersTome.cooldown=100}] run {
            summon minecraft:armor_stand ~ ~2 ~ {Invisible:<%config.dev?0:1%>b,NoGravity:1b,Small:1b,Tags:[satyrn.fdl.evokerFangs,satyrn.fdl.fangPivot]}
            playsound foxcraft_dungeon_loot:entity.player.cast_spell player @a

            execute unless entity @s[gamemode=creative] run {
                execute (if entity @s[predicate=foxcraft_dungeon_loot:items/mainhand_has_unbreaking]) {
                    execute store result score #math.input1 <%config.internalScoreboard%> run data get entity @s SelectedItem.tag.Enchantments[{id:"minecraft:unbreaking"}].lvl
                    function foxcraft_dungeon_loot:math/should_damage_tool
                    execute if score #math.result <%config.internalScoreboard%> matches 1 run item modify entity @s weapon.mainhand foxcraft_dungeon_loot:evokers_tome/damage_sharknado
                } else {
                    item modify entity @s weapon.mainhand foxcraft_dungeon_loot:evokers_tome/damage_sharknado
                }

                execute if entity @s[predicate=foxcraft_dungeon_loot:items/mainhand_broken] run {
                    macro break_item weapon.mainhand minecraft:warped_fungus_on_a_stick{CustomModelData:421951}
                }
            }
        }


        scoreboard players add @s satyrn.fdl.evokersTome.cooldown 1
        # Reset the cooldown timer at 2 seconds (offset by 0t) and 5 seconds (offset by 100t).
        execute at @s[scores={satyrn.fdl.evokersTome.cooldown=40..99}] run function foxcraft_dungeon_loot:items/evokers_tome/reset_cooldown
        execute at @s[scores={satyrn.fdl.evokersTome.cooldown=200..}] run function foxcraft_dungeon_loot:items/evokers_tome/reset_cooldown
    }

    # Now we process the entities created by the Evoker's Tome. Warning for use of @e selection!
    # Since scoreboards are set on entities, using PaperMC with "entities on scoreboard" disabled
    #    is not supported for this item.

    # Process fang beams. This is the default activation mode for the item.
    execute as @e[tag=satyrn.fdl.fangBeam] at @s run {
        scoreboard players add @s satyrn.fdl.evokersTome.spawnerLife 1
        execute (if score @s satyrn.fdl.evokersTome.spawnerLife matches 1) {
            data modify entity @s Rotation set from entity @p[scores={satyrn.fdl.evokersTome.cooldown=1..}] Rotation
            tp @s ~ ~1.7 ~
        } else execute (if score @s satyrn.fdl.evokersTome.spawnerLife matches 2..) {
            tp @s ^ ^ ^1
            # Fang beam extends outwards for 15 ticks
            execute if score @s satyrn.fdl.evokersTome.spawnerLife matches 15.. run kill @s
        }
    }

    # Process the fang pivot for the fang area attack.
    execute as @e[tag=satyrn.fdl.fangPivot] at @s run {
        scoreboard players add @s satyrn.fdl.evokersTome.spawnerLife 1
        execute if score @s satyrn.fdl.evokersTome.spawnerLife matches 2 run {
            summon minecraft:armor_stand ~5 ~ ~ {Invisible:<%config.dev?0:1%>b,Small:1,Tags:[satyrn.fdl.fangSpawn,satyrn.fdl.circleFang,satyrn.fdl.fangLead]}
            summon minecraft:armor_stand ~4 ~ ~ {Invisible:<%config.dev?0:1%>b,Small:1,Tags:[satyrn.fdl.fangSpawn,satyrn.fdl.circleFang,satyrn.fdl.fang4]}
            summon minecraft:armor_stand ~3 ~ ~ {Invisible:<%config.dev?0:1%>b,Small:1,Tags:[satyrn.fdl.fangSpawn,satyrn.fdl.circleFang,satyrn.fdl.fang3]}
            summon minecraft:armor_stand ~4 ~ ~ {Invisible:<%config.dev?0:1%>b,Small:1,Tags:[satyrn.fdl.fangSpawn,satyrn.fdl.circleFang,satyrn.fdl.fang2]}
        }

        tp @s ~ ~ ~ facing entity @e[tag=satyrn.fdl.fangLead,limit=1,sort=nearest] feet
        execute at @s run {
            tp @e[tag=satyrn.fdl.fangLead,limit=1,sort=nearest] ^2 ^ ^5
            tp @e[tag=satyrn.fdl.fang4,limit=1,sort=nearest] ^4 ^ ^
            tp @e[tag=satyrn.fdl.fang3,limit=1,sort=nearest] ^ ^ ^-3
            tp @e[tag=satyrn.fdl.fang2,limit=1,sort=nearest] ^-2 ^ ^
        }

        execute if score @s satyrn.fdl.evokersTome.spawnerLife matches 40.. run kill @s

        execute as @e[tag=satyrn.fdl.circleFang] at @s run {
            scoreboard players add @s satyrn.fdl.evokersTome.spawnerLife 1
            execute if entity @e[type=minecraft:evoker_fangs,distance=1..5] run data modify entity @e[type=minecraft:evoker_fangs,limit=1,sort=nearest] Silent set value 1b
            execute if score @s satyrn.fdl.evokersTome.spawnerLife matches 35.. run kill @s
        }
    }
    execute if entity @e[tag=satyrn.fdl.fang] run scoreboard players add @e[tag=satyrn.fdl.fang] satyrn.fdl.evokersTome.fangLife 1

    # Spawn the armor stand marker for the evoker fangs
    execute as @e[tag=satyrn.fdl.fangSpawn,scores={satyrn.fdl.evokersTome.spawnerLife=2..}] at @s run summon minecraft:armor_stand ~ ~ ~ {Invisible:<%config.dev?0:1%>b,Silent:1b,Small:1b,Tags:[satyrn.fdl.evokerFangs,satyrn.fdl.fang],Motion:[0.0,-10.0,0.0]}

    # Spawn the evoker fangs
    execute as @e[tag=satyrn.fdl.fang,scores={satyrn.fdl.evokersTome.fangLife=1..}] at @s run {
        execute if entity @s[predicate=foxcraft_dungeon_loot:is_on_ground] run {
            summon minecraft:evoker_fangs ~ ~ ~ {Tags:[satyrn.fdl.playerEvokerFang]}
            execute as @e[tag=satyrn.fdl.playerEvokerFang,type=minecraft:evoker_fangs,limit=1,sort=nearest] at @s run {
                data modify entity @s Owner set from entity @p[scores={satyrn.fdl.evokersTome.cooldown=1..}] UUID
                tag @s remove satyrn.fdl.playerEvokerFang
            }
        }
        kill @s
    }
}

# Run when the datapack is uninstalled via the uninstall function.
function on_uninstall {
    scoreboard objectives remove satyrn.fdl.evokersTome.cooldown
    scoreboard objectives remove satyrn.fdl.evokersTome.spawnerLife
    scoreboard objectives remove satyrn.fdl.evokersTome.fangLife
}

# Occurs on ticks where a player used a warped fungus on a stick.
function on_warped_fungus_used {
    # We want to check if the player is using the Evoker's Tome after the cooldown has incremented since processing is
    # offset into the next tick.
    execute if entity @s[predicate=foxcraft_dungeon_loot:items/evokers_tome/in_main_hand] run {
        execute (if score @s satyrn.fdl.evokersTome.cooldown matches 1..) {
            playsound foxcraft_dungeon_loot:entity.player.spell_fails player @s ~ ~ ~ 0.5
            title @s actionbar {"text":"The Evoker's Tome is on cooldown and cannot be used.","color":"dark_purple"}
        } else execute (if entity @s[predicate=foxcraft_dungeon_loot:is_sneaking]) {
                scoreboard players set @s satyrn.fdl.evokersTome.cooldown 100
                title @s actionbar {"text":"The Evoker's Tome is now on cooldown for 5 seconds.","color":"dark_purple"}
        } else {
            scoreboard players set @s satyrn.fdl.evokersTome.cooldown 1
            title @s actionbar {"text":"The Evoker's Tome is now on cooldown for 2 seconds.","color":"dark_purple"}
        }
    }
}

function reset_cooldown {
    playsound foxcraft_dungeon_loot:entity.player.spell_ready player @s ~ ~ ~ 0.5
    particle minecraft:witch ~ ~1 ~ 0 0.5 0 1 10 normal @s
    title @s actionbar {"text":"The Evoker's Tome is ready to use once more.","color":"dark_purple"}
    scoreboard players reset @s satyrn.fdl.evokersTome.cooldown
}
