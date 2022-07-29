import ../../macros.mcm

# Gives the sender a copy of the item.
function give {
    macro give epic/rogues_dagger
}

# Makes the player invisible if they are crouching.
function on_tick {
    execute if score @s satyrn.fdl.itemId.offHand matches 17 if score @s satyrn.fdl.custom.sneakTime matches 1.. run effect give @s minecraft:invisibility 1
}
