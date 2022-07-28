function clock_2s {
    schedule function foxcraft_dungeon_loot:items/totem_of_mysteria/clock_2s 2s
    execute as @a if score @s satyrn.fdl.itemId.offHand matches 56 run effect give @s minecraft:fire_resistance 3
}

function give {
    give @s minecraft:totem_of_undying{DungeonLootId:56,CustomModelData:421952,AttributeModifiers:[{AttributeName:"generic.max_health",Amount:5,Slot:offhand,Name:"generic.max_health",UUID:[I;-122527,370860,12513,-741720]},{AttributeName:"generic.max_health",Amount:5,Slot:mainhand,Name:"generic.max_health",UUID:[I;-122527,370860,12513,-741720]}],display:{Name:'[{"text":"Totem of Mysteria","italic":false,"color":"green"}]',Lore:['[{"text":"Fire Resistance","italic":false,"color":"gray"},{"text":"","italic":false,"color":"dark_purple"}]','[{"text":"May Mysteria, Goddess of the Sun and Life,","italic":true,"color":"dark_purple"},{"text":"","italic":false,"color":"dark_purple"}]','[{"text":"smile upon thee!","italic":true,"color":"dark_purple"}]','[{"text":"Rarity: ","italic":true,"color":"dark_purple"},{"text":"Mythic","color":"green","italic":true}]']},Enchantments:[{id:"minecraft:fire_aspect",lvl:5}]} 1
}

function on_load {
    schedule function foxcraft_dungeon_loot:items/totem_of_mysteria/clock_2s 15t
}
