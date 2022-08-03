import ../../macros.mcm

function clock_60s {
    schedule function foxcraft_dungeon_loot:items/wing_of_ouet_zala/clock_60s 60s
    execute as @r if entity @s[predicate=foxcraft_dungeon_loot:items/wing_of_ouet_zala/in_inventory] run effect give @s minecraft:levitation 5 0 true
}

function give {
    macro give_as_loot mythic/wing_of_ouet_zala
}

function on_load {
    schedule function foxcraft_dungeon_loot:items/wing_of_ouet_zala/clock_60s 7t
}

# Occurs once per player per tick
function on_tick {
    execute (if score @s satyrn.fdl.itemId.offHand matches 61) {
        execute unless entity @s[predicate=foxcraft_dungeon_loot:items/wing_of_ouet_zala/has_effects] run {
            effect give @s minecraft:nausea 1000000 0 true
            tag @s add satyrn.fdl.wingOfOuetZala.effectsApplied
        }
    } else execute (if entity @s[tag=satyrn.fdl.wingOfOuetZala.effectsApplied]) {
        effect clear @s minecraft:nausea
        tag @s remove satyrn.fdl.wingOfOuetZala.effectsApplied
    }
}
