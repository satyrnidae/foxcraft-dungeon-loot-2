import ../../macros.mcm

function give {
    give @s minecraft:warped_fungus_on_a_stick{DungeonLootId:36,Unbreakable:1,CustomModelData:421955,display:{Name:'[{"text":"Deilona\'s Holy Blessings","italic":false,"color":"green"}]',Lore:['[{"text":"When enemies need to be friends, why not try","italic":true}]','[{"text":"helping them out?","italic":true},{"text":"","italic":false}]','[{"text":"Rarity: ","italic":true},{"text":"Mythic","color":"green","italic":true},{"text":"","color":"dark_purple","italic":false}]','[{"text":"","italic":false,"color":"dark_purple"}]','[{"text":"Act of Kindness:","italic":false,"color":"green"},{"text":" ","color":"dark_purple"},{"text":"Courses with the holy power","color":"gray"}]','[{"text":"of Deilona. When used, applies high-level","italic":false,"color":"gray"}]','[{"text":"Instant Health to all other entities in a 20","italic":false,"color":"gray"}]','[{"text":"block radius.","italic":false,"color":"gray"},{"text":"","italic":false,"color":"dark_purple"}]','[{"text":"Fragile: ","italic":false,"color":"red"},{"text":"This item is consumed upon use.","color":"gray"}]']},Enchantments:[{id:"minecraft:mending",lvl:1}],HideFlags:5} 1
}

function on_load {
    scoreboard objectives add satyrn.fdl.deilonasHolyBlessings.cooldown dummy
}

function on_tick {
    # Execute the following if the sender has Deilona's Holy Blessings equipped in their main hand
    execute (if score @s satyrn.fdl.used.warpedFungusOnAStick matches 1.. if score @s satyrn.fdl.itemId.mainHand matches 36) {
        execute (if score @s satyrn.fdl.deilonasHolyBlessings.cooldown matches 1..) {
            playsound foxcraft_dungeon_loot:entity.player.spell_fails player @s ~ ~ ~ 0.5
            title @s actionbar {"text":"Deilona's Holy Blessings is on cooldown and cannot be used.","color":"dark_purple"}
        } else {
            # Apply the effects for using Deilona's Holy Blessings
            effect give @e[distance=0.0001..20,type=!#foxcraft_dungeon_loot:non_living] minecraft:instant_health 3 5
            playsound foxcraft_dungeon_loot:entity.player.cast_wololo player @s ~ ~ ~ 20.0
            particle minecraft:enchanted_hit ~ ~1 ~ 0.5 0.5 0.5 1.0 10 normal @s
            particle minecraft:heart ~ ~1 ~ 20 0.5 20 0.1 50 normal @a[distance=0.0001..20]

            # Break the item and set cooldown for players who are not creative enough ;P
            execute (unless entity @s[nbt={playerGameType:1}]) {
                scoreboard players set @s satyrn.fdl.deilonasHolyBlessings.cooldown 1
                title @s actionbar {"text":"Deilona's Holy Blessings is now on cooldown for 10 seconds.","color":"dark_purple"}

                macro break_item weapon.mainhand minecraft:warped_fungus_on_a_stick{CustomModelData:421955}
            }
        }
    }

    execute if score @s satyrn.fdl.deilonasHolyBlessings.cooldown matches 1.. run scoreboard players add @s satyrn.fdl.deilonasHolyBlessings.cooldown 1

    execute (if score @s satyrn.fdl.deilonasHolyBlessings.cooldown matches 200) {
        playsound foxcraft_dungeon_loot:entity.player.spell_ready player @s ~ ~ ~ 0.5
        particle minecraft:witch ~ ~1 ~ 0 0.5 0 1 10 normal @s
        title @s actionbar {"text":"Deilona's Holy Blessings is ready to be used once more.","color":"dark_purple"}
        scoreboard players reset @s satyrn.fdl.deilonasHolyBlessings.cooldown
    }
}
