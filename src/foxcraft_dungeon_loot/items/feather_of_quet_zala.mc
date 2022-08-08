import ../../macros.mcm

# Run when the datapack is loaded.
function on_load {
    scoreboard objectives add satyrn.fdl.featherOfQuetZala.cooldown dummy
}

# Runs once per tick.
function on_tick {
    # Increment the cooldown timer
    execute as @a[scores={satyrn.fdl.featherOfQuetZala.cooldown=1..}] run {
        scoreboard players add @s satyrn.fdl.featherOfQuetZala.cooldown 1

        # Reset the cooldown timer after 30 seconds.
        execute at @s[scores={satyrn.fdl.featherOfQuetZala.cooldown=600..}] run {
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
                scoreboard players set @s satyrn.fdl.featherOfQuetZala.cooldown 1
                title @s actionbar {"text":"The Feather of Quet-Zala is now on cooldown for 30 seconds.","color":"dark_purple"}

                macro break_item weapon.mainhand minecraft:warped_fungus_on_a_stick{CustomModelData:4219513}
            }
        }
    }
}
