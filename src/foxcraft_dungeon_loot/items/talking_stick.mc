function clock_2s {
    schedule function foxcraft_dungeon_loot:items/talking_stick/clock_2s 2s
    execute as @a if score @s satyrn.fdl.itemId.offHand matches 53 run {
        effect give @s minecraft:haste 3 1
        effect give @s minecraft:resistance 3 9
        effect give @s minecraft:night_vision 15
        effect give @s minecraft:glowing 3
    }
}

function give {
    give @s minecraft:stick{DungeonLootId:53,CustomModelData:421951,AttributeModifiers:[{AttributeName:"generic.movement_speed",Amount:0.2,Slot:offhand,Operation:1,Name:"generic.movement_speed",UUID:[I;-122615,180238,132318,-360476]}],display:{Name:'[{"text":"The Talking Stick","italic":false,"color":"green"}]',Lore:['[{"text":"Hey! Hey! Shut up! You look here, I have"}]','[{"text":"the stick, so you have to shut up!","italic":true}]','[{"text":"Shut up shut up shut up!","italic":true}]','[{"text":"Now... What were we supposed to be doing","italic":true}]','[{"text":"again?","italic":true},{"text":"","italic":false}]','[{"text":"Rarity: ","italic":true},{"text":"Mythic","color":"green"},{"text":"","color":"dark_purple","italic":false}]','[{"text":"","italic":false,"color":"dark_purple"}]','[{"text":"Pay Attention to Me:","italic":false,"color":"green"},{"text":" Applies Night Vision,","italic":false,"color":"gray"}]','[{"text":"Glowing, Resistance, and Haste when in the","italic":false,"color":"gray"}]','[{"text":"off-hand.","italic":false,"color":"gray"}]']},Enchantments:[{id:"minecraft:mending",lvl:1}],HideFlags:1} 1
}

function on_load {
    schedule function foxcraft_dungeon_loot:items/talking_stick/clock_2s 11t
}
