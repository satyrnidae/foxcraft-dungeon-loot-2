import ../../macros.mcm

function clock_2s {
    schedule function foxcraft_dungeon_loot:items/wing_of_ouet_zala/clock_2s 2s
    execute as @a if score @s satyrn.fdl.itemId.offHand matches 61 run effect give @s minecraft:nausea 10 0 true
}

function clock_60s {
    schedule function foxcraft_dungeon_loot:items/wing_of_ouet_zala/clock_60s 60s
    execute as @r if entity @s[nbt={Inventory:[{tag:{DungeonLootId:61}}]}] run effect give @s minecraft:levitation 5 0 true
}

function give {
    macro give_as_loot mythic/wing_of_ouet_zala
}

function on_load {
    schedule function foxcraft_dungeon_loot:items/wing_of_ouet_zala/clock_2s 18t
    schedule function foxcraft_dungeon_loot:items/wing_of_ouet_zala/clock_60s 19t
}
