import ../macros.mcm
import trades.mcm

function on_load {
    # Init the trade index.
    function foxcraft_dungeon_loot:trades/index/on_load
    function foxcraft_dungeon_loot:trades/wandering_trader/on_load
}

function on_uninstall {
    function foxcraft_dungeon_loot:trades/index/on_uninstall
    function foxcraft_dungeon_loot:trades/wandering_trader/on_uninstall
}

# Populating loot tables occurs over multiple ticks
# This function is scheduled, and waits for the trade index to be populated until it begins executing.
function scheduled_tick {
    schedule function foxcraft_dungeon_loot:trades/scheduled_tick 1t

    execute as @e[type=minecraft:wandering_trader,tag=!satyrn.fdl.trades.hasTrades] at @s run function foxcraft_dungeon_loot:trades/wandering_trader/on_tick
}
