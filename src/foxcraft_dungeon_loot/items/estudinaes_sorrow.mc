import ../../macros.mcm

function give {
    macro give_as_loot epic/estudinaes_sorrow
}

dir give {
    function netherite {
        macro give_as_variant_loot epic/estudinaes_sorrow 1
    }
}

function on_player_hurt_entity {
    effect give @s minecraft:nausea 5 0 true

    advancement revoke @s only foxcraft_dungeon_loot:items/estudinaes_sorrow/player_hurt_entity
}


function on_player_killed_entity {
    effect give @s minecraft:nausea 15 1 false

    advancement revoke @s only foxcraft_dungeon_loot:items/estudinaes_sorrow/player_killed_entity
}
