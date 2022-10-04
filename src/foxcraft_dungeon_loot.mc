function load {
    # Set up scoreboards
    scoreboard objectives add <%config.internalScoreboard%> dummy "Options"
    execute unless score #version <%config.internalScoreboard%> matches <%config.scoreboardsVersion%> run function foxcraft_dungeon_loot:update_scoreboards

    scoreboard objectives add satyrn.fdl.used.warpedFungusOnAStick minecraft.used:warped_fungus_on_a_stick "Player used warped fungus"
    scoreboard objectives add satyrn.fdl.used.snowball minecraft.used:snowball "Player used snowball"
    scoreboard objectives add satyrn.fdl.loot.variant trigger "Loot Variant"
    scoreboard objectives add satyrn.fdl.souls dummy "Souls Harvested"

    scoreboard players reset * satyrn.fdl.loot.variant

    # Reset item utility advancements for online players
    advancement revoke @a from foxcraft_dungeon_loot:items

    # Load functions are executed with no sender in context.
    function #foxcraft_dungeon_loot:on_load

    tellraw @a ["",{"text":"Foxcraft Dungeon Loot","color":"gold"},{"text":" v<%config.version%> ","color":"gray"},{"text":"loaded successfully!"}]
}

function tick {
    !IF(config.dev) {
        # For dev, reenable the loot variant trigger
        scoreboard players enable @a satyrn.fdl.loot.variant
    }

    function #foxcraft_dungeon_loot:on_tick

    # Reset statistics scoreboards
    execute as @a[scores={satyrn.fdl.used.warpedFungusOnAStick=1..}] run scoreboard players set @s satyrn.fdl.used.warpedFungusOnAStick 0
    execute as @a[scores={satyrn.fdl.used.snowball=1..}] run scoreboard players set @s satyrn.fdl.used.snowball 0
}

function uninstall {
    tellraw @a {"text":"Uninstalling Foxcraft Dungeon Loot v<%config.version%>..."}

    scoreboard objectives remove satyrn.fdl.used.warpedFungusOnAStick
    scoreboard objectives remove satyrn.fdl.used.snowball
    scoreboard objectives remove satyrn.fdl.loot.variant
    scoreboard objectives remove satyrn.fdl.souls


    function #foxcraft_dungeon_loot:on_uninstall

    execute store success score #uninstall <%config.internalScoreboard%> run datapack disable "file/<%config.baseArchiveName%>-<%config.version%>.zip"

    execute unless score #uninstall <%config.internalScoreboard%> matches 1 run tellraw @s ["", {"text":"Default file name has been changed!","color":"red"},{"text":"\n"},{"text":"To complete the uninstall process please use the following command:"},{"text":"\n"},{"text":"/datapack disable \"file/<pack_name>\"","color":"aqua"}]
    execute if score #uninstall <%config.internalScoreboard%> matches 1 run tellraw @s {"text":"Foxcraft Dungeon Loot successfully uninstalled.","color":"green"}

    scoreboard players reset #uninstall <%config.internalScoreboard%>

    scoreboard objectives remove <%config.internalScoreboard%>
}

function update_scoreboards {
    # Remove scoreboards which were updated during testing
    scoreboard objectives remove satyrn.fdl.loot.variant
    scoreboard objectives remove satyrn.fdl.custom.fallFlying
    scoreboard objectives remove satyrn.fdl.custom.onGround
    scoreboard objectives remove satyrn.fdl.itemId.mainHand
    scoreboard objectives remove satyrn.fdl.itemId.offHand
    scoreboard objectives remove satyrn.fdl.itemId.boots
    scoreboard objectives remove satyrn.fdl.itemId.leggings
    scoreboard objectives remove satyrn.fdl.itemId.chestplate
    scoreboard objectives remove satyrn.fdl.itemId.helmet
    scoreboard objectives remove satyrn.fdl.custom.sneakTime
    scoreboard objectives remove satyrn.fdl.custom.fallOneCm
    scoreboard objectives remove satyrn.fdl.math.input1
    scoreboard objectives remove satyrn.fdl.math.input2
    scoreboard objectives remove satyrn.fdl.const

    scoreboard players set #version <%config.internalScoreboard%> <%config.scoreboardsVersion%>
}
