import ../../macros.mcm

function give {
    macro give_as_loot epic/estudinaes_sorrow
}

dir give {
    function netherite {
        macro give_as_variant_loot epic/estudinaes_sorrow 1
    }
}

function on_hit {
    execute (if entity @s[advancements={foxcraft_dungeon_loot:items/estudinaes_sorrow_on_hit={player_killed_entity=false}}]) {
        effect give @s minecraft:nausea 10 0 true
    } else execute (if entity @s[advancements={foxcraft_dungeon_loot:items/estudinaes_sorrow_on_hit={player_killed_entity=true}}]) {
        effect give @s minecraft:nausea 20 1 false
    }

    advancement revoke @s only foxcraft_dungeon_loot:items/estudinaes_sorrow_on_hit
}
