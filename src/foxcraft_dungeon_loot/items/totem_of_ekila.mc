import ../../macros.mcm

function clock_2s {
    schedule function foxcraft_dungeon_loot:items/totem_of_ekila/clock_2s 2s
    execute as @a if score @s satyrn.fdl.itemId.offHand matches 19 run {
        execute (if entity @s[predicate=foxcraft_dungeon_loot:is_flying]) {
            execute unless entity @s[tag=satyrn.fdl.ekilaFlying] run effect give @s minecraft:absorption 9999 1
            tag @s add satyrn.fdl.ekilaFlying
            effect give @s minecraft:resistance 3 2
        } else {
            execute if entity @s[tag=satyrn.fdl.ekilaFlying] run effect clear @s minecraft:absorption
            tag @s remove satyrn.fdl.ekilaFlying
            effect give @s minecraft:jump_boost 3 2
            effect give @s minecraft:slow_falling 3
        }
    }
}

function give {
    macro give_as_loot mythic/totem_of_ekila
}

function on_load {
    schedule function foxcraft_dungeon_loot:items/totem_of_ekila/clock_2s 14t
}
