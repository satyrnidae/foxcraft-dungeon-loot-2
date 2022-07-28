function clock_2s {
    schedule function foxcraft_dungeon_loot:items/totem_of_ekila/clock_2s 2s
    execute as @a if score @s satyrn.fdl.itemId.offHand matches 19 run {
        execute (if score @s satyrn.fdl.custom.fallFlying matches 1) {
            effect give @s minecraft:absorption 3 1
            effect give @s minecraft:resistance 3 2
        } else {
            effect give @s minecraft:jump_boost 3 2
        }
    }
}

function give {
    give @s minecraft:totem_of_undying{DungeonLootId:19,CustomModelData:421953,AttributeModifiers:[{AttributeName:"generic.max_health",Amount:-0.25,Slot:offhand,Operation:1,Name:"generic.max_health",UUID:[I;-122628,48976,745,-97952]},{AttributeName:"generic.movement_speed",Amount:0.4,Slot:offhand,Operation:1,Name:"generic.movement_speed",UUID:[I;-122628,49076,745,-98152]}],display:{Name:'[{"text":"Totem of Ekila","italic":false,"color":"green"}]',Lore:['[{"text":"May Ekila, the God of the Sky, smile upon thee!"}]','[{"text":"Rarity: ","italic":true},{"text":"Mythic","color":"green"},{"text":"","color":"dark_purple","italic":false}]','[{"text":"","italic":false,"color":"dark_purple"}]','[{"text":"Headed Skyward: ","italic":false,"color":"green"},{"text":"While flying, gain Resistance","italic":false,"color":"gray"}]','[{"text":"III and Absorption II. While grounded, gain","italic":false,"color":"gray"}]','[{"text":"Jump Boost III.","italic":false,"color":"gray"}]']},Enchantments:[{id:"minecraft:mending",lvl:1}],HideFlags:1} 1
}

function on_load {
    schedule function foxcraft_dungeon_loot:items/totem_of_ekila/clock_2s 14t
}
