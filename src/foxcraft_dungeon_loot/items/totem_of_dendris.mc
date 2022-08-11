import ../../macros.mcm

# Occurs once every ten ticks
function clock_10t {
    schedule function foxcraft_dungeon_loot:items/totem_of_dendris/clock_10t 10t
    execute as @a[tag=satyrn.fdl.totemOfDendris.effectsApplied,predicate=!foxcraft_dungeon_loot:items/totem_of_dendris/in_off_hand] run {
        effect clear @s minecraft:night_vision
        effect clear @s minecraft:water_breathing
        effect clear @s minecraft:resistance
        tag @s remove satyrn.fdl.totemOfDendris.effectsApplied
    }

    execute as @a[predicate=foxcraft_dungeon_loot:items/totem_of_dendris/in_off_hand,predicate=!foxcraft_dungeon_loot:items/totem_of_dendris/has_effects] run {
        effect give @s minecraft:night_vision 1000000
        effect give @s minecraft:water_breathing 1000000
        effect give @s minecraft:resistance 1000000 4
        tag @s add satyrn.fdl.totemOfDendris.effectsApplied
    }
}

# Runs when the datapack is loaded.
function on_load {
    schedule function foxcraft_dungeon_loot:items/totem_of_dendris/clock_10t 10t
}
