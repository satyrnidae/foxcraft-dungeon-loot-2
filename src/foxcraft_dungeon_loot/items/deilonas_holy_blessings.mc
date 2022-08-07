import ../../macros.mcm

# Runs once when the datapack is loaded or reloaded.
function on_load {
    scoreboard objectives add satyrn.fdl.deilonasHolyBlessings.cooldown dummy
}

# Runs once per tick
function on_tick {
    # Execute the following for every player attempting to use Deilona's Holy Blessings
    execute as @a[predicate=foxcraft_dungeon_loot:items/deilonas_holy_blessings/in_main_hand,predicate=!foxcraft_dungeon_loot:items/offhand_prevents_use,scores={satyrn.fdl.used.warpedFungusOnAStick=1..}] at @s run {
        execute (if score @s satyrn.fdl.deilonasHolyBlessings.cooldown matches 1..) {
            playsound foxcraft_dungeon_loot:entity.player.spell_fails player @s ~ ~ ~ 0.5
            title @s actionbar {"text":"Deilona's Holy Blessings is on cooldown and cannot be used.","color":"dark_purple"}
        } else {
            tag @s add satyrn.fdl.deilonasHolyBlessings.source
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
                scoreboard players set @s satyrn.fdl.deilonasHolyBlessings.cooldown 1
                title @s actionbar {"text":"Deilona's Holy Blessings is now on cooldown for 10 seconds.","color":"dark_purple"}

                macro break_item weapon.mainhand minecraft:warped_fungus_on_a_stick{CustomModelData:421955}
            }
        }
    }

    # Increment the item's cooldown timer for all players on cooldown.
    execute as @a[scores={satyrn.fdl.deilonasHolyBlessings.cooldown=1..}] run scoreboard players add @s satyrn.fdl.deilonasHolyBlessings.cooldown 1

    # Reset the cooldown timer for all players whose cooldown has been incremented for 200 ticks.
    execute as @a[scores={satyrn.fdl.deilonasHolyBlessings.cooldown=200..}] at @s run {
        playsound foxcraft_dungeon_loot:entity.player.spell_ready player @s ~ ~ ~ 0.5
        particle minecraft:witch ~ ~1 ~ 0 0.5 0 1 10 normal @s
        title @s actionbar {"text":"Deilona's Holy Blessings is ready to be used once more.","color":"dark_purple"}
        scoreboard players reset @s satyrn.fdl.deilonasHolyBlessings.cooldown
    }
}

# Runs when the datapack is uninstalled.
function on_uninstall {
    scoreboard objectives remove satyrn.fdl.deilonasHolyBlessings.cooldown
}
