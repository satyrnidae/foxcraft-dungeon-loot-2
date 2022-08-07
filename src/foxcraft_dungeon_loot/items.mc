# Occurs once per tick.
function on_tick {
    # Updates players who are attempting to use a warped fungus, as long as the offhand item doesn't take activation precedence.
    execute as @a[scores={satyrn.fdl.used.warpedFungusOnAStick=1..},predicate=!foxcraft_dungeon_loot:items/offhand_prevents_use] at @s run function #foxcraft_dungeon_loot:on_warped_fungus_used
    # Updates players who are attempting to use a snowball.
    execute as @a[scores={satyrn.fdl.used.snowball=1..}] at @s run function #foxcraft_dungeon_loot:on_snowball_used
}
