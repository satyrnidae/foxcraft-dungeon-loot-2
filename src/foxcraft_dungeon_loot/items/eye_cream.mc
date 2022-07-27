import ../../macros.mcm

# Gives the sender a copy of the item.
function give {
    give @s minecraft:warped_fungus_on_a_stick{DungeonLootId:42,CustomModelData:421957,display:{Name:'[{"text":"Eye Cream","italic":false,"color":"light_purple"}]',Lore:['[{"text":"Look, stop asking where I got it, and just"}]','[{"text":"rub it in your eyes. It totally works...","italic":true}]','[{"text":"Most of the time... trust me!","italic":true},{"text":"","italic":false}]','[{"text":"Rarity: ","italic":true},{"text":"Epic","color":"light_purple"},{"text":"","color":"dark_purple","italic":false}]','[{"text":"","italic":false,"color":"dark_purple"}]','[{"text":"It Burns:","italic":false,"color":"light_purple"},{"text":" ","color":"green"},{"text":"Right click to apply to your eyes.","color":"gray"}]','[{"text":"Has an 80% chance to apply Night Vision for","italic":false,"color":"gray"}]','[{"text":"20 minutes.","italic":false,"color":"gray"}]']},Enchantments:[{id:"minecraft:mending",lvl:1}],HideFlags:1} 1
}

# Handles the item updates each tick. Executed in the context of a single player.
function on_tick {
    execute if score @s satyrn.fdl.used.warpedFungusOnAStick matches 1.. if score @s satyrn.fdl.itemId.mainHand matches 42 run {
        playsound minecraft:block.slime_block.break player @s ~ ~ ~ 1.0 1.5

        effect give @s minecraft:blindness 3 0 true

        # Roll a D5. If you roll a 1, blindness is applied for 5 minutes.
        #   Otherwise, applies night vision for 20 seconds.
        macro random 1 5
        execute (if score #random <%config.internalScoreboard%> matches 1) {
            effect give @s minecraft:blindness 300
        } else {
            effect give @s minecraft:night_vision 1200
        }

        # Break item
        execute unless entity @s[nbt={playerGameType:1}] run {
            item modify entity @s weapon.mainhand foxcraft_dungeon_loot:remove
        }
    }
}
