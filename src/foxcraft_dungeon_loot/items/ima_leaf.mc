import ../../macros.mcm

function give {
    macro give_as_loot rare/ima_leaf
}

function on_tick {
    # Execute the following if the sender has Deilona's Holy Blessings equipped in their main hand
    execute if score @s[predicate=!foxcraft_dungeon_loot:items/offhand_prevents_use] satyrn.fdl.itemId.mainHand matches 77 if score @s satyrn.fdl.used.warpedFungusOnAStick matches 1.. run {
        particle minecraft:smoke ~ ~ ~ 0.5 1 0.5 0 100
        playsound foxcraft_dungeon_loot:item.ima_leaf.pop player @a
        tp @s ~ 10000 ~

        # Break the item
        execute unless entity @s[gamemode=creative] run {
            playsound minecraft:entity.item.break player @s ~ 10000 ~
            macro break_item weapon.mainhand minecraft:warped_fungus_on_a_stick{CustomModelData:4219520}
        }
    }
}
