import ../../macros.mcm

# Applies effects every 2 seconds.
function clock_2s {
    schedule function foxcraft_dungeon_loot:items/idol_of_melimonas/clock_2s 2s
    execute (as @a if score @s satyrn.fdl.itemId.offHand matches 47) {
        effect give @s minecraft:jump_boost 3 1 true
        effect give @s minecraft:invisibility 30 0 true
    }
}

# Gives the sender a copy of the item.
function give {
    give @s minecraft:totem_of_undying{DungeonLootId:47,CustomModelData:421956,AttributeModifiers:[{AttributeName:"generic.movement_speed",Amount:0.4,Slot:offhand,Operation:1,Name:"generic.movement_speed",UUID:[I;-122527,76913,131025,-153826]},{AttributeName:"generic.luck",Amount:1,Slot:offhand,Name:"generic.luck",UUID:[I;-122527,77013,131025,-154026]}],display:{Name:'[{"text":"Idol of Melimonas","italic":false,"color":"green"}]',Lore:['[{"text":"Invisibility","italic":false,"color":"gray"}]','[{"text":"Jump Boost I","italic":false,"color":"gray"},{"text":"","italic":false,"color":"dark_purple"}]','[{"text":"Weep, for Melimonas smiles upon thee.","italic":true,"color":"dark_purple"}]','[{"text":"Rarity: ","italic":true,"color":"dark_purple"},{"text":"Mythic","color":"green","italic":true}]']},Enchantments:[{id:"minecraft:mending",lvl:1}],HideFlags:1} 1
}

# Initializes the 2 second item clock (offset by 8 ticks).
function on_load {
    schedule function foxcraft_dungeon_loot:items/idol_of_melimonas/clock_2s 8t
}
