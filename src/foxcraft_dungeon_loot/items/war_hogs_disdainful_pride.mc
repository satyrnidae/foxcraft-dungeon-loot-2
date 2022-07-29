import ../../macros.mcm

function give {
    give @s minecraft:netherite_boots{DungeonLootId:58,CustomModelData:421951,AttributeModifiers:[{AttributeName:"generic.armor",Amount:5,Slot:feet,Name:"generic.armor",UUID:[I;-12265,156837,155536,-313674]},{AttributeName:"generic.armor_toughness",Amount:3,Slot:feet,Name:"generic.armor_toughness",UUID:[I;-12265,156937,155536,-313874]},{AttributeName:"generic.knockback_resistance",Amount:0.2,Slot:feet,Name:"generic.knockback_resistance",UUID:[I;-12265,157037,155536,-314074]},{AttributeName:"generic.movement_speed",Amount:-0.1,Slot:feet,Operation:1,Name:"generic.movement_speed",UUID:[I;-12265,157137,155536,-314274]},{AttributeName:"generic.max_health",Amount:2,Slot:feet,Name:"generic.max_health",UUID:[I;-12265,157237,155536,-314474]}],display:{Name:'[{"text":"War Hog\'s Disdainful Pride","italic":false,"color":"green"}]',Lore:['[{"text":"Slow Falling","italic":false,"color":"gray"},{"text":"","italic":false,"color":"dark_purple"}]','[{"text":"Long ago, great warriors roamed the nether,","italic":true,"color":"dark_purple"},{"text":"","italic":true,"color":"dark_purple"}]','[{"text":"dropping down on unsuspecting prey from the","italic":true,"color":"dark_purple"},{"text":"","italic":true,"color":"dark_purple"}]','[{"text":"shelves above. These boots are their","italic":true,"color":"dark_purple"},{"text":"","italic":true,"color":"dark_purple"}]','[{"text":"disdainful pride.","italic":true,"color":"dark_purple"},{"text":"","italic":true,"color":"dark_purple"}]','[{"text":"Rarity: ","italic":true,"color":"dark_purple"},{"text":"Mythic","italic":true,"color":"green"},{"text":"","color":"dark_purple","italic":false}]','[{"text":"","italic":false,"color":"dark_purple"}]','[{"text":"Pride Comes Before the Fall:","italic":false,"color":"green"},{"text":" When falling","color":"gray"},{"text":"","color":"dark_purple"}]','[{"text":"for more than four meters, Slow Falling is","italic":false,"color":"gray"},{"text":"","italic":false,"color":"dark_purple"}]','[{"text":"applied for three seconds.","italic":false,"color":"gray"}]']},Enchantments:[{id:"minecraft:vanishing_curse",lvl:1},{id:"minecraft:feather_falling",lvl:5},{id:"minecraft:fire_protection",lvl:3},{id:"minecraft:mending",lvl:1},{id:"minecraft:protection",lvl:4},{id:"minecraft:soul_speed",lvl:2},{id:"minecraft:unbreaking",lvl:5}]} 1
}

function on_tick {
    execute if score @s satyrn.fdl.custom.fallOneCm matches 400.. if score @s satyrn.fdl.itemId.boots matches 58 if score @s satyrn.fdl.custom.fallFlying matches 0 run {
        effect give @s minecraft:slow_falling 3 1

        execute unless entity @s[gamemode=creative] run {
            item modify entity @s armor.feet foxcraft_dungeon_loot:war_hogs_disdainful_pride/damage_slow_falling
            execute if entity @s[nbt={Inventory:[{Slot:100b,tag:{Damage:481}}]}] run {
                macro break_item armor.feet minecraft:netherite_boots{CustomModelData:421951}
            }
        }
    }
}
