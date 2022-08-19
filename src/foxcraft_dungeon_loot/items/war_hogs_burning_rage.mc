import ../../macros.mcm

# Forces an entity to drop their main-hand item.
function disarm_entity {
    macro random 1 10
    execute if score #math.result <%config.internalScoreboard%> matches 10 run {
        playsound minecraft:entity.player.attack.crit player @a
        particle minecraft:crit ~ ~ ~ 0.5 0.85 0.5 0.01 20 force

        summon minecraft:item ~ ~ ~ {Tags:[satyrn.fdl.droppedItem],Item:{id:"minecraft:stick",Count:1b},PickupDelay:30}
        data modify entity @e[tag=satyrn.fdl.droppedItem,limit=1,sort=nearest] Item set from entity @s HandItems[0]
        data modify entity @e[tag=satyrn.fdl.droppedItem,limit=1,sort=nearest] Thrower set from entity @s UUID

        playsound minecraft:entity.item.pickup player @a ~ ~1.5 ~ 1.0 0.75

        item modify entity @s weapon.mainhand foxcraft_dungeon_loot:remove
    }
}

# Forces a player to drop their main-hand item.
function disarm_player {
    macro random 1 20
    execute if score #math.result <%config.internalScoreboard%> matches 20 run {
        playsound minecraft:entity.player.attack.crit player @a
        particle minecraft:crit ~ ~ ~ 0.5 0.85 0.5 0.01 20 force

        summon minecraft:item ~ ~ ~ {Tags:[satyrn.fdl.droppedItem],Item:{id:"minecraft:stick",Count:1b},PickupDelay:30}
        data modify entity @e[tag=satyrn.fdl.droppedItem,limit=1,sort=nearest] Item set from entity @s SelectedItem
        data modify entity @e[tag=satyrn.fdl.droppedItem,limit=1,sort=nearest] Thrower set from entity @s UUID
        data modify entity @e[tag=satyrn.fdl.droppedItem,limit=1,sort=nearest] Owner set from entity @s UUID

        playsound minecraft:entity.item.pickup player @a ~ ~1.5 ~ 1.0 0.75

        item modify entity @s weapon.mainhand foxcraft_dungeon_loot:remove
    }
}

# Reward function for the advancement
function on_hit {

    execute if entity @s[advancements={foxcraft_dungeon_loot:items/war_hogs_burning_rage/on_hit={player_hurt_entity=true}}] run function foxcraft_dungeon_loot:items/war_hogs_burning_rage/raycast/start
    execute if entity @s[advancements={foxcraft_dungeon_loot:items/war_hogs_burning_rage/on_hit={entity_hurt_player=true}},predicate=!foxcraft_dungeon_loot:items/is_mainhand_empty,gamemode=!creative] run function foxcraft_dungeon_loot:items/war_hogs_burning_rage/disarm_player

    advancement revoke @s only foxcraft_dungeon_loot:items/war_hogs_burning_rage/on_hit
}

# Occurs when the raycast succeeds.
function on_raycast_success {
    execute if entity @s[type=!minecraft:player,predicate=!foxcraft_dungeon_loot:items/is_mainhand_empty] run function foxcraft_dungeon_loot:items/war_hogs_burning_rage/disarm_entity

    execute if entity @s[gamemode=!creative,predicate=!foxcraft_dungeon_loot:items/is_mainhand_empty] run function foxcraft_dungeon_loot:items/war_hogs_burning_rage/disarm_player
}

# Subclass for raycasting.
dir raycast {
    # Starts a raycast from the sender's eyes.
    function start {
        tag @s add satyrn.fdl.raycastSource

        scoreboard players reset #step <%config.internalScoreboard%>

        execute at @s anchored eyes rotated ~ ~ run function foxcraft_dungeon_loot:items/war_hogs_burning_rage/raycast/step

        tag @s remove satyrn.fdl.raycastSource
    }

    # Steps the raycast forwards and checks for intersecting entities.
    function step {
        execute (as @e[tag=!satyrn.fdl.raycastSource,dx=0,type=!#foxcraft_dungeon_loot:non_living] positioned ~-0.99 ~-0.99 ~-0.99 if entity @s[dx=0] positioned ~0.99 ~0.99 ~0.99) {
            !IF(config.dev) {
                tellraw @a [{"text":"Raycast successful after ","color":"gray"},{"score":{"name":"#step","objective":"<%config.internalScoreboard%>"}},{"text":" / 30 steps.","color":"gray"}]
            }
            function foxcraft_dungeon_loot:items/war_hogs_burning_rage/on_raycast_success
        } else {
            !IF(config.dev) {
                particle minecraft:smoke ~ ~ ~
            }
            scoreboard players add #step <%config.internalScoreboard%> 1

            execute positioned ^ ^ ^0.1 rotated ~ ~ if score #step <%config.internalScoreboard%> matches ..30 if block ~ ~ ~ #foxcraft_dungeon_loot:raycast_pass run function foxcraft_dungeon_loot:items/war_hogs_burning_rage/raycast/step
        }
    }
}
