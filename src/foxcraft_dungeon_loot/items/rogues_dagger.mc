import ../../macros.mcm

# Gives the sender a copy of the item.
function give {
    macro give_as_loot epic/rogues_dagger
}

# Makes the player invisible if they are crouching.
function on_tick {
    execute (if score @s satyrn.fdl.itemId.offHand matches 17 if score @s satyrn.fdl.custom.sneakTime matches 1..) {
        execute unless entity @s[predicate=foxcraft_dungeon_loot:items/rogues_dagger/has_effects] run {
            effect give @s minecraft:invisibility 1000000
            tag @s add satyrn.fdl.roguesDagger.effectsApplied
        }
    } else execute (if entity @s[tag=satyrn.fdl.roguesDagger.effectsApplied]) {
        effect clear @s minecraft:invisibility
        tag @s remove satyrn.fdl.roguesDagger.effectsApplied
    }
}
