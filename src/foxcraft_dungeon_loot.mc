function load {
    # Set up scoreboards
    scoreboard objectives add <%config.internalScoreboard%> dummy
    execute unless score version <%config.internalScoreboard%> matches <%config.scoreboardsVersion%> run {
        # Remove scoreboards which were updated during testing
        scoreboard objectives remove satyrn.fdl.loot.variant
        scoreboard objectives remove satyrn.fdl.custom.fallFlying
        scoreboard objectives remove satyrn.fdl.custom.onGround

        scoreboard players set version <%config.internalScoreboard%> <%config.scoreboardsVersion%>
    }

    scoreboard objectives add satyrn.fdl.custom.sneakTime minecraft.custom:minecraft.sneak_time
    scoreboard objectives add satyrn.fdl.used.warpedFungusOnAStick minecraft.used:warped_fungus_on_a_stick
    scoreboard objectives add satyrn.fdl.used.snowball minecraft.used:snowball
    scoreboard objectives add satyrn.fdl.custom.fallOneCm minecraft.custom:minecraft.fall_one_cm
    scoreboard objectives add satyrn.fdl.itemId.mainHand dummy
    scoreboard objectives add satyrn.fdl.itemId.offHand dummy
    scoreboard objectives add satyrn.fdl.itemId.boots dummy
    scoreboard objectives add satyrn.fdl.itemId.leggings dummy
    scoreboard objectives add satyrn.fdl.itemId.chestplate dummy
    scoreboard objectives add satyrn.fdl.itemId.helmet dummy
    scoreboard objectives add satyrn.fdl.loot.variant trigger "Loot Variant"
    scoreboard players reset * satyrn.fdl.loot.variant

    # Reset item utility advancements for online players
    advancement revoke @a from foxcraft_dungeon_loot:items

    scoreboard objectives add satyrn.fdl.const dummy
    scoreboard players set 5 satyrn.fdl.const 5

    # Load functions are executed with no sender in context.
    function #foxcraft_dungeon_loot:on_load

    tellraw @a ["",{"text":"Foxcraft Dungeon Loot","color":"gold"},{"text":" v<%config.version%> ","color":"gray"},{"text":"loaded successfully!"}]
}

function tick {
    # Select item IDs for each slot
    execute as @a run {
        !IF(config.dev) {
            scoreboard players enable @s satyrn.fdl.loot.variant
        }
        execute store result score @s satyrn.fdl.itemId.mainHand run data get entity @s SelectedItem.tag.DungeonLootId
        execute store result score @s satyrn.fdl.itemId.offHand run data get entity @s Inventory[{Slot:-106b}].tag.DungeonLootId
        execute store result score @s satyrn.fdl.itemId.boots run data get entity @s Inventory[{Slot:100b}].tag.DungeonLootId
        execute store result score @s satyrn.fdl.itemId.leggings run data get entity @s Inventory[{Slot:101b}].tag.DungeonLootId
        execute store result score @s satyrn.fdl.itemId.chestplate run data get entity @s Inventory[{Slot:102b}].tag.DungeonLootId
        execute store result score @s satyrn.fdl.itemId.helmet run data get entity @s Inventory[{Slot:103b}].tag.DungeonLootId
        execute store result score @s satyrn.fdl.custom.fallOneCm run data get entity @s FallDistance 100
    }

    # Tick functions are executed with a player in context at the player's location.
    execute as @a at @s run function #foxcraft_dungeon_loot:on_tick

    # Reset statistics scoreboards
    execute as @a unless score @s satyrn.fdl.custom.sneakTime matches 0 run scoreboard players set @s satyrn.fdl.custom.sneakTime 0
    execute as @a unless score @s satyrn.fdl.used.warpedFungusOnAStick matches 0 run scoreboard players set @s satyrn.fdl.used.warpedFungusOnAStick 0
    execute as @a unless score @s satyrn.fdl.used.snowball matches 0 run scoreboard players set @s satyrn.fdl.used.snowball 0
}

function uninstall {
    tellraw @a {"text":"Uninstalling Foxcraft Dungeon Loot v<%config.version%>..."}

    execute store success score #uninstall <%config.internalScoreboard%> run datapack disable "file/<%config.baseArchiveName%>-<%config.version%>.zip"

    execute(unless score #uninstall <%config.internalScoreboard%> matches 1) {
        tellraw @a ["", {"text":"Default file name has been changed!","color":"red"},{"text":"\n"},{"text":"To complete the uninstall process please use the following command:"},{"text":"\n"},{"text":"/datapack disable \"file/<pack_name>\"","color":"aqua"}]
    } else {
        tellraw @s {"text":"Foxcraft Dungeon Loot successfully uninstalled.","color":"green"}
    }

    scoreboard players reset #uninstall <%config.internalScoreboard%>
}
