import ../../macros.mcm

# Applies the item's effects every 2 seconds.
function clock_2s {
    schedule function foxcraft_dungeon_loot:items/estudinaes_patience/clock_2s 2s
    execute as @a if score @s satyrn.fdl.itemId.boots matches 39 run effect give @s minecraft:weakness 3 4
}

# Gives the sender a copy of the item.
function give {
    macro give_as_loot epic/estudinaes_patience
}

dir give {
    # Gives the sender a copy of the item. The item is upgraded to chainmail.
    function chainmail {
        macro give_as_variant_loot epic/estudinaes_patience 1
    }

    # Gives the sender a copy of the item. The item is upgraded to iron.
    function iron {
        macro give_as_variant_loot epic/estudinaes_patience 2
    }

    # Gives the sender a copy of the item. The item is upgraded to diamond.
    function diamond {
        macro give_as_variant_loot epic/estudinaes_patience 3
    }

    # Gives the sender a copy of the item. The item is upgraded to netherite.
    function netherite {
        macro give_as_variant_loot epic/estudinaes_patience 4
    }
}

# Schedule the clock function, offset by 3 ticks.
function on_load {
    schedule function foxcraft_dungeon_loot:items/estudinaes_patience/clock_2s 3t
}
