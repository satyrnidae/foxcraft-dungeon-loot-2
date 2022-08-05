import ../../macros.mcm

function give {
    macro give_as_loot epic_grab_bag
}

function on_tick {
    execute if score @s[predicate=!foxcraft_dungeon_loot:items/offhand_prevents_use] satyrn.fdl.itemId.mainHand matches 74 if score @s satyrn.fdl.used.warpedFungusOnAStick matches 1.. run {
        playsound foxcraft_dungeon_loot:item.grab_bag.open player @a

        execute unless entity @s[gamemode=creative] run {
            item modify entity @s weapon.mainhand foxcraft_dungeon_loot:remove
        }

        particle minecraft:smoke ^ ^1.0 ^0.25 0.25 0.25 0.25 0.01 10
        loot spawn ^ ^1.0 ^0.25 loot foxcraft_dungeon_loot:loot/grab_bag/mythic
    }
}
