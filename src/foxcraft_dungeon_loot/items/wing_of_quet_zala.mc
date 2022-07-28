import ../../macros.mcm

function clock_2s {
    schedule function foxcraft_dungeon_loot:items/wing_of_quet_zala/clock_2s 2s
    execute as @a if score @s satyrn.fdl.itemId.offHand matches 62 run effect give @s minecraft:levitation 3
}

function clock_60s {
    schedule function foxcraft_dungeon_loot:items/wing_of_quet_zala/clock_60s 60s
    macro random 1 4
    execute as @r if score #random <%config.internalScoreboard%> matches 1 if entity @s[nbt={Inventory:[{tag:{DungeonLootId:62}}]}] run effect give @s minecraft:levitation 10
}

function give {
    give @s minecraft:totem_of_undying{DungeonLootId:62,CustomModelData:421957,display:{Name:'[{"text":"Wing of Quet-Zala","italic":false,"color":"green"}]',Lore:['[{"text":"May the Blessings of Quet-Zala, God of"}]','[{"text":"the Winds, lift you to the heavens","italic":true}]','[{"text":"where you belong.","italic":true}]','[{"text":"Rarity: ","italic":true},{"text":"Mythic","color":"green"},{"text":"","color":"dark_purple","italic":false}]','[{"text":"","italic":false,"color":"dark_purple"}]','[{"text":"Wing of Quet-Zala:","italic":false,"color":"green"},{"text":" Applies Levitation","italic":false,"color":"gray"}]','[{"text":"while held in off-hand.","italic":false,"color":"gray"}]']},Enchantments:[{id:"minecraft:mending",lvl:1}],HideFlags:1} 1
}

function on_load {
    schedule function foxcraft_dungeon_loot:items/wing_of_quet_zala/clock_2s 20t
    schedule function foxcraft_dungeon_loot:items/wing_of_quet_zala/clock_60s 21t
}
