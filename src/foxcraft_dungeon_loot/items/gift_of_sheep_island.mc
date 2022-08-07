import ../../macros.mcm

# Updates the item every tick.
function on_tick {
    execute if score @s[predicate=!foxcraft_dungeon_loot:items/offhand_prevents_use] satyrn.fdl.itemId.mainHand matches 44 if score @s satyrn.fdl.used.warpedFungusOnAStick matches 1.. run {
        playsound foxcraft_dungeon_loot:item.gift_of_sheep_island.equip player @s
        effect give @s minecraft:hunger 60
        effect give @s minecraft:fire_resistance 600

        execute unless entity @s[gamemode=creative] run {
            item modify entity @s weapon.mainhand foxcraft_dungeon_loot:remove
        }
    }
}
