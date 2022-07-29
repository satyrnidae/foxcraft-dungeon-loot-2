import ../../macros.mcm

# Main clock for the item.
function clock_2s {
    schedule function foxcraft_dungeon_loot:items/auto_pickaxe/clock_2s 2s
    execute as @a if score @s satyrn.fdl.itemId.mainHand matches 32 run effect give @s minecraft:haste 3 1 true
}

# Gives a copy of the item to the sender.
function give {
    macro give_as_loot mythic/auto_pickaxe
}

dir give {
    # Gives a copy of this item to the sender. The item is upgraded to a diamond pickaxe.
    function diamond {
        macro give_as_variant_loot mythic/auto_pickaxe 1
    }

    # Gives a copy of this item to the sender. The item is upgraded to a netherite pickaxe.
    function netherite {
        macro give_as_variant_loot mythic/auto_pickaxe 2
    }
}

# Sets up item-specific clocks, counters, etc.
function on_load {
    function foxcraft_dungeon_loot:items/auto_pickaxe/clock_2s
}
