function clock_2s {
    schedule function foxcraft_dungeon_loot:items/war_hogs_seething_hatred/clock_2s 2s
    execute if score @s satyrn.fdl.itemId.leggings matches 60 run effect give @s minecraft:fire_resistance 3
}

function give {
    give @s minecraft:netherite_leggings{DungeonLootId:60,CustomModelData:421950,AttributeModifiers:[{AttributeName:"generic.armor",Amount:8,Slot:legs,Name:"generic.armor",UUID:[I;-122619,27985,23250,-55970]},{AttributeName:"generic.armor_toughness",Amount:3,Slot:legs,Name:"generic.armor_toughness",UUID:[I;-122619,28085,23250,-56170]},{AttributeName:"generic.knockback_resistance",Amount:0.2,Slot:legs,Name:"generic.knockback_resistance",UUID:[I;-122619,28185,23250,-56370]},{AttributeName:"generic.movement_speed",Amount:-0.1,Slot:legs,Operation:1,Name:"generic.movement_speed",UUID:[I;-122619,28285,23250,-56570]},{AttributeName:"generic.max_health",Amount:2,Slot:legs,Name:"generic.max_health",UUID:[I;-122619,28385,23250,-56770]}],display:{Name:'[{"text":"War Hog\'s Seething Hatred","italic":false,"color":"green"}]',Lore:['[{"text":"Fire Resistance","italic":false,"color":"gray"},{"text":"","italic":false,"color":"dark_purple"}]','[{"text":"Today, the Piglin Brutes guard the Bastions,","italic":true,"color":"dark_purple"},{"text":"","italic":true,"color":"dark_purple"}]','[{"text":"but long ago, their ancestors staged campaigns","italic":true,"color":"dark_purple"},{"text":"","italic":true,"color":"dark_purple"}]','[{"text":"into the Overworld from them. These leggings","italic":true,"color":"dark_purple"},{"text":"","italic":true,"color":"dark_purple"}]','[{"text":"are their seething hatred.","italic":true,"color":"dark_purple"},{"text":"","italic":true,"color":"dark_purple"}]','[{"text":"Rarity: ","italic":true,"color":"dark_purple"},{"text":"Mythic","color":"green","italic":true}]']},Enchantments:[{id:"minecraft:blast_protection",lvl:4},{id:"minecraft:binding_curse",lvl:1},{id:"minecraft:depth_strider",lvl:3},{id:"minecraft:mending",lvl:1},{id:"minecraft:protection",lvl:5},{id:"minecraft:swift_sneak",lvl:5},{id:"minecraft:unbreaking",lvl:5}]} 1
}

function on_load {
    schedule function foxcraft_dungeon_loot:items/war_hogs_seething_hatred/clock_2s 17t
}
