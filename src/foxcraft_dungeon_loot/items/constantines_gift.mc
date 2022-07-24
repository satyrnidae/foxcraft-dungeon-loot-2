# A clock function that runs once every 10 seconds.
function clock {
    schedule function foxcraft_dungeon_loot:items/constantines_gift/clock 10s
    execute as @a if score @s satyrn.fdl.itemId.offHand matches 35 run effect give @s minecraft:saturation
}

# Gives the sender a copy of the item.
function give {
    give @s minecraft:enchanted_golden_apple{DungeonLootId:35,CustomModelData:421951,AttributeModifiers:[{AttributeName:"generic.luck",Amount:2,Slot:offhand,Name:"generic.luck",UUID:[I;-122615,50238,132318,-100476]},{AttributeName:"generic.movement_speed",Amount:0.2,Slot:offhand,Operation:1,Name:"generic.movement_speed",UUID:[I;-122615,50338,132318,-100676]}],display:{Name:'[{"text":"Constantine\'s Gift","italic":false,"color":"green"}]',Lore:['[{"text":"Don\'t look a gift h-- uh, donkey... in the...","italic":true}]','[{"text":"Uh...","italic":true}]','[{"text":"You know what? Just roll with it.","italic":true},{"text":"","italic":false}]','[{"text":"Rarity: ","italic":true},{"text":"Mythic","color":"green","italic":true},{"text":"","color":"dark_purple","italic":false}]','[{"text":"","italic":false,"color":"dark_purple"}]','[{"text":"Full on Love and Sugar Cubes:","italic":false,"color":"green"},{"text":" ","color":"dark_purple"},{"text":"When held in","color":"gray"}]','[{"text":"off-hand, applies Saturation once every ten","italic":false,"color":"gray"}]','[{"text":"seconds.","italic":false,"color":"gray"}]']},HideFlags:4} 1
}

# Initializes the item's timer function.
function on_load {
    schedule function foxcraft_dungeon_loot:items/constantines_gift/clock 1t
}
