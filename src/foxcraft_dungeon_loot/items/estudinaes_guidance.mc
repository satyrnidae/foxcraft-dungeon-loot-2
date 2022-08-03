import ../../macros.mcm

# Gives the sender a copy of the item.
function give {
    macro give_as_loot epic/estudinaes_guidance
}

dir give {
    # Gives the sender a copy of the item. The item is upgraded to chainmail.
    function chainmail {
        macro give_as_variant_loot epic/estudinaes_guidance 1
    }

    # Gives the sender a copy of the item. The item is upgraded to iron.
    function iron {
        macro give_as_variant_loot epic/estudinaes_guidance 2
    }

    # Gives the sender a copy of the item. The item is upgraded to diamond.
    function diamond {
        macro give_as_variant_loot epic/estudinaes_guidance 3
    }

    # Gives the sender a copy of the item. The item is upgraded to netherite.
    function netherite {
        macro give_as_variant_loot epic/estudinaes_guidance 4
    }
}

# Occurs each tick
function on_tick {
    execute (if score @s satyrn.fdl.itemId.boots matches 38) {
        # Apply the item effects if the entity doesn't have them
        execute unless entity @s[predicate=foxcraft_dungeon_loot:items/estudinaes_guidance/has_effects] run {
            tag @s add satyrn.fdl.estudinaesGuidance.effectsApplied
            effect give @s minecraft:slowness 1000000 1
            effect give @s minecraft:dolphins_grace 1000000
        }
    } else execute (if entity @s[tag=satyrn.fdl.estudinaesGuidance.effectsApplied]) {
        effect clear @s minecraft:slowness
        effect clear @s minecraft:dolphins_grace
        tag @s remove satyrn.fdl.estudinaesGuidance.effectsApplied
    }
}
