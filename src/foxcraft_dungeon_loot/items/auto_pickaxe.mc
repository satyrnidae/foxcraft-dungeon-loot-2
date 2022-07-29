# Main clock for the item.
function clock_2s {
    schedule function foxcraft_dungeon_loot:items/auto_pickaxe/clock_2s 2s
    execute as @a if score @s satyrn.fdl.itemId.mainHand matches 32 run effect give @s minecraft:haste 3 1 true
}

# Gives a copy of the item to the sender.
function give {
    loot give @s loot foxcraft_dungeon_loot:items/mythic/iron_auto_pickaxe
}

dir give {
    # Gives a copy of this item to the sender. The item is upgraded to a diamond pickaxe.
    function diamond {
        loot give @s loot foxcraft_dungeon_loot:items/mythic/diamond_auto_pickaxe
    }

    # Gives a copy of this item to the sender. The item is upgraded to a netherite pickaxe.
    function netherite {
        loot give @s loot foxcraft_dungeon_loot:items/mythic/netherite_auto_pickaxe
    }
}

# Sets up item-specific clocks, counters, etc.
function on_load {
    function foxcraft_dungeon_loot:items/auto_pickaxe/clock_2s
}
