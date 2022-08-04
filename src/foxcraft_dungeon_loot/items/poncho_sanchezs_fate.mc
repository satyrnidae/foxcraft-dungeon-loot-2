import ../../macros.mcm

function give {
    macro give_as_loot mythic/poncho_sanchezs_fate
}

function on_load {
    scoreboard objectives add satyrn.fdl.ponchoSanchezsFate.cooldown dummy
}

function on_tick {
    # Executes this block if the user has used Poncho Sanchez's Fate
    execute if score @s[predicate=!foxcraft_dungeon_loot:items/offhand_prevents_use] satyrn.fdl.itemId.mainHand matches 48 if score @s satyrn.fdl.used.warpedFungusOnAStick matches 1.. run {
        execute (if score @s satyrn.fdl.ponchoSanchezsFate.cooldown matches 1..) {
            playsound foxcraft_dungeon_loot:entity.player.spell_fails player @s ~ ~ ~ 0.5
            title @s actionbar {"text":"Poncho Sanchez's Fate is on cooldown and cannot be used.","color":"dark_purple"}
        } else {
            macro random 1 8

            LOOP(8,i) {
                execute if score #random <%config.internalScoreboard%> matches <%i%> run playsound minecraft:item.goat_horn.sound.<%i%> player @a ~ ~ ~ 6.25
            }

            execute as @e[type=!#foxcraft_dungeon_loot:non_living,type=!#foxcraft_dungeon_loot:hostile,distance=..100] run {
                effect give @s minecraft:slow_falling 180
                effect give @s minecraft:speed 180
                effect give @s minecraft:resistance 180
                effect give @s minecraft:hunger 60
                effect give @s minecraft:nausea 10
                effect give @s minecraft:saturation 3 1
                effect give @s minecraft:absorption 60 1
            }

            execute unless entity @s[gamemode=creative] run {
                scoreboard players set @s satyrn.fdl.ponchoSanchezsFate.cooldown 1
                title @s actionbar {"text":"Poncho Sanchez's Fate is now on cooldown for 5 minutes.","color":"dark_purple"}

                item modify entity @s weapon.mainhand foxcraft_dungeon_loot:poncho_sanchezs_fate/damage

                execute if entity @s[predicate=foxcraft_dungeon_loot:items/mainhand_broken] run {
                    macro break_item weapon.mainhand minecraft:warped_fungus_on_a_stick{CustomModelData:421950}
                }
            }
        }
    }

    # Increments the cooldown timer
    execute if score @s satyrn.fdl.ponchoSanchezsFate.cooldown matches 1.. run scoreboard players add @s satyrn.fdl.ponchoSanchezsFate.cooldown 1

    execute if score @s satyrn.fdl.ponchoSanchezsFate.cooldown matches 6000.. run {
        playsound foxcraft_dungeon_loot:entity.player.spell_ready player @s ~ ~ ~ 0.5
        particle minecraft:witch ~ ~1 ~ 0 0.5 0 1 10 normal @s
        title @s actionbar {"text":"Poncho Sanchez's Fate is ready to be used once more.","color":"dark_purple"}
        scoreboard players reset @s satyrn.fdl.ponchoSanchezsFate.cooldown
    }
}
