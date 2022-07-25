import ../../macros.mcm

function give {
    give @s minecraft:warped_fungus_on_a_stick{DungeonLootId:43,CustomModelData:4219513,display:{Name:'[{"text":"The Feather of Quet-Zala","italic":false,"color":"light_purple"}]',Lore:['[{"text":"Quet-Zala, God of the Winds, gives unto"}]','[{"text":"you this gift. May it inspire you to","italic":true}]','[{"text":"reach new heights.","italic":true}]','[{"text":"Rarity: ","italic":true},{"text":"Epic","color":"light_purple"},{"text":"","color":"dark_purple","italic":false}]','[{"text":"","italic":false,"color":"dark_purple"}]','[{"text":"Wing of Quet-Zala:","italic":false,"color":"light_purple"},{"text":" Upon use, applies 30","italic":false,"color":"gray"}]','[{"text":"seconds Levitation.","italic":false,"color":"gray"},{"text":"","italic":false,"color":"dark_purple"}]','[{"text":"Fragile:","italic":false,"color":"red"},{"text":" The item is consumed upon use.","color":"gray"}]']},Enchantments:[{id:"minecraft:mending",lvl:1}],HideFlags:1} 1
}

function on_load {
    scoreboard objectives add satyrn.fdl.featherOfQuetZala.cooldown dummy
}

function on_tick {
    execute (if score @s satyrn.fdl.itemId.mainHand matches 43 if score @s satyrn.fdl.used.warpedFungusOnAStick matches 1..) {
        execute (unless score @s satyrn.fdl.featherOfQuetZala.cooldown matches 1..) {
            # Player has used the Feather of Quet-Zala, so apply 30 seconds of Levitation.
            playsound foxcraft_dungeon_loot:entity.player.cast_spell player @s ~ ~ ~ 2.0 1

            effect give @s minecraft:levitation 30

            # If the player is not in creative mode, destroy the feather and trigger the cooldown.
            execute (if entity @s[nbt=!{playerGameType:1}]) {
                scoreboard players set @s satyrn.fdl.featherOfQuetZala.cooldown 1
                title @s actionbar {"text":"The Feather of Quet-Zala is now on cooldown for 30 seconds.","color":"dark_purple"}

                macro break_item weapon.mainhand minecraft:warped_fungus_on_a_stick{CustomModelData:4219513}
            }
        } else {
            playsound foxcraft_dungeon_loot:entity.player.spell_fails player @s ~ ~ ~ 0.5 1
            title @s actionbar {"text":"The Feather of Quet-Zala is on cooldown and cannot be used.","color":"dark_purple"}
        }
    }

    # Increment the cooldown timer
    execute if score @s satyrn.fdl.featherOfQuetZala.cooldown matches 1.. run scoreboard players add @s satyrn.fdl.featherOfQuetZala.cooldown 1

    # Reset the cooldown timer after 30 seconds.
    execute (if score @s satyrn.fdl.featherOfQuetZala.cooldown matches 600) {
        macro cooldown_complete
        title @s actionbar {"text":"The Feather of Quet-Zala is ready to be used once more.","color":"dark_purple"}
        scoreboard players reset @s satyrn.fdl.featherOfQuetZala.cooldown
    }
}
