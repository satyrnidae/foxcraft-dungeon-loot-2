# Applies the item's effects every two seconds.
function clock_2s {
    schedule function foxcraft_dungeon_loot:items/estudinaes_guidance/clock_2s 2s
    execute as @a if score @s satyrn.fdl.itemId.boots matches 38 run {
        effect give @s minecraft:slowness 3 1
        effect give @s minecraft:dolphins_grace 3
    }
}

# Gives the sender a copy of the item.
function give {
    give @s minecraft:leather_boots{DungeonLootId:38,CustomModelData:421952,display:{color:5215783,Name:'[{"text":"Estudinae\'s Guidance","italic":false,"color":"light_purple"}]',Lore:['[{"text":"Survivors of Dinidae were aided by fellow tribes","italic":false}]','[{"text":"as they escaped the dangers of Poncho Sanchez.","italic":true},{"text":"","italic":false}]','[{"text":"Rarity: ","italic":true},{"text":"Epic","color":"light_purple"},{"text":"","color":"dark_purple","italic":false}]','[{"text":"","italic":false,"color":"dark_purple"}]','[{"text":"Estudinae\'s Solidarity: ","italic":false,"color":"light_purple"},{"text":"Grants Luck, Dolphin\'s","color":"gray"},{"text":"","color":"dark_purple"}]','[{"text":"Grace, and Health Boost at the cost of Slowness.","italic":false,"color":"gray"}]']},AttributeModifiers:[{AttributeName:"generic.luck",Amount:1,Slot:feet,Name:"generic.luck",UUID:[I;-122620,24837,171513,-49674]},{AttributeName:"generic.max_health",Amount:4,Slot:feet,Name:"generic.max_health",UUID:[I;-122620,24937,171513,-49874]}],Enchantments:[{id:"minecraft:blast_protection",lvl:4},{id:"minecraft:depth_strider",lvl:3},{id:"minecraft:fire_protection",lvl:4},{id:"minecraft:mending",lvl:1},{id:"minecraft:projectile_protection",lvl:4},{id:"minecraft:protection",lvl:4},{id:"minecraft:unbreaking",lvl:3}]} 1
}

