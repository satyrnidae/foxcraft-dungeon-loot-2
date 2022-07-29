function give {
    give @s minecraft:warped_fungus_on_a_stick{DungeonLootId:63,CustomModelData:4219510,display:{Name:'[{"text":"Silverfish Escape Artist","italic":false,"color":"light_purple"}]',Lore:['[{"text":"Sometimes getting out alive is more"}]','[{"text":"important than getting what you want. You","italic":true}]','[{"text":"might be able to kill a silverfish, but","italic":true}]','[{"text":"could you stop one from running away?","italic":true}]','[{"text":"Rarity: ","italic":true},{"text":"Epic","color":"light_purple"},{"text":"","color":"dark_purple","italic":false}]','[{"text":"","italic":false,"color":"dark_purple"}]','[{"text":"Escape Artist:","italic":false,"color":"light_purple"},{"text":" When you consume this item,","italic":false,"color":"gray"}]','[{"text":"it grants 30 seconds of every effect you","italic":false,"color":"gray"}]','[{"text":"need to escape.","italic":false,"color":"gray"},{"text":"","italic":false,"color":"dark_purple"}]','[{"text":"Fragile:","italic":false,"color":"red"},{"text":" This item is consumed upon use.","color":"gray"},{"text":"","color":"dark_purple"}]','[{"text":"Edible:","italic":false,"color":"yellow"},{"text":" >:3","color":"gray"}]']},Enchantments:[{id:"minecraft:mending",lvl:1}],HideFlags:1} 1
}

function on_load {
    scoreboard objectives add satyrn.fdl.silverfishEscapeArtist.cooldown dummy
}

function on_tick {
    execute if score @s satyfn.fdl.used.warpedFungusOnAStick matches 1.. if score @s satyrn.fdl.itemId.mainHand matches 63 run {
        execute (if score @s satyrn.fdl.silverfishEscapeArtist.cooldown matches 1..) {
            playsound foxcraft_dungeon_loot:entity.player.spell_fails player @s
            title @s actionbar {"text":"Silverfish Escape Artist is on cooldown and cannot be used.","color":"dark_purple"}
        } else {
            playsound minecraft:entity.generic.eat player @s
            playsound minecraft:entity.player.burp player @s
            particle minecraft:item minecraft:warped_fungus_on_a_stick{CustomModelData:4219510} ^ ^1.25 ^0.5 0 0.5 0.5 0.1 8

            effect give @s minecraft:saturation 3 0 true
            effect give @s minecraft:speed 30 3
            effect give @s minecraft:mining_fatigue 30
            effect give @s minecraft:jump_boost 30
            effect give @s minecraft:regeneration 30
            effect give @s minecraft:water_breathing 30
            effect give @s minecraft:invisibility 30
            effect give @s minecraft:night_vision 30
            effect give @s minecraft:weakness 30
            effect give @s minecraft:absorption 30
            effect give @s minecraft:glowing 30
            effect give @s minecraft:luck 30
            effect give @s minecraft:slow_falling 30
            effect give @s minecraft:hunger 30 2

            execute unless entity @s[gamemode=creative] run {
                scoreboard players add @s satyrn.fdl.silverfishEscapeArtist.cooldown 1
                title @s actionbar {"text":"Silverfish Escape Artist is now on cooldown for 30 seconds.","color":"dark_purple"}
                item modify entity @s weapon.mainhand foxcraft_dungeon_loot:remove
            }
        }
    }

    execute if score @s satyrn.fdl.silverfishEscapeArtist.cooldown matches 1.. run scoreboard players add @s satyrn.fdl.silverfishEscapeArtist.cooldown 1

    execute if score @s satyrn.fdl.silverfishEscapeArtist.cooldown matches 600 run {
        playsound foxcraft_dungeon_loot:entity.player.spell_ready player @s ~ ~ ~ 0.5
        particle minecraft:witch ~ ~1 ~ 0 0.5 0 1 10 normal @s
        title @s actionbar {"text":"Silverfish Escape Artist is ready to be used once more.","color":"dark_purple"}
    }
}
