import ../../macros.mcm

# Occurs once when the datapack is loaded.
function on_load {
    scoreboard objectives add satyrn.fdl.bringerOfFear.cooldown dummy
}

# Occurs once per tick.
function on_tick {
    # Execute for all players with a cooldown score greater than one.
    execute as @a[scores={satyrn.fdl.bringerOfFear.cooldown=1..}] run {

        scoreboard players add @s satyrn.fdl.bringerOfFear.cooldown 1

        # Execute for all players with a cooldown score greater than 24k ticks.
        execute at @s[scores={satyrn.fdl.bringerOfFear.coooldown=24000..}] run {
            playsound foxcraft_dungeon_loot:entity.player.spell_ready player @s ~ ~ ~ 0.5
            particle minecraft:witch ~ ~1 ~ 0 0.5 0 1 10 normal @s
            title @s actionbar {"text":"Bringer of Fear is ready to be used once more.","color":"dark_purple"}
            scoreboard players reset @s satyrn.fdl.bringerOfFear.cooldown
        }
    }
}

# Occurs once when the datapack is uninstalled.
function on_uninstall {
    scoreboard objectives remove satyrn.fdl.bringerOfFear.cooldown
}

# Occurs when this item type is used.
function on_warped_fungus_used {
    execute if entity @s[predicate=foxcraft_dungeon_loot:items/bringer_of_fear/in_main_hand] run {
        execute (if score @s satyrn.fdl.bringerOfFear.cooldown matches 1..) {
            playsound foxcraft_dungeon_loot:entity.player.spell_fails player @s ~ ~ ~ 0.5
            title @s actionbar {"text":"Bringer of Fear is on cooldown and cannot be used.","color":"dark_purple"}
        } else {
            playsound minecraft:event.raid.horn hostile @a ~ ~ ~ 100

            macro random 1 20

            execute (if score #math.result <%config.internalScoreboard%> matches 1..10) {
                effect give @s minecraft:bad_omen 1200
                tellraw @s {"text":"A chill trickles down your spine.","color":"gray","italic":true}
            } else execute (if score #math.result <%config.internalScoreboard%> matches 11..17) {
                effect give @s minecraft:bad_omen 1200 2
                tellraw @s {"text":"The sound of horns fills the air.","color":"gray","italic":true}
            } else {
                effect give @s minecraft:bad_omen 1200 4
                weather thunder 15
                tellraw @s {"text":"The sky darkens as the horns blare. What have you done?","color":"gray","italic":true}
            }

            execute unless entity @s[gamemode=creative] run {
                scoreboard players set @s satyrn.fdl.bringerOfFear.cooldown 1
                title @s actionbar {"text":"Bringer of Fear is now on cooldown for 20 minutes.","color":"dark_purple"}

                macro break_item weapon.mainhand minecraft:warped_fungus_on_a_stick{CustomModelData:4219512}
            }
        }
    }
}
