import ../../macros.mcm

function give {
    macro give_as_loot common_grab_bag
}

function on_tick {
    execute as @a[predicate=foxcraft_dungeon_loot:items/common_grab_bag/in_main_hand,predicate=!foxcraft_dungeon_loot:items/offhand_prevents_use,scores={satyrn.fdl.used.warpedFungusOnAStick=1..}] at @s run {
        playsound foxcraft_dungeon_loot:item.grab_bag.open player @a

        execute unless entity @s[gamemode=creative] run {
            item modify entity @s weapon.mainhand foxcraft_dungeon_loot:remove
        }

        particle minecraft:smoke ^ ^1.0 ^0.25 0.25 0.25 0.25 0.01 10
        loot spawn ^ ^1.0 ^0.25 loot foxcraft_dungeon_loot:loot/grab_bag/common
    }
}
