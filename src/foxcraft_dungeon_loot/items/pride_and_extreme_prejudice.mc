import ../../macros.mcm

# Gives the sender a copy of the item.
function give {
    give @s minecraft:warped_fungus_on_a_stick{DungeonLootId:49,Unbreakable:1,CustomModelData:4219511,display:{Name:'[{"text":"Pride and Extreme Prejudice","italic":false,"color":"green"}]',Lore:['[{"text":"There is no glory without risk. Best to be"}]','[{"text":"prepared for the worst.","italic":true}]','[{"text":"Rarity: ","italic":true},{"text":"Mythic","color":"green"},{"text":"","color":"dark_purple","italic":false}]','[{"text":"","italic":false,"color":"dark_purple"}]','[{"text":"Roll the Dice:","italic":false,"color":"green"},{"text":" Rolls a D10. The result will","italic":false,"color":"gray"}]','[{"text":"determine the outcome:","italic":false,"color":"gray"}]','[{"text":" - 10% Bad Omen IV","italic":false,"color":"gray"}]','[{"text":" - 10% Bad Omen III","italic":false,"color":"gray"}]','[{"text":" - 60% Bad Omen I","italic":false,"color":"gray"}]','[{"text":" - 20% Hero of the Village","italic":false,"color":"gray"}]','[{"text":"All effects are applied for 20 minutes.","italic":false,"color":"gray"},{"text":"","italic":false,"color":"dark_purple"}]','[{"text":"Fragile:","italic":false,"color":"red"},{"text":" The item will be consumed upon use.","color":"gray"}]']},Enchantments:[{id:"minecraft:mending",lvl:1}],HideFlags:5} 1
}

function on_load {
    scoreboard objectives add satyrn.fdl.prideAndExtremePrejudice.cooldown dummy
}

function on_tick {
    execute (if score @s satyrn.fdl.used.warpedFungusOnAStick matches 1.. if score @s satyrn.fdl.itemId.mainHand matches 49) {
        execute (if score @s satyrn.fdl.prideAndExtremePrejudice.cooldown matches 1..) {
            playsound foxcraft_dungeon_loot:entity.player.spell_fails player @s ~ ~ ~ 1.0
            title @s actionbar {"text":"Pride and Extreme Prejudice is ready to be used once more.","color":"dark_purple"}
        } else {
            macro random 1 10

            execute (if score #random <%config.internalScoreboard%> matches 1) {
                playsound minecraft:event.raid.horn hostile @s ~ ~ ~ 200.0
                effect give @s minecraft:bad_omen 1200 3
                tellraw @s {"text":"The sound of horns fills the air.","color":"gray","italic":true}
            } else execute (if score #random <%config.internalScoreboard%> matches 2) {
                playsound minecraft:event.raid.horn hostile @s ~ ~ ~ 200.0
                effect give @s minecraft:bad_omen 1200 2
                tellraw @s {"text":"A fell wind sweeps the land.","color":"gray","italic":true}
            } else execute (if score #random <%config.internalScoreboard%> matches 3..8) {
                playsound minecraft:event.raid.horn hostile @s ~ ~ ~ 200.0
                effect give @s minecraft:bad_omen 1200
                tellraw @s {"text":"A chill trickles down your spine.","color":"gray","italic":true}
            } else {
                playsound foxcraft_dungeon_loot:event.roll.hero player @s ~ ~ ~ 1.0
                effect give @s minecraft:hero_of_the_village 1200
                tellraw @s {"text":"A warm breeze calms your nerves.","color":"gray","italic":true}
            }

            execute (unless entity @s[nbt={playerGameType:1}]) {
                scoreboard players add @s satyrn.fdl.prideAndExtremePrejudice.cooldown 1
                title @s actionbar {"text":"Pride and Extreme Prejudice is now on cooldown for 20 minutes.","color":"dark_purple"}
                macro break_item weapon.mainhand minecraft:warped_fungus_on_a_stick{CustomModelData:4219511}
            }
        }
    }

    # Increment the cooldown timer.
    execute if score @s satyrn.fdl.prideAndExtremePrejudice.cooldown matches 1.. run scoreboard players add @s satyrn.fdl.prideAndExtremePrejudice.cooldown 1

    # Reset the cooldown timer.
    execute (if score @s satyrn.fdl.prideAndExtremePrejudice.cooldown matches 24000) {
        playsound foxcraft_dungeon_loot:entity.player.spell_ready player @s ~ ~ ~ 0.5
        particle minecraft:witch ~ ~1 ~ 0 0.5 0 1 10 normal @s
        title @s actionbar {"text":"Pride and Extreme Prejudice is ready to be used once more.","color":"dark_purple"}
        scoreboard players reset @s satyrn.fdl.prideAndExtremePrejudice.cooldown
    }
}
