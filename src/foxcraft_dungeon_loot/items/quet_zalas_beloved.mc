function give {
    give @s minecraft:elytra{DungeonLootId:50,Damage:431,CustomModelData:421951,AttributeModifiers:[{AttributeName:"generic.armor",Amount:6,Slot:chest,Name:"generic.armor",UUID:[I;-122615,101238,132318,-202476]},{AttributeName:"generic.movement_speed",Amount:0.4,Slot:chest,Operation:1,Name:"generic.movement_speed",UUID:[I;-122615,101338,132318,-202676]}],display:{Name:'[{"text":"Quet-Zala\'s Beloved","italic":false,"color":"green"}]',Lore:['[{"text":"\\"And to you, my most cherished disciple:"}]','[{"text":"Wings. May they carry you away from harm,","italic":true}]','[{"text":"and into my loving embrace.\\"","italic":true},{"text":"","italic":false}]','[{"text":"Rarity: ","italic":true},{"text":"Mythic","color":"green"},{"text":"","color":"dark_purple","italic":false}]','[{"text":"","italic":false,"color":"dark_purple"}]','[{"text":"Quet-Zala\'s Embrace:","italic":false,"color":"green"},{"text":" ","color":"dark_purple"},{"text":"When falling for more","color":"gray"}]','[{"text":"than four meters, Slow Falling is applied","italic":false,"color":"gray"}]','[{"text":"for three seconds.","italic":false,"color":"gray"}]']},Enchantments:[{id:"minecraft:blast_protection",lvl:4},{id:"minecraft:fire_protection",lvl:4},{id:"minecraft:mending",lvl:1},{id:"minecraft:projectile_protection",lvl:4},{id:"minecraft:protection",lvl:5},{id:"minecraft:thorns",lvl:3},{id:"minecraft:unbreaking",lvl:5}]} 1
}

function on_tick {
    execute if score @s satyrn.fdl.custom.fallOneCm matches 400.. if score @s satyrn.fdl.itemId.chestplate matches 50 if score @s satyrn.fdl.custom.fallFlying matches 0 run {
        execute unless entity @s[nbt={Inventory:[{Slot:102b,tag:{Damage:431}}]}] run {
            effect give @s minecraft:slow_falling 3

            execute unless score @s satyrn.fdl.custom.playerGameType matches 1 run {
                item modify entity @s armor.chest foxcraft_dungeon_loot:quet_zalas_beloved/damage_slow_falling
            }
        }
    }
}
