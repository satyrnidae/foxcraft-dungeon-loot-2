import ../../macros.mcm

# Occurs when a player hits a valid entity with the Tithe to Uthiir.
function on_hit {
    # Occurs when the player hurts an arthropod.
    execute if entity @s[advancements={foxcraft_dungeon_loot:items/tithe_to_uthiir/on_hit={player_killed_arthropod=false}}] run function foxcraft_dungeon_loot:items/tithe_to_uthiir/on_hit_arthropod

    # Occurs when the player kills an arthropod.
    execute if entity @s[advancements={foxcraft_dungeon_loot:items/tithe_to_uthiir/on_hit={player_killed_arthropod=true}}] run function foxcraft_dungeon_loot:items/tithe_to_uthiir/on_killed_arthropod

    advancement revoke @s only foxcraft_dungeon_loot:items/tithe_to_uthiir/on_hit
}

function on_hit_arthropod {
    macro random 1 20

    execute if score #math.result <%config.internalScoreboard%> matches 20 run {
        playsound minecraft:entity.player.attack.crit player @a
        execute positioned ^ ^1 ^2 at @e[type=#foxcraft_dungeon_loot:arthropods,sort=nearest,limit=1] anchored eyes run particle minecraft:crit ^ ^1 ^1 0.5 0.5 0.5 0.01 20 force

        # Summon a short-lived area effect cloud to show the effect radius
        summon minecraft:area_effect_cloud ~ ~0.1 ~ {Duration:2,Color:222308903,Radius:10}

        execute as @e[type=#foxcraft_dungeon_loot:hostile,distance=..10] run effect give @s minecraft:wither 5 2
    }
}

function on_killed_arthropod {
    effect give @s minecraft:speed 10 1
    effect give @s minecraft:resistance 5 2
    effect give @s minecraft:regeneration 3
}

# Handles the spider eye eaten event.
function on_spider_eye_eaten {
    effect clear @s minecraft:poison
}
