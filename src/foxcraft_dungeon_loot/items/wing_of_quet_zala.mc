import ../../macros.mcm

function clock_60s {
    schedule function foxcraft_dungeon_loot:items/wing_of_quet_zala/clock_60s 60s
    execute as @r if entity @s[predicate=foxcraft_dungeon_loot:items/wing_of_quet_zala/in_inventory] run effect give @s minecraft:levitation 5 0 true
}

function on_load {
    schedule function foxcraft_dungeon_loot:items/wing_of_quet_zala/clock_60s 8t
}

# Occurs once per player per tick
function on_tick {
    execute (if score @s satyrn.fdl.itemId.offHand matches 62) {
        execute unless entity @s[predicate=foxcraft_dungeon_loot:items/wing_of_quet_zala/has_effects] run {
            effect give @s minecraft:levitation 1000000 0 true
            tag @s add satyrn.fdl.wingOfQuetZala.effectsApplied
        }
    } else execute (if entity @s[tag=satyrn.fdl.wingOfQuetZala.effectsApplied]) {
        effect clear @s minecraft:levitation
        tag @s remove satyrn.fdl.wingOfQuetZala.effectsApplied
    }
}
