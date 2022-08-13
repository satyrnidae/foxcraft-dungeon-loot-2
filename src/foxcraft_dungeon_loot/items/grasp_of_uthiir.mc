import ../../macros.mcm

# Relevant Entity Tags:
# satyrn.fdl.graspOfUthiir.heldItem - A player that is holding the X No Evil item
# satyrn.fdl.graspOfUthiir.projectile - The snowball thrown by a player who used X No Evil
# satyrn.fdl.graspOfUthiir.projectileTracker - An armor stand which tracks the projectile. Has a snowball passenger which saves the throwing player's UUID.
# satyrn.fdl.graspOfUthiir.ownerId - The snowball passenger which saves the throwing player's UUID.
# satyrn.fdl.graspOfUthiir.areaOfEffect - The area of effect cloud created by the projectile.

function on_snowball_used {
    # Execute if a tagged player threw a snowball.
    execute if entity @s[tag=satyrn.fdl.graspOfUthiir.heldItem] run {
        # Execute the following as the nearest snowball, presumably the one thrown by the player.
        execute as @e[type=minecraft:snowball,limit=1,sort=nearest] at @s run {
            # Tag the snowball as the projectile.
            tag @s add satyrn.fdl.graspOfUthiir.projectile

            # Summon a tracker armor stand and set its motion relative to the projectile.
            summon minecraft:armor_stand ^ ^ ^ {Silent:1b,Invisible:<%config.dev?0:1%>b,Invulnerable:1b,Small:1b,Silent:1b,Tags:[satyrn.fdl.graspOfUthiir.projectileTracker]}
            data modify entity @e[tag=satyrn.fdl.graspOfUthiir.projectileTracker,limit=1,sort=nearest] Motion set from entity @s Motion
        }
    }
}

# Occurs once per player per tick.
function on_tick {
    # A tag is added to the player while they are holding X No Evil and is cleared from any player not holding X No Evil.
    execute as @a[predicate=!foxcraft_dungeon_loot:items/grasp_of_uthiir/in_main_hand,predicate=!foxcraft_dungeon_loot:items/grasp_of_uthiir/in_off_hand] run tag @s remove satyrn.fdl.graspOfUthiir.heldItem

    execute as @a[predicate=foxcraft_dungeon_loot:items/is_mainhand_snowball,predicate=!foxcraft_dungeon_loot:items/grasp_of_uthiir/in_main_hand] run tag @s remove satyrn.fdl.graspOfUthiir.heldItem

    execute as @a[predicate=foxcraft_dungeon_loot:items/grasp_of_uthiir/in_main_hand] run tag @s add satyrn.fdl.graspOfUthiir.heldItem

    execute as @a[predicate=!foxcraft_dungeon_loot:items/is_mainhand_snowball,predicate=foxcraft_dungeon_loot:items/grasp_of_uthiir/in_off_hand] run tag @s add satyrn.fdl.graspOfUthiir.heldItem

    execute as @e[tag=satyrn.fdl.graspOfUthiir.projectileTracker] at @s run {
        # If the projectile tracker is near a projectile, set its motion from that projectile.
        execute (if entity @e[tag=satyrn.fdl.graspOfUthiir.projectile,distance=..1,limit=1,sort=nearest]) {
            data modify entity @s Motion set from entity @e[tag=satyrn.fdl.graspOfUthiir.projectile,limit=1,sort=nearest] Motion
        } else {
            execute store success score #test <%config.internalScoreboard%> run setblock ~ ~ ~ minecraft:cobweb keep
            execute if score #test <%config.internalScoreboard%> matches 0 store success score #test <%config.internalScoreboard%> run setblock ~ ~1 ~ minecraft:cobweb keep
            execute if score #test <%config.internalScoreboard%> matches 0 store success score #test <%config.internalScoreboard%> run setblock ~ ~-1 ~ minecraft:cobweb keep
            execute if score #test <%config.internalScoreboard%> matches 0 store success score #test <%config.internalScoreboard%> run setblock ~1 ~ ~ minecraft:cobweb keep
            execute if score #test <%config.internalScoreboard%> matches 0 store success score #test <%config.internalScoreboard%> run setblock ~-1 ~ ~ minecraft:cobweb keep
            execute if score #test <%config.internalScoreboard%> matches 0 store success score #test <%config.internalScoreboard%> run setblock ~ ~ ~1 minecraft:cobweb keep
            execute if score #test <%config.internalScoreboard%> matches 0 store success score #test <%config.internalScoreboard%> run setblock ~ ~ ~-1 minecraft:cobweb keep
            execute if score #test <%config.internalScoreboard%> matches 0 store success score #test <%config.internalScoreboard%> run setblock ~1 ~ ~-1 minecraft:cobweb keep
            execute if score #test <%config.internalScoreboard%> matches 0 store success score #test <%config.internalScoreboard%> run setblock ~-1 ~ ~-1 minecraft:cobweb keep
            execute if score #test <%config.internalScoreboard%> matches 0 store success score #test <%config.internalScoreboard%> run setblock ~1 ~ ~1 minecraft:cobweb keep
            execute if score #test <%config.internalScoreboard%> matches 0 store success score #test <%config.internalScoreboard%> run setblock ~-1 ~ ~1 minecraft:cobweb keep
            execute if score #test <%config.internalScoreboard%> matches 0 store success score #test <%config.internalScoreboard%> run loot spawn ~ ~ ~ loot foxcraft_dungeon_loot:items/rare/grasp_of_uthiir


            # Clean up tracking entity
            !IF(config.dev) {
                data merge entity @s {Motion:[0.0f,0.0f,0.0f],NoGravity:1b}
                tag @s remove satyrn.fdl.graspOfUthiir.projectileTracker
            }
            !IF(!config.dev) {
                kill @s
            }
        }
    }
}
