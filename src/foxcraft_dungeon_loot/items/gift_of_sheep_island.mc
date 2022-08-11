# Runs on ticks when a player has used a warped fungus on a stick.
function on_warped_fungus_used {
    execute if entity @s[predicate=foxcraft_dungeon_loot:items/gift_of_sheep_island/in_main_hand] run {
        playsound foxcraft_dungeon_loot:item.gift_of_sheep_island.equip player @s
        effect give @s minecraft:hunger 60
        effect give @s minecraft:fire_resistance 600

        execute unless entity @s[gamemode=creative] run {
            item modify entity @s weapon.mainhand foxcraft_dungeon_loot:remove
        }
    }
}
