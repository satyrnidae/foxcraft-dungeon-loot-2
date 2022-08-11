# TAGS USED
# satyrn.fdl.events.processSnowballUsed - Refers to a player who is holding a snowball item.

# TODO: Tune this so it feels nice
# Clock that executes once per 5 ticks. Updates the fallOnCm scoreboard based on player fall distance.
function clock_3t {
    schedule function foxcraft_dungeon_loot:events/clock_3t 3t
    execute as @a store result score @s satyrn.fdl.events.fallOneCm run data get entity @s FallDistance 100

    # Calls the on_fall event when a player is falling for a great distance.
    execute as @a[scores={satyrn.fdl.events.fallOneCm=300..},predicate=!foxcraft_dungeon_loot:is_flying] at @s run function #foxcraft_dungeon_loot:on_fall
}

# Runs when the datapack is loaded.
function on_load {
    scoreboard objectives add satyrn.fdl.events.fallOneCm dummy "Fall distance (cm)"
    scoreboard objectives add satyrn.fdl.events.ateSpiderEye minecraft.used:minecraft.spider_eye
    function foxcraft_dungeon_loot:events/clock_3t
}

# Occurs once per tick.
function on_tick {
    # Updates players who are attempting to use a warped fungus, as long as the offhand item doesn't take activation precedence.
    execute as @a[scores={satyrn.fdl.used.warpedFungusOnAStick=1..},predicate=foxcraft_dungeon_loot:events/process_mainhand_warped_fungus,predicate=!foxcraft_dungeon_loot:events/offhand_prevents_stick_use] at @s run function #foxcraft_dungeon_loot:on_warped_fungus_used

    # Updates players who are attempting to use a warped fungus in their offhand, provided they don't have a warped fungus in their mainhand.
    # TODO: This requires refactoring all the warped fungus items quite a bit, so its disabled for now.
    # execute as @a[scores={satyrn.fdl.used.warpedFungusOnAStick=1..},predicate=foxcraft_dungeon_loot:events/process_offhand_warped_fungus,predicate=!foxcraft_dungeon_loot:events/has_mainhand_warped_fungus] at @s run function #foxcraft_dungeon_loot:on_warped_fungus_used

    # Updates players who are attempting to use a snowball.
    execute as @a[scores={satyrn.fdl.used.snowball=1..},tag=satyrn.fdl.events.processSnowballUsed] at @s run function #foxcraft_dungeon_loot:on_snowball_used

    # Remove snowball tag from players not holding an event-enabled snowball.
    execute as @a[tag=satyrn.fdl.events.processSnowballUsed,predicate=!foxcraft_dungeon_loot:events/process_snowball] run tag @s remove satyrn.fdl.events.processSnowballUsed

    # Add snowball tag to players holding an event-enabled snowball.
    execute as @a[predicate=foxcraft_dungeon_loot:events/process_snowball] run tag @s add satyrn.fdl.events.processSnowballUsed

    # Updates players who ate a spider eye while holding an item that intercepts that event.
    execute as @a[scores={satyrn.fdl.events.ateSpiderEye=1..},predicate=foxcraft_dungeon_loot:events/process_spider_eye] at @s run function #foxcraft_dungeon_loot:on_spider_eye_eaten

    scoreboard players reset @a satyrn.fdl.events.ateSpiderEye
}

# Called when the datapack is uninstalled.
function on_uninstall {
    scoreboard objectives remove satyrn.fdl.events.fallOneCm
    scoreboard objectives remove satyrn.fdl.events.ateSpiderEye
}
