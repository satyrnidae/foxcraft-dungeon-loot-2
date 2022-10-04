function set_sell_from_item {
    data modify storage foxcraft_dungeon_loot:trades Current.sell set from entity @s Item
    kill @s
}

function set_buy_from_item {
    data modify storage foxcraft_dungeon_loot:trades Current.buy set from entity @s Item
    kill @s
}

function set_buyb_from_item {
    data modify storage foxcraft_dungeon_loot:trades Current.buyB set from entity @s Item
    kill @s
}

# Creates a new recipe, initializing the current trade to a constant value.
function new {
    data modify storage foxcraft_dungeon_loot:trades Current set value {rewardExp:0b,maxUses:3,buy:{id:"minecraft:emerald",Count:1b},buyB:{id:"minecraft:air",Count:1b},sell:{id:"minecraft:emerald",Count:1b}}
}

# Appends the current recipe to the end of the trade index, and initializes a new current trade.
function push {
    data modify storage foxcraft_dungeon_loot:trades Index append from storage foxcraft_dungeon_loot:trades Current
}
