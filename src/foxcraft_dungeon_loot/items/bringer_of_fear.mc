import ../../macros.mcm

function give {
    give @s minecraft:warped_fungus_on_a_stick{DungeonLootId:34,CustomModelData:4219512,display:{Name:'[{"text":"Bringer of Fear","italic":false,"color":"red"}]',Lore:['[{"text":"Those who whisper into the darkness had"}]','[{"text":"best be prepared for the consequences.","italic":true}]','[{"text":"Rarity: ","italic":true},{"text":"Cursed","color":"red","italic":true},{"text":"","color":"dark_purple","italic":false}]','[{"text":"","italic":false,"color":"dark_purple"}]','[{"text":"Darkness Whispers:","italic":false,"color":"red"},{"text":" Rolls a D20. The result","italic":false,"color":"gray"}]','[{"text":"will determine the outcome:","italic":false,"color":"gray"}]','[{"text":" - 50% Bad Omen I","italic":false,"color":"gray"}]','[{"text":" - 35% Bad Omen III","italic":false,"color":"gray"}]','[{"text":" - 15% Bad Omen V","italic":false,"color":"gray"}]','[{"text":"All effects are applied for 20 minutes.","italic":false,"color":"gray"},{"text":"","italic":false,"color":"dark_purple"}]','[{"text":"Fragile:","italic":false,"color":"red"},{"text":" The item will be consumed upon use.","color":"gray"}]']},Enchantments:[{id:"minecraft:mending",lvl:1}],HideFlags:1} 1
}

function on_load {
    scoreboard objectives add satyrn.fdl.bringerOfFear.cooldown dummy
}

function on_tick {
    # Execute the following if the sender has the Bringer of Fear equipped in their main hand
    execute (if score @s satyrn.fdl.used.warpedFungusOnAStick matches 1.. if score @s satyrn.fdl.itemId.mainHand matches 34) {
        execute (unless score @s satyrn.fdl.bringerOfFear.cooldown matches 1..) {
            playsound minecraft:event.raid.horn hostile @s ~ ~ ~ 200 1

            macro roll d2

            execute (if score #random <%config.internalScoreboard%> matches 1) {
                effect give @s minecraft:bad_omen 1200
            } else {
                macro roll d10

                execute (if score #random <%config.internalScoreboard%> matches 1..7) {
                    effect give @s minecraft:bad_omen 1200 2
                } else {
                    effect give @s minecraft:bad_omen 1200 4
                }
            }

            execute (if entity @s[nbt=!{playerGameType:1}]) {
                scoreboard players set @s satyrn.fdl.bringerOfFear.cooldown 1
                title @s actionbar {"text":"Bringer of Fear is now on cooldown for 20 minutes.","color":"dark_purple"}

                macro break_item weapon.mainhand minecraft:warped_fungus_on_a_stick{CustomModelData:4219512}
            }
        } else {
            playsound minecraft:entity.evoker.prepare_summon player @s ~ ~ ~ 0.5 1
            title @s actionbar {"text":"Bringer of Fear is on cooldown and cannot be used.","color":"dark_purple","italic":true}
        }
    }
    execute (if score @s satyrn.fdl.bringerOfFear.cooldown matches 1..) {
        scoreboard players add @s satyrn.fdl.bringerOfFear.cooldown 1
    }
    execute (if score @s satyrn.fdl.bringerOfFear.cooldown matches 24000) {
        macro cooldown_complete
        title @s actionbar {"text":"Bringer of Fear is ready to be used once more.","color":"dark_purple"}
        scoreboard players reset @s satyrn.fdl.bringerOfFear.cooldown
    }
}
