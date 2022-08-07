import ../../macros.mcm

# Occurs once every ten ticks
function clock_10t {
    # Schedule the function to run again in 10 ticks.
    schedule function foxcraft_dungeon_loot:items/auto_pickaxe/clock_10t 10t

    # Execute for every player holding the pickaxe in their main hand.
    execute as @a[predicate=foxcraft_dungeon_loot:items/auto_pickaxe/in_main_hand] at @s run {
        execute unless entity @s[predicate=foxcraft_dungeon_loot:items/auto_pickaxe/has_effects] run {
            effect give @s minecraft:haste 1000000 1 true
            tag @s add satyrn.fdl.autoPickaxe.effectsApplied
        }
    }

    # Execute for every player not holding the pickaxe in their main hand, but tagged as having the pickaxe's effects.
    execute as @a[predicate=!foxcraft_dungeon_loot:items/auto_pickaxe/in_main_hand,tag=satyrn.fdl.autoPickaxe.effectsApplied] at @s run {
        effect clear @s minecraft:haste
        tag @s remove satyrn.fdl.autoPickaxe.effectsApplied
    }
}

# Occurs once as the data pack is loaded.
function on_load {
    schedule function foxcraft_dungeon_loot:items/auto_pickaxe/clock_10t 1t
}
