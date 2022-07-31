import ../../macros.mcm

function clock_2s {
    schedule function foxcraft_dungeon_loot:items/totem_of_mysteria/clock_2s 2s
    execute as @a at @s if score @s satyrn.fdl.itemId.offHand matches 56 run {
        execute as @e[type=#foxcraft_dungeon_loot:hostile,distance=..7,sort=nearest,limit=5] at @s anchored feet run {
            data modify entity @s Fire set from storage foxcraft_dungeon_loot:totem_of_mysteria Fire
            particle minecraft:flame ^ ^0.25 ^ 0.5 1 0.25 0.01 20 force
        }
        tag @s add satyrn.fdl.mysteriaSource
        execute as @e[type=#foxcraft_dungeon_loot:ally,distance=..7,sort=nearest,limit=5,tag=!satyrn.fdl.mysteriaSource] at @s run {
            effect give @s minecraft:fire_resistance 3
        }
        tag @s remove satyrn.fdl.mysteriaSource
    }
}

function give {
    macro give_as_loot mythic/totem_of_mysteria
}

function on_tick {
    execute (if score @s satyrn.fdl.itemId.offHand matches 56) {
        execute unless entity @s[tag=satyrn.fdl.mysteriaActive] run {
            effect give @s minecraft:fire_resistance 9999
            tag @s add satyrn.fdl.mysteriaActive
        }
    } else execute (if entity @s[tag=satyrn.fdl.mysteriaActive]){
        effect clear @s minecraft:fire_resistance
        tag @s remove satyrn.fdl.mysteriaActive
    }
}

function on_load {
    schedule function foxcraft_dungeon_loot:items/totem_of_mysteria/clock_2s 15t
    data merge storage foxcraft_dungeon_loot:totem_of_mysteria {Fire:80}
}
