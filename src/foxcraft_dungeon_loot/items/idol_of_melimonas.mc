# TAGS USED
# satyrn.fdl.idolOfMelimonas.effectsApplied - Applied to players when the item's effects are given to them.

# Occurs once per player per tick
function clock_10t {
    schedule function foxcraft_dungeon_loot:items/idol_of_melimonas/clock_10t 10t

    execute as @a[predicate=foxcraft_dungeon_loot:items/idol_of_melimonas/in_off_hand,predicate=!foxcraft_dungeon_loot:items/idol_of_melimonas/has_effects] run {
        effect give @s minecraft:jump_boost 1000000 1 true
        effect give @s minecraft:invisibility 1000000 0 true
        tag @s add satyrn.fdl.idolOfMelimonas.effectsApplied
    }

    execute as @a[predicate=!foxcraft_dungeon_loot:items/idol_of_melimonas/in_off_hand,tag=satyrn.fdl.idolOfMelimonas.effectsApplied] run {
        effect clear @s minecraft:jump_boost
        effect clear @s minecraft:invisibility
        tag @s remove satyrn.fdl.idolOfMelimonas.effectsApplied
    }
}

# Executes when the datapack is loaded.
function on_load {
    schedule function foxcraft_dungeon_loot:items/idol_of_melimonas/clock_10t 6t
}
