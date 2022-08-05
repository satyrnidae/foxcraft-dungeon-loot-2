import ../../macros.mcm

# Gives the sender a copy of the item.
function give {
    macro give_as_loot mythic/pride_and_extreme_prejudice
}

function on_load {
    scoreboard objectives add satyrn.fdl.prideAndExtremePrejudice.cooldown dummy
}

function on_tick {
    execute if score @s[predicate=!foxcraft_dungeon_loot:items/offhand_prevents_use] satyrn.fdl.itemId.mainHand matches 49 if score @s satyrn.fdl.used.warpedFungusOnAStick matches 1.. run {
        execute (if score @s satyrn.fdl.prideAndExtremePrejudice.cooldown matches 1..) {
            playsound foxcraft_dungeon_loot:entity.player.spell_fails player @s ~ ~ ~ 0.5
            title @s actionbar {"text":"Pride and Extreme Prejudice is ready to be used once more.","color":"dark_purple"}
        } else {
            macro random 1 10

            execute (if score #random <%config.internalScoreboard%> matches 1) {
                playsound minecraft:event.raid.horn hostile @a ~ ~ ~ 6.25
                effect give @s minecraft:bad_omen 1200 3
                tellraw @s {"text":"The sound of horns fills the air.","color":"gray","italic":true}
            } else execute (if score #random <%config.internalScoreboard%> matches 2) {
                playsound minecraft:event.raid.horn hostile @a ~ ~ ~ 6.25
                effect give @s minecraft:bad_omen 1200 2
                tellraw @s {"text":"A fell wind sweeps the land.","color":"gray","italic":true}
            } else execute (if score #random <%config.internalScoreboard%> matches 3..8) {
                playsound minecraft:event.raid.horn hostile @a ~ ~ ~ 6.25
                effect give @s minecraft:bad_omen 1200
                tellraw @s {"text":"A chill trickles down your spine.","color":"gray","italic":true}
            } else {
                playsound foxcraft_dungeon_loot:event.roll.hero player @a
                effect give @s minecraft:hero_of_the_village 1200
                tellraw @s {"text":"A warm breeze calms your nerves.","color":"gray","italic":true}
            }

            execute unless entity @s[gamemode=creative] run {
                scoreboard players add @s satyrn.fdl.prideAndExtremePrejudice.cooldown 1
                title @s actionbar {"text":"Pride and Extreme Prejudice is now on cooldown for 20 minutes.","color":"dark_purple"}
                macro break_item weapon.mainhand minecraft:warped_fungus_on_a_stick{CustomModelData:4219511}
            }
        }
    }

    # Increment the cooldown timer.
    execute if score @s satyrn.fdl.prideAndExtremePrejudice.cooldown matches 1.. run scoreboard players add @s satyrn.fdl.prideAndExtremePrejudice.cooldown 1

    # Reset the cooldown timer.
    execute (if score @s satyrn.fdl.prideAndExtremePrejudice.cooldown matches 24000..) {
        playsound foxcraft_dungeon_loot:entity.player.spell_ready player @s ~ ~ ~ 0.5
        particle minecraft:witch ~ ~1 ~ 0 0.5 0 1 10 normal @s
        title @s actionbar {"text":"Pride and Extreme Prejudice is ready to be used once more.","color":"dark_purple"}
        scoreboard players reset @s satyrn.fdl.prideAndExtremePrejudice.cooldown
    }
}
