import ../../macros.mcm

function give {
    macro give_as_loot mythic/how_about_no
}

function on_load {
    scoreboard objectives add satyrn.fdl.howAboutNo.cooldown dummy
}

function on_tick {
    execute if score @s[predicate=!foxcraft_dungeon_loot:items/offhand_prevents_use] satyrn.fdl.itemId.mainHand matches 46 if score @s satyrn.fdl.used.warpedFungusOnAStick matches 1.. run {
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

    # Increment the cooldown timer
    execute if score @s satyrn.fdl.howAboutNo.cooldown matches 1.. run scoreboard players add @s satyrn.fdl.howAboutNo.cooldown 1

    # Reset the cooldown timer after 5 minutes.
    execute if score @s satyrn.fdl.howAboutNo.cooldown matches 6000.. run {
        playsound foxcraft_dungeon_loot:entity.player.spell_ready player @s ~ ~ ~ 0.5
        particle minecraft:witch ~ ~1 ~ 0 0.5 0 1 10 normal @s
        title @s actionbar {"text":"How About No is ready to be used once more.","color":"dark_purple"}
        scoreboard players reset @s satyrn.fdl.howAboutNo.cooldown
    }
}