dir give {
    # Gives the sender a copy of the item. The item is upgraded to chainmail.
    function chainmail {
        give @s minecraft:chainmail_boots{DungeonLootId:38,CustomModelData:421952,display:{color:5215783,Name:'[{"text":"Estudinae\'s Guidance","italic":false,"color":"light_purple"}]',Lore:['[{"text":"Survivors of Dinidae were aided by fellow tribes","italic":false}]','[{"text":"as they escaped the dangers of Poncho Sanchez.","italic":true},{"text":"","italic":false}]','[{"text":"Rarity: ","italic":true},{"text":"Epic","color":"light_purple"},{"text":"","color":"dark_purple","italic":false}]','[{"text":"","italic":false,"color":"dark_purple"}]','[{"text":"Estudinae\'s Solidarity: ","italic":false,"color":"light_purple"},{"text":"Grants Luck, Dolphin\'s","color":"gray"},{"text":"","color":"dark_purple"}]','[{"text":"Grace, and Health Boost at the cost of Slowness.","italic":false,"color":"gray"}]']},AttributeModifiers:[{AttributeName:"generic.luck",Amount:1,Slot:feet,Name:"generic.luck",UUID:[I;-122620,24837,171513,-49674]},{AttributeName:"generic.max_health",Amount:4,Slot:feet,Name:"generic.max_health",UUID:[I;-122620,24937,171513,-49874]}],Enchantments:[{id:"minecraft:blast_protection",lvl:4},{id:"minecraft:depth_strider",lvl:3},{id:"minecraft:fire_protection",lvl:4},{id:"minecraft:mending",lvl:1},{id:"minecraft:projectile_protection",lvl:4},{id:"minecraft:protection",lvl:4},{id:"minecraft:unbreaking",lvl:3}]} 1
    }

    # Gives the sender a copy of the item. The item is upgraded to iron.
    function iron {
        give @s minecraft:iron_boots{DungeonLootId:38,CustomModelData:421952,display:{color:5215783,Name:'[{"text":"Estudinae\'s Guidance","italic":false,"color":"light_purple"}]',Lore:['[{"text":"Survivors of Dinidae were aided by fellow tribes","italic":false}]','[{"text":"as they escaped the dangers of Poncho Sanchez.","italic":true},{"text":"","italic":false}]','[{"text":"Rarity: ","italic":true},{"text":"Epic","color":"light_purple"},{"text":"","color":"dark_purple","italic":false}]','[{"text":"","italic":false,"color":"dark_purple"}]','[{"text":"Estudinae\'s Solidarity: ","italic":false,"color":"light_purple"},{"text":"Grants Luck, Dolphin\'s","color":"gray"},{"text":"","color":"dark_purple"}]','[{"text":"Grace, and Health Boost at the cost of Slowness.","italic":false,"color":"gray"}]']},AttributeModifiers:[{AttributeName:"generic.luck",Amount:1,Slot:feet,Name:"generic.luck",UUID:[I;-122620,24837,171513,-49674]},{AttributeName:"generic.max_health",Amount:4,Slot:feet,Name:"generic.max_health",UUID:[I;-122620,24937,171513,-49874]}],Enchantments:[{id:"minecraft:blast_protection",lvl:4},{id:"minecraft:depth_strider",lvl:3},{id:"minecraft:fire_protection",lvl:4},{id:"minecraft:mending",lvl:1},{id:"minecraft:projectile_protection",lvl:4},{id:"minecraft:protection",lvl:4},{id:"minecraft:unbreaking",lvl:3}]} 1
    }

    # Gives the sender a copy of the item. The item is upgraded to diamond.
    function diamond {
        give @s minecraft:diamond_boots{DungeonLootId:38,CustomModelData:421952,display:{color:5215783,Name:'[{"text":"Estudinae\'s Guidance","italic":false,"color":"light_purple"}]',Lore:['[{"text":"Survivors of Dinidae were aided by fellow tribes","italic":false}]','[{"text":"as they escaped the dangers of Poncho Sanchez.","italic":true},{"text":"","italic":false}]','[{"text":"Rarity: ","italic":true},{"text":"Epic","color":"light_purple"},{"text":"","color":"dark_purple","italic":false}]','[{"text":"","italic":false,"color":"dark_purple"}]','[{"text":"Estudinae\'s Solidarity: ","italic":false,"color":"light_purple"},{"text":"Grants Luck, Dolphin\'s","color":"gray"},{"text":"","color":"dark_purple"}]','[{"text":"Grace, and Health Boost at the cost of Slowness.","italic":false,"color":"gray"}]']},AttributeModifiers:[{AttributeName:"generic.luck",Amount:1,Slot:feet,Name:"generic.luck",UUID:[I;-122620,24837,171513,-49674]},{AttributeName:"generic.max_health",Amount:4,Slot:feet,Name:"generic.max_health",UUID:[I;-122620,24937,171513,-49874]}],Enchantments:[{id:"minecraft:blast_protection",lvl:4},{id:"minecraft:depth_strider",lvl:3},{id:"minecraft:fire_protection",lvl:4},{id:"minecraft:mending",lvl:1},{id:"minecraft:projectile_protection",lvl:4},{id:"minecraft:protection",lvl:4},{id:"minecraft:unbreaking",lvl:3}]} 1
    }

    # Gives the sender a copy of the item. The item is upgraded to netherite.
    function netherite {
        give @s minecraft:netherite_boots{DungeonLootId:38,CustomModelData:421952,display:{color:5215783,Name:'[{"text":"Estudinae\'s Guidance","italic":false,"color":"light_purple"}]',Lore:['[{"text":"Survivors of Dinidae were aided by fellow tribes","italic":false}]','[{"text":"as they escaped the dangers of Poncho Sanchez.","italic":true},{"text":"","italic":false}]','[{"text":"Rarity: ","italic":true},{"text":"Epic","color":"light_purple"},{"text":"","color":"dark_purple","italic":false}]','[{"text":"","italic":false,"color":"dark_purple"}]','[{"text":"Estudinae\'s Solidarity: ","italic":false,"color":"light_purple"},{"text":"Grants Luck, Dolphin\'s","color":"gray"},{"text":"","color":"dark_purple"}]','[{"text":"Grace, and Health Boost at the cost of Slowness.","italic":false,"color":"gray"}]']},AttributeModifiers:[{AttributeName:"generic.luck",Amount:1,Slot:feet,Name:"generic.luck",UUID:[I;-122620,24837,171513,-49674]},{AttributeName:"generic.max_health",Amount:4,Slot:feet,Name:"generic.max_health",UUID:[I;-122620,24937,171513,-49874]}],Enchantments:[{id:"minecraft:blast_protection",lvl:4},{id:"minecraft:depth_strider",lvl:3},{id:"minecraft:fire_protection",lvl:4},{id:"minecraft:mending",lvl:1},{id:"minecraft:projectile_protection",lvl:4},{id:"minecraft:protection",lvl:4},{id:"minecraft:unbreaking",lvl:3}]} 1
    }
}

# Initializes the item's clocks.
function on_load {
    schedule function foxcraft_dungeon_loot:items/estudinaes_guidance/clock_2s 2t
}
