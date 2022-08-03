import ../../macros.mcm

# Gives the sender a copy of this item.
function give {
    macro give_as_loot mythic/stompies
}

dir give {
    # Gives the sender a copy of this item, upgraded to chainmail boots.
    function chainmail {
        macro give_as_variant_loot mythic/stompies 1
    }

    # Gives the sender a copy of this item, upgraded to iron boots.
    function iron {
        macro give_as_variant_loot mythic/stompies 2
    }

    # Gives the sender a copy of this item, upgraded to diamond boots.
    function diamond {
        macro give_as_variant_loot mythic/stompies 3
    }

    # Gives the sender a copy of this item, upgraded to netherite boots.
    function netherite {
        macro give_as_variant_loot mythic/stompies 4
    }
}

# Occurs once per player per tick
function on_tick {
    execute (if score @s satyrn.fdl.itemId.boots matches 52) {
        execute unless entity @s[predicate=foxcraft_dungeon_loot:items/stompies/has_effects] run {
            effect give @s minecraft:jump_boost 1000000 1 true
            tag @s add satyrn.fdl.stompies.effectsApplied
        }
    } else execute (if entity @s[tag=satyrn.fdl.stompies.effectsApplied]) {
        effect clear @s minecraft:jump_boost
        tag @s remove satyrn.fdl.stompies.effectsApplied
    }
}
