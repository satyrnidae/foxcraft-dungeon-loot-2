import ../../macros.mcm

# Applies the item's effects every two seconds.
function clock_2s {
    schedule function foxcraft_dungeon_loot:items/estudinaes_survival/clock_2s 2s
    execute as @a if score @s satyrn.fdl.itemId.helmet matches 40 run {
        effect give @s minecraft:conduit_power 3
        effect give @s minecraft:mining_fatigue 3
    }
}

# Applies more item effects every 10 seconds.
function clock_10s {
    schedule function foxcraft_dungeon_loot:items/estudinaes_survival/clock_10s 10s
    execute as @a if score @s satyrn.fdl.itemId.helmet matches 40 run effect give @s minecraft:saturation
}

# Gives the sender a copy of this item.
function give {
    macro give epic/estudinaes_survival
}

dir give {
    # Gives the sender a copy of this item. The item is upgraded to chainmail.
    function chainmail {
        macro give_variant epic/estudinaes_survival 1
    }

    # Gives the sender a copy of this item. The item is upgraded to iron.
    function iron {
        macro give_variant epic/estudinaes_survival 2
    }

    # Gives the sender a copy of this item. The item is upgraded to diamond.
    function diamond {
        macro give_variant epic/estudinaes_survival 3
    }

    # Gives the sender a copy of this item. The item is upgraded to netherite.
    function netherite {
        macro give_variant epic/estudinaes_survival 4
    }
}

# Initializes the item's 2 second and 10 second clocks. The clocks are offset by 6 and 7 ticks, respectively.
function on_load {
    schedule function foxcraft_dungeon_loot:items/estudinaes_survival/clock_2s 6t
    schedule function foxcraft_dungeon_loot:items/estudinaes_survival/clock_10s 7t
}
