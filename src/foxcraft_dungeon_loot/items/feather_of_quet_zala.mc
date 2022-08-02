import ../../macros.mcm

function give {
    macro give_as_loot epic/feather_of_quet_zala
}

function on_load {
    scoreboard objectives add satyrn.fdl.featherOfQuetZala.cooldown dummy
}

function on_tick {
    execute if score @s satyrn.fdl.itemId.mainHand matches 43 if score @s satyrn.fdl.used.warpedFungusOnAStick matches 1.. run {
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

    # Increment the cooldown timer
    execute if score @s satyrn.fdl.featherOfQuetZala.cooldown matches 1.. run scoreboard players add @s satyrn.fdl.featherOfQuetZala.cooldown 1

    # Reset the cooldown timer after 30 seconds.
    execute if score @s satyrn.fdl.featherOfQuetZala.cooldown matches 600.. run {
        playsound foxcraft_dungeon_loot:entity.player.spell_ready player @s ~ ~ ~ 0.5
        particle minecraft:witch ~ ~1 ~ 0 0.5 0 1 10 normal @s
        title @s actionbar {"text":"The Feather of Quet-Zala is ready to be used once more.","color":"dark_purple"}
        scoreboard players reset @s satyrn.fdl.featherOfQuetZala.cooldown
    }
}
