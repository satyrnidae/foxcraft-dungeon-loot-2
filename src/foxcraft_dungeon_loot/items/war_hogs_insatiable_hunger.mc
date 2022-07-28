function clock_2s {
    schedule function foxcraft_dungeon_loot:items/war_hogs_insatiable_hunger/clock_2s 2s
    execute as @a if score @s satyrn.fdl.itemId.chestplate matches 59 run effect give @s minecraft:hunger 10 1 true
}

function give {
    give @s minecraft:netherite_chestplate{DungeonLootId:59,CustomModelData:421950,AttributeModifiers:[{AttributeName:"generic.armor",Amount:8,Slot:chest,Name:"generic.armor",UUID:[I;-12265,45437,155536,-90874]},{AttributeName:"generic.knockback_resistance",Amount:0.5,Slot:chest,Name:"generic.knockback_resistance",UUID:[I;-12265,45537,155536,-91074]},{AttributeName:"generic.armor_toughness",Amount:3,Slot:chest,Name:"generic.armor_toughness",UUID:[I;-12265,45637,155536,-91274]},{AttributeName:"generic.max_health",Amount:2,Slot:chest,Name:"generic.max_health",UUID:[I;-12265,45737,155536,-91474]},{AttributeName:"generic.movement_speed",Amount:-0.1,Slot:chest,Operation:1,Name:"generic.movement_speed",UUID:[I;-12265,45837,155536,-91674]}],display:{Name:'[{"text":"War Hog\'s Insatiable Hunger","italic":false,"color":"green"}]',Lore:['[{"text":"Hunger II","italic":false,"color":"red"},{"text":"","italic":false,"color":"dark_purple"}]','[{"text":"Long ago, piglins fought against Wither","italic":true,"color":"dark_purple"}]','[{"text":"Skeletons in a bid for dominion over the","italic":true,"color":"dark_purple"}]','[{"text":"Nether. The generals of their army wore","italic":true,"color":"dark_purple"}]','[{"text":"ancient armors imbued with their own","italic":true,"color":"dark_purple"}]','[{"text":"power. This chestplate is their insatiable","italic":true,"color":"dark_purple"}]','[{"text":"hunger.","italic":true,"color":"dark_purple"}]','[{"text":"Rarity: ","italic":true,"color":"dark_purple"},{"text":"Mythic","color":"green","italic":true}]']},Enchantments:[{id:"minecraft:blast_protection",lvl:3},{id:"minecraft:fire_protection",lvl:3},{id:"minecraft:mending",lvl:1},{id:"minecraft:projectile_protection",lvl:3},{id:"minecraft:protection",lvl:5},{id:"minecraft:thorns",lvl:3},{id:"minecraft:unbreaking",lvl:5}]} 1
}

function on_load {
    schedule function foxcraft_dungeon_loot:items/war_hogs_insatiable_hunger/clock_2s 16t
}
