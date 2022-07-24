# Applies the item's effects every 2 seconds.
function clock_2s {
    schedule function foxcraft_dungeon_loot:items/estudinaes_patience/clock_2s 2s
    execute as @a if score @s satyrn.fdl.itemId.boots matches 39 run effect give @s minecraft:weakness 3 4
}

# Gives the sender a copy of the item.
function give {
    give @s minecraft:leather_chestplate{DungeonLootId:39,CustomModelData:421951,display:{color:5215783,Name:'[{"text":"Estudinae\'s Patience","italic":false,"color":"light_purple"}]',Lore:['[{"text":"Guardians of Dinidae wore this armor as they","italic":false}]','[{"text":"marched to their inevitable deaths at war","italic":true}]','[{"text":"with Poncho Sanchez.","italic":true},{"text":"","italic":false}]','[{"text":"Rarity: ","italic":true},{"text":"Epic","color":"light_purple"},{"text":"","color":"dark_purple","italic":false}]','[{"text":"","italic":false,"color":"dark_purple"}]','[{"text":"Estudinae\'s Fortitude: ","italic":false,"color":"light_purple"},{"text":"Grants extra health at","color":"gray"},{"text":"","color":"dark_purple"}]','[{"text":"the cost of Weakness.","italic":false,"color":"gray"}]']},AttributeModifiers:[{AttributeName:"generic.max_health",Amount:10.0,Slot:chest,Name:"generic.max_health",UUID:[I;-122620,25237,171513,-50474]}],Enchantments:[{id:"minecraft:blast_protection",lvl:4},{id:"minecraft:fire_protection",lvl:4},{id:"minecraft:mending",lvl:1},{id:"minecraft:projectile_protection",lvl:4},{id:"minecraft:protection",lvl:4},{id:"minecraft:thorns",lvl:3},{id:"minecraft:unbreaking",lvl:3}]} 1
}

