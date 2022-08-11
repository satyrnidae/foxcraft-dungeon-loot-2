import ../../macros.mcm

# Runs when the datapack is loaded.
function on_load {
    scoreboard objectives add satyrn.fdl.howAboutNo.cooldown dummy
}

# Executes once per tick.
function on_tick {
    # Increment the cooldown timer
    execute as @a[scores={satyrn.fdl.howAboutNo.cooldown=1..}] run {
        scoreboard players add @s satyrn.fdl.howAboutNo.cooldown 1

        # Reset the cooldown timer after 5 minutes.
        execute at @s[scores={satyrn.fdl.howAboutNo.cooldown=6000..}] run {
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
                scoreboard players set @s satyrn.fdl.howAboutNo.cooldown 1
                title @s actionbar {"text":"How About No is now on cooldown for 5 minutes.","color":"dark_purple"}
                macro break_item weapon.mainhand minecraft:warped_fungus_on_a_stick{CustomModelData:421959}
            }
        }
    }
}
