function clock_2s {
    schedule function foxcraft_dungeon_loot:items/totem_of_mysteria/clock_2s 2s
    execute as @a[predicate=foxcraft_dungeon_loot:items/totem_of_mysteria/in_off_hand] at @s run {
        execute as @e[type=#foxcraft_dungeon_loot:hostile,distance=..7,sort=nearest,limit=5,predicate=!foxcraft_dungeon_loot:is_persistent] at @s anchored feet run {
            data modify entity @s Fire set from storage foxcraft_dungeon_loot:totem_of_mysteria Fire
            particle minecraft:flame ^ ^0.25 ^ 0.5 1 0.25 0.01 10
        }
        tag @s add satyrn.fdl.mysteriaSource
        execute as @e[type=#foxcraft_dungeon_loot:ally,distance=..7,sort=nearest,limit=5,tag=!satyrn.fdl.mysteriaSource] at @s run {
            effect give @s minecraft:fire_resistance 3
            particle minecraft:flame ^ ^0.25 ^ 0.5 1 0.25 0.01 10
        }
        tag @s remove satyrn.fdl.mysteriaSource
    }
}

function clock_10t {
    schedule function foxcraft_dungeon_loot:items/totem_of_mysteria/clock_10t 10t

    execute as @a[tag=satyrn.fdl.mysteriaActive,predicate=!foxcraft_dungeon_loot:items/totem_of_mysteria/in_off_hand] run {
        effect clear @s minecraft:fire_resistance
        tag @s remove satyrn.fdl.mysteriaActive
    }

    execute as @a[predicate=foxcraft_dungeon_loot:items/totem_of_mysteria/in_off_hand,predicate=!foxcraft_dungeon_loot:items/totem_of_mysteria/has_effects] run {
        effect give @s minecraft:fire_resistance 1000000
        tag @s add satyrn.fdl.mysteriaActive
    }
}

function on_load {
    schedule function foxcraft_dungeon_loot:items/totem_of_mysteria/clock_10t 1t
    schedule function foxcraft_dungeon_loot:items/totem_of_mysteria/clock_2s 2t
    data merge storage foxcraft_dungeon_loot:items {TotemOfMysteria:{Fire:80}}
}

function on_uninstall {
    data remove storage foxcraft_dungeon_loot:items TotemOfMysteria
}
