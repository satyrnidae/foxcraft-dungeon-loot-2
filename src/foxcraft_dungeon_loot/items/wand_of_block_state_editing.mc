import ../../macros.mcm

# Gives the user a copy of the item.
function give {
    macro give_as_loot epic/wand_of_block_state_editing
}

# Updates the item on tick.
function on_tick {
    execute (if score @s satyrn.fdl.itemId.mainHand matches 57) {
        execute unless entity @s[tag=satyrn.fdl.debugStickUser] run {
            effect give @s minecraft:haste 1000000 100 true
            tag @s add satyrn.fdl.debugStickUser
        }
    } else execute (if entity @s[tag=satyrn.fdl.debugStickUser]) {
        effect clear @s minecraft:haste
        tag @s remove satyrn.fdl.debugStickUser
    }
}
