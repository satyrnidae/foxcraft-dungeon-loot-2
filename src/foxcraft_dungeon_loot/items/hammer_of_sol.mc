import ../../macros.mcm

function on_tick {
    execute if score @s[tag=satyrn.fdl.holdingTitanHammer] satyrn.fdl.used.snowball matches 1.. run {
        stopsound @s * entity.snowball.throw
        playsound foxcraft_dungeon_loot:item.hammer_of_sol.throw player @a ~ ~ ~ 2.0
        playsound foxcraft_dungeon_loot:item.hammer_of_sol.throw2 player @a ~ ~ ~ 2.0

        # Add tag to thrown hammer so we can track it.
        data merge entity @e[type=snowball, limit=1, sort=nearest] {Tags:[satyrn.fdl.titanHammer]}

        # Summon an armor stand (tracker) to track when the hammer breaks.
        execute at @e[type=snowball, limit=1, sort=nearest] run {
            summon minecraft:armor_stand ~ ~ ~ {Invisible:<%config.dev?0:1%>b,Invulnerable:1b,Small:1b,Silent:1b,Tags:[satyrn.fdl.titanHammerTracker]}
            data modify entity @e[tag=satyrn.fdl.titanHammerTracker, limit=1, sort=nearest] Motion set from entity @e[type=snowball, limit=1, sort=nearest] Motion
        }
    }

    # Add tag to player to know they have the hammer in their main hand (Since they are throwing it, if they only have 1, the next they wouldn't have it in their hand anymore)
    execute (if score @s satyrn.fdl.itemId.mainHand matches 75) {
        tag @s add satyrn.fdl.holdingTitanHammer
    } else execute (if score @s[predicate=!foxcraft_dungeon_loot:items/is_mainhand_snowball] satyrn.fdl.itemId.offHand matches 75) {
        tag @s add satyrn.fdl.holdingTitanHammer
    # Remove the tag that says the player has a hammer if they no longer have one in their main hand.
    } else {
        tag @s remove satyrn.fdl.holdingTitanHammer
    }

    # Teleport tracker to the hammer and do all the tracking that needs to be tracked
    execute as @e[tag=satyrn.fdl.titanHammerTracker] at @s run {
        execute (if entity @e[tag=satyrn.fdl.titanHammer, distance=..1, limit=1, sort=nearest] at @e[tag=satyrn.fdl.titanHammer, limit=1, sort=nearest]) {
            kill @e[type=#foxcraft_dungeon_loot:markers,tag=satyrn.fdl.titanHammer.raycastTarget,limit=1,sort=nearest,distance=..2.8]

            # Set motion instead of tp
            data modify entity @s Motion set from entity @e[tag=satyrn.fdl.titanHammer, distance=..1, limit=1, sort=nearest] Motion
            particle minecraft:small_flame ~ ~ ~ 0.1 0.1 0.1 0 1
            particle minecraft:smoke ~ ~ ~ 0.1 0.1 0.1 0 1

            summon minecraft:area_effect_cloud ~ ~ ~ {Duration:100,Tags:[satyrn.fdl.titanHammer.raycastTarget]}

        # If tracker cannot find a hammer, it hit something and was destroyed.
        } else {
            # Search for entity to damage
            execute (anchored feet as @e[type=!#foxcraft_dungeon_loot:non_living, dx=0, limit=1, sort=nearest] at @s) {
                function foxcraft_dungeon_loot:items/hammer_of_sol/hit_target
            } else {
                # Perform a raycast to find the entity
                execute anchored feet facing entity @e[type=#foxcraft_dungeon_loot:markers,tag=satyrn.fdl.titanHammer.raycastTarget,limit=1,sort=nearest] feet run function foxcraft_dungeon_loot:items/hammer_of_sol/start_raycast_forward

                execute unless entity @s[tag=satyrn.fdl.titanHammer.raycastSuccess] run {
                    execute anchored feet facing entity @e[type=#foxcraft_dungeon_loot:markers,tag=satyrn.fdl.titanHammer.raycastTarget,limit=1,sort=nearest] feet run function foxcraft_dungeon_loot:items/hammer_of_sol/start_raycast_backward
                    execute unless entity @s[tag=satyrn.fdl.titanHammer.raycastSuccess] run {
                        playsound foxcraft_dungeon_loot:item.hammer_of_sol.miss player @a ~ ~ ~ 2.0
                    }
                }
            }

            # Spawn new hammer that will disappear after 5 seconds (100 ticks)
            loot spawn ^ ^ ^ loot foxcraft_dungeon_loot:items/mythic/hammer_of_sol
            data merge entity @e[type=item, limit=1, sort=nearest] {Age: 5900, Tags:[satyrn.fdl.titanHammerSpawnedItem]}

            # Destroy tracker, play hit sound, and hit particle effects
            particle minecraft:flame ~ ~ ~ 0.5 0.2 0.5 0 20
            particle minecraft:smoke ~ ~ ~ 0.5 0.1 0.5 0 10
            !IF(config.dev) {
                data modify entity @s Motion set value [0f,0f,0f]
                data modify entity @s NoGravity set value 1b
                tag @s remove satyrn.fdl.titanHammerTracker
                tag @e[type=#foxcraft_dungeon_loot:markers,tag=satyrn.fdl.titanHammer.raycastTarget,limit=1,sort=nearest] remove satyrn.fdl.titanHammer.raycastTarget
            }
            !IF(!config.dev) {
                kill @s
                kill @e[type=#foxcraft_dungeon_loot:markers,tag=satyrn.fdl.titanHammer.raycastTarget,limit=1,sort=nearest]
            }

        }
    }

    # Track newly spawned hammers after they were destroyed.
    # If one is about to disappear, play sound, spawn particle effects, and delete the tag so it only happens once.
    execute as @e[tag=satyrn.fdl.titanHammerSpawnedItem,predicate=foxcraft_dungeon_loot:items/hammer_of_sol/should_expire] at @s run {
        particle minecraft:explosion ~ ~ ~ 0.2 0.2 0.2 0 10
        particle minecraft:flame ~ ~ ~ 0.3 0.2 0.3 0 60
        particle minecraft:smoke ~ ~ ~ 0.3 0.2 0.3 0 30
        playsound foxcraft_dungeon_loot:item.hammer_of_sol.pop player @a ~ ~ ~ 2.0
        tag @s remove satyrn.fdl.titanHammerSpawnedItem
    }
}

function hit_target {
    playsound foxcraft_dungeon_loot:item.hammer_of_sol.hit player @a ~ ~ ~ 2.0
    # Set on fire for 5 seconds (100 ticks)
    data merge entity @s {Fire:100}
    # Deal damage via potion effects for both living and undead targets
    execute (if entity @s[type=#foxcraft_dungeon_loot:undead] at @s) {
        effect give @s minecraft:instant_health 10
    } else {
        effect give @s minecraft:instant_damage 10
    }
}

function start_raycast_forward {
    tag @s add satyrn.fdl.titanHammer.raycastSource

    scoreboard players reset #step <%config.internalScoreboard%>

    execute positioned ^ ^ ^ run function foxcraft_dungeon_loot:items/hammer_of_sol/raycast_forward

    tag @s remove satyrn.fdl.titanHammer.raycastSource
}

function raycast_forward {
    execute (as @e[tag=!satyrn.fdl.titanHammer.raycastSource,dx=0,type=!#foxcraft_dungeon_loot:non_living] positioned ~-0.99 ~-0.99 ~-0.99 if entity @s[dx=0] positioned ~0.99 ~0.99 ~0.99) {
        function foxcraft_dungeon_loot:items/hammer_of_sol/hit_target
        tag @e[tag=satyrn.fdl.titanHammerTracker,limit=1,sort=nearest] add satyrn.fdl.titanHammer.raycastSuccess
    } else {
        !IF(config.dev) {
            particle minecraft:witch ~ ~ ~
        }
        scoreboard players add #step <%config.internalScoreboard%> 1

        execute positioned ^ ^ ^-0.1 rotated ~ ~ if score #step <%config.internalScoreboard%> matches ..5 if block ~ ~ ~ #foxcraft_dungeon_loot:raycast_pass run {
            function foxcraft_dungeon_loot:items/hammer_of_sol/raycast_forward
        }
    }
}

function start_raycast_backward {
    tag @s add satyrn.fdl.titanHammer.raycastSource

    scoreboard players reset #step <%config.internalScoreboard%>

    execute positioned ^ ^ ^ run function foxcraft_dungeon_loot:items/hammer_of_sol/raycast_backward

    tag @s remove satyrn.fdl.titanHammer.raycastSource
}

function raycast_backward {
    execute (as @e[tag=!satyrn.fdl.titanHammer.raycastSource,dx=0,type=!#foxcraft_dungeon_loot:non_living] positioned ~-0.99 ~-0.99 ~-0.99 if entity @s[dx=0] positioned ~0.99 ~0.99 ~0.99) {
        function foxcraft_dungeon_loot:items/hammer_of_sol/hit_target
        tag @e[tag=satyrn.fdl.titanHammerTracker,limit=1,sort=nearest] add satyrn.fdl.titanHammer.raycastSuccess
    } else {
        !IF(config.dev) {
            particle minecraft:witch ~ ~ ~
        }
        scoreboard players add #step <%config.internalScoreboard%> 1

        execute positioned ^ ^ ^0.1 rotated ~ ~ if score #step <%config.internalScoreboard%> matches ..5 if block ~ ~ ~ #foxcraft_dungeon_loot:raycast_pass run {
            function foxcraft_dungeon_loot:items/hammer_of_sol/raycast_backward
        }
    }
}
