import ../../macros.mcm

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

# Occurs each tick.
function on_tick {
    execute (if score @s satyrn.fdl.itemId.mainHand matches 32) {
        execute unless entity @s[predicate=foxcraft_dungeon_loot:items/auto_pickaxe/has_effects] run {
            effect give @s minecraft:haste 1000000 1 true
            tag @s add satyrn.fdl.autoPickaxe.effectsApplied
        }
    } else execute (if entity @s[tag=satyrn.fdl.autoPickaxe.effectsApplied]) {
        effect clear @s minecraft:haste
        tag @s remove satyrn.fdl.autoPickaxe.effectsApplied
    }
}
