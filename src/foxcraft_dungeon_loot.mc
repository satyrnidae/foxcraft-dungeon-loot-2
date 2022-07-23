function load {
    # Set up scoreboards
    scoreboard objectives add <%config.internalScoreboard%> dummy
    scoreboard objectives add satyrn.fdl.custom.sneakTime minecraft.custom:minecraft.sneak_time
    scoreboard objectives add satyrn.fdl.used.warpedFungusOnAStick minecraft.used:warped_fungus_on_a_stick
    scoreboard objectives add satyrn.fdl.itemId.mainHand dummy
    scoreboard objectives add satyrn.fdl.itemId.offHand dummy
    scoreboard objectives add satyrn.fdl.itemId.boots dummy
    scoreboard objectives add satyrn.fdl.itemId.leggings dummy
    scoreboard objectives add satyrn.fdl.itemId.chestplate dummy
    scoreboard objectives add satyrn.fdl.itemId.helmet dummy

    function #foxcraft_dungeon_loot:items/on_load
}

function tick {
    # Select item IDs for each slot
    execute as @a store result score @s satyrn.fdl.itemId.mainHand run data get entity @s SelectedItem.tag.DungeonLootId
    execute as @a store result score @s satyrn.fdl.itemId.offHand run data get entity @s Inventory[{Slot:-106b}].tag.DungeonLootId
    execute as @a store result score @s satyrn.fdl.itemId.boots run data get entity @s Inventory[{Slot:100b}].tag.DungeonLootId
    execute as @a store result score @s satyrn.fdl.itemId.leggings run data get entity @s Inventory[{Slot:101b}].tag.DungeonLootId
    execute as @a store result score @s satyrn.fdl.itemId.chestplate run data get entity @s Inventory[{Slot:102b}].tag.DungeonLootId
    execute as @a store result score @s satyrn.fdl.itemId.helmet run data get entity @s Inventory[{Slot:103b}].tag.DungeonLootId

    # TODO: Call item update functions
    execute as @a run function #foxcraft_dungeon_loot:items/on_tick

    # Reset statistics scoreboards
    execute as @a unless score @s satyrn.fdl.custom.sneakTime matches 0 run scoreboard players set @s satyrn.fdl.custom.sneakTime 0
    execute as @a unless score @s satyrn.fdl.used.warpedFungusOnAStick matches 0 run scoreboard players set @s satyrn.fdl.used.warpedFungusOnAStick 0
}
