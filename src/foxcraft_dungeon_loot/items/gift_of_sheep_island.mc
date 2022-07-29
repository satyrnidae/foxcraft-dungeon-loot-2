import ../../macros.mcm

# Gives the user a copy of the item.
function give {
    macro give rare/gift_of_sheep_island
}

# Updates the item every tick.
function on_tick {
    execute if score @s satyrn.fdl.used.warpedFungusOnAStick matches 1.. if score @s satyrn.fdl.itemId.mainHand matches 44 run {
        playsound minecraft:item.armor.equip_leather player @s ~ ~ ~ 1.0 1.0
        effect give @s minecraft:hunger 60
        effect give @s minecraft:fire_resistance 600

        execute unless entity @s[gamemode=creative] run {
            item modify entity @s weapon.mainhand foxcraft_dungeon_loot:remove
        }
    }
}
