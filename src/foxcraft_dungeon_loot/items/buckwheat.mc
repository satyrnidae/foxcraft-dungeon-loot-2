# Runs every 3 seconds.
function clock_3s {
    schedule function foxcraft_dungeon_loot:items/buckwheat/clock_3s 3s

    execute as @a[predicate=foxcraft_dungeon_loot:items/buckwheat/in_main_hand] at @s run {
        # Up to 10 livestock mobs within 5 blocks with an age of 0 (breeding cooldown is over)
        execute as @e[type=#foxcraft_dungeon_loot:livestock, distance=..5, predicate=foxcraft_dungeon_loot:items/buckwheat/has_age_0, limit=10, sort=nearest] at @s run {
            # Set in love for 10 seconds.
            data modify entity @s InLove set from storage foxcraft_dungeon_loot:items Buckwheat.InLove
            particle minecraft:heart ~ ~1 ~ 0.2 0.2 0.2 0 10
        }
    }
}

# Runs when the datapack is loaded.
function on_load {
    schedule function foxcraft_dungeon_loot:items/buckwheat/clock_3s 1t
    data merge storage foxcraft_dungeon_loot:items {Buckwheat:{InLove:600}}
}

# Runs when the datapack is uninstalled via the uninstall command.
function on_uninstall {
    data remove storage foxcraft_dungeon_loot:items Buckwheat.InLove
}
