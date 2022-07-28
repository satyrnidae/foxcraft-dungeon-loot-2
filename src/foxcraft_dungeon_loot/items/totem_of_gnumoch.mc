function clock_2s {
    schedule function foxcraft_dungeon_loot:items/totem_of_gnumoch/clock_2s 2s
    execute as @a if score @s satyrn.fdl.itemId.offHand matches 20 if score @s satyrn.fdl.custom.onGround matches 1 run {
        effect give @s minecraft:resistance 3 2
        effect give @s minecraft:slowness 3 1
        effect give @s minecraft:absorption 3 2
    }
}

function give {
    give @s minecraft:totem_of_undying{DungeonLootId:20,CustomModelData:421954,AttributeModifiers:[{AttributeName:"generic.knockback_resistance",Amount:1,Slot:offhand,Name:"generic.knockback_resistance",UUID:[I;-122628,70376,745,-140752]},{AttributeName:"generic.armor",Amount:10,Slot:offhand,Name:"generic.armor",UUID:[I;-122628,70576,745,-141152]},{AttributeName:"generic.armor_toughness",Amount:5,Slot:offhand,Name:"generic.armor_toughness",UUID:[I;-122628,70676,745,-141352]}],display:{Name:'[{"text":"Totem of Gnumoch","italic":false,"color":"green"}]',Lore:['[{"text":"May Gnumoch, the God of the Earth, smile"}]','[{"text":"upon thee!","italic":true}]','[{"text":"Rarity: ","italic":true},{"text":"Mythic","color":"green"},{"text":"","color":"dark_purple","italic":false}]','[{"text":"","italic":false,"color":"dark_purple"}]','[{"text":"Feet Firmly Planted: ","italic":false,"color":"green"},{"text":"While on the ground,","italic":false,"color":"gray"}]','[{"text":"and with the totem in off-hand, grants","italic":false,"color":"gray"}]','[{"text":"Resistance III.","italic":false,"color":"gray"}]']},Enchantments:[{id:"minecraft:mending",lvl:1}],HideFlags:1} 1
}

function on_load {
    schedule function foxcraft_dungeon_loot:items/totem_of_gnumoch/clock_2s 15t
}
