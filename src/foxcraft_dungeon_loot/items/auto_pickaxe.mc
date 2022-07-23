# Main clock for the item.
function clock {
    schedule function foxcraft_dungeon_loot:items/auto_pickaxe/clock 2s
    execute as @a if score @s satyrn.fdl.itemId.mainHand matches 32 run effect give @s minecraft:haste 3 1 true
}

# Gives a copy of the item to the sender.
function give {
    give @s minecraft:iron_pickaxe{DungeonLootId:32,CustomModelData:421951,display:{Name:'[{"text":"Albatross Heavy Industries® Auto-Pickaxe™","italic":false,"color":"green"}]',Lore:['[{"text":"Haste II","italic":false,"color":"gray"},{"text":"","italic":false,"color":"dark_purple"}]','[{"text":"The new Albatross Heavy Industries®","italic":true,"color":"dark_purple"}]','[{"text":"Auto-Pickaxe™: For all your tunneling needs!","italic":true,"color":"dark_purple"}]','[{"text":"Rarity: ","italic":true,"color":"dark_purple"},{"text":"Mythic","color":"green","italic":true}]']},Enchantments:[{id:"minecraft:efficiency",lvl:10},{id:"minecraft:mending",lvl:1},{id:"minecraft:silk_touch",lvl:1},{id:"minecraft:unbreaking",lvl:5}]} 1
}

dir give {
    # Gives a copy of this item to the sender. The item is upgraded to a diamond pickaxe.
    function diamond {
        give @s minecraft:diamond_pickaxe{DungeonLootId:32,CustomModelData:421951,display:{Name:'[{"text":"Albatross Heavy Industries® Auto-Pickaxe™","italic":false,"color":"green"}]',Lore:['[{"text":"Haste II","italic":false,"color":"gray"},{"text":"","italic":false,"color":"dark_purple"}]','[{"text":"The new Albatross Heavy Industries®","italic":true,"color":"dark_purple"}]','[{"text":"Auto-Pickaxe™: For all your tunneling needs!","italic":true,"color":"dark_purple"}]','[{"text":"Rarity: ","italic":true,"color":"dark_purple"},{"text":"Mythic","color":"green","italic":true}]']},Enchantments:[{id:"minecraft:efficiency",lvl:10},{id:"minecraft:mending",lvl:1},{id:"minecraft:silk_touch",lvl:1},{id:"minecraft:unbreaking",lvl:5}]} 1
    }

    # Gives a copy of this item to the sender. The item is upgraded to a netherite pickaxe.
    function netherite {
        give @s minecraft:netherite_pickaxe{DungeonLootId:32,CustomModelData:421951,display:{Name:'[{"text":"Albatross Heavy Industries® Auto-Pickaxe™","italic":false,"color":"green"}]',Lore:['[{"text":"Haste II","italic":false,"color":"gray"},{"text":"","italic":false,"color":"dark_purple"}]','[{"text":"The new Albatross Heavy Industries®","italic":true,"color":"dark_purple"}]','[{"text":"Auto-Pickaxe™: For all your tunneling needs!","italic":true,"color":"dark_purple"}]','[{"text":"Rarity: ","italic":true,"color":"dark_purple"},{"text":"Mythic","color":"green","italic":true}]']},Enchantments:[{id:"minecraft:efficiency",lvl:10},{id:"minecraft:mending",lvl:1},{id:"minecraft:silk_touch",lvl:1},{id:"minecraft:unbreaking",lvl:5}]} 1
    }
}

# Sets up item-specific clocks, counters, etc.
function on_load {
    schedule function foxcraft_dungeon_loot:items/auto_pickaxe/clock 2s
}