import ../../macros.mcm

function clock_2s {
    schedule function foxcraft_dungeon_loot:items/stompies/clock_2s 2s
    execute as @a if score @s satyrn.fdl.itemId.boots matches 52 run effect give @s minecraft:jump_boost 3 1 true
}

function give {
    macro give_as_loot mythic/stompies
}

dir give {
    function chainmail {
        macro give_as_variant_loot mythic/stompies 1
    }

    function iron {
        macro give_as_variant_loot mythic/stompies 2
    }

    function diamond {
        macro give_as_variant_loot mythic/stompies 3
    }

    function netherite {
        macro give_as_variant_loot mythic/stompies 4
    }
}

function on_load {
    schedule function foxcraft_dungeon_loot:items/stompies/clock_2s 10t
}
