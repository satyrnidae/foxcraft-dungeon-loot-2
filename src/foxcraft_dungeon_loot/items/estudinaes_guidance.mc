import ../../macros.mcm

# Applies the item's effects every two seconds.
function clock_2s {
    schedule function foxcraft_dungeon_loot:items/estudinaes_guidance/clock_2s 2s
    execute as @a if score @s satyrn.fdl.itemId.boots matches 38 run {
        effect give @s minecraft:slowness 3 1
        effect give @s minecraft:dolphins_grace 3
    }
}

# Gives the sender a copy of the item.
function give {
    macro give epic/estudinaes_guidance
}

dir give {
    # Gives the sender a copy of the item. The item is upgraded to chainmail.
    function chainmail {
        macro give_variant epic/estudinaes_guidance 1
    }

    # Gives the sender a copy of the item. The item is upgraded to iron.
    function iron {
        macro give_variant epic/estudinaes_guidance 2
    }

    # Gives the sender a copy of the item. The item is upgraded to diamond.
    function diamond {
        macro give_variant epic/estudinaes_guidance 3
    }

    # Gives the sender a copy of the item. The item is upgraded to netherite.
    function netherite {
        macro give_variant epic/estudinaes_guidance 4
    }
}

# Initializes the item's clocks.
function on_load {
    schedule function foxcraft_dungeon_loot:items/estudinaes_guidance/clock_2s 2t
}
