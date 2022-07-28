# Applies the regeneration effects every two seconds
function clock_2s {
    schedule function foxcraft_dungeon_loot:items/totem_of_deilona/clock_2s 2s
    execute (as @a if score @s satyrn.fdl.itemId.mainHand matches 55) {
        particle minecraft:heart ~ ~1 ~ 1.25 0.5 1.25 0.1 10 normal @a[limit=6,sort=nearest,distance=..10]
        effect give @a[limit=5,sort=nearest,distance=0.0001..10] minecraft:regeneration 3
    } else execute (as @a if score @s satyrn.fdl.itemId.offHand matches 55) {
        effect give @s minecraft:regeneration 3 1
    }
}

# Gives the sender a copy of the Totem of Deilona
function give {
    give @s minecraft:totem_of_undying{DungeonLootId:55,CustomModelData:421951,AttributeModifiers:[{AttributeName:"generic.luck",Amount:2,Slot:offhand,Name:"generic.luck",UUID:[I;-122613,28189,202737,-56378]}],display:{Name:'[{"text":"Totem of Deilona","italic":false,"color":"green"}]',Lore:['[{"text":"May Deilona, Goddess of Health and ","color":"dark_purple"},{"text":"Good","color":"dark_purple","italic":true}]','[{"text":"Fortune, smile upon thee!","italic":true,"color":"dark_purple"},{"text":"","italic":true,"color":"dark_purple"}]','[{"text":"Rarity: ","italic":true,"color":"dark_purple"},{"text":"Mythic","color":"green"},{"text":"","color":"dark_purple","italic":false}]','[{"text":"","italic":false,"color":"dark_purple"}]','[{"text":"Deilona\'s Blessing:","italic":false,"color":"green"},{"text":" When held in off-hand,","italic":false,"color":"gray"}]','[{"text":"grants the user Regeneration II. When held","italic":false,"color":"gray"}]','[{"text":"in main hand, grants nearby players (with","italic":false,"color":"gray"}]','[{"text":"the exception of the wielder) Regeneration","italic":false,"color":"gray"}]','[{"text":"I.","italic":false,"color":"gray"}]']},Enchantments:[{id:"minecraft:mending",lvl:1}],HideFlags:1} 1
}

# Schedules the clock function with an offset of 13 ticks.
function on_load {
    schedule function foxcraft_dungeon_loot:items/totem_of_deilona/clock_2s 13t
}
