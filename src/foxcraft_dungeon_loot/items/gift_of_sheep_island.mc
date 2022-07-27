import ../../macros.mcm

# Gives the user a copy of the item.
function give {
    give @s minecraft:warped_fungus_on_a_stick{DungeonLootId:44,Unbreakable:1,CustomModelData:421958,display:{Name:'[{"text":"The Gift of Sheep Island","italic":false,"color":"aqua"}]',Lore:['[{"text":"Keeping someone warm is basically like keeping"}]','[{"text":"them protected from external temperatures,","italic":true}]','[{"text":"right?","italic":true},{"text":"","italic":false}]','[{"text":"Rarity: ","italic":true},{"text":"Rare","color":"aqua"},{"text":"","color":"dark_purple","italic":false}]','[{"text":"","italic":false,"color":"dark_purple"}]','[{"text":"Insulative Cover:","italic":false,"color":"aqua"},{"text":" ","color":"green"},{"text":"Applies 10 minutes of fire","color":"gray"}]','[{"text":"resistance at the cost of 1 minute of Hunger.","italic":false,"color":"gray"},{"text":"","italic":false,"color":"dark_purple"}]','[{"text":"Fragile:","italic":false,"color":"red"},{"text":" This item is consumed on use.","color":"gray"}]']},Enchantments:[{id:"minecraft:mending",lvl:1}],HideFlags:5} 1
}

# Updates the item every tick.
function on_tick {
    execute if score @s satyrn.fdl.used.warpedFungusOnAStick matches 1.. if score @s satyrn.fdl.itemId.mainHand matches 44 run {
        playsound minecraft:item.armor.equip_leather player @s ~ ~ ~ 1.0 1.0
        effect give @s minecraft:hunger 60
        effect give @s minecraft:fire_resistance 600

        execute unless entity @s[nbt={playerGameType:1}] run {
            item modify entity @s weapon.mainhand foxcraft_dungeon_loot:remove
        }
    }
}
