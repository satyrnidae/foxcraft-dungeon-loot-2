import ../../macros.mcm

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

# Occurs once per player per tick
function on_tick {
    execute (if score @s satyrn.fdl.itemId.chestplate matches 39) {
        # Add the item effect
        execute unless entity @s[predicate=foxcraft_dungeon_loot:items/estudinaes_patience/has_effects] run {
            tag @s add satyrn.fdl.estudinaesPatience.effectsApplied
            effect give @s minecraft:weakness 1000000 4
        }
    } else execute (if entity @s[tag=satyrn.fdl.estudinaesPatience.effectsApplied]) {
        effect clear @s minecraft:weakness
        tag @s remove satyrn.fdl.estudinaesPatience.effectsApplied
    }
}
