import ../../macros.mcm

function give {
    macro give_as_loot mythic/deilonas_holy_blessings
}

function on_load {
    scoreboard objectives add satyrn.fdl.deilonasHolyBlessings.cooldown dummy
}

function on_tick {
    # Execute the following if the sender has Deilona's Holy Blessings equipped in their main hand
    execute if score @s[predicate=!foxcraft_dungeon_loot:items/offhand_prevents_use] satyrn.fdl.itemId.mainHand matches 36 if score @s satyrn.fdl.used.warpedFungusOnAStick matches 1.. run {
        execute (if score @s satyrn.fdl.deilonasHolyBlessings.cooldown matches 1..) {
            playsound foxcraft_dungeon_loot:entity.player.spell_fails player @s ~ ~ ~ 0.5
            title @s actionbar {"text":"Deilona's Holy Blessings is on cooldown and cannot be used.","color":"dark_purple"}
        } else {
            tag @s add satyrn.fdl.deilonasHolyBlessings.initiator
            # Apply the effects for using Deilona's Holy Blessings
            execute as @e[tag=!satyrn.fdl.deilonasHolyBlessings.initiator,distance=0.0001..20,type=!#foxcraft_dungeon_loot:non_living] at @s anchored eyes run {
                effect give @s minecraft:instant_health 3 5
                particle minecraft:heart ^ ^0.5 ^ 0 0 0 0.2 1 force @a[tag=satyrn.fdl.deilonasHolyBlessings.initiator]
            }
            tag @s remove satyrn.fdl.deilonasHolyBlessings.initiator

            playsound foxcraft_dungeon_loot:entity.player.cast_wololo player @a ~ ~ ~ 1.125
            particle minecraft:enchanted_hit ~ ~1 ~ 0.5 0.5 0.5 1.0 10 normal @s


            # Break the item and set cooldown for players who are not creative enough ;P
            execute unless entity @s[gamemode=creative] run {
                scoreboard players set @s satyrn.fdl.deilonasHolyBlessings.cooldown 1
                title @s actionbar {"text":"Deilona's Holy Blessings is now on cooldown for 10 seconds.","color":"dark_purple"}

                macro break_item weapon.mainhand minecraft:warped_fungus_on_a_stick{CustomModelData:421955}
            }
        }
    }

    execute if score @s satyrn.fdl.deilonasHolyBlessings.cooldown matches 1.. run scoreboard players add @s satyrn.fdl.deilonasHolyBlessings.cooldown 1

    execute if score @s satyrn.fdl.deilonasHolyBlessings.cooldown matches 200.. run {
        playsound foxcraft_dungeon_loot:entity.player.spell_ready player @s ~ ~ ~ 0.5
        particle minecraft:witch ~ ~1 ~ 0 0.5 0 1 10 normal @s
        title @s actionbar {"text":"Deilona's Holy Blessings is ready to be used once more.","color":"dark_purple"}
        scoreboard players reset @s satyrn.fdl.deilonasHolyBlessings.cooldown
    }
}
