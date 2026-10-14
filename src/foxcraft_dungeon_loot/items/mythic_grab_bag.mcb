# Runs on ticks where a player has used a warped fungus on a stick.
function on_warped_fungus_used {
    execute if entity @s[predicate=foxcraft_dungeon_loot:items/mythic_grab_bag/in_main_hand] run {
        playsound foxcraft_dungeon_loot:item.grab_bag.open player @a

        execute unless entity @s[gamemode=creative] run {
            item modify entity @s weapon.mainhand foxcraft_dungeon_loot:remove
        }

        particle minecraft:smoke ^ ^1.0 ^0.25 0.25 0.25 0.25 0.01 10
        loot spawn ^ ^1.0 ^0.25 loot foxcraft_dungeon_loot:loot/grab_bag/mythic
    }
}
