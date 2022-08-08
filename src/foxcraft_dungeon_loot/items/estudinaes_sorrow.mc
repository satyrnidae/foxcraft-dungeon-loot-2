# Reward function for the foxcraft_dungeon_loot:items/estudinaes_sorrow_on_hit advancement
function on_hit {
    # Execute for players who only damaged an entity
    execute if entity @s[advancements={foxcraft_dungeon_loot:items/estudinaes_sorrow_on_hit={player_killed_entity=false}}] run effect give @s minecraft:nausea 10

    # Execute for players who killed an entity
    execute if entity @s[advancements={foxcraft_dungeon_loot:items/estudinaes_sorrow_on_hit={player_killed_entity=true}}] run effect give @s minecraft:nausea 20 1

    advancement revoke @s only foxcraft_dungeon_loot:items/estudinaes_sorrow/on_hit
}
