import ../../macros.mcm

function clock_3s {
    schedule function foxcraft_dungeon_loot:items/love_wheat/clock_3s 3s

    execute as @a at @s if score @s satyrn.fdl.itemId.mainHand matches 76 run {
        # Up to 10 livestock mobs within 5 blocks with an age of 0 (breeding cooldown is over)
        execute if entity @e[type=#foxcraft_dungeon_loot:livestock, distance=..5, predicate=foxcraft_dungeon_loot:items/love_wheat/has_age_0, limit=10, sort=nearest] as @e[type=#foxcraft_dungeon_loot:livestock, distance=..5, predicate=foxcraft_dungeon_loot:items/love_wheat/has_age_0, limit=10, sort=nearest] at @s run {
            # Set in love for 10 seconds.
            data merge entity @s {InLove:600}
            particle minecraft:heart ~ ~1 ~ 0.2 0.2 0.2 0 10
        }
    }
}

function give {
    macro give_as_loot epic/love_wheat
}

function on_load {
    schedule function foxcraft_dungeon_loot:items/love_wheat/clock_3s 9t
}
