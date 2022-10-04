###

TAGS USED

satyrn.fdl.torenhiasFist.heldItem - A player that was holding Tor'Enhia's Fist
satyrn.fdl.torenhiasFist.projectile - The snowball projectile
satyrn.fdl.torenhiasFist.projectileTracker - The armor stand tracking the projectile
satyrn.fdl.torenhiasFist.lightningSpawner - The marker entity in charge of spawning lighting

###

# Sets up scoreboards and constants on load.
function on_load {
    scoreboard objectives add satyrn.fdl.torenhiasFist.cooldown dummy
    scoreboard objectives add satyrn.fdl.torenhiasFist.particle dummy

    scoreboard players set #5 <%config.internalScoreboard%> 5
}

# Occurs once per tick.
function on_tick {
    # Add a tag to players holding Tor'Enhia's Fist, and remove the tag from players who aren't.
    execute as @a[predicate=!foxcraft_dungeon_loot:items/torenhias_fist/in_main_hand,predicate=!foxcraft_dungeon_loot:items/torenhias_fist/in_off_hand] run tag @s remove satyrn.fdl.torenhiasFist.heldItem

    execute as @a[predicate=foxcraft_dungeon_loot:items/is_mainhand_snowball,predicate=!foxcraft_dungeon_loot:items/torenhias_fist/in_main_hand] run tag @s remove satyrn.fdl.torenhiasFist.heldItem

    execute as @a[predicate=foxcraft_dungeon_loot:items/torenhias_fist/in_main_hand] run tag @s add satyrn.fdl.torenhiasFist.heldItem

    execute as @a[predicate=!foxcraft_dungeon_loot:items/is_mainhand_snowball,predicate=foxcraft_dungeon_loot:items/torenhias_fist/in_off_hand] run tag @s add satyrn.fdl.torenhiasFist.heldItem

    # Update the projectile tracker
    execute as @e[tag=satyrn.fdl.torenhiasFist.projectileTracker,type=#foxcraft_dungeon_loot:markers] at @s run {
        execute (if entity @e[tag=satyrn.fdl.torenhiasFist.projectile,distance=..1,limit=1,sort=nearest]) {
            data modify entity @s Motion set from entity @e[tag=satyrn.fdl.torenhiasFist.projectile,limit=1,sort=nearest] Motion
            particle minecraft:electric_spark ~ ~0.5 ~ 0.25 0 0.25 0.05 1
        } else {
            summon minecraft:marker ~ ~ ~ {Tags:[satyrn.fdl.torenhiasFist.lightningSpawner]}
            loot spawn ^ ^ ^ loot foxcraft_dungeon_loot:items/epic/torenhias_fist
            kill @s
        }
    }

    # Update the lightning spawners
    execute as @e[tag=satyrn.fdl.torenhiasFist.lightningSpawner,type=#foxcraft_dungeon_loot:markers] at @s run {
        execute (unless score @s satyrn.fdl.torenhiasFist.cooldown matches 0..) {
            # 3 seconds until lightning spawns
            scoreboard players set @s satyrn.fdl.torenhiasFist.cooldown 70
            execute if predicate foxcraft_dungeon_loot:is_weather_clear run weather thunder 7
        } else execute (unless score @s satyrn.fdl.torenhiasFist.cooldown matches 0) {
            scoreboard players remove @s satyrn.fdl.torenhiasFist.cooldown 1
            scoreboard players operation @s satyrn.fdl.torenhiasFist.particle = @s satyrn.fdl.torenhiasFist.cooldown
            scoreboard players operation @s satyrn.fdl.torenhiasFist.particle %= #5 <%config.internalScoreboard%>

            execute if score @s satyrn.fdl.torenhiasFist.particle matches 0 run {
                particle minecraft:electric_spark ~ ~0.5 ~ 0.25 0 0.25 0.05 3 force
            }
            execute if score @s satyrn.fdl.torenhiasFist.cooldown matches 10 run {
                summon minecraft:lightning_bolt ^0.25 ^ ^-0.25
            }
            execute if score @s satyrn.fdl.torenhiasFist.cooldown matches 5 run {
                summon minecraft:lightning_bolt ^-0.25 ^ ^0.25
            }
        } else {
            summon minecraft:lightning_bolt
            playsound foxcraft_dungeon_loot:item.torenhias_fist.thunder player @a ~ ~ ~ 4.0
            # Clean up lightning spawner
            kill @s
        }
    }
}

# Runs when a player uses a snowball.
function on_snowball_used {
    # Execute if a player who was holding Tor'Enhia's Fist threw the item from their main hand.
    execute if entity @s[tag=satyrn.fdl.torenhiasFist.heldItem] run {
        execute as @e[type=minecraft:snowball,limit=1,sort=nearest] at @s run {
            # Tag the snowball as the projectile.
            tag @s add satyrn.fdl.torenhiasFist.projectile

            summon minecraft:armor_stand ^ ^ ^ {Invisible:<%config.dev?0:1%>b,Invulnerable:1b,Small:1b,Silent:1b,Tags:[satyrn.fdl.torenhiasFist.projectileTracker]}
            data modify entity @e[tag=satyrn.fdl.torenhiasFist.projectileTracker,limit=1,sort=nearest] Motion set from entity @s Motion
        }
    }
}

# Runs when the datapack is uninstalled
function on_uninstall {
    scoreboard objectives remove satyrn.fdl.torenhiasFist.cooldown
    scoreboard objectives remove satyrn.fdl.torenhiasFist.particle
}
