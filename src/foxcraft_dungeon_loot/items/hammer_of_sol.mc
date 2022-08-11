# TAGS USED
# satyrn.fdl.holdingTitanHammer - Used to mark a player who was holding a titan hammer on tick for on_snowball_used
# satyrn.fdl.titanHammer - Used to mark a snowball that should be treated as a titan hammer projectile
# satyrn.fdl.titanHammerTracker - Used to mark an armor stand which tracks the titan hammer projectile
# satyrn.fdl.titanHammer.raycastTarget - Refers to a Marker entity which is used to rotate the entity raycast.
# satyrn.fdl.titanHammer.raycastSuccess - Added to the projectile tracker armor stand when the raycast function is successful.
# satyrn.fdl.titanHammerSpawnedItem - Added to the hammer item that is dropped by the projectile tracker at the end of its travel.
# satyrn.fdl.titanHammer.raycastSource - Added to the projectile tracker armor stand to exclude it from the raycast.

# Run when the snowball tracker has found a target to hit.
function hit_target {
    playsound foxcraft_dungeon_loot:item.hammer_of_sol.hit player @a ~ ~ ~ 2.0

    execute (if entity @s[type=!minecraft:player]) {
        # Apply fire equivalent to Fire Aspect III
        data modify entity @s Fire set from storage foxcraft_dungeon_loot:items HammerOfSol.Fire
    } else {
        # Fireball hack to light players on fire
        summon minecraft:small_fireball ~ ~3 ~ {Motion:[0.0,-10.0,0.0]}
    }

    # Deal damage via potion effects for both living and undead targets
    execute (if entity @s[type=#foxcraft_dungeon_loot:undead] at @s) {
        effect give @s minecraft:instant_health 10
    } else {
        effect give @s minecraft:instant_damage 10
    }
}

# Runs when the plugin is used.
function on_load {
    # Set up storage. Fire is the duration of the Hammer of Sol's fire effect.
    # 240t = Fire Aspect III
    data merge storage foxcraft_dungeon_loot:items {HammerOfSol:{Fire:240}}
}

# Runs on ticks when a snowball is used.
function on_snowball_used {
    execute if entity @s[tag=satyrn.fdl.holdingTitanHammer] run {
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
}

# Runs once per tick
function on_tick {
    # Add tag to player to know they have the hammer in their main hand (Since they are throwing it, if they only have 1, the next they wouldn't have it in their hand anymore)
    execute as @a[predicate=!foxcraft_dungeon_loot:items/hammer_of_sol/in_main_hand,predicate=!foxcraft_dungeon_loot:items/hammer_of_sol/in_off_hand] run tag @s remove satyrn.fdl.holdingTitanHammer

    execute as @a[predicate=foxcraft_dungeon_loot:items/is_mainhand_snowball,predicate=!foxcraft_dungeon_loot:items/hammer_of_sol/in_main_hand] run tag @s remove satyrn.fdl.holdingTitanHammer
    # Add tag to players holding the hammer in their main hand.
    execute as @a[predicate=foxcraft_dungeon_loot:items/hammer_of_sol/in_main_hand] run tag @s add satyrn.fdl.holdingTitanHammer
    # Add tag to players holding the hammer in their offhand who don't have another snowball in their main hand.
    execute as @a[predicate=!foxcraft_dungeon_loot:items/is_mainhand_snowball,predicate=foxcraft_dungeon_loot:items/hammer_of_sol/in_off_hand] run tag @s add satyrn.fdl.holdingTitanHammer

    # Teleport tracker to the hammer and do all the tracking that needs to be tracked
    execute as @e[tag=satyrn.fdl.titanHammerTracker] at @s run {
        execute (if entity @e[tag=satyrn.fdl.titanHammer, distance=..1, limit=1, sort=nearest] at @e[tag=satyrn.fdl.titanHammer, limit=1, sort=nearest]) {
            kill @e[type=#foxcraft_dungeon_loot:markers,tag=satyrn.fdl.titanHammer.raycastTarget,limit=1,sort=nearest,distance=..2.8]

            # Set motion instead of tp
            data modify entity @s Motion set from entity @e[tag=satyrn.fdl.titanHammer, distance=..1, limit=1, sort=nearest] Motion
            particle minecraft:small_flame ~ ~ ~ 0.1 0.1 0.1 0 1
            particle minecraft:smoke ~ ~ ~ 0.1 0.1 0.1 0 1

            summon minecraft:marker ~ ~ ~ {Tags:[satyrn.fdl.titanHammer.raycastTarget]}

        # If tracker cannot find a hammer, it hit something and was destroyed.
        } else {
            # Search for entity to damage
            execute (anchored feet as @e[type=!#foxcraft_dungeon_loot:non_living, dx=0, limit=1, sort=nearest] at @s) {
                function foxcraft_dungeon_loot:items/hammer_of_sol/hit_target
            } else {
                # Perform a raycast to find the entity
                execute anchored feet facing entity @e[type=#foxcraft_dungeon_loot:markers,tag=satyrn.fdl.titanHammer.raycastTarget,limit=1,sort=nearest] feet run function foxcraft_dungeon_loot:items/hammer_of_sol/raycast/forward/start

                execute unless entity @s[tag=satyrn.fdl.titanHammer.raycastSuccess] run {
                    execute anchored feet facing entity @e[type=#foxcraft_dungeon_loot:markers,tag=satyrn.fdl.titanHammer.raycastTarget,limit=1,sort=nearest] feet run function foxcraft_dungeon_loot:items/hammer_of_sol/raycast/backward/start
                    execute unless entity @s[tag=satyrn.fdl.titanHammer.raycastSuccess] run {
                        playsound foxcraft_dungeon_loot:item.hammer_of_sol.miss player @a ~ ~ ~ 2.0
                    }
                }
            }

            # Spawn new hammer that will disappear after 5 seconds (100 ticks)
            loot spawn ^ ^ ^ loot foxcraft_dungeon_loot:items/mythic/hammer_of_sol
            data merge entity @e[type=minecraft:item,limit=1,sort=nearest] {Age:5900,Tags:[satyrn.fdl.titanHammerSpawnedItem]}

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

function on_uninstall {
    data remove storage foxcraft_dungeon_loot:items HammerOfSol
}

# Contains all raycast functions
dir raycast {
    # A raycast that steps towards the raycast target; i.e. backwards along the path of the projectile's travel
    dir backward {
        # Starts the raycast.
        function start {
            tag @s add satyrn.fdl.titanHammer.raycastSource

            scoreboard players reset #step <%config.internalScoreboard%>

            function foxcraft_dungeon_loot:items/hammer_of_sol/raycast/backward/step

            tag @s remove satyrn.fdl.titanHammer.raycastSource
        }

        # Checks for colliding entities or blocks and steps the raycast along its direction of travel.
        function step {
            execute (as @e[tag=!satyrn.fdl.titanHammer.raycastSource,dx=0,type=!#foxcraft_dungeon_loot:non_living] positioned ~-0.99 ~-0.99 ~-0.99 if entity @s[dx=0] positioned ~0.99 ~0.99 ~0.99) {
                function foxcraft_dungeon_loot:items/hammer_of_sol/hit_target
                tag @e[tag=satyrn.fdl.titanHammerTracker,limit=1,sort=nearest] add satyrn.fdl.titanHammer.raycastSuccess
            } else {
                !IF(config.dev) {
                    particle minecraft:witch ~ ~ ~
                }
                scoreboard players add #step <%config.internalScoreboard%> 1

                execute positioned ^ ^ ^0.1 rotated ~ ~ if score #step <%config.internalScoreboard%> matches ..5 if block ~ ~ ~ #foxcraft_dungeon_loot:raycast_pass run {
                    function foxcraft_dungeon_loot:items/hammer_of_sol/raycast/backward/step
                }
            }
        }
    }

    # A raycast function that steps away from the raycast target; i.e. forwards along the path of the projectile's travel
    dir forward {
        # Starts the raycast.
        function start {
            tag @s add satyrn.fdl.titanHammer.raycastSource

            scoreboard players reset #step <%config.internalScoreboard%>

            function foxcraft_dungeon_loot:items/hammer_of_sol/raycast/forward/step

            tag @s remove satyrn.fdl.titanHammer.raycastSource
        }

        # Checks for colliding entities or blocks and steps the raycast along its direction of travel.
        function step {
            execute (as @e[tag=!satyrn.fdl.titanHammer.raycastSource,dx=0,type=!#foxcraft_dungeon_loot:non_living] positioned ~-0.99 ~-0.99 ~-0.99 if entity @s[dx=0] positioned ~0.99 ~0.99 ~0.99) {
                function foxcraft_dungeon_loot:items/hammer_of_sol/hit_target
                tag @e[tag=satyrn.fdl.titanHammerTracker,limit=1,sort=nearest] add satyrn.fdl.titanHammer.raycastSuccess
            } else {
                !IF(config.dev) {
                    particle minecraft:witch ~ ~ ~
                }
                scoreboard players add #step <%config.internalScoreboard%> 1

                execute positioned ^ ^ ^-0.1 rotated ~ ~ if score #step <%config.internalScoreboard%> matches ..5 if block ~ ~ ~ #foxcraft_dungeon_loot:raycast_pass run {
                    function foxcraft_dungeon_loot:items/hammer_of_sol/raycast/forward/step
                }
            }
        }
    }
}
