# Applies the item's effects every two seconds.
function clock_2s {
    schedule function foxcraft_dungeon_loot:items/estudinaes_survival/clock_2s 2s
    execute as @a if score @s satyrn.fdl.itemId.helmet matches 40 run {
        effect give @s minecraft:conduit_power 3
        effect give @s minecraft:mining_fatigue 3
    }
}

# Applies more item effects every 10 seconds.
function clock_10s {
    schedule function foxcraft_dungeon_loot:items/estudinaes_survival/clock_10s 10s
    execute as @a if score @s satyrn.fdl.itemId.helmet matches 40 run effect give @s minecraft:saturation
}

# Gives the sender a copy of this item.
function give {
    give @s minecraft:leather_helmet{DungeonLootId:40,CustomModelData:421951,display:{color:5215783,Name:'[{"text":"Estudinae\'s Survival","italic":false,"color":"light_purple"}]',Lore:['[{"text":"Scientists of Dinidae developed equipment to"}]','[{"text":"keep survivors alive as they fled their","italic":true}]','[{"text":"homeland.","italic":true},{"text":"","italic":false}]','[{"text":"Rarity: ","italic":true},{"text":"Epic","color":"light_purple"},{"text":"","color":"dark_purple","italic":false}]','[{"text":"","italic":false,"color":"dark_purple"}]','[{"text":"Estudinae\'s Constitution: ","italic":false,"color":"light_purple"},{"text":"Grants Conduit Power","italic":false,"color":"gray"}]','[{"text":"and Saturation at the cost of Mining Fatigue.","italic":false,"color":"gray"}]']},Enchantments:[{id:"minecraft:blast_protection",lvl:4},{id:"minecraft:fire_protection",lvl:4},{id:"minecraft:mending",lvl:1},{id:"minecraft:projectile_protection",lvl:4},{id:"minecraft:protection",lvl:4},{id:"minecraft:unbreaking",lvl:3}]} 1
}

dir give {
    # Gives the sender a copy of this item. The item is upgraded to chainmail.
    function chainmail {
        give @s minecraft:chainmail_helmet{DungeonLootId:40,CustomModelData:421951,display:{color:5215783,Name:'[{"text":"Estudinae\'s Survival","italic":false,"color":"light_purple"}]',Lore:['[{"text":"Scientists of Dinidae developed equipment to"}]','[{"text":"keep survivors alive as they fled their","italic":true}]','[{"text":"homeland.","italic":true},{"text":"","italic":false}]','[{"text":"Rarity: ","italic":true},{"text":"Epic","color":"light_purple"},{"text":"","color":"dark_purple","italic":false}]','[{"text":"","italic":false,"color":"dark_purple"}]','[{"text":"Estudinae\'s Constitution: ","italic":false,"color":"light_purple"},{"text":"Grants Conduit Power","italic":false,"color":"gray"}]','[{"text":"and Saturation at the cost of Mining Fatigue.","italic":false,"color":"gray"}]']},Enchantments:[{id:"minecraft:blast_protection",lvl:4},{id:"minecraft:fire_protection",lvl:4},{id:"minecraft:mending",lvl:1},{id:"minecraft:projectile_protection",lvl:4},{id:"minecraft:protection",lvl:4},{id:"minecraft:unbreaking",lvl:3}]} 1
    }

    # Gives the sender a copy of this item. The item is upgraded to iron.
    function iron {
        give @s minecraft:iron_helmet{DungeonLootId:40,CustomModelData:421951,display:{color:5215783,Name:'[{"text":"Estudinae\'s Survival","italic":false,"color":"light_purple"}]',Lore:['[{"text":"Scientists of Dinidae developed equipment to"}]','[{"text":"keep survivors alive as they fled their","italic":true}]','[{"text":"homeland.","italic":true},{"text":"","italic":false}]','[{"text":"Rarity: ","italic":true},{"text":"Epic","color":"light_purple"},{"text":"","color":"dark_purple","italic":false}]','[{"text":"","italic":false,"color":"dark_purple"}]','[{"text":"Estudinae\'s Constitution: ","italic":false,"color":"light_purple"},{"text":"Grants Conduit Power","italic":false,"color":"gray"}]','[{"text":"and Saturation at the cost of Mining Fatigue.","italic":false,"color":"gray"}]']},Enchantments:[{id:"minecraft:blast_protection",lvl:4},{id:"minecraft:fire_protection",lvl:4},{id:"minecraft:mending",lvl:1},{id:"minecraft:projectile_protection",lvl:4},{id:"minecraft:protection",lvl:4},{id:"minecraft:unbreaking",lvl:3}]} 1
    }

    # Gives the sender a copy of this item. The item is upgraded to diamond.
    function diamond {
        give @s minecraft:diamond_helmet{DungeonLootId:40,CustomModelData:421951,display:{color:5215783,Name:'[{"text":"Estudinae\'s Survival","italic":false,"color":"light_purple"}]',Lore:['[{"text":"Scientists of Dinidae developed equipment to"}]','[{"text":"keep survivors alive as they fled their","italic":true}]','[{"text":"homeland.","italic":true},{"text":"","italic":false}]','[{"text":"Rarity: ","italic":true},{"text":"Epic","color":"light_purple"},{"text":"","color":"dark_purple","italic":false}]','[{"text":"","italic":false,"color":"dark_purple"}]','[{"text":"Estudinae\'s Constitution: ","italic":false,"color":"light_purple"},{"text":"Grants Conduit Power","italic":false,"color":"gray"}]','[{"text":"and Saturation at the cost of Mining Fatigue.","italic":false,"color":"gray"}]']},Enchantments:[{id:"minecraft:blast_protection",lvl:4},{id:"minecraft:fire_protection",lvl:4},{id:"minecraft:mending",lvl:1},{id:"minecraft:projectile_protection",lvl:4},{id:"minecraft:protection",lvl:4},{id:"minecraft:unbreaking",lvl:3}]} 1
    }

    # Gives the sender a copy of this item. The item is upgraded to netherite.
    function netherite {
        give @s minecraft:netherite_helmet{DungeonLootId:40,CustomModelData:421951,display:{color:5215783,Name:'[{"text":"Estudinae\'s Survival","italic":false,"color":"light_purple"}]',Lore:['[{"text":"Scientists of Dinidae developed equipment to"}]','[{"text":"keep survivors alive as they fled their","italic":true}]','[{"text":"homeland.","italic":true},{"text":"","italic":false}]','[{"text":"Rarity: ","italic":true},{"text":"Epic","color":"light_purple"},{"text":"","color":"dark_purple","italic":false}]','[{"text":"","italic":false,"color":"dark_purple"}]','[{"text":"Estudinae\'s Constitution: ","italic":false,"color":"light_purple"},{"text":"Grants Conduit Power","italic":false,"color":"gray"}]','[{"text":"and Saturation at the cost of Mining Fatigue.","italic":false,"color":"gray"}]']},Enchantments:[{id:"minecraft:blast_protection",lvl:4},{id:"minecraft:fire_protection",lvl:4},{id:"minecraft:mending",lvl:1},{id:"minecraft:projectile_protection",lvl:4},{id:"minecraft:protection",lvl:4},{id:"minecraft:unbreaking",lvl:3}]} 1
    }
}

# Initializes the item's 2 second and 10 second clocks. The clocks are offset by 6 and 7 ticks, respectively.
function on_load {
    schedule function foxcraft_dungeon_loot:items/estudinaes_survival/clock_2s 6t
    schedule function foxcraft_dungeon_loot:items/estudinaes_survival/clock_10s 7t
}
