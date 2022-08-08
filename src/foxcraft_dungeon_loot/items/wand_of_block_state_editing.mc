# Updates the item effects on every ten ticks.
function clock_4t {
    schedule function foxcraft_dungeon_loot:items/wand_of_block_state_editing/clock_4t 4t

    execute as @a[tag=satyrn.fdl.debugStickUser,predicate=!foxcraft_dungeon_loot:items/wand_of_block_state_editing/in_main_hand] run {
        effect clear @s minecraft:haste
        tag @s remove satyrn.fdl.debugStickUser
    }

    execute as @a[predicate=foxcraft_dungeon_loot:items/wand_of_block_state_editing/in_main_hand,predicate=!foxcraft_dungeon_loot:items/wand_of_block_state_editing/has_effects] run {
        effect give @s minecraft:haste 1000000 100 true
        tag @s add satyrn.fdl.debugStickUser
    }
}

function on_load {
    schedule function foxcraft_dungeon_loot:items/wand_of_block_state_editing/clock_4t 1t
}
