function clock_2s {
    schedule function foxcraft_dungeon_loot:items/totem_of_dendris/clock_2s 2s
    execute as @a if score @s satyrn.fdl.itemId.offHand matches 54 run {
        effect give @s minecraft:night_vision 15
        effect give @s minecraft:water_breathing 3
    }
}

function give {
    give @s minecraft:totem_of_undying{DungeonLootId:54,CustomModelData:421955,AttributeModifiers:[{AttributeName:"generic.attack_speed",Amount:-0.2,Slot:mainhand,Operation:1,Name:"generic.attack_speed",UUID:[I;-122527,58513,131025,-117026]},{AttributeName:"generic.attack_speed",Amount:-0.2,Slot:offhand,Operation:1,Name:"generic.attack_speed",UUID:[I;-122527,58613,131025,-117226]}],display:{Name:'[{"text":"Totem of Dendris","italic":false,"color":"green"}]',Lore:['[{"text":"Night Vision","italic":false,"color":"gray"},{"text":"","italic":false,"color":"dark_purple"}]','[{"text":"Water Breathing","italic":false,"color":"gray"},{"text":"","italic":false,"color":"dark_purple"}]','[{"text":"May Dendris, the God of Dreams and the","italic":true,"color":"dark_purple"}]','[{"text":"Deep Things, smile upon thee!","italic":true,"color":"dark_purple"}]','[{"text":"Rarity: ","italic":true,"color":"dark_purple"},{"text":"Mythic","color":"green","italic":true}]']},Enchantments:[{id:"minecraft:mending",lvl:1}],HideFlags:1} 1
}

function on_load {
    schedule function foxcraft_dungeon_loot:items/totem_of_dendris/clock_2s 12t
}
