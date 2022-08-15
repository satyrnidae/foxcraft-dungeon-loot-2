import ../../macros.mcm

# Has a chance to apply wither to the entity.
function apply_wither {
    macro random 1 10
    execute if score #math.result <%config.internalScoreboard%> matches 10 run {
        playsound minecraft:entity.player.attack.crit player @a
        particle minecraft:crit ~ ~ ~ 0.5 0.85 0.5 0.01 20 force

        effect give @s minecraft:wither 5 1
    }
}

# Reward function for the foxcraft_dungeon_loot:items/estudinaes_sorrow_on_hit advancement
function on_hit {
    # Execute for players who only damaged an entity
    execute if entity @s[advancements={foxcraft_dungeon_loot:items/estudinaes_sorrow/on_hit={player_killed_entity=false}}] run {
        effect give @s minecraft:nausea 10
        function foxcraft_dungeon_loot:items/estudinaes_sorrow/raycast/start
    }

    # Execute for players who killed an entity
    execute if entity @s[advancements={foxcraft_dungeon_loot:items/estudinaes_sorrow/on_hit={player_killed_entity=true}}] run {
        effect give @s minecraft:nausea 20
        effect give @s minecraft:hunger 10
    }

    advancement revoke @s only foxcraft_dungeon_loot:items/estudinaes_sorrow/on_hit
}

# Occurs when the raycast hits an entity.
function on_raycast_success {
    execute if entity @s[type=!minecraft:player] run function foxcraft_dungeon_loot:items/estudinaes_sorrow/apply_wither

    execute if entity @s[gamemode=!creative] run function foxcraft_dungeon_loot:items/estudinaes_sorrow/apply_wither
}

# Sub-class containing functions for raycasting.
dir raycast {
    # Starts a raycast from the sender's eyes.
    function start {
        tag @s add satyrn.fdl.raycastSource

        scoreboard players reset #step <%config.internalScoreboard%>

        execute at @s anchored eyes run function foxcraft_dungeon_loot:items/estudinaes_sorrow/raycast/step

        tag @s remove satyrn.fdl.raycastSource
    }

    function step {
        execute (as @e[tag=!satyrn.fdl.raycastSource,dx=0,type=!#foxcraft_dungeon_loot:non_living] positioned ~-0.99 ~-0.99 ~-0.99 if entity @s[dx=0] positioned ~0.99 ~0.99 ~0.99) {
            !IF(config.dev) {
                tellraw @a [{"text":"Raycast successful after ","color":"gray"},{"score":{"name":"#step","objective":"<%config.internalScoreboard%>"}},{"text":" / 50 steps.","color":"gray"}]
            }
            function foxcraft_dungeon_loot:items/estudinaes_sorrow/on_raycast_success
        } else {
            !IF(config.dev) {
                particle minecraft:smoke ~ ~ ~
            }
            scoreboard players add #step <%config.internalScoreboard%> 1

            execute positioned ^ ^ ^0.1 rotated ~ ~ if score #step <%config.internalScoreboard%> matches ..50 if block ~ ~ ~ #foxcraft_dungeon_loot:raycast_pass run function foxcraft_dungeon_loot:items/estudinaes_sorrow/raycast/step
        }
    }
}