dir give {
    # Gives the sender a copy of the item. The item is upgraded to chainmail.
    function chainmail {
        give @s minecraft:chainmail_chestplate{DungeonLootId:39,CustomModelData:421951,display:{color:5215783,Name:'[{"text":"Estudinae\'s Patience","italic":false,"color":"light_purple"}]',Lore:['[{"text":"Guardians of Dinidae wore this armor as they","italic":false}]','[{"text":"marched to their inevitable deaths at war","italic":true}]','[{"text":"with Poncho Sanchez.","italic":true},{"text":"","italic":false}]','[{"text":"Rarity: ","italic":true},{"text":"Epic","color":"light_purple"},{"text":"","color":"dark_purple","italic":false}]','[{"text":"","italic":false,"color":"dark_purple"}]','[{"text":"Estudinae\'s Fortitude: ","italic":false,"color":"light_purple"},{"text":"Grants extra health at","color":"gray"},{"text":"","color":"dark_purple"}]','[{"text":"the cost of Weakness.","italic":false,"color":"gray"}]']},AttributeModifiers:[{AttributeName:"generic.max_health",Amount:10.0,Slot:chest,Name:"generic.max_health",UUID:[I;-122620,25237,171513,-50474]}],Enchantments:[{id:"minecraft:blast_protection",lvl:4},{id:"minecraft:fire_protection",lvl:4},{id:"minecraft:mending",lvl:1},{id:"minecraft:projectile_protection",lvl:4},{id:"minecraft:protection",lvl:4},{id:"minecraft:thorns",lvl:3},{id:"minecraft:unbreaking",lvl:3}]} 1
    }

    # Gives the sender a copy of the item. The item is upgraded to iron.
    function iron {
        give @s minecraft:iron_chestplate{DungeonLootId:39,CustomModelData:421951,display:{color:5215783,Name:'[{"text":"Estudinae\'s Patience","italic":false,"color":"light_purple"}]',Lore:['[{"text":"Guardians of Dinidae wore this armor as they","italic":false}]','[{"text":"marched to their inevitable deaths at war","italic":true}]','[{"text":"with Poncho Sanchez.","italic":true},{"text":"","italic":false}]','[{"text":"Rarity: ","italic":true},{"text":"Epic","color":"light_purple"},{"text":"","color":"dark_purple","italic":false}]','[{"text":"","italic":false,"color":"dark_purple"}]','[{"text":"Estudinae\'s Fortitude: ","italic":false,"color":"light_purple"},{"text":"Grants extra health at","color":"gray"},{"text":"","color":"dark_purple"}]','[{"text":"the cost of Weakness.","italic":false,"color":"gray"}]']},AttributeModifiers:[{AttributeName:"generic.max_health",Amount:10.0,Slot:chest,Name:"generic.max_health",UUID:[I;-122620,25237,171513,-50474]}],Enchantments:[{id:"minecraft:blast_protection",lvl:4},{id:"minecraft:fire_protection",lvl:4},{id:"minecraft:mending",lvl:1},{id:"minecraft:projectile_protection",lvl:4},{id:"minecraft:protection",lvl:4},{id:"minecraft:thorns",lvl:3},{id:"minecraft:unbreaking",lvl:3}]} 1
    }

    # Gives the sender a copy of the item. The item is upgraded to diamond.
    function diamond {
        give @s minecraft:diamond_chestplate{DungeonLootId:39,CustomModelData:421951,display:{color:5215783,Name:'[{"text":"Estudinae\'s Patience","italic":false,"color":"light_purple"}]',Lore:['[{"text":"Guardians of Dinidae wore this armor as they","italic":false}]','[{"text":"marched to their inevitable deaths at war","italic":true}]','[{"text":"with Poncho Sanchez.","italic":true},{"text":"","italic":false}]','[{"text":"Rarity: ","italic":true},{"text":"Epic","color":"light_purple"},{"text":"","color":"dark_purple","italic":false}]','[{"text":"","italic":false,"color":"dark_purple"}]','[{"text":"Estudinae\'s Fortitude: ","italic":false,"color":"light_purple"},{"text":"Grants extra health at","color":"gray"},{"text":"","color":"dark_purple"}]','[{"text":"the cost of Weakness.","italic":false,"color":"gray"}]']},AttributeModifiers:[{AttributeName:"generic.max_health",Amount:10.0,Slot:chest,Name:"generic.max_health",UUID:[I;-122620,25237,171513,-50474]}],Enchantments:[{id:"minecraft:blast_protection",lvl:4},{id:"minecraft:fire_protection",lvl:4},{id:"minecraft:mending",lvl:1},{id:"minecraft:projectile_protection",lvl:4},{id:"minecraft:protection",lvl:4},{id:"minecraft:thorns",lvl:3},{id:"minecraft:unbreaking",lvl:3}]} 1
    }

    # Gives the sender a copy of the item. The item is upgraded to netherite.
    function netherite {
        give @s minecraft:netherite_chestplate{DungeonLootId:39,CustomModelData:421951,display:{color:5215783,Name:'[{"text":"Estudinae\'s Patience","italic":false,"color":"light_purple"}]',Lore:['[{"text":"Guardians of Dinidae wore this armor as they","italic":false}]','[{"text":"marched to their inevitable deaths at war","italic":true}]','[{"text":"with Poncho Sanchez.","italic":true},{"text":"","italic":false}]','[{"text":"Rarity: ","italic":true},{"text":"Epic","color":"light_purple"},{"text":"","color":"dark_purple","italic":false}]','[{"text":"","italic":false,"color":"dark_purple"}]','[{"text":"Estudinae\'s Fortitude: ","italic":false,"color":"light_purple"},{"text":"Grants extra health at","color":"gray"},{"text":"","color":"dark_purple"}]','[{"text":"the cost of Weakness.","italic":false,"color":"gray"}]']},AttributeModifiers:[{AttributeName:"generic.max_health",Amount:10.0,Slot:chest,Name:"generic.max_health",UUID:[I;-122620,25237,171513,-50474]}],Enchantments:[{id:"minecraft:blast_protection",lvl:4},{id:"minecraft:fire_protection",lvl:4},{id:"minecraft:mending",lvl:1},{id:"minecraft:projectile_protection",lvl:4},{id:"minecraft:protection",lvl:4},{id:"minecraft:thorns",lvl:3},{id:"minecraft:unbreaking",lvl:3}]} 1
    }
}

# Schedule the clock function, offset by 3 ticks.
function on_load {
    schedule function foxcraft_dungeon_loot:items/estudinaes_patience/clock_2s 3t
}
