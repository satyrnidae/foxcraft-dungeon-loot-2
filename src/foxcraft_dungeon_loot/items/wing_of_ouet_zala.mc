function clock_2s {
    schedule function foxcraft_dungeon_loot:items/wing_of_ouet_zala/clock_2s 2s
    execute as @a if score @s satyrn.fdl.itemId.offHand matches 61 run effect give @s minecraft:nausea 10
}

function clock_60s {
    schedule function foxcraft_dungeon_loot:items/wing_of_ouet_zala/clock_60s 60s
    execute as @r if entity @s[nbt={Inventory:[{tag:{DungeonLootId:61}}]}] run effect give @s minecraft:levitation 10
}

function give {
    give @s minecraft:feather{DungeonLootId:61,CustomModelData:421950,display:{Name:'[{"text":"Wing of Ouet-Zala","italic":false,"color":"green"}]',Lore:['[{"text":"May the Blessings of Ouet-Zala, God of"}]','[{"text":"the Winds, lift you to the haevens","italic":true}]','[{"text":"where you belong.","italic":true}]','[{"text":"Rarity: ","italic":true},{"text":"Mythic","color":"green","italic":true},{"text":"","color":"dark_purple","italic":false}]','[{"text":"","italic":false,"color":"dark_purple"}]','[{"text":"Wing of Ouet-Zala:","italic":false,"color":"green"},{"text":" Applies Levitation","italic":false,"color":"gray"}]','[{"text":"while held in off-hand.","italic":false,"color":"gray"}]']},Enchantments:[{id:"minecraft:mending",lvl:1}],HideFlags:1} 1
}

function on_load {
    schedule function foxcraft_dungeon_loot:items/wing_of_ouet_zala/clock_2s 18t
    schedule function foxcraft_dungeon_loot:items/wing_of_ouet_zala/clock_60s 19t
}
