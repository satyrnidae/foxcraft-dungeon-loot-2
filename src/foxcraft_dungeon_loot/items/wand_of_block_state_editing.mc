function give {
    give @s minecraft:debug_stick{DungeonLootId:57,CustomModelData:421950,display:{Name:'[{"text":"Wand of Block State Editing","italic":false,"color":"light_purple"}]',Lore:['[{"text":"Haste CI","italic":false,"color":"gray"},{"text":"","italic":false,"color":"dark_purple"}]','[{"text":"Finally, you can make the perfect table.","italic":true,"color":"dark_purple"}]','[{"text":"Rarity: ","italic":true,"color":"dark_purple"},{"text":"Epic","color":"light_purple","italic":true},{"text":"","color":"dark_purple","italic":false}]','[{"text":"","italic":false,"color":"dark_purple"}]','[{"text":"Debug Stick:","italic":false,"color":"light_purple"},{"text":" ","color":"dark_purple"},{"text":"Break any block with an","color":"gray"}]','[{"text":"editable state to select the state that you","italic":false,"color":"gray"}]','[{"text":"wish to edit. Right-click the block to set","italic":false,"color":"gray"}]','[{"text":"the value of the state after selecting it.","italic":false,"color":"gray"}]']}} 1
}

function on_tick {
    execute if score @s satyrn.fdl.itemId.mainHand matches 57 run effect give @s minecraft:haste 1 100 true
}
